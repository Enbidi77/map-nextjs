import type {
  DatabaseAdapter,
  CreateSavedPlaceInput,
  UpdateSavedPlaceInput,
  SavedPlaceFilter,
} from '../adapters/types.js';
import type { SavedPlace } from '../schema/index.js';
import { PostgresDatabaseAdapter, type DrizzleDatabase } from '../adapters/postgres.js';

function getAdapter(target: DatabaseAdapter | DrizzleDatabase): DatabaseAdapter {
  if (typeof target === 'object' && target !== null && 'createSavedPlace' in target) {
    return target as DatabaseAdapter;
  }
  return new PostgresDatabaseAdapter(target);
}

export async function createSavedPlace(
  target: DatabaseAdapter | DrizzleDatabase,
  input: CreateSavedPlaceInput
): Promise<SavedPlace> {
  return getAdapter(target).createSavedPlace(input);
}

export async function getSavedPlaceById(
  target: DatabaseAdapter | DrizzleDatabase,
  id: string
): Promise<SavedPlace | null> {
  return getAdapter(target).getSavedPlaceById(id);
}

export async function listSavedPlaces(
  target: DatabaseAdapter | DrizzleDatabase,
  userId?: string | null,
  filter?: SavedPlaceFilter
): Promise<SavedPlace[]> {
  return getAdapter(target).listSavedPlaces(userId, filter);
}

export async function updateSavedPlace(
  target: DatabaseAdapter | DrizzleDatabase,
  id: string,
  input: UpdateSavedPlaceInput
): Promise<SavedPlace | null> {
  return getAdapter(target).updateSavedPlace(id, input);
}

export async function deleteSavedPlace(
  target: DatabaseAdapter | DrizzleDatabase,
  id: string
): Promise<boolean> {
  return getAdapter(target).deleteSavedPlace(id);
}
