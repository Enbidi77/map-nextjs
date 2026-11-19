import type { TypedSupabaseClient } from '../client/client.js';
import { normalizeSupabaseError } from '../client/errors.js';
import type { SearchHistoryItem } from '../types/domain.types.js';

function mapRowToSearchHistory(row: any): SearchHistoryItem {
  const lat = row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : null;
  const lng = row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : null;
  return {
    id: row.id,
    userId: row.user_id,
    query: row.query,
    latitude: lat,
    longitude: lng,
    centerLng: lng,
    centerLat: lat,
    selectedPlaceId: row.selected_place_id,
    selectedPlaceName: row.selected_place_name,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.created_at,
  };
}

/**
 * Retrieves search history items for the current user.
 */
export async function getSearchHistory(
  client: TypedSupabaseClient,
  limit: number = 20
): Promise<SearchHistoryItem[]> {
  try {
    const { data, error } = await client
      .from('search_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(mapRowToSearchHistory);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

/**
 * Retrieves unique recent search query strings.
 */
export async function getRecentSearches(
  client: TypedSupabaseClient,
  limit: number = 10
): Promise<string[]> {
  try {
    const { data, error } = await client
      .from('search_history')
      .select('query')
      .order('created_at', { ascending: false })
      .limit(limit * 2);

    if (error) throw error;

    const queries: string[] = Array.from(new Set<string>((data || []).map((row: any) => row.query)));
    return queries.slice(0, limit);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}
