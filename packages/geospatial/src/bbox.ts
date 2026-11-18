import type { BoundingBox, Coordinate } from '@modern-maps/types';
import { bbox as turfBbox, lineString } from '@turf/turf';
import { calculateDistance } from './distance.js';

/**
 * Computes the minimum bounding box [minLng, minLat, maxLng, maxLat] enclosing an array of coordinates.
 */
export function computeBoundingBox(coordinates: Coordinate[]): BoundingBox {
  if (coordinates.length === 0) {
    return [0, 0, 0, 0];
  }

  if (coordinates.length === 1) {
    const coord = coordinates[0]!;
    return [coord[0], coord[1], coord[0], coord[1]];
  }

  const line = lineString(coordinates);
  const [minLng, minLat, maxLng, maxLat] = turfBbox(line);
  return [minLng ?? 0, minLat ?? 0, maxLng ?? 0, maxLat ?? 0];
}

/**
 * Checks if a point [lng, lat] lies within the given bounding box [minLng, minLat, maxLng, maxLat].
 */
export function isPointInBoundingBox(point: Coordinate, bbox: BoundingBox): boolean {
  const [lng, lat] = point;
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
}

/**
 * Calculates the center [lng, lat] of a bounding box.
 */
export function boundingBoxCenter(bbox: BoundingBox): Coordinate {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
}

/**
 * Converts a bounding box tuple to a GeoJSON Polygon ring of coordinates (closed ring of 5 points).
 */
export function boundingBoxToPolygon(bbox: BoundingBox): Coordinate[][] {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return [
    [
      [minLng, minLat],
      [maxLng, minLat],
      [maxLng, maxLat],
      [minLng, maxLat],
      [minLng, minLat],
    ],
  ];
}

/**
 * Computes bounding box dimensions (width and height in meters).
 */
export function boundingBoxDimensions(bbox: BoundingBox): {
  widthMeters: number;
  heightMeters: number;
} {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const midLat = (minLat + maxLat) / 2;

  const widthMeters = calculateDistance([minLng, midLat], [maxLng, midLat], 'meters');
  const heightMeters = calculateDistance([minLng, minLat], [minLng, maxLat], 'meters');

  return { widthMeters, heightMeters };
}

/**
 * Expands bounding box by a given percentage factor (e.g. 0.1 for 10% padding)
 */
export function expandBoundingBox(bbox: BoundingBox, factor: number = 0.1): BoundingBox {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const deltaLng = (maxLng - minLng) * factor;
  const deltaLat = (maxLat - minLat) * factor;

  const newMinLng = Math.max(-180, minLng - deltaLng);
  const newMaxLng = Math.min(180, maxLng + deltaLng);
  const newMinLat = Math.max(-90, minLat - deltaLat);
  const newMaxLat = Math.min(90, maxLat + deltaLat);

  return [newMinLng, newMinLat, newMaxLng, newMaxLat];
}
