/**
 * Formats square meters into human-readable area strings.
 */
export function formatArea(
  squareMeters: number,
  unitSystem: 'metric' | 'imperial' = 'metric',
  precision: number = 2
): string {
  if (squareMeters <= 0) return '0 m²';

  if (unitSystem === 'metric') {
    if (squareMeters < 10000) {
      return `${Math.round(squareMeters).toLocaleString()} m²`;
    }
    const sqKm = squareMeters / 1000000;
    if (sqKm >= 1) {
      return `${sqKm.toFixed(precision)} km²`;
    }
    const hectares = squareMeters / 10000;
    return `${hectares.toFixed(precision)} ha`;
  } else {
    const sqFeet = squareMeters * 10.7639;
    if (sqFeet < 43560) {
      return `${Math.round(sqFeet).toLocaleString()} sq ft`;
    }
    const acres = squareMeters / 4046.8564;
    if (acres < 640) {
      return `${acres.toFixed(precision)} acres`;
    }
    const sqMiles = squareMeters / 2589988.11;
    return `${sqMiles.toFixed(precision)} sq mi`;
  }
}
