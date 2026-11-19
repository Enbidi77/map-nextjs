import type { TypedSupabaseClient } from '../client/client.js';
import { normalizeSupabaseError, NotFoundError, ValidationError } from '../client/errors.js';
import type { GeoJSONFeature } from '@modern-maps/types';
import type {
  UserMapFeature,
  CreateMapFeatureInput,
  UpdateMapFeatureInput,
} from '../types/domain.types.js';

function mapRowToMapFeature(row: any): UserMapFeature {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    featureType: row.feature_type,
    geojson: row.geojson as GeoJSONFeature,
    properties: (row.properties as Record<string, unknown>) || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createMapFeature(
  client: TypedSupabaseClient,
  input: CreateMapFeatureInput
): Promise<UserMapFeature> {
  try {
    if (!input.name || !input.name.trim()) {
      throw new ValidationError('Feature name is required');
    }
    if (!input.geojson) {
      throw new ValidationError('GeoJSON geometry or feature is required');
    }

    const payload: any = {
      name: input.name.trim(),
      feature_type: input.featureType,
      geojson: input.geojson,
      properties: input.properties || {},
    };

    if (input.userId) {
      payload.user_id = input.userId;
    }

    const { data, error } = await client
      .from('user_map_features')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('UserMapFeature');

    return mapRowToMapFeature(data);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

export async function updateMapFeature(
  client: TypedSupabaseClient,
  id: string,
  input: UpdateMapFeatureInput
): Promise<UserMapFeature> {
  try {
    const payload: any = {};
    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.featureType !== undefined) payload.feature_type = input.featureType;
    if (input.geojson !== undefined) payload.geojson = input.geojson;
    if (input.properties !== undefined) payload.properties = input.properties;

    const { data, error } = await client
      .from('user_map_features')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('UserMapFeature', id);

    return mapRowToMapFeature(data);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

export async function deleteMapFeature(
  client: TypedSupabaseClient,
  id: string
): Promise<void> {
  try {
    const { error } = await client
      .from('user_map_features')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

export async function bulkCreateMapFeatures(
  client: TypedSupabaseClient,
  features: CreateMapFeatureInput[]
): Promise<UserMapFeature[]> {
  try {
    if (features.length === 0) return [];

    const payloads = features.map((f) => {
      const payload: any = {
        name: f.name.trim(),
        feature_type: f.featureType,
        geojson: f.geojson,
        properties: f.properties || {},
      };
      if (f.userId) payload.user_id = f.userId;
      return payload;
    });

    const { data, error } = await client
      .from('user_map_features')
      .insert(payloads)
      .select('*');

    if (error) throw error;
    return (data || []).map(mapRowToMapFeature);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}
