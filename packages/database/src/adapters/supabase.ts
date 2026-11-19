import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Coordinate, BoundingBox } from '@modern-maps/types';
import { haversineDistanceMeters } from '@modern-maps/geospatial';
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

export interface SupabaseAdapterOptions {
  supabaseUrl: string;
  supabaseKey: string;
}

export class SupabaseDatabaseAdapter implements DatabaseAdapter {
  readonly isMemory = false;
  private client: SupabaseClient;

  constructor(clientOrOptions: SupabaseClient | SupabaseAdapterOptions) {
    if ('from' in clientOrOptions) {
      this.client = clientOrOptions as SupabaseClient;
    } else {
      const { supabaseUrl, supabaseKey } = clientOrOptions;
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('SupabaseDatabaseAdapter requires supabaseUrl and supabaseKey');
      }
      this.client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
  }

  public getClient(): SupabaseClient {
    return this.client;
  }

  // --- Helpers for mapping Supabase snake_case rows to schema models ---

  private mapSavedPlace(row: any): SavedPlace {
    return {
      id: row.id,
      userId: row.user_id ?? null,
      providerId: row.provider_id ?? null,
      name: row.name,
      formattedAddress: row.formatted_address ?? '',
      category: row.category,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      geom: row.location ? String(row.location) : null,
      notes: row.notes ?? null,
      customColor: row.custom_color ?? null,
      customIcon: row.custom_icon ?? null,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };
  }

  private mapCollection(row: any): PlaceCollection {
    return {
      id: row.id,
      userId: row.user_id ?? null,
      name: row.name,
      description: row.description ?? null,
      color: row.color ?? null,
      icon: row.icon ?? null,
      isPublic: Boolean(row.is_public),
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };
  }

  private mapCollectionItem(row: any): CollectionItem {
    return {
      id: row.id,
      collectionId: row.collection_id,
      savedPlaceId: row.saved_place_id,
      sortOrder: Number(row.sort_order ?? 0),
      addedAt: row.added_at ? new Date(row.added_at) : new Date(),
    };
  }

  private mapMapFeature(row: any): UserMapFeature {
    return {
      id: row.id,
      userId: row.user_id ?? null,
      name: row.name,
      featureType: row.feature_type as MapFeatureType,
      geojson: (row.geojson as Record<string, unknown>) ?? {},
      properties: (row.properties as Record<string, unknown>) ?? null,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };
  }

  private mapSearchHistory(row: any): SearchHistoryItem {
    return {
      id: row.id,
      userId: row.user_id ?? null,
      query: row.query,
      selectedPlaceId: row.selected_place_id ?? null,
      selectedPlaceName: row.selected_place_name ?? null,
      latitude: row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : null,
      longitude: row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : null,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    };
  }

  private mapUserProfile(row: any): User {
    return {
      id: row.id,
      email: row.email ?? `${row.username || row.id}@modernmaps.io`,
      name: row.full_name ?? row.username ?? null,
      avatarUrl: row.avatar_url ?? null,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };
  }

  private mapUserPreferences(row: any): UserPreferences {
    return {
      id: row.id,
      userId: row.user_id,
      defaultStyle: row.default_style ?? 'streets',
      defaultZoom: Number(row.default_zoom ?? 12),
      defaultCenterLng: Number(row.default_center_lng ?? -122.4194),
      defaultCenterLat: Number(row.default_center_lat ?? 37.7749),
      theme: row.theme ?? 'system',
      distanceUnit: row.distance_unit ?? 'metric',
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };
  }

  // --- Spatial Queries ---

