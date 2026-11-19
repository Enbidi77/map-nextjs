import type { Coordinate, BoundingBox, PlaceCategory, PlaceModel } from '@modern-maps/types';
import type { GeocodingProvider, GeocodeOptions, ReverseGeocodeOptions, GeocodeResult } from './types.js';

export interface NominatimConfig {
  baseUrl?: string;
  userAgent?: string;
  email?: string;
}

export function mapOsmToCategory(osmClass?: string, osmType?: string): PlaceCategory {
  if (!osmClass && !osmType) return 'other';
  const c = (osmClass || '').toLowerCase();
  const t = (osmType || '').toLowerCase();

  if (c === 'amenity') {
    if (['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'bistro', 'food_court'].includes(t)) {
      return 'food_drink';
    }
    if (['hospital', 'clinic', 'pharmacy', 'doctors', 'dentist'].includes(t)) {
      return 'medical';
    }
    if (['bank', 'atm', 'post_office', 'police', 'fire_station', 'library', 'school', 'university', 'fuel'].includes(t)) {
      return 'services';
    }
    if (['cinema', 'theatre', 'arts_centre', 'nightclub'].includes(t)) {
      return 'entertainment';
    }
  }

  if (c === 'tourism') {
    if (['hotel', 'motel', 'hostel', 'guest_house', 'apartment', 'camp_site'].includes(t)) {
      return 'lodging';
    }
    if (['museum', 'attraction', 'viewpoint', 'theme_park', 'zoo', 'gallery'].includes(t)) {
      return 'attraction';
    }
  }

  if (c === 'shop') return 'shopping';
  if (c === 'leisure') {
    if (['park', 'nature_reserve', 'garden'].includes(t)) return 'nature';
    return 'entertainment';
  }
  if (['railway', 'aeroway', 'station'].includes(c) || ['bus_stop', 'subway_entrance'].includes(t)) {
    return 'transit';
  }
  if (['natural', 'landuse'].includes(c)) return 'nature';

  return 'other';
}

export function buildNominatimSearchUrl(
  query: string,
  options: GeocodeOptions = {},
  baseUrl: string = 'https://nominatim.openstreetmap.org'
): string {
  const url = new URL('/search', baseUrl);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', String(options.limit ?? 10));

  if (options.language) {
    url.searchParams.set('accept-language', options.language);
  }

  if (options.countryCodes && options.countryCodes.length > 0) {
    url.searchParams.set('countrycodes', options.countryCodes.join(','));
  }

  if (options.boundingBox) {
    const [minLng, minLat, maxLng, maxLat] = options.boundingBox;
    url.searchParams.set('viewbox', `${minLng},${maxLat},${maxLng},${minLat}`);
    url.searchParams.set('bounded', '1');
  }

  return url.toString();
}

export function buildNominatimReverseUrl(
  coordinate: Coordinate,
  options: ReverseGeocodeOptions = {},
  baseUrl: string = 'https://nominatim.openstreetmap.org'
): string {
  const [lng, lat] = coordinate;
  const url = new URL('/reverse', baseUrl);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('zoom', String(options.zoom ?? 18));

  if (options.language) {
    url.searchParams.set('accept-language', options.language);
  }

  return url.toString();
}

export function parseNominatimResult(item: any): GeocodeResult {
  const lng = parseFloat(item.lon);
  const lat = parseFloat(item.lat);
  const category = mapOsmToCategory(item.category || item.class, item.type);

  let bbox: BoundingBox | undefined;
  if (Array.isArray(item.boundingbox) && item.boundingbox.length === 4) {
    // Nominatim returns [south, north, west, east] as strings
    const south = parseFloat(item.boundingbox[0]);
    const north = parseFloat(item.boundingbox[1]);
    const west = parseFloat(item.boundingbox[2]);
    const east = parseFloat(item.boundingbox[3]);
    bbox = [west, south, east, north];
  }

  const addr = item.address || {};
  const name = item.name || item.display_name?.split(',')[0]?.trim() || 'Unknown Location';

  const placeModel: PlaceModel = {
    id: `osm-${item.place_id || item.osm_id || Math.random().toString(36).substring(2)}`,
    name,
    description: item.display_name,
    category,
    coordinates: [lng, lat],
    address: item.display_name || '',
    city: addr.city || addr.town || addr.village || addr.municipality,
    state: addr.state || addr.region,
    country: addr.country,
    postalCode: addr.postcode,
    metadata: {
      osmId: item.osm_id,
      osmType: item.osm_type,
      importance: item.importance,
    },
  };

  return {
    placeId: String(item.place_id || item.osm_id),
    name,
    displayName: item.display_name || '',
    category,
    coordinates: [lng, lat],
    boundingBox: bbox,
    importance: item.importance !== undefined ? parseFloat(item.importance) : undefined,
    address: {
      houseNumber: addr.house_number,
      road: addr.road,
      neighborhood: addr.neighbourhood,
      suburb: addr.suburb,
      city: addr.city || addr.town || addr.village,
      county: addr.county,
      state: addr.state,
      postcode: addr.postcode,
      country: addr.country,
      countryCode: addr.country_code,
    },
    placeModel,
  };
}

export class NominatimGeocodingAdapter implements GeocodingProvider {
  readonly name = 'nominatim';
  private baseUrl: string;
  private userAgent: string;
  private email?: string;

  constructor(config: NominatimConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://nominatim.openstreetmap.org';
    this.userAgent = config.userAgent || 'ModernMaps/1.0';
    this.email = config.email;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': this.userAgent,
      Accept: 'application/json',
    };
    if (this.email) {
      headers['From'] = this.email;
    }
    return headers;
  }

  async forward(query: string, options: GeocodeOptions = {}): Promise<GeocodeResult[]> {
    if (!query || !query.trim()) return [];

    const url = buildNominatimSearchUrl(query, options, this.baseUrl);
    const response = await fetch(url, { headers: this.getHeaders() });
    if (!response.ok) {
      throw new Error(`Nominatim geocoding error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    let results = data.map(parseNominatimResult);
    if (options.categoryFilter && options.categoryFilter.length > 0) {
      results = results.filter((r) => options.categoryFilter!.includes(r.category));
    }
    return results;
  }

  async reverse(coordinate: Coordinate, options: ReverseGeocodeOptions = {}): Promise<GeocodeResult | null> {
    const url = buildNominatimReverseUrl(coordinate, options, this.baseUrl);
    const response = await fetch(url, { headers: this.getHeaders() });
    if (!response.ok) {
      throw new Error(`Nominatim reverse geocoding error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data || data.error) return null;

    return parseNominatimResult(data);
  }
}
