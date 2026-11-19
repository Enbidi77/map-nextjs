import { describe, it, expect, vi } from 'vitest';
import {
  getSavedPlaces,
  getSavedPlaceById,
  getNearbySavedPlaces,
  getPaginatedPlaces,
} from '../src/queries/savedPlaces.js';
import { getCollections, getCollectionById, getCollectionItems } from '../src/queries/collections.js';
import { getFeaturesInViewport, getMapFeatures } from '../src/queries/mapFeatures.js';
import { NotFoundError } from '../src/client/errors.js';

describe('Supabase Queries', () => {
  it('retrieves saved places with filtering', async () => {
    const mockRows = [
      {
        id: 'p1',
        user_id: 'u1',
        provider_id: null,
        name: 'Golden Gate Bridge',
        formatted_address: 'San Francisco, CA',
        category: 'attraction',
        latitude: 37.8199,
        longitude: -122.4783,
        notes: null,
        custom_color: '#ff0000',
        custom_icon: 'landmark',
        rating: 4.9,
        metadata: {},
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      then: (resolve: any) => resolve({ data: mockRows, error: null }),
    };

    const mockClient = {
      from: vi.fn().mockReturnValue(chain),
    } as any;

    const places = await getSavedPlaces(mockClient, {
      userId: 'u1',
      category: 'attraction',
      limit: 10,
    });

    expect(places).toHaveLength(1);
    expect(places[0]!.name).toBe('Golden Gate Bridge');
    expect(places[0]!.latitude).toBe(37.8199);
    expect(places[0]!.longitude).toBe(-122.4783);
  });

  it('throws NotFoundError on getSavedPlaceById when not found', async () => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    const mockClient = {
      from: vi.fn().mockReturnValue(chain),
    } as any;

    await expect(getSavedPlaceById(mockClient, 'missing-id')).rejects.toThrow(NotFoundError);
  });

  it('calls nearby_saved_places RPC', async () => {
    const mockNearby = [
      {
        id: 'p2',
        user_id: 'u1',
        provider_id: null,
        name: 'Coit Tower',
        formatted_address: 'San Francisco, CA',
        category: 'attraction',
        latitude: 37.8024,
        longitude: -122.4058,
        notes: null,
        custom_color: null,
        custom_icon: null,
        rating: 4.5,
        metadata: {},
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        distance_meters: 1250,
      },
    ];

    const mockClient = {
      rpc: vi.fn().mockResolvedValue({ data: mockNearby, error: null }),
    } as any;

    const results = await getNearbySavedPlaces(mockClient, {
      centerLng: -122.4194,
      centerLat: 37.7749,
      radiusMeters: 2000,
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe('Coit Tower');
    expect(results[0]!.distanceMeters).toBe(1250);
  });

  it('calls features_in_viewport RPC', async () => {
    const mockFeatures = [
      {
        id: 'f1',
        user_id: 'u1',
        name: 'Market St Route',
        feature_type: 'linestring',
        geojson: { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-122.4, 37.7], [-122.41, 37.78]] } },
        properties: { color: 'blue' },
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    const mockClient = {
      rpc: vi.fn().mockResolvedValue({ data: mockFeatures, error: null }),
    } as any;

    const features = await getFeaturesInViewport(mockClient, {
      minLng: -122.5,
      minLat: 37.7,
      maxLng: -122.3,
      maxLat: 37.8,
    });

    expect(features).toHaveLength(1);
    expect(features[0]!.name).toBe('Market St Route');
    expect(features[0]!.featureType).toBe('linestring');
  });
});
