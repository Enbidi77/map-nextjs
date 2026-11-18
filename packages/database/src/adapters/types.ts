import type { Coordinate, BoundingBox, PlaceCategory } from '@modern-maps/types';
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

export interface CreateSavedPlaceInput {
  id?: string;
  userId?: string | null;
  providerId?: string | null;
  name: string;
  formattedAddress: string;
  category: PlaceCategory | string;
  latitude: number;
  longitude: number;
  notes?: string | null;
  customColor?: string | null;
  customIcon?: string | null;
}

export interface UpdateSavedPlaceInput {
  name?: string;
  formattedAddress?: string;
  category?: PlaceCategory | string;
  latitude?: number;
  longitude?: number;
  notes?: string | null;
  customColor?: string | null;
  customIcon?: string | null;
}

export interface SavedPlaceWithDistance extends SavedPlace {
  distanceMeters: number;
}

export interface SavedPlaceFilter {
  category?: PlaceCategory | string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface CreateCollectionInput {
  id?: string;
  userId?: string | null;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  isPublic?: boolean;
}

export interface UpdateCollectionInput {
  name?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  isPublic?: boolean;
}

export interface PlaceCollectionWithPlaces extends PlaceCollection {
  places: SavedPlace[];
}

export interface CreateMapFeatureInput {
  id?: string;
  userId?: string | null;
  name: string;
  featureType: MapFeatureType;
  geojson: Record<string, unknown>;
  properties?: Record<string, unknown> | null;
}

export interface UpdateMapFeatureInput {
  name?: string;
  featureType?: MapFeatureType;
  geojson?: Record<string, unknown>;
  properties?: Record<string, unknown> | null;
}

export interface AddSearchHistoryInput {
  id?: string;
  userId?: string | null;
  query: string;
  selectedPlaceId?: string | null;
  selectedPlaceName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CreateUserInput {
  id?: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateUserPreferencesInput {
  defaultStyle?: string;
  defaultZoom?: number;
  defaultCenterLng?: number;
  defaultCenterLat?: number;
  theme?: string;
  distanceUnit?: string;
}

export interface DatabaseAdapter {
  readonly isMemory: boolean;

  // Spatial queries
  findNearbyPlaces(
    userId: string | null | undefined,
    center: Coordinate,
    radiusMeters: number
  ): Promise<SavedPlaceWithDistance[]>;

  findPlacesInBBox(
    userId: string | null | undefined,
    bbox: BoundingBox
  ): Promise<SavedPlace[]>;

  // Saved places CRUD
  createSavedPlace(input: CreateSavedPlaceInput): Promise<SavedPlace>;
  getSavedPlaceById(id: string): Promise<SavedPlace | null>;
  listSavedPlaces(userId?: string | null, filter?: SavedPlaceFilter): Promise<SavedPlace[]>;
  updateSavedPlace(id: string, input: UpdateSavedPlaceInput): Promise<SavedPlace | null>;
  deleteSavedPlace(id: string): Promise<boolean>;

  // Collections CRUD
  createCollection(input: CreateCollectionInput): Promise<PlaceCollection>;
  getCollectionById(id: string, includePlaces?: boolean): Promise<PlaceCollectionWithPlaces | PlaceCollection | null>;
  listCollections(userId?: string | null): Promise<PlaceCollection[]>;
  updateCollection(id: string, input: UpdateCollectionInput): Promise<PlaceCollection | null>;
  deleteCollection(id: string): Promise<boolean>;
  addPlaceToCollection(collectionId: string, savedPlaceId: string, sortOrder?: number): Promise<CollectionItem>;
  removePlaceFromCollection(collectionId: string, savedPlaceId: string): Promise<boolean>;
  getCollectionItems(collectionId: string): Promise<(CollectionItem & { savedPlace: SavedPlace })[]>;

  // Map features CRUD
  createMapFeature(input: CreateMapFeatureInput): Promise<UserMapFeature>;
  getMapFeatureById(id: string): Promise<UserMapFeature | null>;
  listMapFeatures(userId?: string | null, featureType?: MapFeatureType): Promise<UserMapFeature[]>;
  updateMapFeature(id: string, input: UpdateMapFeatureInput): Promise<UserMapFeature | null>;
  deleteMapFeature(id: string): Promise<boolean>;

  // Search history
  addSearchHistory(input: AddSearchHistoryInput): Promise<SearchHistoryItem>;
  getSearchHistory(userId?: string | null, limit?: number): Promise<SearchHistoryItem[]>;
  clearSearchHistory(userId?: string | null): Promise<boolean>;

  // Users & Preferences
  createUser(input: CreateUserInput): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserPreferences(userId: string): Promise<UserPreferences | null>;
  updateUserPreferences(userId: string, input: UpdateUserPreferencesInput): Promise<UserPreferences>;
}
