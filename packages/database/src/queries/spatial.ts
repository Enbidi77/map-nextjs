import type { Coordinate, BoundingBox } from '@modern-maps/types';
import type { DatabaseAdapter, SavedPlaceWithDistance } from '../adapters/types.js';
import type { SavedPlace } from '../schema/index.js';
import { PostgresDatabaseAdapter, type DrizzleDatabase } from '../adapters/postgres.js';

function isAdapter(target: unknown): target is DatabaseAdapter {
  return typeof target === 'object' && target !== null && 'findNearbyPlaces' in target;
}

/**
 * Finds saved places within `radiusMeters` of `center` [lng, lat].
 * Supports either DatabaseAdapter instance (Postgres or InMemory) or raw Drizzle DB instance.
 */
export async function findNearbyPlaces(
  target: DatabaseAdapter | DrizzleDatabase,
  userId: string | null | undefined,
  center: Coordinate,
  radiusMeters: number
): Promise<SavedPlaceWithDistance[]> {
  if (isAdapter(target)) {
    return target.findNearbyPlaces(userId, center, radiusMeters);
  }

  // Target is a raw DrizzleDatabase instance
  const tempAdapter = new PostgresDatabaseAdapter(target);
  return tempAdapter.findNearbyPlaces(userId, center, radiusMeters);
}

/**
 * Finds saved places within a bounding box [minLng, minLat, maxLng, maxLat].
 */
export async function findPlacesInBBox(
  target: DatabaseAdapter | DrizzleDatabase,
  userId: string | null | undefined,
  bbox: BoundingBox
): Promise<SavedPlace[]> {
  if (isAdapter(target)) {
    return target.findPlacesInBBox(userId, bbox);
  }

  const tempAdapter = new PostgresDatabaseAdapter(target);
  return tempAdapter.findPlacesInBBox(userId, bbox);
}
