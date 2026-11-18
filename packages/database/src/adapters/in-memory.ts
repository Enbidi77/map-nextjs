import type { Coordinate, BoundingBox } from '@modern-maps/types';
import { haversineDistanceMeters, isPointInBoundingBox } from '@modern-maps/geospatial';
import type {
  DatabaseAdapter,
  CreateSavedPlaceInput,
  UpdateSavedPlaceInput,
  SavedPlaceWithDistance,
  SavedPlaceFilter,
  CreateCollectionInput,
  UpdateCollectionInput,
  PlaceCollectionWithPlaces,
  CreateMapFeatureInput,
  UpdateMapFeatureInput,
  AddSearchHistoryInput,
  CreateUserInput,
  UpdateUserPreferencesInput,
} from './types.js';
import type {
  User,
  UserPreferences,
  SavedPlace,
  PlaceCollection,
  CollectionItem,
  SearchHistoryItem,
  UserMapFeature,
  MapFeatureType,
} from '../schema/index.js';

export class InMemoryDatabaseAdapter implements DatabaseAdapter {
  readonly isMemory = true;

  private users = new Map<string, User>();
  private userPreferences = new Map<string, UserPreferences>();
  private savedPlaces = new Map<string, SavedPlace>();
  private collections = new Map<string, PlaceCollection>();
  private collectionItems = new Map<string, CollectionItem>();
  private searchHistory = new Map<string, SearchHistoryItem>();
  private mapFeatures = new Map<string, UserMapFeature>();
  private historyCounter = 0;

  constructor() {
    this.seedDefaultData();
  }

  // Clear all data (useful for test resets)
  public clear(): void {
    this.users.clear();
    this.userPreferences.clear();
    this.savedPlaces.clear();
    this.collections.clear();
    this.collectionItems.clear();
    this.searchHistory.clear();
    this.mapFeatures.clear();
  }

  // --- Spatial Queries ---

  async findNearbyPlaces(
    userId: string | null | undefined,
    center: Coordinate,
    radiusMeters: number
  ): Promise<SavedPlaceWithDistance[]> {
    const places = Array.from(this.savedPlaces.values()).filter((place) => {
      if (userId && place.userId && place.userId !== userId) {
        return false;
      }
      return true;
    });

    const results: SavedPlaceWithDistance[] = [];

    for (const place of places) {
      const dist = haversineDistanceMeters(center, [place.longitude, place.latitude]);
      if (dist <= radiusMeters) {
        results.push({
          ...place,
          distanceMeters: Math.round(dist),
        });
      }
    }

    return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  async findPlacesInBBox(
    userId: string | null | undefined,
    bbox: BoundingBox
  ): Promise<SavedPlace[]> {
    const places = Array.from(this.savedPlaces.values()).filter((place) => {
      if (userId && place.userId && place.userId !== userId) {
        return false;
      }
      return isPointInBoundingBox([place.longitude, place.latitude], bbox);
    });

    return places;
  }

  // --- Saved Places CRUD ---

  async createSavedPlace(input: CreateSavedPlaceInput): Promise<SavedPlace> {
    const id = input.id ?? crypto.randomUUID();
    const now = new Date();
    const place: SavedPlace = {
      id,
      userId: input.userId ?? null,
      providerId: input.providerId ?? null,
      name: input.name,
      formattedAddress: input.formattedAddress,
      category: input.category,
      latitude: input.latitude,
      longitude: input.longitude,
      geom: `SRID=4326;POINT(${input.longitude} ${input.latitude})`,
      notes: input.notes ?? null,
      customColor: input.customColor ?? null,
      customIcon: input.customIcon ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.savedPlaces.set(id, place);
    return place;
  }

  async getSavedPlaceById(id: string): Promise<SavedPlace | null> {
    return this.savedPlaces.get(id) ?? null;
  }

  async listSavedPlaces(
    userId?: string | null,
    filter?: SavedPlaceFilter
  ): Promise<SavedPlace[]> {
    let places = Array.from(this.savedPlaces.values());

    if (userId !== undefined && userId !== null) {
      places = places.filter((p) => p.userId === userId);
    }

    if (filter?.category) {
      places = places.filter((p) => p.category === filter.category);
    }

    if (filter?.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      places = places.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.formattedAddress.toLowerCase().includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q))
      );
    }

