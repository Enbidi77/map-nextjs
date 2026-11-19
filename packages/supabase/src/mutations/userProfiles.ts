import type { TypedSupabaseClient } from '../client/client.js';
import { normalizeSupabaseError, NotFoundError } from '../client/errors.js';
import type {
  UserProfile,
  UserPreferences,
  MapLayerPreference,
} from '../types/domain.types.js';

export async function updateUserProfile(
  client: TypedSupabaseClient,
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<UserProfile> {
  try {
    const payload: any = {};
    if (updates.username !== undefined) payload.username = updates.username;
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
    if (updates.bio !== undefined) payload.bio = updates.bio;
    if (updates.website !== undefined) payload.website = updates.website;

    const { data, error } = await client
      .from('user_profiles')
      .update(payload)
      .eq('id', userId)
      .select('*')
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

export async function updateUserPreferences(
  client: TypedSupabaseClient,
  userId: string,
  preferences: Partial<Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<UserPreferences> {
  try {
    const payload: any = {};
    if (preferences.defaultStyle !== undefined) payload.default_style = preferences.defaultStyle;
    if (preferences.defaultZoom !== undefined) payload.default_zoom = preferences.defaultZoom;
    if (preferences.defaultCenterLng !== undefined) payload.default_center_lng = preferences.defaultCenterLng;
    if (preferences.defaultCenterLat !== undefined) payload.default_center_lat = preferences.defaultCenterLat;
    if (preferences.theme !== undefined) payload.theme = preferences.theme;
    if (preferences.distanceUnit !== undefined) payload.distance_unit = preferences.distanceUnit;

    const { data, error } = await client
      .from('user_preferences')
      .update(payload)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('UserPreferences', userId);

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

export async function upsertMapLayerPreference(
  client: TypedSupabaseClient,
  pref: {
    userId: string;
    layerId: string;
    visible?: boolean;
    opacity?: number;
    styleOverrides?: Record<string, unknown>;
  }
): Promise<MapLayerPreference> {
  try {
    const payload: any = {
      user_id: pref.userId,
      layer_id: pref.layerId,
      visible: pref.visible ?? true,
      opacity: pref.opacity ?? 1.0,
      style_overrides: pref.styleOverrides || {},
    };

    const { data, error } = await client
      .from('map_layer_preferences')
      .upsert(payload, { onConflict: 'user_id, layer_id' })
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('MapLayerPreference');

    return {
      id: data.id,
      userId: data.user_id,
      layerId: data.layer_id,
      visible: data.visible,
      opacity: Number(data.opacity),
      styleOverrides: (data.style_overrides as Record<string, unknown>) || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}
