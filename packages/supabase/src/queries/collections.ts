import type { TypedSupabaseClient } from '../client/client.js';
import { normalizeSupabaseError, NotFoundError } from '../client/errors.js';
import type {
  PlaceCollection,
  CollectionItem,
  SharedCollection,
  SavedPlace,
} from '../types/domain.types.js';

export interface GetCollectionsOptions {
  userId?: string;
  isPublic?: boolean;
  limit?: number;
}

function mapRowToCollection(row: any, itemCount?: number): PlaceCollection {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    isPublic: row.is_public,
    color: row.color,
    icon: row.icon,
    itemCount: itemCount ?? (row.collection_items ? (Array.isArray(row.collection_items) ? row.collection_items.length : 0) : 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Retrieves place collections for a user or public collections.
 */
export async function getCollections(
  client: TypedSupabaseClient,
  options: GetCollectionsOptions = {}
): Promise<PlaceCollection[]> {
  try {
    let query = client.from('place_collections').select('*, collection_items(count)');

    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }
    if (options.isPublic !== undefined) {
      query = query.eq('is_public', options.isPublic);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row: any) => {
      const count = row.collection_items?.[0]?.count ?? 0;
      return mapRowToCollection(row, Number(count));
    });
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

/**
 * Retrieves a single collection by ID.
 */
export async function getCollectionById(
  client: TypedSupabaseClient,
  id: string
): Promise<PlaceCollection> {
  try {
    const { data, error } = await client
      .from('place_collections')
      .select('*, collection_items(count)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('PlaceCollection', id);

    const count = (data as any).collection_items?.[0]?.count ?? 0;
    return mapRowToCollection(data, Number(count));
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

/**
 * Retrieves all items in a collection, including the associated saved_places.
 */
export async function getCollectionItems(
  client: TypedSupabaseClient,
  collectionId: string
): Promise<CollectionItem[]> {
  try {
    const { data, error } = await client
      .from('collection_items')
      .select('*, saved_places(*)')
      .eq('collection_id', collectionId)
      .order('added_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => {
      let place: SavedPlace | undefined;
      if (item.saved_places) {
        const p = item.saved_places;
        place = {
          id: p.id,
          userId: p.user_id,
          providerId: p.provider_id,
          name: p.name,
          formattedAddress: p.formatted_address,
          category: p.category,
          latitude: Number(p.latitude),
          longitude: Number(p.longitude),
          notes: p.notes,
          customColor: p.custom_color,
          customIcon: p.custom_icon,
          rating: p.rating !== null ? Number(p.rating) : null,
          metadata: (p.metadata as Record<string, unknown>) || {},
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        };
      }

      return {
        id: item.id,
        collectionId: item.collection_id,
        savedPlaceId: item.saved_place_id,
        placeId: item.saved_place_id,
        sortOrder: item.sort_order,
        addedAt: item.added_at,
        notes: item.notes,
        place,
      };
    });
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

/**
 * Retrieves collections shared with the specified user.
 */
export async function getSharedCollections(
  client: TypedSupabaseClient,
  userId: string
): Promise<SharedCollection[]> {
  try {
    const { data, error } = await client
      .from('shared_collections')
      .select('*')
      .eq('shared_with_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      collectionId: row.collection_id,
      sharedWithUserId: row.shared_with_user_id,
      permission: row.permission,
      createdAt: row.created_at,
    }));
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}
