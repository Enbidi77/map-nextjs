import type {
  PlaceModel,
  PlaceSearchResult,
} from '@modern-maps/types';
import type {
  PlaceSearchOptions,
  ReverseGeocodeOptions,
  PlaceSearchProvider,
  GeocodingProvider,
} from './types.js';
import { NominatimProvider } from './providers/nominatim.js';
import { PhotonProvider } from './providers/photon.js';
export { PhotonProvider, NominatimProvider };
import { SearchCache } from './cache.js';

export interface PlaceSearchServiceOptions {
  primarySearchProvider?: PlaceSearchProvider;
  autocompleteProvider?: PlaceSearchProvider;
  geocodingProvider?: GeocodingProvider;
  enableCache?: boolean;
  cacheTtlMs?: number;
}

export class PlaceSearchService {
  private _searchProvider: PlaceSearchProvider;
  private _autocompleteProvider: PlaceSearchProvider;
  private _geocodingProvider: GeocodingProvider;
  private _cache?: SearchCache<PlaceSearchResult[]>;
  private _reverseCache?: SearchCache<PlaceModel>;

  constructor(options: PlaceSearchServiceOptions = {}) {
    this._searchProvider = options.primarySearchProvider ?? new NominatimProvider();
    this._autocompleteProvider = options.autocompleteProvider ?? new NominatimProvider();
    this._geocodingProvider = options.geocodingProvider ?? new NominatimProvider();

    const enableCache = options.enableCache ?? true;
    if (enableCache) {
      this._cache = new SearchCache<PlaceSearchResult[]>({
        ttlMs: options.cacheTtlMs ?? 1000 * 60 * 5, // 5 min
      });
      this._reverseCache = new SearchCache<PlaceModel>({
        ttlMs: options.cacheTtlMs ?? 1000 * 60 * 15,
      });
    }
  }

  async search(options: PlaceSearchOptions): Promise<PlaceSearchResult[]> {
    const cacheKey = `search:${options.query.toLowerCase().trim()}:${options.proximity?.join(',')}:${options.bbox?.join(',')}:${options.limit}`;

    if (this._cache?.has(cacheKey)) {
      const cached = this._cache.get(cacheKey);
      if (cached && cached.length > 0) return this._filterCategories(cached, options);
    }

    try {
      const results = await this._searchProvider.search(options);
      if (results && results.length > 0) {
        this._cache?.set(cacheKey, results);
        return this._filterCategories(results, options);
      }
    } catch {
      // Fallback to secondary provider if primary fails
    }

    try {
      const fallback = await this._autocompleteProvider.search(options);
      this._cache?.set(cacheKey, fallback);
      return this._filterCategories(fallback, options);
    } catch {
      return [];
    }
  }

  async autocomplete(options: PlaceSearchOptions): Promise<PlaceSearchResult[]> {
    const cacheKey = `ac:${options.query.toLowerCase().trim()}:${options.proximity?.join(',')}:${options.limit}`;

    if (this._cache?.has(cacheKey)) {
      const cached = this._cache.get(cacheKey);
      if (cached && cached.length > 0) return this._filterCategories(cached, options);
    }

    try {
      const results = await this._searchProvider.search(options);
      if (results && results.length > 0) {
        this._cache?.set(cacheKey, results);
        return this._filterCategories(results, options);
      }
    } catch {
      // Fallback
    }

    try {
      const fallback = await this._autocompleteProvider.autocomplete(options);
      this._cache?.set(cacheKey, fallback);
      return this._filterCategories(fallback, options);
    } catch {
      return [];
    }
  }

  async reverse(options: ReverseGeocodeOptions): Promise<PlaceModel | null> {
    const [lon, lat] = options.coordinate;
    const cacheKey = `rev:${lat.toFixed(4)},${lon.toFixed(4)}:${options.zoom ?? 18}`;

    if (this._reverseCache?.has(cacheKey)) {
      return this._reverseCache.get(cacheKey) ?? null;
    }

    const place = await this._geocodingProvider.reverse(options);
    if (place) {
      this._reverseCache?.set(cacheKey, place);
    }
    return place;
  }

  private _filterCategories(
    results: PlaceSearchResult[],
    options: PlaceSearchOptions
  ): PlaceSearchResult[] {
    if (!options.categories || options.categories.length === 0) {
      return results;
    }
    const catSet = new Set(options.categories);
    return results.filter((r) => catSet.has(r.place.category));
  }

  clearCache(): void {
    this._cache?.clear();
    this._reverseCache?.clear();
  }
}
