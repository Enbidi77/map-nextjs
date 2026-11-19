import { describe, it, expect } from 'vitest';
import {
  buildOverpassQuery,
  getOverpassTagFilter,
  parseOverpassElement,
} from '../src/places/overpass.js';
import { MockNearbyPlaceAdapter } from '../src/places/mock.js';

describe('Nearby Places Adapters', () => {
  it('generates category tag filters for Overpass QL', () => {
    expect(getOverpassTagFilter('food_drink')).toContain('restaurant');
    expect(getOverpassTagFilter('lodging')).toContain('hotel');
    expect(getOverpassTagFilter('medical')).toContain('hospital');
    expect(getOverpassTagFilter('nature')).toContain('park');
  });

  it('builds Overpass QL query string with center and radius', () => {
    const q = buildOverpassQuery([-122.4194, 37.7749], 1500, 'food_drink', 20, 30);
    expect(q).toContain('[out:json][timeout:30];');
    expect(q).toContain('around:1500,37.7749,-122.4194');
    expect(q).toContain('out center 20;');
  });

  it('parses Overpass element into PlaceSearchResult', () => {
    const el = {
      type: 'node',
      id: 998877,
      lat: 37.78,
      lon: -122.41,
      tags: {
        name: 'Tartine Bakery',
        amenity: 'cafe',
        'addr:street': 'Guerrero St',
        'addr:housenumber': '600',
        'addr:city': 'San Francisco',
        phone: '+1-415-555-0199',
      },
    };

    const res = parseOverpassElement(el, [-122.4194, 37.7749]);
    expect(res).not.toBeNull();
    expect(res!.place.name).toBe('Tartine Bakery');
    expect(res!.place.category).toBe('food_drink');
    expect(res!.place.coordinates).toEqual([-122.41, 37.78]);
    expect(res!.distanceMeters).toBeGreaterThan(0);
  });

  it('MockNearbyPlaceAdapter filters by category and radius', async () => {
    const adapter = new MockNearbyPlaceAdapter();

    const cafes = await adapter.searchByCategory('food_drink', [-122.41, 37.78], 5000);
    expect(cafes.length).toBeGreaterThanOrEqual(1);
    expect(cafes.every((c) => c.place.category === 'food_drink')).toBe(true);

    const nearbyWithin500 = await adapter.searchNearby({
      center: [-122.41, 37.78],
      radiusMeters: 500,
    });
    expect(nearbyWithin500.every((p) => p.distanceMeters! <= 500)).toBe(true);
  });
});
