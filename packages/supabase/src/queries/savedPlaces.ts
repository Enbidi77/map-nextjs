import type { TypedSupabaseClient } from '../client/client.js';
import { normalizeSupabaseError, NotFoundError } from '../client/errors.js';
import type {
  SavedPlace,
  NearbySavedPlacesFilter,
  PaginatedPlacesOptions,
} from '../types/domain.types.js';

export interface GetSavedPlacesOptions {
  userId?: string;
  category?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'name' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

function mapRowToSavedPlace(row: any): SavedPlace {
  return {
    id: row.id,
    userId: row.user_id,
    providerId: row.provider_id,
    name: row.name,
    formattedAddress: row.formatted_address,
    category: row.category,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    notes: row.notes,
    customColor: row.custom_color,
    customIcon: row.custom_icon,
    rating: row.rating !== null ? Number(row.rating) : null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.distance_meters !== undefined ? { distanceMeters: Number(row.distance_meters) } : {}),
  };
}

/**
 * Retrieves saved places filtered by optional user, category, or search criteria.
 */
export async function getSavedPlaces(
  client: TypedSupabaseClient,
  options: GetSavedPlacesOptions = {}
): Promise<SavedPlace[]> {
  try {
    let query = client.from('saved_places').select('*');

    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }
    if (options.category) {
      query = query.eq('category', options.category);
    }
    if (options.searchQuery) {
      query = query.ilike('name', `%${options.searchQuery}%`);
    }

    const sortBy = options.sortBy || 'created_at';
    const ascending = options.sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    if (options.limit !== undefined) {
      const offset = options.offset || 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapRowToSavedPlace);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

/**
 * Retrieves a single saved place by ID.
 */
export async function getSavedPlaceById(
  client: TypedSupabaseClient,
  id: string
): Promise<SavedPlace> {
  try {
    const { data, error } = await client
      .from('saved_places')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('SavedPlace', id);
    return mapRowToSavedPlace(data);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

/**
 * Uses PostGIS RPC function `nearby_saved_places` to find places near a coordinate within a radius.
 */
export async function getNearbySavedPlaces(
  client: TypedSupabaseClient,
  filter: NearbySavedPlacesFilter
): Promise<SavedPlace[]> {
  try {
    const { data, error } = await client.rpc('nearby_saved_places', {
      center_lng: filter.centerLng,
      center_lat: filter.centerLat,
      radius_meters: filter.radiusMeters ?? 5000,
      max_results: filter.maxResults ?? 50,
      category_filter: filter.categoryFilter ?? null,
    });

    if (error) throw error;
    return (data || []).map(mapRowToSavedPlace);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

/**
 * Uses PostGIS RPC function `paginated_places` with cursor-based pagination.
 */
export async function getPaginatedPlaces(
  client: TypedSupabaseClient,
  options: PaginatedPlacesOptions = {}
): Promise<SavedPlace[]> {
  try {
    const { data, error } = await client.rpc('paginated_places', {
      cursor_id: options.cursorId ?? null,
      page_size: options.pageSize ?? 20,
      category_filter: options.categoryFilter ?? null,
      search_query: options.searchQuery ?? null,
    });

    if (error) throw error;
    return (data || []).map(mapRowToSavedPlace);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}
