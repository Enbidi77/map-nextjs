import type {
  PlaceModel,
  PlaceSearchResult,
  Coordinate,
} from '@modern-maps/types';
import { calculateDistance } from '@modern-maps/geospatial';
import type {
  PlaceSearchOptions,
  ReverseGeocodeOptions,
  PlaceSearchProvider,
  GeocodingProvider,
} from '../types.js';
import {
  normalizePhotonFeature,
  type PhotonRawFeature,
} from '../normalizer.js';

export interface PhotonProviderConfig {
  baseUrl?: string;
  mockFallback?: boolean;
}

export class PhotonProvider implements PlaceSearchProvider, GeocodingProvider {
  readonly name = 'photon';
  private _baseUrl: string;
  private _mockFallback: boolean;

  constructor(config: PhotonProviderConfig = {}) {
    this._baseUrl = config.baseUrl ?? 'https://photon.komoot.io';
    this._mockFallback = config.mockFallback ?? true;
  }

  async autocomplete(options: PlaceSearchOptions): Promise<PlaceSearchResult[]> {
    return this.search(options);
  }

  async search(options: PlaceSearchOptions): Promise<PlaceSearchResult[]> {
    const { query, proximity, bbox, limit = 10, language = 'en' } = options;

    if (!query || query.trim() === '') {
      return [];
    }

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        limit: String(Math.min(limit, 50)),
        lang: language,
      });

      if (proximity) {
        params.set('lon', String(proximity[0]));
        params.set('lat', String(proximity[1]));
      }

      if (bbox) {
        // Photon bbox: minLon,minLat,maxLon,maxLat
        const [minLng, minLat, maxLng, maxLat] = bbox;
        params.set('bbox', `${minLng},${minLat},${maxLng},${maxLat}`);
      }

      const response = await fetch(`${this._baseUrl}/api?${params.toString()}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        throw new Error(`Photon HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as { features: PhotonRawFeature[] };
      const features = data.features || [];

      return features.map((feat, idx) => {
        const place = normalizePhotonFeature(feat);
        const distanceMeters = proximity
          ? calculateDistance(proximity, place.coordinates, 'meters')
          : undefined;

        return {
          place,
          distanceMeters,
          relevanceScore: Math.max(0.1, 1 - idx * 0.05),
        };
      });
    } catch (err) {
      if (this._mockFallback) {
        return this._getFallbackResults(query, proximity, limit);
      }
      throw err;
    }
  }

  async forward(query: string, options: Partial<PlaceSearchOptions> = {}): Promise<PlaceModel[]> {
    const results = await this.search({ query, ...options });
    return results.map((r) => r.place);
  }

  async reverse(options: ReverseGeocodeOptions): Promise<PlaceModel | null> {
    const { coordinate } = options;
    const [lon, lat] = coordinate;

    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
      });

      const response = await fetch(`${this._baseUrl}/reverse?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Photon reverse HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as { features: PhotonRawFeature[] };
      const feature = data.features?.[0];
      if (!feature) return null;
      return normalizePhotonFeature(feature);
    } catch (err) {
      if (this._mockFallback) {
        return {
          id: `photon-mock-${Math.round(lon * 1000)}-${Math.round(lat * 1000)}`,
          name: 'Reverse Geocoded Location',
          description: `Location at ${lat.toFixed(5)}, ${lon.toFixed(5)}`,
          category: 'other',
          coordinates: coordinate,
          address: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        };
      }
      throw err;
    }
  }

  private _getFallbackResults(
    query: string,
    proximity?: Coordinate,
    limit: number = 10
  ): PlaceSearchResult[] {
    const q = query.toLowerCase();
    const mockPlaces: PlaceModel[] = [
      {
        id: 'mock-pt-market',
        name: `${query} Central Market`,
        description: `Market on Main St, downtown`,
        category: 'shopping',
        coordinates: proximity ? [proximity[0] + 0.005, proximity[1] + 0.005] : [-122.4194, 37.7749],
        address: '100 Main St',
        city: 'Metropolis',
      },
      {
        id: 'mock-pt-station',
        name: `${query} Grand Station`,
        description: `Central Railway & Transit Station`,
        category: 'transit',
        coordinates: proximity ? [proximity[0] - 0.005, proximity[1] - 0.005] : [-122.4000, 37.7800],
        address: '200 Station Way',
        city: 'Metropolis',
      },
      {
        id: 'mock-pt-park',
        name: `${query} Memorial Park`,
        description: `Public municipal park and gardens`,
        category: 'nature',
        coordinates: proximity ? [proximity[0] + 0.01, proximity[1] - 0.01] : [-122.4300, 37.7600],
        address: '500 Park Blvd',
        city: 'Metropolis',
      },
    ];

    const matched = mockPlaces.filter((p) => p.name.toLowerCase().includes(q));
    const candidates = matched;

    return candidates.slice(0, limit).map((place, index) => {
      const distanceMeters = proximity
        ? calculateDistance(proximity, place.coordinates, 'meters')
        : undefined;
      return {
        place,
        distanceMeters,
        relevanceScore: Math.max(0.1, 1 - index * 0.1),
      };
    });
  }
}
