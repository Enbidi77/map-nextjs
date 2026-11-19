import type { Coordinate, PlaceCategory, PlaceSearchResult } from '@modern-maps/types';

export interface NearbySearchOptions {
  center: Coordinate;
  radiusMeters?: number;
  category?: PlaceCategory;
  limit?: number;
  query?: string;
}

export interface NearbyPlaceProvider {
  readonly name: string;
  searchNearby(options: NearbySearchOptions): Promise<PlaceSearchResult[]>;
  searchByCategory(category: PlaceCategory, center: Coordinate, radiusMeters?: number): Promise<PlaceSearchResult[]>;
}
