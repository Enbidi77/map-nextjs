import { describe, it, expect, vi } from 'vitest';
import {
  buildNominatimSearchUrl,
  buildNominatimReverseUrl,
  parseNominatimResult,
  mapOsmToCategory,
  NominatimGeocodingAdapter,
} from '../src/geocoding/nominatim.js';
import { MockGeocodingAdapter } from '../src/geocoding/mock.js';

describe('Geocoding Adapters', () => {
  it('builds Nominatim search URL correctly', () => {
    const url = buildNominatimSearchUrl('San Francisco', {
      limit: 5,
      language: 'en',
      countryCodes: ['us'],
      boundingBox: [-122.5, 37.7, -122.3, 37.8],
    });

    expect(url).toContain('q=San+Francisco');
    expect(url).toContain('format=jsonv2');
    expect(url).toContain('limit=5');
    expect(url).toContain('countrycodes=us');
    expect(url).toContain('bounded=1');
  });

  it('builds Nominatim reverse geocode URL correctly', () => {
    const url = buildNominatimReverseUrl([-122.4194, 37.7749], { zoom: 16 });
    expect(url).toContain('lat=37.7749');
    expect(url).toContain('lon=-122.4194');
    expect(url).toContain('zoom=16');
  });

  it('maps OSM classes and types to PlaceCategory', () => {
    expect(mapOsmToCategory('amenity', 'restaurant')).toBe('food_drink');
    expect(mapOsmToCategory('amenity', 'hospital')).toBe('medical');
    expect(mapOsmToCategory('tourism', 'hotel')).toBe('lodging');
    expect(mapOsmToCategory('tourism', 'museum')).toBe('attraction');
    expect(mapOsmToCategory('shop', 'supermarket')).toBe('shopping');
    expect(mapOsmToCategory('leisure', 'park')).toBe('nature');
  });

  it('parses Nominatim JSON item to GeocodeResult', () => {
    const raw = {
      place_id: 12345,
      osm_id: 67890,
      osm_type: 'way',
      lat: '37.7749',
      lon: '-122.4194',
      display_name: 'Civic Center, San Francisco, CA, USA',
      category: 'amenity',
      type: 'place_of_worship',
      importance: '0.85',
      boundingbox: ['37.77', '37.78', '-122.42', '-122.41'],
      address: {
        city: 'San Francisco',
        state: 'California',
        country: 'United States',
        postcode: '94102',
      },
    };

    const res = parseNominatimResult(raw);
    expect(res.placeId).toBe('12345');
    expect(res.coordinates).toEqual([-122.4194, 37.7749]);
    expect(res.boundingBox).toEqual([-122.42, 37.77, -122.41, 37.78]);
    expect(res.address?.city).toBe('San Francisco');
    expect(res.placeModel.name).toBe('Civic Center');
  });

  it('MockGeocodingAdapter handles forward and reverse geocoding', async () => {
    const adapter = new MockGeocodingAdapter();

    const forward = await adapter.forward('Golden Gate');
    expect(forward.length).toBeGreaterThan(0);
    expect(forward[0]!.name).toBe('Golden Gate Bridge');

    const reverse = await adapter.reverse([-122.4783, 37.8199]);
    expect(reverse).not.toBeNull();
    expect(reverse!.name).toBe('Golden Gate Bridge');
  });
});