  async findNearbyPlaces(
    userId: string | null | undefined,
    center: Coordinate,
    radiusMeters: number
  ): Promise<SavedPlaceWithDistance[]> {
    let query = this.client.from('saved_places').select('*');

    if (userId && userId !== 'default-user') {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Supabase findNearbyPlaces error: ${error.message}`);
    }

    const results: SavedPlaceWithDistance[] = [];
    for (const row of data || []) {
      const place = this.mapSavedPlace(row);
      const distance = haversineDistanceMeters(center, [place.longitude, place.latitude]);
      if (distance <= radiusMeters) {
        results.push({
          ...place,
          distanceMeters: Math.round(distance),
        });
      }
    }

    results.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return results;
  }

  async findPlacesInBBox(
    userId: string | null | undefined,
    bbox: BoundingBox
  ): Promise<SavedPlace[]> {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    let query = this.client
      .from('saved_places')
      .select('*')
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng);

    if (userId && userId !== 'default-user') {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      throw new Error(`Supabase findPlacesInBBox error: ${error.message}`);
    }

    return (data || []).map((row) => this.mapSavedPlace(row));
  }

  // --- Saved Places CRUD ---

  async createSavedPlace(input: CreateSavedPlaceInput): Promise<SavedPlace> {
    const id = input.id ?? crypto.randomUUID();
    const payload = {
      id,
      user_id: input.userId && input.userId !== 'default-user' ? input.userId : null,
      provider_id: input.providerId ?? null,
      name: input.name,
      formatted_address: input.formattedAddress,
      category: input.category,
      latitude: input.latitude,
      longitude: input.longitude,
      notes: input.notes ?? null,
      custom_color: input.customColor ?? null,
      custom_icon: input.customIcon ?? null,
    };

    const { data, error } = await this.client
      .from('saved_places')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase createSavedPlace error: ${error.message}`);
    }

