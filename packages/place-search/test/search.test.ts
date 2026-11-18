import { describe, it, expect, vi } from 'vitest';
import {
  detectCategory,
  normalizeNominatimPlace,
  normalizePhotonFeature,
  SearchCache,
  debounce,
  NominatimProvider,
  PhotonProvider,
  PlaceSearchService,
} from '../src/index.js';

describe('Normalizer and Category Detection', () => {
  it('correctly maps OSM tags to standard PlaceCategory', () => {
    expect(detectCategory('amenity', 'restaurant')).toBe('food_drink');
    expect(detectCategory('amenity', 'cafe')).toBe('food_drink');
    expect(detectCategory('tourism', 'hotel')).toBe('lodging');
    expect(detectCategory('shop', 'supermarket')).toBe('shopping');
    expect(detectCategory('railway', 'station')).toBe('transit');
    expect(detectCategory('tourism', 'museum')).toBe('attraction');
    expect(detectCategory('leisure', 'park')).toBe('nature');
    expect(detectCategory('amenity', 'hospital')).toBe('medical');
    expect(detectCategory('amenity', 'cinema')).toBe('entertainment');
    expect(detectCategory('amenity', 'bank')).toBe('services');
    expect(detectCategory('unknown', 'unknown')).toBe('other');
  });

  it('normalizes raw Nominatim item into PlaceModel', () => {
    const raw = {
      place_id: 123456,
      osm_type: 'node',
      osm_id: 998877,
      lat: '37.7749',
      lon: '-122.4194',
      display_name: 'San Francisco City Hall, 1, Dr. Carlton B. Goodlett Place, Civic Center, San Francisco, California, 94102, USA',
      class: 'amenity',
      type: 'townhall',
      importance: 0.85,
      address: {
        city: 'San Francisco',
        state: 'California',
        postcode: '94102',
        country: 'USA',
      },
      extratags: {
        website: 'https://sf.gov',
      },
    };

    const place = normalizeNominatimPlace(raw);
    expect(place.id).toBe('osm-node-998877');
    expect(place.coordinates).toEqual([-122.4194, 37.7749]);
    expect(place.city).toBe('San Francisco');
    expect(place.website).toBe('https://sf.gov');
    expect(place.category).toBe('other');
  });

  it('normalizes Photon GeoJSON feature into PlaceModel', () => {
    const feature = {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [-122.3937, 37.7955] as [number, number],
      },
      properties: {
        osm_id: 45678,
        osm_type: 'W',
        osm_key: 'amenity',
        osm_value: 'marketplace',
        name: 'Ferry Building',
        street: 'The Embarcadero',
        city: 'San Francisco',
        state: 'CA',
        country: 'United States',
      },
    };

    const place = normalizePhotonFeature(feature);
    expect(place.id).toBe('photon-W-45678');
    expect(place.name).toBe('Ferry Building');
    expect(place.coordinates).toEqual([-122.3937, 37.7955]);
    expect(place.city).toBe('San Francisco');
  });
});

describe('Search Cache', () => {
  it('stores and retrieves cached entries before expiration', () => {
    const cache = new SearchCache<string>({ ttlMs: 1000 });
    cache.set('key1', 'value1');

    expect(cache.has('key1')).toBe(true);
    expect(cache.get('key1')).toBe('value1');
    expect(cache.size).toBe(1);
  });

  it('evicts entries when capacity limit is reached', () => {
    const cache = new SearchCache<string>({ maxSize: 2, ttlMs: 10000 });
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');

    expect(cache.size).toBe(2);
    expect(cache.has('a')).toBe(false);
    expect(cache.has('b')).toBe(true);
    expect(cache.has('c')).toBe(true);
  });
});

describe('Debounce Utility', () => {
  it('delays execution and collapses rapid calls', async () => {
    const fn = vi.fn((x: number) => x * 2);
    const debounced = debounce(fn, 50);

    debounced(1);
    debounced(2);
    const promise3 = debounced(3);

    const result = await promise3;
    expect(result).toBe(6);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('PlaceSearchService & Providers', () => {
  it('performs search and caches results', async () => {
    const service = new PlaceSearchService({
      primarySearchProvider: new NominatimProvider({ mockFallback: true }),
      autocompleteProvider: new PhotonProvider({ mockFallback: true }),
    });

    const results = await service.search({
      query: 'Ferry',
      proximity: [-122.4194, 37.7749],
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.place.coordinates).toBeDefined();

    // Second call should return cached results instantly
    const cachedResults = await service.search({
      query: 'Ferry',
      proximity: [-122.4194, 37.7749],
    });

    expect(cachedResults).toEqual(results);
  });

  it('filters search results by category', async () => {
    const service = new PlaceSearchService();
    const foodResults = await service.search({
      query: 'bakery',
      categories: ['food_drink'],
    });

    for (const r of foodResults) {
      expect(r.place.category).toBe('food_drink');
    }
  });

  it('reverse geocodes coordinates into a place', async () => {
    const service = new PlaceSearchService();
    const place = await service.reverse({
      coordinate: [-122.4194, 37.7749],
    });

    expect(place).not.toBeNull();
    expect(place?.coordinates[0]).toBeCloseTo(-122.4194, 3);
    expect(place?.coordinates[1]).toBeCloseTo(37.7749, 3);
  });
});
