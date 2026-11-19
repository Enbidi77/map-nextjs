import { describe, it, expect, vi } from 'vitest';
import {
  createSavedPlace,
  updateSavedPlace,
  deleteSavedPlace,
} from '../src/mutations/savedPlaces.js';
import {
  createCollection,
  addPlaceToCollection,
  deleteCollection,
} from '../src/mutations/collections.js';
import { createMapFeature } from '../src/mutations/mapFeatures.js';
import { ValidationError } from '../src/client/errors.js';

describe('Supabase Mutations', () => {
  it('creates a saved place with validation', async () => {
    const chain: any = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'sp-123',
          user_id: 'user-1',
          provider_id: null,
          name: 'Central Park',
          formatted_address: 'New York, NY',
          category: 'nature',
          latitude: 40.785091,
          longitude: -73.968285,
          notes: 'Great park',
          custom_color: null,
          custom_icon: null,
          rating: 4.8,
          metadata: {},
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      }),
    };

    const mockClient = {
      from: vi.fn().mockReturnValue(chain),
    } as any;

    const result = await createSavedPlace(mockClient, {
      userId: 'user-1',
      name: 'Central Park',
      formattedAddress: 'New York, NY',
      category: 'nature',
      latitude: 40.785091,
      longitude: -73.968285,
    });

    expect(result.id).toBe('sp-123');
    expect(result.name).toBe('Central Park');
  });

  it('rejects empty place name on creation', async () => {
    const mockClient = {} as any;
    await expect(
      createSavedPlace(mockClient, {
        name: '',
        formattedAddress: 'Anywhere',
        latitude: 0,
        longitude: 0,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('creates collection and adds item', async () => {
    const collChain: any = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'c-1',
          user_id: 'u-1',
          name: 'Favorites',
          description: null,
          is_public: false,
          color: null,
          icon: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      }),
    };

    const itemChain: any = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'ci-1',
          collection_id: 'c-1',
          saved_place_id: 'p-1',
          sort_order: 0,
          notes: 'Favorite spot',
          added_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      }),
    };

    const mockClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'place_collections') return collChain;
        if (table === 'collection_items') return itemChain;
        return collChain;
      }),
    } as any;

    const coll = await createCollection(mockClient, {
      userId: 'u-1',
      name: 'Favorites',
    });
    expect(coll.name).toBe('Favorites');

    const item = await addPlaceToCollection(mockClient, coll.id, 'p-1', 'Favorite spot');
    expect(item.collectionId).toBe('c-1');
    expect(item.placeId).toBe('p-1');
  });

  it('creates map feature with GeoJSON validation', async () => {
    const chain: any = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'f-1',
          user_id: 'u-1',
          name: 'Polygon boundary',
          feature_type: 'polygon',
          geojson: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[-122, 37], [-122, 38], [-121, 38], [-121, 37], [-122, 37]]],
            },
          },
          properties: {},
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        error: null,
      }),
    };

    const mockClient = {
      from: vi.fn().mockReturnValue(chain),
    } as any;

    const feature = await createMapFeature(mockClient, {
      userId: 'u-1',
      name: 'Polygon boundary',
      featureType: 'polygon',
      geojson: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[-122, 37], [-122, 38], [-121, 38], [-121, 37], [-122, 37]]],
        },
      } as any,
    });

    expect(feature.id).toBe('f-1');
    expect(feature.featureType).toBe('polygon');
  });
});
