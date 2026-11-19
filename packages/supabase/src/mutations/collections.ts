import type { TypedSupabaseClient } from '../client/client.js';
import { normalizeSupabaseError, NotFoundError, ValidationError } from '../client/errors.js';
import type {
  PlaceCollection,
  CollectionItem,
  SharedCollection,
  CreateCollectionInput,
  UpdateCollectionInput,
  ShareCollectionInput,
} from '../types/domain.types.js';

function mapRowToCollection(row: any): PlaceCollection {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    isPublic: row.is_public,
    color: row.color,
    icon: row.icon,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createCollection(
  client: TypedSupabaseClient,
  input: CreateCollectionInput
): Promise<PlaceCollection> {
  try {
    if (!input.name || !input.name.trim()) {
      throw new ValidationError('Collection name is required');
    }

    const { data, error } = await client
      .from('place_collections')
      .insert({
        user_id: input.userId,
        name: input.name.trim(),
        description: input.description ?? null,
        is_public: input.isPublic ?? false,
        color: input.color ?? null,
        icon: input.icon ?? null,
      })
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('PlaceCollection');

    return mapRowToCollection(data);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

export async function updateCollection(
  client: TypedSupabaseClient,
  id: string,
  input: UpdateCollectionInput
): Promise<PlaceCollection> {
  try {
    const payload: any = {};
    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.description !== undefined) payload.description = input.description;
    if (input.isPublic !== undefined) payload.is_public = input.isPublic;
    if (input.color !== undefined) payload.color = input.color;
    if (input.icon !== undefined) payload.icon = input.icon;

    const { data, error } = await client
      .from('place_collections')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('PlaceCollection', id);

    return mapRowToCollection(data);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

export async function deleteCollection(
  client: TypedSupabaseClient,
  id: string
): Promise<void> {
  try {
    const { error } = await client
      .from('place_collections')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

export async function addPlaceToCollection(
  client: TypedSupabaseClient,
  collectionId: string,
  placeId: string,
  notes?: string | null,
  sortOrder?: number
): Promise<CollectionItem> {
  try {
    const { data, error } = await client
      .from('collection_items')
      .insert({
        collection_id: collectionId,
        saved_place_id: placeId,
        notes: notes ?? null,
        sort_order: sortOrder ?? 0,
      })
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('CollectionItem');

    return {
      id: data.id,
      collectionId: data.collection_id,
      savedPlaceId: data.saved_place_id,
      placeId: data.saved_place_id,
      sortOrder: data.sort_order,
      addedAt: data.added_at,
      notes: data.notes,
    };
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

export async function removePlaceFromCollection(
  client: TypedSupabaseClient,
  collectionId: string,
  placeId: string
): Promise<void> {
  try {
    const { error } = await client
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('saved_place_id', placeId);

    if (error) throw error;
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

export async function shareCollection(
  client: TypedSupabaseClient,
  input: ShareCollectionInput
): Promise<SharedCollection> {
  try {
    const { data, error } = await client
      .from('shared_collections')
      .insert({
        collection_id: input.collectionId,
        shared_with_user_id: input.sharedWithUserId,
        permission: input.permission || 'read',
      })
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('SharedCollection');

    return {
      id: data.id,
      collectionId: data.collection_id,
      sharedWithUserId: data.shared_with_user_id,
      permission: data.permission,
      createdAt: data.created_at,
    };
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

export async function unshareCollection(
  client: TypedSupabaseClient,
  sharedCollectionId: string
): Promise<void> {
  try {
    const { error } = await client
      .from('shared_collections')
      .delete()
      .eq('id', sharedCollectionId);

    if (error) throw error;
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}
