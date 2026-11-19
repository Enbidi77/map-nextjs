import type { Coordinate, PlaceCategory, PlaceSearchResult } from '@modern-maps/types';
import type { NearbyPlaceProvider, NearbySearchOptions } from './types.js';

export const MOCK_NEARBY_PLACES: PlaceSearchResult[] = [
  {
    place: {
      id: 'mock-cafe-1',
      name: 'Blue Bottle Coffee',
      category: 'food_drink',
      coordinates: [-122.408, 37.782],
      address: '66 Mint St, San Francisco, CA',
      rating: 4.6,
      priceLevel: 2,
    },
    distanceMeters: 320,
    relevanceScore: 0.95,
  },
  {
    place: {
      id: 'mock-rest-1',
      name: 'The French Laundry',
      category: 'food_drink',
      coordinates: [-122.364, 38.404],
      address: '6640 Washington St, Yountville, CA',
      rating: 4.9,
      priceLevel: 4,
    },
    distanceMeters: 1450,
    relevanceScore: 0.92,
  },
  {
    place: {
      id: 'mock-hotel-1',
      name: 'Fairmont Hotel',
      category: 'lodging',
      coordinates: [-122.411, 37.792],
      address: '950 Mason St, San Francisco, CA',
      rating: 4.7,
      priceLevel: 4,
    },
    distanceMeters: 850,
    relevanceScore: 0.88,
  },
  {
    place: {
      id: 'mock-park-1',
      name: 'Mission Dolores Park',
      category: 'nature',
      coordinates: [-122.427, 37.759],
      address: 'Dolores St, San Francisco, CA',
      rating: 4.8,
    },
    distanceMeters: 1200,
    relevanceScore: 0.85,
  },
  {
    place: {
      id: 'mock-pharm-1',
      name: 'Walgreens Pharmacy',
      category: 'medical',
      coordinates: [-122.415, 37.785],
      address: '135 Powell St, San Francisco, CA',
      rating: 4.0,
      priceLevel: 1,
    },
    distanceMeters: 450,
    relevanceScore: 0.80,
  },
];

export class MockNearbyPlaceAdapter implements NearbyPlaceProvider {
  readonly name = 'mock';
  private places: PlaceSearchResult[];

  constructor(customPlaces?: PlaceSearchResult[]) {
    this.places = customPlaces || MOCK_NEARBY_PLACES;
  }

  async searchNearby(options: NearbySearchOptions): Promise<PlaceSearchResult[]> {
    let results = [...this.places];

    if (options.category) {
      results = results.filter((p) => p.place.category === options.category);
    }

    if (options.query) {
      const q = options.query.toLowerCase();
      results = results.filter((p) => p.place.name.toLowerCase().includes(q));
    }

    if (options.radiusMeters) {
      results = results.filter((p) => (p.distanceMeters ?? 0) <= options.radiusMeters!);
    }

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  async searchByCategory(
    category: PlaceCategory,
    center: Coordinate,
    radiusMeters: number = 2000
  ): Promise<PlaceSearchResult[]> {
    return this.searchNearby({
      center,
      radiusMeters,
      category,
    });
  }
}
