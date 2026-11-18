import { describe, it, expect } from 'vitest';
import {
  MockMapLibreMap,
  MOCK_CITY_COORDINATES,
  MOCK_CITY_BOUNDS,
  MOCK_SF_PLACES,
  MOCK_SF_ROUTE,
  MOCK_SF_PLACES_FEATURE_COLLECTION,
} from '../src/index.js';

describe('Testing Utilities and Fixtures', () => {
  it('instantiates MockMapLibreMap and handles camera operations', () => {
    const map = new MockMapLibreMap({
      center: [-122.4194, 37.7749],
      zoom: 12,
      pitch: 45,
      bearing: 90,
    });

    expect(map.getCenter()).toEqual({ lng: -122.4194, lat: 37.7749 });
    expect(map.getZoom()).toBe(12);
    expect(map.getPitch()).toBe(45);
    expect(map.getBearing()).toBe(90);

    map.flyTo({ center: [-74.006, 40.7128], zoom: 14 });
    expect(map.getCenter()).toEqual({ lng: -74.006, lat: 40.7128 });
    expect(map.getZoom()).toBe(14);
  });

  it('manages mock layers and sources cleanly', () => {
    const map = new MockMapLibreMap();
    map.addSource('places', { type: 'geojson', data: MOCK_SF_PLACES_FEATURE_COLLECTION });
    expect(map.getSource('places')).toBeDefined();

    map.addLayer({ id: 'places-layer', type: 'circle', source: 'places' });
    expect(map.getLayer('places-layer')).toBeDefined();

    map.removeLayer('places-layer');
    expect(map.getLayer('places-layer')).toBeUndefined();
  });

  it('contains valid mock geospatial datasets', () => {
    expect(MOCK_CITY_COORDINATES.sanFrancisco).toEqual([-122.4194, 37.7749]);
    expect(MOCK_CITY_BOUNDS.sanFrancisco).toHaveLength(4);
    expect(MOCK_SF_PLACES.length).toBeGreaterThan(0);
    expect(MOCK_SF_ROUTE.legs.length).toBeGreaterThan(0);
    expect(MOCK_SF_PLACES_FEATURE_COLLECTION.features.length).toBe(MOCK_SF_PLACES.length);
  });
});