    return this.mapSavedPlace(data);
  }

  async getSavedPlaceById(id: string): Promise<SavedPlace | null> {
    const { data, error } = await this.client
      .from('saved_places')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase getSavedPlaceById error: ${error.message}`);
    }

    return data ? this.mapSavedPlace(data) : null;
  }

  async listSavedPlaces(
    userId?: string | null,
    filter?: SavedPlaceFilter
  ): Promise<SavedPlace[]> {
    let query = this.client.from('saved_places').select('*');

    if (userId && userId !== 'default-user') {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    if (filter?.category) {
      query = query.eq('category', filter.category);
    }

    if (filter?.searchQuery) {
      query = query.ilike('name', `%${filter.searchQuery}%`);
    }

    query = query.order('created_at', { ascending: false });

    if (filter?.limit) {
      query = query.limit(filter.limit);
    }
    if (filter?.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit || 20) - 1);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Supabase listSavedPlaces error: ${error.message}`);
    }

    return (data || []).map((row) => this.mapSavedPlace(row));
  }

  async updateSavedPlace(
    id: string,
    input: UpdateSavedPlaceInput
  ): Promise<SavedPlace | null> {
    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) payload.name = input.name;
    if (input.formattedAddress !== undefined) payload.formatted_address = input.formattedAddress;
    if (input.category !== undefined) payload.category = input.category;
    if (input.latitude !== undefined) payload.latitude = input.latitude;
    if (input.longitude !== undefined) payload.longitude = input.longitude;
    if (input.notes !== undefined) payload.notes = input.notes;
    if (input.customColor !== undefined) payload.custom_color = input.customColor;
    if (input.customIcon !== undefined) payload.custom_icon = input.customIcon;

    const { data, error } = await this.client
      .from('saved_places')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase updateSavedPlace error: ${error.message}`);
    }

    return data ? this.mapSavedPlace(data) : null;
  }

  async deleteSavedPlace(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('saved_places')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Supabase deleteSavedPlace error: ${error.message}`);
    }

    return true;
  }

  // --- Collections CRUD ---

  async createCollection(input: CreateCollectionInput): Promise<PlaceCollection> {
    const id = input.id ?? crypto.randomUUID();
    const payload = {
      id,
      user_id: input.userId && input.userId !== 'default-user' ? input.userId : null,
      name: input.name,
      description: input.description ?? null,
      color: input.color ?? null,
      icon: input.icon ?? null,
      is_public: input.isPublic ?? false,
    };

    const { data, error } = await this.client
      .from('place_collections')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase createCollection error: ${error.message}`);
    }

    return this.mapCollection(data);
  }

  async getCollectionById(
    id: string,
    includePlaces = false
  ): Promise<PlaceCollectionWithPlaces | PlaceCollection | null> {
    const { data: colData, error: colError } = await this.client
      .from('place_collections')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (colError) {
      throw new Error(`Supabase getCollectionById error: ${colError.message}`);
    }
    if (!colData) return null;

    const col = this.mapCollection(colData);
    if (!includePlaces) return col;

    const { data: itemData, error: itemError } = await this.client
      .from('collection_items')
      .select('*, saved_places(*)')
      .eq('collection_id', id)
      .order('sort_order', { ascending: true });

    if (itemError) {
      throw new Error(`Supabase getCollectionItems error: ${itemError.message}`);
    }

    const places: SavedPlace[] = (itemData || [])
      .map((item: any) => (item.saved_places ? this.mapSavedPlace(item.saved_places) : null))
      .filter((p): p is SavedPlace => p !== null);

    return {
      ...col,
      places,
    };
  }

  async listCollections(userId?: string | null): Promise<PlaceCollection[]> {
    let query = this.client.from('place_collections').select('*');

    if (userId && userId !== 'default-user') {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      throw new Error(`Supabase listCollections error: ${error.message}`);
    }

    return (data || []).map((row) => this.mapCollection(row));
  }

  async updateCollection(
    id: string,
    input: UpdateCollectionInput
  ): Promise<PlaceCollection | null> {
    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) payload.name = input.name;
    if (input.description !== undefined) payload.description = input.description;
    if (input.color !== undefined) payload.color = input.color;
    if (input.icon !== undefined) payload.icon = input.icon;
    if (input.isPublic !== undefined) payload.is_public = input.isPublic;

    const { data, error } = await this.client
      .from('place_collections')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase updateCollection error: ${error.message}`);
    }

    return data ? this.mapCollection(data) : null;
  }

  async deleteCollection(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('place_collections')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Supabase deleteCollection error: ${error.message}`);
    }

    return true;
  }

  async addPlaceToCollection(
    collectionId: string,
    savedPlaceId: string,
    sortOrder = 0
  ): Promise<CollectionItem> {
    const id = crypto.randomUUID();
    const payload = {
      id,
      collection_id: collectionId,
      saved_place_id: savedPlaceId,
      sort_order: sortOrder,
    };

    const { data, error } = await this.client
      .from('collection_items')
      .upsert(payload, { onConflict: 'collection_id,saved_place_id' })
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase addPlaceToCollection error: ${error.message}`);
    }

    return this.mapCollectionItem(data);
  }

  async removePlaceFromCollection(
    collectionId: string,
    savedPlaceId: string
  ): Promise<boolean> {
    const { error } = await this.client
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('saved_place_id', savedPlaceId);

    if (error) {
      throw new Error(`Supabase removePlaceFromCollection error: ${error.message}`);
    }

    return true;
  }

  async getCollectionItems(
    collectionId: string
  ): Promise<(CollectionItem & { savedPlace: SavedPlace })[]> {
    const { data, error } = await this.client
      .from('collection_items')
      .select('*, saved_places(*)')
      .eq('collection_id', collectionId)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Supabase getCollectionItems error: ${error.message}`);
    }

    return (data || [])
      .filter((row: any) => row.saved_places)
      .map((row: any) => ({
        ...this.mapCollectionItem(row),
        savedPlace: this.mapSavedPlace(row.saved_places),
      }));
  }

  // --- Map Features CRUD ---

  async createMapFeature(input: CreateMapFeatureInput): Promise<UserMapFeature> {
    const id = input.id ?? crypto.randomUUID();
    const payload = {
      id,
      user_id: input.userId && input.userId !== 'default-user' ? input.userId : null,
      name: input.name,
      feature_type: input.featureType,
      geojson: input.geojson,
      properties: input.properties ?? {},
    };

    const { data, error } = await this.client
      .from('user_map_features')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase createMapFeature error: ${error.message}`);
    }

    return this.mapMapFeature(data);
  }

  async getMapFeatureById(id: string): Promise<UserMapFeature | null> {
    const { data, error } = await this.client
      .from('user_map_features')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase getMapFeatureById error: ${error.message}`);
    }

    return data ? this.mapMapFeature(data) : null;
  }

  async listMapFeatures(
    userId?: string | null,
    featureType?: MapFeatureType
  ): Promise<UserMapFeature[]> {
    let query = this.client.from('user_map_features').select('*');

    if (userId && userId !== 'default-user') {
      query = query.eq('user_id', userId);
    }
    if (featureType) {
      query = query.eq('feature_type', featureType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      throw new Error(`Supabase listMapFeatures error: ${error.message}`);
    }

    return (data || []).map((row) => this.mapMapFeature(row));
  }

  async updateMapFeature(
    id: string,
    input: UpdateMapFeatureInput
  ): Promise<UserMapFeature | null> {
    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) payload.name = input.name;
    if (input.featureType !== undefined) payload.feature_type = input.featureType;
    if (input.geojson !== undefined) payload.geojson = input.geojson;
    if (input.properties !== undefined) payload.properties = input.properties;

    const { data, error } = await this.client
      .from('user_map_features')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase updateMapFeature error: ${error.message}`);
    }

    return data ? this.mapMapFeature(data) : null;
  }

  async deleteMapFeature(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('user_map_features')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Supabase deleteMapFeature error: ${error.message}`);
    }

    return true;
  }

  // --- Search History ---

  async addSearchHistory(input: AddSearchHistoryInput): Promise<SearchHistoryItem> {
    const id = input.id ?? crypto.randomUUID();
    const payload = {
      id,
      user_id: input.userId && input.userId !== 'default-user' ? input.userId : null,
      query: input.query,
      selected_place_id: input.selectedPlaceId ?? null,
      selected_place_name: input.selectedPlaceName ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    };

    const { data, error } = await this.client
      .from('search_history')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase addSearchHistory error: ${error.message}`);
    }

    return this.mapSearchHistory(data);
  }

  async getSearchHistory(
    userId?: string | null,
    limit = 20
  ): Promise<SearchHistoryItem[]> {
    let query = this.client.from('search_history').select('*');

    if (userId && userId !== 'default-user') {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Supabase getSearchHistory error: ${error.message}`);
    }

    return (data || []).map((row) => this.mapSearchHistory(row));
  }

  async clearSearchHistory(userId?: string | null): Promise<boolean> {
    let query = this.client.from('search_history').delete();

    if (userId && userId !== 'default-user') {
      query = query.eq('user_id', userId);
    } else {
      query = query.not('id', 'is', null);
    }

    const { error } = await query;
    if (error) {
      throw new Error(`Supabase clearSearchHistory error: ${error.message}`);
    }

    return true;
  }

  // --- Users & Preferences ---

  async createUser(input: CreateUserInput): Promise<User> {
    const id = input.id ?? crypto.randomUUID();
    const payload = {
      id,
      username: input.email.split('@')[0],
      full_name: input.name ?? null,
      avatar_url: input.avatarUrl ?? null,
    };

    const { data, error } = await this.client
      .from('user_profiles')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase createUser error: ${error.message}`);
    }

    return {
      ...this.mapUserProfile(data),
      email: input.email,
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase getUserById error: ${error.message}`);
    }

    return data ? this.mapUserProfile(data) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const username = email.split('@')[0];
    const { data, error } = await this.client
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase getUserByEmail error: ${error.message}`);
    }

    return data ? { ...this.mapUserProfile(data), email } : null;
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await this.client
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase getUserPreferences error: ${error.message}`);
    }

    return data ? this.mapUserPreferences(data) : null;
  }

  async updateUserPreferences(
    userId: string,
    input: UpdateUserPreferencesInput
  ): Promise<UserPreferences> {
    const payload: Record<string, unknown> = {
      user_id: userId,
    };
    if (input.defaultStyle !== undefined) payload.default_style = input.defaultStyle;
    if (input.defaultZoom !== undefined) payload.default_zoom = input.defaultZoom;
    if (input.defaultCenterLng !== undefined) payload.default_center_lng = input.defaultCenterLng;
    if (input.defaultCenterLat !== undefined) payload.default_center_lat = input.defaultCenterLat;
    if (input.theme !== undefined) payload.theme = input.theme;
    if (input.distanceUnit !== undefined) payload.distance_unit = input.distanceUnit;

    const { data, error } = await this.client
      .from('user_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase updateUserPreferences error: ${error.message}`);
    }

    return this.mapUserPreferences(data);
  }
}
