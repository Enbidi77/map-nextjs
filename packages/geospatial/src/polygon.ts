import type { Coordinate } from '@modern-maps/types';
import {
  booleanPointInPolygon as turfBooleanPointInPolygon,
  area as turfArea,
  centroid as turfCentroid,
  point,
  polygon,
} from '@turf/turf';

export type AreaUnits = 'meters' | 'kilometers' | 'acres' | 'hectares' | 'squareMiles';

/**
 * Checks if a point lies within a polygon.
 * @param pt Coordinate [lng, lat]
 * @param polygonRings Array of rings (outer ring + optional holes). Each ring is array of [lng, lat].
 */
export function isPointInPolygon(pt: Coordinate, polygonRings: Coordinate[][]): boolean {
  const p = point(pt);
  const poly = polygon(polygonRings);
  return turfBooleanPointInPolygon(p, poly);
}

/**
 * Computes the area of a polygon in specified units.
 */
export function calculatePolygonArea(
  polygonRings: Coordinate[][],
  units: AreaUnits = 'meters'
): number {
  const poly = polygon(polygonRings);
  const areaSqMeters = turfArea(poly);

  switch (units) {
    case 'kilometers':
      return areaSqMeters / 1_000_000;
    case 'hectares':
      return areaSqMeters / 10_000;
    case 'acres':
      return areaSqMeters / 4046.8564224;
    case 'squareMiles':
      return areaSqMeters / 2_589_988.11;
    case 'meters':
    default:
      return areaSqMeters;
  }
}

/**
 * Computes the geometric centroid [lng, lat] of a polygon or array of coordinates.
 */
export function calculatePolygonCentroid(polygonRings: Coordinate[][]): Coordinate {
  const poly = polygon(polygonRings);
  const c = turfCentroid(poly);
  const [lng, lat] = c.geometry.coordinates;
  return [lng ?? 0, lat ?? 0];
}
