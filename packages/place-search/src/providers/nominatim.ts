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
  normalizeNominatimPlace,
  type NominatimRawItem,
} from '../normalizer.js';

export interface NominatimProviderConfig {
  baseUrl?: string;
  userAgent?: string;
  minRequestIntervalMs?: number;
  mockFallback?: boolean;
}

export class NominatimProvider implements PlaceSearchProvider, GeocodingProvider {
  readonly name = 'nominatim';
  private _baseUrl: string;
  private _userAgent: string;
  private _minIntervalMs: number;
  private _lastRequestTime: number = 0;
  private _mockFallback: boolean;

  constructor(config: NominatimProviderConfig = {}) {
    this._baseUrl = config.baseUrl ?? 'https://nominatim.openstreetmap.org';
    this._userAgent = config.userAgent ?? 'ModernMapsPlatform/1.0 (contact: info@modernmaps.local)';
    this._minIntervalMs = config.minRequestIntervalMs ?? 1000;
    this._mockFallback = config.mockFallback ?? true;
  }

  private async _throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this._lastRequestTime;
    if (elapsed < this._minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this._minIntervalMs - elapsed));
    }
    this._lastRequestTime = Date.now();
  }

  async search(options: PlaceSearchOptions): Promise<PlaceSearchResult[]> {
    const { query, bbox, proximity, limit = 10, countryCodes, language = 'en' } = options;

    if (!query || query.trim() === '') {
      return [];
    }

    try {
      await this._throttle();

      const params = new URLSearchParams({
        q: query.trim(),
        format: 'jsonv2',
        addressdetails: '1',
        extratags: '1',
        limit: String(Math.min(limit, 50)),
        'accept-language': language,
      });

      if (bbox) {
        // Nominatim viewbox is: left,top,right,bottom -> minLng,maxLat,maxLng,minLat
        const [minLng, minLat, maxLng, maxLat] = bbox;
        params.set('viewbox', `${minLng},${maxLat},${maxLng},${minLat}`);
      }

      if (countryCodes && countryCodes.length > 0) {
        params.set('countrycodes', countryCodes.join(','));
      }

      const response = await fetch(`${this._baseUrl}/search?${params.toString()}`, {
        headers: {
          'User-Agent': this._userAgent,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        throw new Error(`Nominatim HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as NominatimRawItem[];
      return data.map((item, idx) => {
        const place = normalizeNominatimPlace(item);
        const distanceMeters = proximity
          ? calculateDistance(proximity, place.coordinates, 'meters')
          : undefined;

        return {
          place,
          distanceMeters,
          relevanceScore: item.importance ?? Math.max(0.1, 1 - idx * 0.05),
        };
      });
    } catch (err) {
      if (this._mockFallback) {
        return this._getFallbackResults(query, proximity, limit);
      }
      throw err;
    }
  }

  async autocomplete(options: PlaceSearchOptions): Promise<PlaceSearchResult[]> {
    return this.search(options);
  }

  async forward(query: string, options: Partial<PlaceSearchOptions> = {}): Promise<PlaceModel[]> {
    const results = await this.search({ query, ...options });
    return results.map((r) => r.place);
  }

  async reverse(options: ReverseGeocodeOptions): Promise<PlaceModel | null> {
    const { coordinate, zoom = 18, language = 'en' } = options;
    const [lon, lat] = coordinate;

    try {
      await this._throttle();

      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        format: 'jsonv2',
        addressdetails: '1',
        extratags: '1',
        zoom: String(zoom),
        'accept-language': language,
      });

      const response = await fetch(`${this._baseUrl}/reverse?${params.toString()}`, {
        headers: {
          'User-Agent': this._userAgent,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        throw new Error(`Nominatim reverse HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as NominatimRawItem;
      if (!data || !data.lat) return null;
      return normalizeNominatimPlace(data);
    } catch (err) {
      if (this._mockFallback) {
        return {
          id: `reverse-mock-${Math.round(lon * 1000)}-${Math.round(lat * 1000)}`,
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
    const q = query.toLowerCase().trim();
    const mockPlaces: PlaceModel[] = [
      {
        id: 'osm-relation-49915',
        name: 'Việt Nam',
        description: 'Việt Nam',
        category: 'attraction',
        coordinates: [107.9651, 15.9267],
        address: 'Việt Nam',
        country: 'Việt Nam',
        metadata: {
          bbox: [102.1438643, 7.6920852, 114.8572578, 23.3926918],
          type: 'administrative',
          addresstype: 'country',
        },
      },
      {
        id: 'mock-vn-hanoi',
        name: 'Hà Nội',
        description: 'Hà Nội, Việt Nam',
        category: 'attraction',
        coordinates: [105.8342, 21.0278],
        address: 'Hà Nội, Việt Nam',
        city: 'Hà Nội',
        country: 'Việt Nam',
        metadata: {
          bbox: [105.7, 20.9, 105.95, 21.15],
          type: 'city',
        },
      },
      {
        id: 'mock-vn-hcmc',
        name: 'Thành phố Hồ Chí Minh',
        description: 'Thành phố Hồ Chí Minh, Việt Nam',
        category: 'attraction',
        coordinates: [106.6297, 10.8231],
        address: 'Thành phố Hồ Chí Minh, Việt Nam',
        city: 'Thành phố Hồ Chí Minh',
        country: 'Việt Nam',
        metadata: {
          bbox: [106.5, 10.7, 106.8, 10.9],
          type: 'city',
        },
      },
      {
        id: 'mock-vn-danang',
        name: 'Đà Nẵng',
        description: 'Đà Nẵng, Việt Nam',
        category: 'attraction',
        coordinates: [108.2022, 16.0544],
        address: 'Đà Nẵng, Việt Nam',
        city: 'Đà Nẵng',
        country: 'Việt Nam',
        metadata: {
          bbox: [108.1, 15.95, 108.3, 16.15],
          type: 'city',
        },
      },
      {
        id: 'mock-china',
        name: 'China',
        description: 'China',
        category: 'attraction',
        coordinates: [104.1954, 35.8617],
        address: 'China',
        country: 'China',
        metadata: {
          bbox: [73.4994136, 18.1535216, 134.7728099, 53.5609739],
          type: 'administrative',
          addresstype: 'country',
        },
      },
      {
        id: 'mock-sf-ferry',
        name: 'Ferry Building Marketplace',
        description: '1 Ferry Building, San Francisco, CA 94111',
        category: 'food_drink',
        coordinates: [-122.3937, 37.7955],
        address: '1 Ferry Building, San Francisco, CA 94111',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        rating: 4.7,
      },
      {
        id: 'mock-sf-bridge',
        name: 'Golden Gate Bridge',
        description: 'Golden Gate Bridge, San Francisco, CA',
        category: 'attraction',
        coordinates: [-122.4783, 37.8199],
        address: 'Golden Gate Bridge, San Francisco, CA',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        rating: 4.9,
      },
      {
        id: 'mock-sf-coit',
        name: 'Coit Tower',
        description: '1 Telegraph Hill Blvd, San Francisco, CA 94133',
        category: 'attraction',
        coordinates: [-122.4058, 37.8024],
        address: '1 Telegraph Hill Blvd, San Francisco, CA 94133',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        rating: 4.6,
      },
      {
        id: 'mock-sf-tartine',
        name: 'Tartine Bakery',
        description: '600 Guerrero St, San Francisco, CA 94110',
        category: 'food_drink',
        coordinates: [-122.4241, 37.7614],
        address: '600 Guerrero St, San Francisco, CA 94110',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        rating: 4.6,
      },
    ];

    const matched = mockPlaces.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchAddress = p.address.toLowerCase().includes(q);
      const matchCountry = (p.country?.toLowerCase() ?? '').includes(q);
      const matchCity = (p.city?.toLowerCase() ?? '').includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      // Handle "vietnam" vs "viet nam"
      const normalizedQ = q.replace(/\s+/g, '');
      const normalizedName = p.name.toLowerCase().replace(/\s+/g, '');
      const normalizedAddress = p.address.toLowerCase().replace(/\s+/g, '');
      const matchNormalized = normalizedName.includes(normalizedQ) || normalizedAddress.includes(normalizedQ);
      return matchName || matchAddress || matchCountry || matchCity || matchCat || matchNormalized;
    });

    const candidates = matched.length > 0 ? matched : (q ? [] : mockPlaces);

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
