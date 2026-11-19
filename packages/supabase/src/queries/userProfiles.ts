import type { TypedSupabaseClient } from '../client/client.js';
import { normalizeSupabaseError, NotFoundError } from '../client/errors.js';
import type {
  UserProfile,
  UserPreferences,
  MapLayerPreference,
} from '../types/domain.types.js';

export async function getUserProfile(
  client: TypedSupabaseClient,
  userId: string
): Promise<UserProfile> {
  try {
    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('UserProfile', userId);

    return {
      id: data.id,
      username: data.username,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      website: data.website,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

export async function getUserPreferences(
  client: TypedSupabaseClient,
  userId: string
): Promise<UserPreferences | null> {
  try {
    const { data, error } = await client
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      defaultStyle: data.default_style,
      defaultZoom: Number(data.default_zoom),
      defaultCenterLng: Number(data.default_center_lng),
      defaultCenterLat: Number(data.default_center_lat),
      theme: data.theme,
      distanceUnit: data.distance_unit,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

export async function getMapLayerPreferences(
  client: TypedSupabaseClient,
  userId: string
): Promise<MapLayerPreference[]> {
  try {
    const { data, error } = await client
      .from('map_layer_preferences')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      layerId: row.layer_id,
      visible: row.visible,
      opacity: Number(row.opacity),
      styleOverrides: (row.style_overrides as Record<string, unknown>) || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}
