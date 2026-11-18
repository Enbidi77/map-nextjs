import type {
  DatabaseAdapter,
  CreateMapFeatureInput,
  UpdateMapFeatureInput,
} from '../adapters/types.js';
import type { UserMapFeature, MapFeatureType } from '../schema/index.js';
import { PostgresDatabaseAdapter, type DrizzleDatabase } from '../adapters/postgres.js';

function getAdapter(target: DatabaseAdapter | DrizzleDatabase): DatabaseAdapter {
  if (typeof target === 'object' && target !== null && 'createMapFeature' in target) {
    return target as DatabaseAdapter;
  }
  return new PostgresDatabaseAdapter(target);
}

export async function createMapFeature(
  target: DatabaseAdapter | DrizzleDatabase,
  input: CreateMapFeatureInput
): Promise<UserMapFeature> {
  return getAdapter(target).createMapFeature(input);
}

export async function getMapFeatureById(
  target: DatabaseAdapter | DrizzleDatabase,
  id: string
): Promise<UserMapFeature | null> {
  return getAdapter(target).getMapFeatureById(id);
}

export async function listMapFeatures(
  target: DatabaseAdapter | DrizzleDatabase,
  userId?: string | null,
  featureType?: MapFeatureType
): Promise<UserMapFeature[]> {
  return getAdapter(target).listMapFeatures(userId, featureType);
}

export async function updateMapFeature(
  target: DatabaseAdapter | DrizzleDatabase,
  id: string,
  input: UpdateMapFeatureInput
): Promise<UserMapFeature | null> {
  return getAdapter(target).updateMapFeature(id, input);
}

export async function deleteMapFeature(
  target: DatabaseAdapter | DrizzleDatabase,
  id: string
): Promise<boolean> {
  return getAdapter(target).deleteMapFeature(id);
}
