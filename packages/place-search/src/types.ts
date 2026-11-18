import type {
  Coordinate,
  BoundingBox,
  PlaceModel,
  PlaceCategory,
  PlaceSearchResult,
} from '@modern-maps/types';

export interface PlaceSearchOptions {
  query: string;
  proximity?: Coordinate;
  bbox?: BoundingBox;
  limit?: number;
  offset?: number;
  categories?: PlaceCategory[];
  countryCodes?: string[];
  language?: string;
}

export interface ReverseGeocodeOptions {
  coordinate: Coordinate;
  zoom?: number;
  language?: string;
}

export interface PlaceSearchProvider {
  readonly name: string;
  search(options: PlaceSearchOptions): Promise<PlaceSearchResult[]>;
  autocomplete(options: PlaceSearchOptions): Promise<PlaceSearchResult[]>;
}

export interface GeocodingProvider {
  readonly name: string;
  forward(query: string, options?: Partial<PlaceSearchOptions>): Promise<PlaceModel[]>;
  reverse(options: ReverseGeocodeOptions): Promise<PlaceModel | null>;
}
