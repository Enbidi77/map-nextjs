import type { Coordinate, PlaceCategory, PlaceModel, PlaceSearchResult } from '@modern-maps/types';
import type { NearbyPlaceProvider, NearbySearchOptions } from './types.js';
import { mapOsmToCategory } from '../geocoding/nominatim.js';

export interface OverpassConfig {
  baseUrl?: string;
  userAgent?: string;
  timeoutSeconds?: number;
}

export function getOverpassTagFilter(category?: PlaceCategory): string {
  if (!category) {
    return '["amenity"]';
  }

  switch (category) {
    case 'food_drink':
      return '["amenity"~"restaurant|cafe|fast_food|bar|pub|bistro|food_court"]';
    case 'lodging':
      return '["tourism"~"hotel|motel|hostel|guest_house|apartment|camp_site"]';
    case 'shopping':
      return '["shop"]';
    case 'attraction':
      return '["tourism"~"attraction|museum|viewpoint|theme_park|zoo|gallery"]';
    case 'services':
      return '["amenity"~"bank|atm|post_office|police|fire_station|library|fuel"]';
    case 'medical':
      return '["amenity"~"hospital|clinic|pharmacy|doctors|dentist"]';
    case 'nature':
      return '["leisure"~"park|nature_reserve|garden"]';
    case 'entertainment':
      return '["amenity"~"cinema|theatre|nightclub"]';
    case 'transit':
      return '["railway"~"station|subway_entrance"]';
    default:
      return '["amenity"]';
  }
}

export function buildOverpassQuery(
  center: Coordinate,
  radiusMeters: number = 2000,
  category?: PlaceCategory,
  limit: number = 30,
  timeoutSeconds: number = 25
): string {
  const [lng, lat] = center;
  const tagFilter = getOverpassTagFilter(category);

  return `[out:json][timeout:${timeoutSeconds}];
(
  node(around:${radiusMeters},${lat},${lng})${tagFilter};
  way(around:${radiusMeters},${lat},${lng})${tagFilter};
);
out center ${limit};`;
}

function calculateDistanceMeters(p1: Coordinate, p2: Coordinate): number {
  const R = 6371000;
  const dLat = ((p2[1] - p1[1]) * Math.PI) / 180;
  const dLon = ((p2[0] - p1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1[1] * Math.PI) / 180) *
      Math.cos((p2[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function parseOverpassElement(
  element: any,
  center: Coordinate
): PlaceSearchResult | null {
  const tags = element.tags || {};
  const name = tags.name || tags['name:en'] || tags.operator || tags.brand;
  if (!name) return null;

  const lat = element.lat !== undefined ? element.lat : element.center?.lat;
  const lon = element.lon !== undefined ? element.lon : element.center?.lon;
  if (lat === undefined || lon === undefined) return null;

  const coords: Coordinate = [lon, lat];
  const distance = calculateDistanceMeters(center, coords);

  const osmClass = tags.amenity ? 'amenity' : tags.tourism ? 'tourism' : tags.shop ? 'shop' : tags.leisure ? 'leisure' : 'other';
  const osmType = tags.amenity || tags.tourism || tags.shop || tags.leisure;
  const category = mapOsmToCategory(osmClass, osmType);

  const place: PlaceModel = {
    id: `osm-${element.type}-${element.id}`,
    name,
    category,
    coordinates: coords,
    address: [tags['addr:street'], tags['addr:housenumber'], tags['addr:city'], tags['addr:postcode']]
      .filter(Boolean)
      .join(', ') || tags['addr:full'] || `${name}, (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
    city: tags['addr:city'],
    postalCode: tags['addr:postcode'],
    phone: tags.phone || tags['contact:phone'],
    website: tags.website || tags['contact:website'],
    openingHours: tags.opening_hours ? { weekdayDescriptions: [tags.opening_hours] } : undefined,
    metadata: {
      osmId: element.id,
      osmType: element.type,
      cuisine: tags.cuisine,
      wheelchair: tags.wheelchair,
    },
  };

  return {
    place,
    distanceMeters: distance,
    relevanceScore: Math.max(0.1, 1 - distance / 10000),
  };
}

export class OverpassPlaceAdapter implements NearbyPlaceProvider {
  readonly name = 'overpass';
  private baseUrl: string;
  private userAgent: string;
  private timeoutSeconds: number;

  constructor(config: OverpassConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://overpass-api.de/api/interpreter';
    this.userAgent = config.userAgent || 'ModernMaps/1.0';
    this.timeoutSeconds = config.timeoutSeconds || 25;
  }

  async searchNearby(options: NearbySearchOptions): Promise<PlaceSearchResult[]> {
    const radius = options.radiusMeters ?? 2000;
    const limit = options.limit ?? 25;
    const query = buildOverpassQuery(
      options.center,
      radius,
      options.category,
      limit,
      this.timeoutSeconds
    );

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'User-Agent': this.userAgent,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const elements = Array.isArray(data.elements) ? data.elements : [];

    const results: PlaceSearchResult[] = [];
    for (const el of elements) {
      const parsed = parseOverpassElement(el, options.center);
      if (parsed) {
        if (!options.query || parsed.place.name.toLowerCase().includes(options.query.toLowerCase())) {
          results.push(parsed);
        }
      }
    }

    results.sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
    return results.slice(0, limit);
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
