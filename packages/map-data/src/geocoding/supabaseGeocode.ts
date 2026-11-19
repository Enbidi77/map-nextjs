import type { Coordinate, PlaceModel, PlaceCategory } from '@modern-maps/types';
import type { GeocodingProvider, GeocodeOptions, ReverseGeocodeOptions, GeocodeResult } from './types.js';

export interface SupabaseGeocodeConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  functionName?: string;
}

export class SupabaseGeocodingAdapter implements GeocodingProvider {
  readonly name = 'supabase';
  private functionUrl: string;
  private apiKey: string;

  constructor(config: SupabaseGeocodeConfig) {
    const fn = config.functionName || 'geocode';
    this.functionUrl = `${config.supabaseUrl.replace(/\/+$/, '')}/functions/v1/${fn}`;
    this.apiKey = config.supabaseAnonKey;
  }

  async forward(query: string, options: GeocodeOptions = {}): Promise<GeocodeResult[]> {
    if (!query || !query.trim()) return [];

    const url = new URL(this.functionUrl);
    url.searchParams.set('q', query.trim());
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
      throw new Error(`Supabase geocode error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return (data.results || []).map((r: any) => this.mapResult(r));
  }

  async reverse(coordinate: Coordinate, _options: ReverseGeocodeOptions = {}): Promise<GeocodeResult | null> {
    const [lng, lat] = coordinate;
    const url = new URL(this.functionUrl);
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lng', String(lng));

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        apikey: this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase reverse geocode error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const first = (data.results || [])[0];
    return first ? this.mapResult(first) : null;
  }

  private mapResult(r: any): GeocodeResult {
    const coords: Coordinate = [r.coordinates[0], r.coordinates[1]];
    const cat = (r.category as PlaceCategory) || 'other';

    const placeModel: PlaceModel = {
      id: r.id,
      name: r.name,
      description: r.formattedAddress,
      category: cat,
      coordinates: coords,
      address: r.formattedAddress,
    };

    return {
      placeId: r.id,
      name: r.name,
      displayName: r.formattedAddress,
      category: cat,
      coordinates: coords,
      boundingBox: r.bbox,
      importance: r.confidence,
      placeModel,
    };
  }
}
