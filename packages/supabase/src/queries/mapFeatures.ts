import type { TypedSupabaseClient } from '../client/client.js';
import { normalizeSupabaseError, NotFoundError } from '../client/errors.js';
import type { GeoJSONFeature } from '@modern-maps/types';
import type {
  UserMapFeature,
  FeaturesInViewportFilter,
  FeaturesIntersectingGeometryFilter,
  FeatureType,
} from '../types/domain.types.js';

export interface GetMapFeaturesOptions {
  userId?: string;
  featureType?: FeatureType;
  limit?: number;
  offset?: number;
}

function mapRowToMapFeature(row: any): UserMapFeature {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    featureType: row.feature_type as FeatureType,
    geojson: row.geojson as GeoJSONFeature,
    properties: (row.properties as Record<string, unknown>) || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Retrieves user map features.
 */
export async function getMapFeatures(
  client: TypedSupabaseClient,
  options: GetMapFeaturesOptions = {}
): Promise<UserMapFeature[]> {
  try {
    let query = client.from('user_map_features').select('*');

    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }
    if (options.featureType) {
      query = query.eq('feature_type', options.featureType);
    }

    query = query.order('created_at', { ascending: false });

    if (options.limit !== undefined) {
      const offset = options.offset || 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(mapRowToMapFeature);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

/**
 * Retrieves a single user map feature by ID.
 */
export async function getMapFeatureById(
  client: TypedSupabaseClient,
  id: string
): Promise<UserMapFeature> {
  try {
    const { data, error } = await client
      .from('user_map_features')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('UserMapFeature', id);

    return mapRowToMapFeature(data);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

/**
 * Uses PostGIS RPC function `features_in_viewport` to fetch features within a bounding box.
 */
export async function getFeaturesInViewport(
  client: TypedSupabaseClient,
  filter: FeaturesInViewportFilter
): Promise<UserMapFeature[]> {
  try {
    const { data, error } = await client.rpc('features_in_viewport', {
      min_lng: filter.minLng,
      min_lat: filter.minLat,
      max_lng: filter.maxLng,
      max_lat: filter.maxLat,
      max_features: filter.maxFeatures ?? 100,
      feature_type_filter: filter.featureTypeFilter ?? null,
    });

    if (error) throw error;
    return (data || []).map(mapRowToMapFeature);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

/**
 * Uses PostGIS RPC function `features_intersecting_geometry` to query intersecting features.
 */
export async function getFeaturesIntersectingGeometry(
  client: TypedSupabaseClient,
  filter: FeaturesIntersectingGeometryFilter
): Promise<UserMapFeature[]> {
  try {
    const { data, error } = await client.rpc('features_intersecting_geometry', {
      target_geom: filter.targetGeom as any,
      max_features: filter.maxFeatures ?? 100,
    });

    if (error) throw error;
    return (data || []).map(mapRowToMapFeature);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}
