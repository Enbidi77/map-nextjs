import type { TypedSupabaseClient } from '../client/client.js';
import { normalizeSupabaseError, NotFoundError, ValidationError } from '../client/errors.js';
import type {
  SavedPlace,
  CreateSavedPlaceInput,
  UpdateSavedPlaceInput,
} from '../types/domain.types.js';

function mapRowToSavedPlace(row: any): SavedPlace {
  return {
    id: row.id,
    userId: row.user_id,
    providerId: row.provider_id,
    name: row.name,
    formattedAddress: row.formatted_address,
    category: row.category,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    notes: row.notes,
    customColor: row.custom_color,
    customIcon: row.custom_icon,
    rating: row.rating !== null ? Number(row.rating) : null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Creates a new saved place.
 */
export async function createSavedPlace(
  client: TypedSupabaseClient,
  input: CreateSavedPlaceInput
): Promise<SavedPlace> {
  try {
    if (!input.name || !input.name.trim()) {
      throw new ValidationError('Place name is required');
    }
    if (typeof input.latitude !== 'number' || typeof input.longitude !== 'number') {
      throw new ValidationError('Valid latitude and longitude are required');
    }

    const payload: any = {
      name: input.name.trim(),
      formatted_address: input.formattedAddress,
      category: input.category || 'other',
      latitude: input.latitude,
      longitude: input.longitude,
      location: `POINT(${input.longitude} ${input.latitude})`,
      notes: input.notes ?? null,
      custom_color: input.customColor ?? null,
      custom_icon: input.customIcon ?? null,
      rating: input.rating ?? null,
      metadata: input.metadata || {},
    };

    if (input.userId) {
      payload.user_id = input.userId;
    }
    if (input.providerId) {
      payload.provider_id = input.providerId;
    }

    const { data, error } = await client
      .from('saved_places')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('SavedPlace');

    return mapRowToSavedPlace(data);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

/**
 * Updates an existing saved place.
 */
export async function updateSavedPlace(
  client: TypedSupabaseClient,
  id: string,
  input: UpdateSavedPlaceInput
): Promise<SavedPlace> {
  try {
    const payload: any = {};
    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.formattedAddress !== undefined) payload.formatted_address = input.formattedAddress;
    if (input.category !== undefined) payload.category = input.category;
    if (input.latitude !== undefined) payload.latitude = input.latitude;
    if (input.longitude !== undefined) payload.longitude = input.longitude;
    if (input.latitude !== undefined && input.longitude !== undefined) {
      payload.location = `POINT(${input.longitude} ${input.latitude})`;
    }
    if (input.notes !== undefined) payload.notes = input.notes;
    if (input.customColor !== undefined) payload.custom_color = input.customColor;
    if (input.customIcon !== undefined) payload.custom_icon = input.customIcon;
    if (input.rating !== undefined) payload.rating = input.rating;
    if (input.metadata !== undefined) payload.metadata = input.metadata;

    const { data, error } = await client
      .from('saved_places')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('SavedPlace', id);

    return mapRowToSavedPlace(data);
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

/**
 * Deletes a saved place by ID.
 */
export async function deleteSavedPlace(
  client: TypedSupabaseClient,
  id: string
): Promise<void> {
  try {
    const { error } = await client
      .from('saved_places')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}
