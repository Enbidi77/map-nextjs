import type { TypedSupabaseClient } from '../client/client.js';
import { normalizeSupabaseError, NotFoundError } from '../client/errors.js';
import type { SearchHistoryItem } from '../types/domain.types.js';

export interface AddSearchHistoryInput {
  userId: string;
  query: string;
  latitude?: number | null;
  longitude?: number | null;
  centerLng?: number | null;
  centerLat?: number | null;
  selectedPlaceId?: string | null;
  selectedPlaceName?: string | null;
  metadata?: Record<string, unknown>;
}

export async function addSearchHistory(
  client: TypedSupabaseClient,
  input: AddSearchHistoryInput
): Promise<SearchHistoryItem> {
  try {
    const lat = input.latitude ?? input.centerLat ?? null;
    const lng = input.longitude ?? input.centerLng ?? null;

    const payload: any = {
      user_id: input.userId,
      query: input.query.trim(),
      latitude: lat,
      longitude: lng,
      selected_place_id: input.selectedPlaceId ?? null,
      selected_place_name: input.selectedPlaceName ?? null,
      metadata: input.metadata || {},
    };

    if (lat !== null && lng !== null) {
      payload.location = `POINT(${lng} ${lat})`;
    }

    const { data, error } = await client
      .from('search_history')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('SearchHistoryItem');

    return {
      id: data.id,
      userId: data.user_id,
      query: data.query,
      latitude: data.latitude !== null ? Number(data.latitude) : null,
      longitude: data.longitude !== null ? Number(data.longitude) : null,
      centerLng: data.longitude !== null ? Number(data.longitude) : null,
      centerLat: data.latitude !== null ? Number(data.latitude) : null,
      selectedPlaceId: data.selected_place_id,
      selectedPlaceName: data.selected_place_name,
      metadata: (data.metadata as Record<string, unknown>) || {},
      createdAt: data.created_at,
    };
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

export async function clearSearchHistory(
  client: TypedSupabaseClient,
  userId: string
): Promise<void> {
  try {
    const { error } = await client
      .from('search_history')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}
