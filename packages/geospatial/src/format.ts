import type { Coordinate, CoordinateFormat, DMSCoordinate } from '@modern-maps/types';

/**
 * Converts a decimal degree number into degrees, minutes, seconds and cardinal direction.
 */
export function toDMS(
  val: number,
  isLatitude: boolean
): { degrees: number; minutes: number; seconds: number; direction: 'N' | 'S' | 'E' | 'W'; formatted: string } {
  let direction: 'N' | 'S' | 'E' | 'W';
  if (isLatitude) {
    direction = val >= 0 ? 'N' : 'S';
  } else {
    direction = val >= 0 ? 'E' : 'W';
  }

  const absolute = Math.abs(val);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.round((minutesNotTruncated - minutes) * 60 * 10) / 10;

  const formatted = `${degrees}°${minutes}'${seconds.toFixed(1)}"${direction}`;
  return { degrees, minutes, seconds, direction, formatted };
}

/**
 * Converts coordinate [lng, lat] into full DMS structure.
 */
export function coordinateToDMS(coords: Coordinate): DMSCoordinate {
  const [lng, lat] = coords;
  const latDms = toDMS(lat, true);
  const lngDms = toDMS(lng, false);

  return {
    latitude: latDms,
    longitude: lngDms,
    formatted: `${latDms.formatted} ${lngDms.formatted}`,
  };
}

/**
 * Formats coordinates for UI display.
 */
export function formatCoordinates(
  coords: Coordinate,
  format: CoordinateFormat = 'dd',
  precision: number = 4
): string {
  const [lng, lat] = coords;
  if (format === 'dms') {
    return coordinateToDMS(coords).formatted;
  }

  return `${lat.toFixed(precision)}°, ${lng.toFixed(precision)}°`;
}

/**
 * Parses DMS string like `37°46'29.6"N 122°25'09.8"W` back into [lng, lat] Coordinate.
 */
export function parseDMS(dmsStr: string): Coordinate | null {
  const dmsRegex =
    /(\d+)[°\s]+(\d+)['\s]+([\d.]+)"?\s*([NSEW])\s*,?\s*(\d+)[°\s]+(\d+)['\s]+([\d.]+)"?\s*([NSEW])/i;
  const match = dmsStr.trim().match(dmsRegex);
  if (!match) return null;

  const [, d1, m1, s1, dir1, d2, m2, s2, dir2] = match;
  if (!d1 || !m1 || !s1 || !dir1 || !d2 || !m2 || !s2 || !dir2) return null;

  const val1 =
    (parseFloat(d1) + parseFloat(m1) / 60 + parseFloat(s1) / 3600) *
    (dir1.toUpperCase() === 'S' || dir1.toUpperCase() === 'W' ? -1 : 1);
  const val2 =
    (parseFloat(d2) + parseFloat(m2) / 60 + parseFloat(s2) / 3600) *
    (dir2.toUpperCase() === 'S' || dir2.toUpperCase() === 'W' ? -1 : 1);

  const isFirstLat = dir1.toUpperCase() === 'N' || dir1.toUpperCase() === 'S';
  const lat = isFirstLat ? val1 : val2;
  const lng = isFirstLat ? val2 : val1;

  return [lng, lat];
}

/**
 * Formats distance in meters into human-readable string.
 */
export function formatDistance(
  meters: number,
  unitSystem: 'metric' | 'imperial' = 'metric'
): string {
  if (meters < 0) return '0 m';

  if (unitSystem === 'metric') {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    const km = meters / 1000;
    return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
  } else {
    const feet = meters * 3.28084;
    if (feet < 1000) {
      return `${Math.round(feet)} ft`;
    }
    const miles = meters / 1609.344;
    return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
  }
}

/**
 * Formats duration in seconds into human-readable string.
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.max(1, Math.round(seconds))} sec`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMins} min`;
}
