import type {
  DatabaseAdapter,
  CreateCollectionInput,
  UpdateCollectionInput,
  PlaceCollectionWithPlaces,
} from '../adapters/types.js';
import type { PlaceCollection, CollectionItem, SavedPlace } from '../schema/index.js';
import { PostgresDatabaseAdapter, type DrizzleDatabase } from '../adapters/postgres.js';

function getAdapter(target: DatabaseAdapter | DrizzleDatabase): DatabaseAdapter {
  if (typeof target === 'object' && target !== null && 'createCollection' in target) {
    return target as DatabaseAdapter;
  }
  return new PostgresDatabaseAdapter(target);
}

export async function createCollection(
  target: DatabaseAdapter | DrizzleDatabase,
  input: CreateCollectionInput
): Promise<PlaceCollection> {
  return getAdapter(target).createCollection(input);
}

export async function getCollectionById(
  target: DatabaseAdapter | DrizzleDatabase,
  id: string,
  includePlaces = false
): Promise<PlaceCollectionWithPlaces | PlaceCollection | null> {
  return getAdapter(target).getCollectionById(id, includePlaces);
}

export async function listCollections(
  target: DatabaseAdapter | DrizzleDatabase,
  userId?: string | null
): Promise<PlaceCollection[]> {
  return getAdapter(target).listCollections(userId);
}

export async function updateCollection(
  target: DatabaseAdapter | DrizzleDatabase,
  id: string,
  input: UpdateCollectionInput
): Promise<PlaceCollection | null> {
  return getAdapter(target).updateCollection(id, input);
}

export async function deleteCollection(
  target: DatabaseAdapter | DrizzleDatabase,
  id: string
): Promise<boolean> {
  return getAdapter(target).deleteCollection(id);
}

export async function addPlaceToCollection(
  target: DatabaseAdapter | DrizzleDatabase,
  collectionId: string,
  savedPlaceId: string,
  sortOrder = 0
): Promise<CollectionItem> {
  return getAdapter(target).addPlaceToCollection(collectionId, savedPlaceId, sortOrder);
}

export async function removePlaceFromCollection(
  target: DatabaseAdapter | DrizzleDatabase,
  collectionId: string,
  savedPlaceId: string
): Promise<boolean> {
  return getAdapter(target).removePlaceFromCollection(collectionId, savedPlaceId);
}

export async function getCollectionItems(
  target: DatabaseAdapter | DrizzleDatabase,
  collectionId: string
): Promise<(CollectionItem & { savedPlace: SavedPlace })[]> {
  return getAdapter(target).getCollectionItems(collectionId);
}
