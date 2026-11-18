import type { Coordinate } from '@modern-maps/types';
import { distance as turfDistance, point, lineString, length as turfLength } from '@turf/turf';

export type DistanceUnits = 'meters' | 'kilometers' | 'miles' | 'feet' | 'yards';

/**
 * Earth radius constants in various units
 */
const EARTH_RADIUS_METERS = 6371008.8;

/**
 * High-performance Haversine distance calculation in meters between two [lng, lat] coordinates.
 */
export function haversineDistanceMeters(from: Coordinate, to: Coordinate): number {
  const [lng1, lat1] = from;
  const [lng2, lat2] = to;

  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLng = (lng2 - lng1) * toRad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculate distance between two coordinates using Turf.js with specified unit.
 */
export function calculateDistance(
  from: Coordinate,
  to: Coordinate,
  units: DistanceUnits = 'meters'
): number {
  const pt1 = point(from);
  const pt2 = point(to);

  if (units === 'meters') {
    return turfDistance(pt1, pt2, { units: 'meters' });
  } else if (units === 'kilometers') {
    return turfDistance(pt1, pt2, { units: 'kilometers' });
  } else if (units === 'miles') {
    return turfDistance(pt1, pt2, { units: 'miles' });
  } else if (units === 'feet') {
    return turfDistance(pt1, pt2, { units: 'feet' });
  } else if (units === 'yards') {
    return turfDistance(pt1, pt2, { units: 'yards' });
  }

  return turfDistance(pt1, pt2, { units: 'meters' });
}

/**
 * Calculate total path / polyline length across an array of coordinates.
 */
export function calculatePathLength(
  coordinates: Coordinate[],
  units: DistanceUnits = 'meters'
): number {
  if (coordinates.length < 2) {
    return 0;
  }

  const line = lineString(coordinates);
  if (units === 'meters') {
    return turfLength(line, { units: 'meters' });
  } else if (units === 'kilometers') {
    return turfLength(line, { units: 'kilometers' });
  } else if (units === 'miles') {
    return turfLength(line, { units: 'miles' });
  } else if (units === 'feet') {
    return turfLength(line, { units: 'feet' });
  }

  return turfLength(line, { units: 'meters' });
}
