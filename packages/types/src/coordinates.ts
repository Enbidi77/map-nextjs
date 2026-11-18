/**
 * Coordinate representations and spatial primitives.
 * Modern Maps follows GeoJSON standard: [longitude, latitude] or [longitude, latitude, elevation].
 */

/**
 * Standard 2D geographic coordinate: [longitude, latitude]
 * Longitude ranges from -180 to 180.
 * Latitude ranges from -90 to 90.
 */
export type Coordinate = [longitude: number, latitude: number];

/**
 * 3D geographic coordinate: [longitude, latitude, altitudeMeters]
 */
export type Coordinate3D = [longitude: number, latitude: number, altitudeMeters: number];

/**
 * Geographic coordinate expressed as an object.
 */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Geographic coordinate with optional altitude.
 */
export interface LatLngAltitude extends LatLng {
  altitude?: number;
}

/**
 * Bounding box represented as a 4-element tuple [minLng, minLat, maxLng, maxLat]
 * (Equivalent to [west, south, east, north]).
 */
export type BoundingBox = [
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number
];

/**
 * Bounding box represented as an object with cardinal bounds.
 */
export interface BoundingBoxObject {
  west: number;
  south: number;
  east: number;
  north: number;
}

/**
 * Supported coordinate display formats:
 * - 'dd': Decimal Degrees (e.g. 37.7749°, -122.4194°)
 * - 'dms': Degrees, Minutes, Seconds (e.g. 37°46'29.6"N, 122°25'09.8"W)
 * - 'mgrs': Military Grid Reference System
 * - 'utm': Universal Transverse Mercator
 */
export type CoordinateFormat = 'dd' | 'dms' | 'mgrs' | 'utm';

export interface DMSComponent {
  degrees: number;
  minutes: number;
  seconds: number;
  direction: 'N' | 'S' | 'E' | 'W';
}

export interface DMSCoordinate {
  latitude: DMSComponent;
  longitude: DMSComponent;
  formatted: string;
}
