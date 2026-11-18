import type { BoundingBox, Coordinate } from './coordinates.js';

export type PlaceCategory =
  | 'food_drink'
  | 'lodging'
  | 'shopping'
  | 'transit'
  | 'attraction'
  | 'services'
  | 'nature'
  | 'medical'
  | 'entertainment'
  | 'other';

export interface TimePeriod {
  day: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  time: string; // "0900", "1700" (HHmm format)
}

export interface OpeningPeriod {
  open: TimePeriod;
  close?: TimePeriod;
}

export interface OpeningHours {
  openNow?: boolean;
  periods?: OpeningPeriod[];
  weekdayDescriptions?: string[];
}

export interface PlaceModel {
  id: string;
  name: string;
  description?: string;
  category: PlaceCategory;
  coordinates: Coordinate;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  website?: string;
  rating?: number; // 1.0 - 5.0
  reviewCount?: number;
  priceLevel?: 1 | 2 | 3 | 4; // $ to $$$$
  openingHours?: OpeningHours;
  photos?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlaceFilter {
  query?: string;
  categories?: PlaceCategory[];
  boundingBox?: BoundingBox;
  center?: Coordinate;
  radiusMeters?: number;
  minRating?: number;
  maxPriceLevel?: number;
  openNow?: boolean;
  limit?: number;
  offset?: number;
}

export interface PlaceSearchResult {
  place: PlaceModel;
  distanceMeters?: number;
  relevanceScore: number;
  highlightedName?: string;
}