    // Sort by updatedAt descending
    places.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    const offset = filter?.offset ?? 0;
    const limit = filter?.limit ?? places.length;
    return places.slice(offset, offset + limit);
  }

  async updateSavedPlace(
    id: string,
    input: UpdateSavedPlaceInput
  ): Promise<SavedPlace | null> {
    const existing = this.savedPlaces.get(id);
    if (!existing) return null;

    const lat = input.latitude ?? existing.latitude;
    const lng = input.longitude ?? existing.longitude;

    const updated: SavedPlace = {
      ...existing,
      name: input.name ?? existing.name,
      formattedAddress: input.formattedAddress ?? existing.formattedAddress,
      category: input.category ?? existing.category,
      latitude: lat,
      longitude: lng,
      geom: `SRID=4326;POINT(${lng} ${lat})`,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      customColor: input.customColor !== undefined ? input.customColor : existing.customColor,
      customIcon: input.customIcon !== undefined ? input.customIcon : existing.customIcon,
      updatedAt: new Date(),
    };

    this.savedPlaces.set(id, updated);
    return updated;
  }

  async deleteSavedPlace(id: string): Promise<boolean> {
    const existed = this.savedPlaces.delete(id);
    if (existed) {
      // Cascade delete collection items
      for (const [itemId, item] of this.collectionItems.entries()) {
        if (item.savedPlaceId === id) {
          this.collectionItems.delete(itemId);
        }
      }
    }
    return existed;
  }

  // --- Collections CRUD ---

  async createCollection(input: CreateCollectionInput): Promise<PlaceCollection> {
    const id = input.id ?? crypto.randomUUID();
    const now = new Date();
    const col: PlaceCollection = {
      id,
      userId: input.userId ?? null,
      name: input.name,
      description: input.description ?? null,
      color: input.color ?? null,
      icon: input.icon ?? null,
      isPublic: input.isPublic ?? false,
      createdAt: now,
      updatedAt: now,
    };

    this.collections.set(id, col);
    return col;
  }

  async getCollectionById(
    id: string,
    includePlaces = false
  ): Promise<PlaceCollectionWithPlaces | PlaceCollection | null> {
    const col = this.collections.get(id);
    if (!col) return null;

    if (!includePlaces) return col;

    const items = Array.from(this.collectionItems.values())
      .filter((item) => item.collectionId === id)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const places: SavedPlace[] = [];
    for (const item of items) {
      const place = this.savedPlaces.get(item.savedPlaceId);
      if (place) {
        places.push(place);
      }
    }

    return {
      ...col,
      places,
    };
  }

  async listCollections(userId?: string | null): Promise<PlaceCollection[]> {
    let cols = Array.from(this.collections.values());
    if (userId !== undefined && userId !== null) {
      cols = cols.filter((c) => c.userId === userId || c.isPublic);
    }
    return cols.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async updateCollection(
    id: string,
    input: UpdateCollectionInput
  ): Promise<PlaceCollection | null> {
    const existing = this.collections.get(id);
    if (!existing) return null;

    const updated: PlaceCollection = {
      ...existing,
      name: input.name ?? existing.name,
      description: input.description !== undefined ? input.description : existing.description,
      color: input.color !== undefined ? input.color : existing.color,
      icon: input.icon !== undefined ? input.icon : existing.icon,
      isPublic: input.isPublic !== undefined ? input.isPublic : existing.isPublic,
      updatedAt: new Date(),
    };

    this.collections.set(id, updated);
    return updated;
  }

  async deleteCollection(id: string): Promise<boolean> {
    const existed = this.collections.delete(id);
    if (existed) {
      for (const [itemId, item] of this.collectionItems.entries()) {
        if (item.collectionId === id) {
          this.collectionItems.delete(itemId);
        }
      }
    }
    return existed;
  }

  async addPlaceToCollection(
    collectionId: string,
    savedPlaceId: string,
    sortOrder = 0
  ): Promise<CollectionItem> {
    const id = crypto.randomUUID();
    const item: CollectionItem = {
      id,
      collectionId,
      savedPlaceId,
      sortOrder,
      addedAt: new Date(),
    };
    this.collectionItems.set(id, item);
    return item;
  }

  async removePlaceFromCollection(
    collectionId: string,
    savedPlaceId: string
  ): Promise<boolean> {
    let removed = false;
    for (const [itemId, item] of this.collectionItems.entries()) {
      if (item.collectionId === collectionId && item.savedPlaceId === savedPlaceId) {
        this.collectionItems.delete(itemId);
        removed = true;
      }
    }
    return removed;
  }

  async getCollectionItems(
    collectionId: string
  ): Promise<(CollectionItem & { savedPlace: SavedPlace })[]> {
    const items = Array.from(this.collectionItems.values())
      .filter((i) => i.collectionId === collectionId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const result: (CollectionItem & { savedPlace: SavedPlace })[] = [];
    for (const item of items) {
      const place = this.savedPlaces.get(item.savedPlaceId);
      if (place) {
        result.push({
          ...item,
          savedPlace: place,
        });
      }
    }
    return result;
  }

  // --- Map Features CRUD ---

  async createMapFeature(input: CreateMapFeatureInput): Promise<UserMapFeature> {
    const id = input.id ?? crypto.randomUUID();
    const now = new Date();
    const feat: UserMapFeature = {
      id,
      userId: input.userId ?? null,
      name: input.name,
      featureType: input.featureType,
      geojson: input.geojson,
      properties: input.properties ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.mapFeatures.set(id, feat);
    return feat;
  }

  async getMapFeatureById(id: string): Promise<UserMapFeature | null> {
    return this.mapFeatures.get(id) ?? null;
  }

  async listMapFeatures(
    userId?: string | null,
    featureType?: MapFeatureType
  ): Promise<UserMapFeature[]> {
    let feats = Array.from(this.mapFeatures.values());
    if (userId !== undefined && userId !== null) {
      feats = feats.filter((f) => f.userId === userId);
    }
    if (featureType) {
      feats = feats.filter((f) => f.featureType === featureType);
    }
    return feats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async updateMapFeature(
    id: string,
    input: UpdateMapFeatureInput
  ): Promise<UserMapFeature | null> {
    const existing = this.mapFeatures.get(id);
    if (!existing) return null;

    const updated: UserMapFeature = {
      ...existing,
      name: input.name ?? existing.name,
      featureType: input.featureType ?? existing.featureType,
      geojson: input.geojson ?? existing.geojson,
      properties: input.properties !== undefined ? input.properties : existing.properties,
      updatedAt: new Date(),
    };

    this.mapFeatures.set(id, updated);
    return updated;
  }

  async deleteMapFeature(id: string): Promise<boolean> {
    return this.mapFeatures.delete(id);
  }

  // --- Search History ---

  async addSearchHistory(input: AddSearchHistoryInput): Promise<SearchHistoryItem> {
    const id = input.id ?? crypto.randomUUID();
    const item: SearchHistoryItem = {
      id,
      userId: input.userId ?? null,
      query: input.query,
      selectedPlaceId: input.selectedPlaceId ?? null,
      selectedPlaceName: input.selectedPlaceName ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      createdAt: new Date(Date.now() + this.historyCounter++),
    };
    this.searchHistory.set(id, item);
    return item;
  }

  async getSearchHistory(
    userId?: string | null,
    limit = 20
  ): Promise<SearchHistoryItem[]> {
    let items = Array.from(this.searchHistory.values());
    if (userId !== undefined && userId !== null) {
      items = items.filter((i) => i.userId === userId);
    }
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return items.slice(0, limit);
  }

  async clearSearchHistory(userId?: string | null): Promise<boolean> {
    if (userId === undefined || userId === null) {
      this.searchHistory.clear();
      return true;
    }
    for (const [id, item] of this.searchHistory.entries()) {
      if (item.userId === userId) {
        this.searchHistory.delete(id);
      }
    }
    return true;
  }

  // --- Users & Preferences ---

  async createUser(input: CreateUserInput): Promise<User> {
    const id = input.id ?? crypto.randomUUID();
    const now = new Date();
    const user: User = {
      id,
      email: input.email,
      name: input.name ?? null,
      avatarUrl: input.avatarUrl ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);

    // Create default preferences
    const prefId = crypto.randomUUID();
    const prefs: UserPreferences = {
      id: prefId,
      userId: id,
      defaultStyle: 'streets',
      defaultZoom: 12,
      defaultCenterLng: -122.4194,
      defaultCenterLat: 37.7749,
      theme: 'system',
      distanceUnit: 'metric',
      updatedAt: now,
    };
    this.userPreferences.set(id, prefs);

    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    return this.userPreferences.get(userId) ?? null;
  }

  async updateUserPreferences(
    userId: string,
    input: UpdateUserPreferencesInput
  ): Promise<UserPreferences> {
    let prefs = this.userPreferences.get(userId);
    const now = new Date();

    if (!prefs) {
      prefs = {
        id: crypto.randomUUID(),
        userId,
        defaultStyle: input.defaultStyle ?? 'streets',
        defaultZoom: input.defaultZoom ?? 12,
        defaultCenterLng: input.defaultCenterLng ?? -122.4194,
        defaultCenterLat: input.defaultCenterLat ?? 37.7749,
        theme: input.theme ?? 'system',
        distanceUnit: input.distanceUnit ?? 'metric',
        updatedAt: now,
      };
    } else {
      prefs = {
        ...prefs,
        defaultStyle: input.defaultStyle ?? prefs.defaultStyle,
        defaultZoom: input.defaultZoom ?? prefs.defaultZoom,
        defaultCenterLng: input.defaultCenterLng ?? prefs.defaultCenterLng,
        defaultCenterLat: input.defaultCenterLat ?? prefs.defaultCenterLat,
        theme: input.theme ?? prefs.theme,
        distanceUnit: input.distanceUnit ?? prefs.distanceUnit,
        updatedAt: now,
      };
    }

    this.userPreferences.set(userId, prefs);
    return prefs;
  }

  // --- Seed default fixture places ---
  private seedDefaultData(): void {
    const defaultPlaces: CreateSavedPlaceInput[] = [
      {
        id: 'place-ferry-building',
        name: 'Ferry Building Marketplace',
        formattedAddress: '1 Ferry Building, San Francisco, CA 94111',
        category: 'food_drink',
        latitude: 37.7955,
        longitude: -122.3937,
        notes: 'Historic ferry terminal with artisan food stalls and farmers market.',
        customColor: '#3b82f6',
        customIcon: 'utensils',
      },
      {
        id: 'place-golden-gate',
        name: 'Golden Gate Bridge',
        formattedAddress: 'Golden Gate Bridge, San Francisco, CA',
        category: 'attraction',
        latitude: 37.8199,
        longitude: -122.4783,
        notes: 'Iconic suspension bridge linking SF and Marin County.',
        customColor: '#ef4444',
        customIcon: 'landmark',
      },
      {
        id: 'place-palace-fine-arts',
        name: 'Palace of Fine Arts',
        formattedAddress: '3301 Lyon St, San Francisco, CA 94123',
        category: 'attraction',
        latitude: 37.8029,
        longitude: -122.4484,
        notes: 'Greco-Roman rotunda and colonnades in the Marina District.',
        customColor: '#8b5cf6',
        customIcon: 'camera',
      },
      {
        id: 'place-coit-tower',
        name: 'Coit Tower',
        formattedAddress: '1 Telegraph Hill Blvd, San Francisco, CA 94133',
        category: 'attraction',
        latitude: 37.8024,
        longitude: -122.4058,
        notes: 'Tower atop Telegraph Hill offering 360-degree city views.',
        customColor: '#f59e0b',
        customIcon: 'eye',
      },
      {
        id: 'place-mission-dolores',
        name: 'Mission Dolores Park',
        formattedAddress: 'Dolores St & 19th St, San Francisco, CA 94114',
        category: 'nature',
        latitude: 37.7596,
        longitude: -122.4269,
        notes: 'Lively hillside park with skyline views and palm trees.',
        customColor: '#10b981',
        customIcon: 'tree',
      },
    ];

    for (const p of defaultPlaces) {
      this.createSavedPlace(p);
    }

    // Default collection: SF Top Landmarks
    const defaultCol: CreateCollectionInput = {
      id: 'col-sf-landmarks',
      name: 'San Francisco Highlights',
      description: 'Must-visit scenic viewpoints and architectural landmarks.',
      color: '#3b82f6',
      icon: 'map-pin',
      isPublic: true,
    };
    this.createCollection(defaultCol);
    this.addPlaceToCollection('col-sf-landmarks', 'place-ferry-building', 1);
    this.addPlaceToCollection('col-sf-landmarks', 'place-golden-gate', 2);
    this.addPlaceToCollection('col-sf-landmarks', 'place-palace-fine-arts', 3);
  }
}
