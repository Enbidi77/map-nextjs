import type { PlaceCategory, PlaceModel, Coordinate } from '@modern-maps/types';

/**
 * Maps OpenStreetMap tags (osm_key / osm_value or class / type) to standard PlaceCategory.
 */
export function detectCategory(osmKey?: string, osmValue?: string, type?: string): PlaceCategory {
  const key = (osmKey || '').toLowerCase();
  const val = (osmValue || type || '').toLowerCase();

  // Food & Drink
  if (
    key === 'amenity' &&
    ['restaurant', 'cafe', 'bar', 'pub', 'fast_food', 'food_court', 'bistro', 'bakery'].includes(
      val
    )
  ) {
    return 'food_drink';
  }
  if (['bakery', 'restaurant', 'cafe', 'bar'].includes(val)) {
    return 'food_drink';
  }

  // Lodging
  if (
    key === 'tourism' &&
    ['hotel', 'motel', 'hostel', 'guest_house', 'apartment', 'resort'].includes(val)
  ) {
    return 'lodging';
  }
  if (['hotel', 'motel', 'hostel'].includes(val)) {
    return 'lodging';
  }

  // Shopping
  if (key === 'shop' || ['supermarket', 'mall', 'convenience', 'department_store'].includes(val)) {
    return 'shopping';
  }

  // Transit
  if (
    key === 'railway' ||
    key === 'aeroway' ||
    ['bus_stop', 'subway_entrance', 'station', 'airport', 'ferry_terminal', 'platform'].includes(
      val
    )
  ) {
    return 'transit';
  }

  // Attractions & Tourism
  if (
    key === 'tourism' &&
    ['museum', 'attraction', 'viewpoint', 'theme_park', 'zoo', 'aquarium', 'gallery'].includes(val)
  ) {
    return 'attraction';
  }
  if (key === 'historic') {
    return 'attraction';
  }

  // Nature & Outdoors
  if (
    key === 'leisure' &&
    ['park', 'nature_reserve', 'garden', 'pitch', 'playground'].includes(val)
  ) {
    return 'nature';
  }
  if (['park', 'beach', 'forest', 'peak', 'mountain'].includes(val)) {
    return 'nature';
  }

  // Medical
  if (['hospital', 'clinic', 'pharmacy', 'doctors', 'dentist'].includes(val)) {
    return 'medical';
  }

  // Entertainment
  if (
    ['cinema', 'theatre', 'stadium', 'nightclub', 'casino', 'bowling_alley', 'arts_centre'].includes(
      val
    )
  ) {
    return 'entertainment';
  }

  // Services
  if (['bank', 'atm', 'post_office', 'police', 'fire_station', 'library', 'school', 'university'].includes(val)) {
    return 'services';
  }

  return 'other';
}

export interface NominatimRawItem {
  place_id: number | string;
  osm_type?: string;
  osm_id?: number | string;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  class?: string;
  type?: string;
  importance?: number;
  boundingbox?: [string, string, string, string];
  address?: {
    road?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
    [key: string]: unknown;
  };
  extratags?: Record<string, string>;
}

/**
 * Normalizes a Nominatim API response item into a canonical PlaceModel.
 */
export function normalizeNominatimPlace(raw: NominatimRawItem): PlaceModel {
  const lat = parseFloat(raw.lat);
  const lon = parseFloat(raw.lon);
  const coordinates: Coordinate = [lon, lat];

  const city =
    raw.address?.city ||
    raw.address?.town ||
    raw.address?.village ||
    raw.address?.suburb ||
    undefined;

  const displayName = raw.name || raw.display_name.split(',')[0]?.trim() || 'Location';
  const category = detectCategory(raw.class, raw.type);

  let bbox: [number, number, number, number] | undefined = undefined;
  if (Array.isArray(raw.boundingbox) && raw.boundingbox.length === 4) {
    // Nominatim boundingbox is [minLat, maxLat, minLon, maxLon] -> convert to [minLng, minLat, maxLng, maxLat]
    const minLat = parseFloat(raw.boundingbox[0]!);
    const maxLat = parseFloat(raw.boundingbox[1]!);
    const minLon = parseFloat(raw.boundingbox[2]!);
    const maxLon = parseFloat(raw.boundingbox[3]!);
    if (!isNaN(minLat) && !isNaN(maxLat) && !isNaN(minLon) && !isNaN(maxLon)) {
      bbox = [minLon, minLat, maxLon, maxLat];
    }
  }

  return {
    id: `osm-${raw.osm_type || 'node'}-${raw.osm_id || raw.place_id}`,
    name: displayName,
    description: raw.display_name,
    category,
    coordinates,
    address: raw.display_name,
    city,
    state: raw.address?.state,
    country: raw.address?.country,
    postalCode: raw.address?.postcode,
    phone: raw.extratags?.phone || raw.extratags?.['contact:phone'],
    website: raw.extratags?.website || raw.extratags?.['contact:website'],
    metadata: {
      osm_id: raw.osm_id,
      osm_type: raw.osm_type,
      class: raw.class,
      type: raw.type,
      importance: raw.importance,
      bbox,
    },
  };
}

export interface PhotonRawFeature {
  geometry: {
    coordinates: [number, number];
    type: 'Point';
  };
  type: 'Feature';
  properties: {
    osm_id?: number;
    osm_type?: string;
    osm_key?: string;
    osm_value?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
    extent?: [number, number, number, number];
    [key: string]: unknown;
  };
}

/**
 * Normalizes a Photon GeoJSON feature into a canonical PlaceModel.
 */
export function normalizePhotonFeature(feature: PhotonRawFeature): PlaceModel {
  const [lon, lat] = feature.geometry.coordinates;
  const p = feature.properties;
  const coordinates: Coordinate = [lon, lat];

  const parts: string[] = [];
  if (p.street) {
    parts.push(p.housenumber ? `${p.housenumber} ${p.street}` : p.street);
  }
  if (p.city) parts.push(p.city);
  if (p.state) parts.push(p.state);
  if (p.country) parts.push(p.country);

  const address = parts.length > 0 ? parts.join(', ') : p.name || 'Location';
  const category = detectCategory(p.osm_key, p.osm_value);

  return {
    id: `photon-${p.osm_type || 'N'}-${p.osm_id || Math.round(lon * 1000 + lat * 1000)}`,
    name: p.name || parts[0] || 'Location',
    description: address,
    category,
    coordinates,
    address,
    city: p.city,
    state: p.state,
    country: p.country,
    postalCode: p.postcode,
    metadata: {
      osm_id: p.osm_id,
      osm_type: p.osm_type,
      osm_key: p.osm_key,
      osm_value: p.osm_value,
      extent: p.extent,
    },
  };
}
