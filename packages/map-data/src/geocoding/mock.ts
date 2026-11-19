import type { Coordinate } from '@modern-maps/types';
import type { GeocodingProvider, GeocodeOptions, ReverseGeocodeOptions, GeocodeResult } from './types.js';

export const MOCK_PLACES: GeocodeResult[] = [
  {
    placeId: 'mock-sf-gg-bridge',
    name: 'Golden Gate Bridge',
    displayName: 'Golden Gate Bridge, San Francisco, CA, USA',
    category: 'attraction',
    coordinates: [-122.4783, 37.8199],
    importance: 0.95,
    address: { city: 'San Francisco', state: 'California', country: 'United States' },
    placeModel: {
      id: 'mock-sf-gg-bridge',
      name: 'Golden Gate Bridge',
      category: 'attraction',
      coordinates: [-122.4783, 37.8199],
      address: 'Golden Gate Bridge, San Francisco, CA, USA',
    },
  },
  {
    placeId: 'mock-sf-coit-tower',
    name: 'Coit Tower',
    displayName: '1 Telegraph Hill Blvd, San Francisco, CA 94133, USA',
    category: 'attraction',
    coordinates: [-122.4058, 37.8024],
    importance: 0.88,
    address: { city: 'San Francisco', state: 'California', country: 'United States' },
    placeModel: {
      id: 'mock-sf-coit-tower',
      name: 'Coit Tower',
      category: 'attraction',
      coordinates: [-122.4058, 37.8024],
      address: '1 Telegraph Hill Blvd, San Francisco, CA 94133, USA',
    },
  },
  {
    placeId: 'mock-nyc-central-park',
    name: 'Central Park',
    displayName: 'Central Park, New York, NY, USA',
    category: 'nature',
    coordinates: [-73.9665, 40.7812],
    importance: 0.98,
    address: { city: 'New York', state: 'New York', country: 'United States' },
    placeModel: {
      id: 'mock-nyc-central-park',
      name: 'Central Park',
      category: 'nature',
      coordinates: [-73.9665, 40.7812],
      address: 'Central Park, New York, NY, USA',
    },
  },
  {
    placeId: 'mock-lon-big-ben',
    name: 'Big Ben',
    displayName: 'Big Ben, London, SW1A 0AA, United Kingdom',
    category: 'attraction',
    coordinates: [-0.1246, 51.5007],
    importance: 0.96,
    address: { city: 'London', country: 'United Kingdom' },
    placeModel: {
      id: 'mock-lon-big-ben',
      name: 'Big Ben',
      category: 'attraction',
      coordinates: [-0.1246, 51.5007],
      address: 'Big Ben, London, SW1A 0AA, United Kingdom',
    },
  },
  {
    placeId: 'mock-tokyo-tower',
    name: 'Tokyo Tower',
    displayName: '4-2-8 Shibakoen, Minato City, Tokyo 105-0011, Japan',
    category: 'attraction',
    coordinates: [139.7454, 35.6586],
    importance: 0.94,
    address: { city: 'Tokyo', country: 'Japan' },
    placeModel: {
      id: 'mock-tokyo-tower',
      name: 'Tokyo Tower',
      category: 'attraction',
      coordinates: [139.7454, 35.6586],
      address: '4-2-8 Shibakoen, Minato City, Tokyo 105-0011, Japan',
    },
  },
];

export class MockGeocodingAdapter implements GeocodingProvider {
  readonly name = 'mock';
  private places: GeocodeResult[];

  constructor(customPlaces?: GeocodeResult[]) {
    this.places = customPlaces || MOCK_PLACES;
  }

  async forward(query: string, options: GeocodeOptions = {}): Promise<GeocodeResult[]> {
    if (!query || !query.trim()) return [];
    const q = query.toLowerCase().trim();

    let results = this.places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.displayName.toLowerCase().includes(q) ||
        (p.address?.city && p.address.city.toLowerCase().includes(q))
    );

    if (options.categoryFilter && options.categoryFilter.length > 0) {
      results = results.filter((r) => options.categoryFilter!.includes(r.category));
    }

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  async reverse(coordinate: Coordinate, _options: ReverseGeocodeOptions = {}): Promise<GeocodeResult | null> {
    const [lng, lat] = coordinate;
    let closest: GeocodeResult | null = null;
    let minDistance = Infinity;

    for (const p of this.places) {
      const dLng = p.coordinates[0] - lng;
      const dLat = p.coordinates[1] - lat;
      const dist = Math.sqrt(dLng * dLng + dLat * dLat);
      if (dist < minDistance) {
        minDistance = dist;
        closest = p;
      }
    }

    // Within ~0.5 degrees
    if (minDistance < 0.5) {
      return closest;
    }

    return {
      placeId: `mock-rev-${lng.toFixed(4)}-${lat.toFixed(4)}`,
      name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      displayName: `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      category: 'other',
      coordinates: [lng, lat],
      placeModel: {
        id: `mock-rev-${lng.toFixed(4)}-${lat.toFixed(4)}`,
        name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        category: 'other',
        coordinates: [lng, lat],
        address: `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      },
    };
  }
}
