import type { Coordinate } from '@modern-maps/types';
import { bearing as turfBearing, destination as turfDestination, point } from '@turf/turf';

/**
 * Normalizes any bearing in degrees to the [0, 360) range.
 */
export function normalizeBearing(degrees: number): number {
  const mod = degrees % 360;
  return mod < 0 ? mod + 360 : mod;
}

/**
 * Calculates initial geographic bearing from origin to destination (-180 to 180 degrees).
 * 0 = North, 90 = East, 180/-180 = South, -90 = West.
 */
export function calculateBearing(from: Coordinate, to: Coordinate): number {
  const pt1 = point(from);
  const pt2 = point(to);
  return turfBearing(pt1, pt2);
}

/**
 * Calculates compass heading from origin to destination (0 to 360 degrees).
 */
export function calculateCompassHeading(from: Coordinate, to: Coordinate): number {
  return normalizeBearing(calculateBearing(from, to));
}

/**
 * Computes destination coordinate given a start point, distance in meters, and bearing in degrees.
 */
export function calculateDestination(
  origin: Coordinate,
  distanceMeters: number,
  bearingDegrees: number
): Coordinate {
  const pt = point(origin);
  const dest = turfDestination(pt, distanceMeters, bearingDegrees, { units: 'meters' });
  const [lng, lat] = dest.geometry.coordinates;
  return [lng ?? origin[0], lat ?? origin[1]];
}

const COMPASS_POINTS = [
  'N', 'NNE', 'NE', 'ENE',
  'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW',
  'W', 'WNW', 'NW', 'NNW',
] as const;

/**
 * Converts a bearing or heading in degrees to a 16-point cardinal direction string.
 */
export function getCompassDirection(bearingDegrees: number): string {
  const normalized = normalizeBearing(bearingDegrees);
  const index = Math.round(normalized / 22.5) % 16;
  return COMPASS_POINTS[index] ?? 'N';
}
