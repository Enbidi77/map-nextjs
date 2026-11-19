import type { Coordinate, BoundingBox, PlaceModel, PlaceCategory } from '@modern-maps/types';

export interface GeocodeOptions {
  limit?: number;
  boundingBox?: BoundingBox;
  countryCodes?: string[];
  language?: string;
  categoryFilter?: PlaceCategory[];
}

export interface ReverseGeocodeOptions {
  zoom?: number;
  language?: string;
}

export interface GeocodeResult {
  placeId: string;
  name: string;
  displayName: string;
  category: PlaceCategory;
  coordinates: Coordinate;
  boundingBox?: BoundingBox;
  importance?: number;
  address?: {
    houseNumber?: string;
    road?: string;
    neighborhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countryCode?: string;
  };
  placeModel: PlaceModel;
}

export interface GeocodingProvider {
  readonly name: string;
  forward(query: string, options?: GeocodeOptions): Promise<GeocodeResult[]>;
  reverse(coordinate: Coordinate, options?: ReverseGeocodeOptions): Promise<GeocodeResult | null>;
}
