import type { Coordinate, PlaceCategory, PlaceModel, PlaceSearchResult } from '@modern-maps/types';
import type { NearbyPlaceProvider, NearbySearchOptions } from './types.js';

export interface SupabasePlacesConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  functionName?: string;
}

export class SupabaseNearbyPlacesAdapter implements NearbyPlaceProvider {
  readonly name = 'supabase';
  private functionUrl: string;
  private apiKey: string;

  constructor(config: SupabasePlacesConfig) {
    const fn = config.functionName || 'nearby-places';
    this.functionUrl = `${config.supabaseUrl.replace(/\/+$/, '')}/functions/v1/${fn}`;
    this.apiKey = config.supabaseAnonKey;
  }

  async searchNearby(options: NearbySearchOptions): Promise<PlaceSearchResult[]> {
    const [lng, lat] = options.center;
    const url = new URL(this.functionUrl);
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lng', String(lng));
    if (options.radiusMeters) {
      url.searchParams.set('radius', String(options.radiusMeters));
    }
    if (options.category) {
      url.searchParams.set('category', options.category);
    }
    if (options.limit) {
      url.searchParams.set('limit', String(options.limit));
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        apikey: this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase nearby-places error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const places = Array.isArray(data.places) ? data.places : [];

    return places.map((p: any) => {
      const placeModel: PlaceModel = {
        id: p.id,
        name: p.name,
        category: (p.category as PlaceCategory) || 'other',
        coordinates: [p.longitude, p.latitude],
        address: p.formattedAddress,
        rating: p.rating,
        description: p.notes,
        metadata: p.metadata || {},
      };

      return {
        place: placeModel,
        distanceMeters: p.distanceMeters,
        relevanceScore: Math.max(0.1, 1 - (p.distanceMeters || 0) / 10000),
      };
    });
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
