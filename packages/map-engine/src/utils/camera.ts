import type { BoundingBox, CameraState, Coordinate } from '../types.js';

/**
 * Calculates center coordinate from a bounding box [minLng, minLat, maxLng, maxLat].
 */
export function getBoundsCenter(bounds: BoundingBox): Coordinate {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
}

/**
 * Normalizes bearing to range [0, 360).
 */
export function normalizeBearing(bearing: number): number {
  const mod = bearing % 360;
  return mod < 0 ? mod + 360 : mod;
}

/**
 * Clamps pitch to allowed MapLibre range [0, 85].
 */
export function clampPitch(pitch: number, maxPitch: number = 85): number {
  return Math.max(0, Math.min(pitch, maxPitch));
}

/**
 * Checks whether two camera states are practically identical.
 */
export function isCameraEqual(a: CameraState, b: CameraState, epsilon: number = 1e-5): boolean {
  return (
    Math.abs(a.center[0] - b.center[0]) < epsilon &&
    Math.abs(a.center[1] - b.center[1]) < epsilon &&
    Math.abs(a.zoom - b.zoom) < epsilon &&
    Math.abs(a.pitch - b.pitch) < epsilon &&
    Math.abs(a.bearing - b.bearing) < epsilon
  );
}
