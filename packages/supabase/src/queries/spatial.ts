import type { TypedSupabaseClient } from '../client/client.js';
import { normalizeSupabaseError, ValidationError } from '../client/errors.js';
import type { Coordinate, BoundingBox } from '@modern-maps/types';

/**
 * Calls the PostGIS RPC function `spatial_distance` to compute great-circle distance between two points in meters.
 */
export async function calculateSpatialDistance(
  client: TypedSupabaseClient,
  point1: Coordinate,
  point2: Coordinate
): Promise<number> {
  try {
    const [p1Lng, p1Lat] = point1;
    const [p2Lng, p2Lat] = point2;

    const { data, error } = await client.rpc('spatial_distance', {
      p1_lng: p1Lng,
      p1_lat: p1Lat,
      p2_lng: p2Lng,
      p2_lat: p2Lat,
    });

    if (error) throw error;
    return Number(data ?? 0);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

/**
 * Converts a [lng, lat] coordinate to a PostGIS WKT POINT string: "POINT(lng lat)"
 */
export function coordinateToWktPoint(coordinate: Coordinate): string {
  const [lng, lat] = coordinate;
  if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
    throw new ValidationError(`Invalid coordinate for WKT conversion: ${JSON.stringify(coordinate)}`);
  }
  return `POINT(${lng} ${lat})`;
}

/**
 * Parses a PostGIS WKT POINT string "POINT(lng lat)" into [lng, lat] coordinate.
 */
export function parseWktPoint(wkt: string): Coordinate {
  const match = wkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (!match || !match[1] || !match[2]) {
    throw new ValidationError(`Invalid WKT POINT string: "${wkt}"`);
  }
  const lng = parseFloat(match[1]);
  const lat = parseFloat(match[2]);
  return [lng, lat];
}

/**
 * Converts a bounding box [minLng, minLat, maxLng, maxLat] to a PostGIS POLYGON WKT string.
 */
export function bboxToWktPolygon(bbox: BoundingBox): string {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return `POLYGON((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat}))`;
}
