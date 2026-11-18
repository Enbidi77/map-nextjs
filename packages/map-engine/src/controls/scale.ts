/**
 * Calculates geographic scale bar measurements for a given latitude and zoom level.
 */

export interface ScaleMeasurement {
  metricDistance: number;
  metricLabel: string;
  metricWidthPx: number;
  imperialDistance: number;
  imperialLabel: string;
  imperialWidthPx: number;
}

const METRIC_STEPS = [
  1, 2, 5, 10, 20, 50, 100, 200, 500,
  1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000,
];

const IMPERIAL_STEPS = [
  5, 10, 20, 50, 100, 200, 500, 1000, // feet
  1320, 2640, 5280, // quarter, half, 1 mile in feet
  10560, 26400, 52800, 105600, 264000, 528000, // 2, 5, 10, 20, 50, 100 miles
];

/**
 * Computes meters per pixel at a given latitude and zoom.
 */
export function getMetersPerPixel(latitude: number, zoom: number): number {
  const earthCircumferenceMeters = 40075016.686;
  const rad = (latitude * Math.PI) / 180;
  return (earthCircumferenceMeters * Math.cos(rad)) / Math.pow(2, zoom + 8);
}

/**
 * Calculates scale representation for a desired max width (e.g. 100px).
 */
export function calculateScale(
  latitude: number,
  zoom: number,
  maxWidthPx: number = 100
): ScaleMeasurement {
  const mpp = getMetersPerPixel(latitude, zoom);
  const maxMeters = maxWidthPx * mpp;

  // Find largest metric step <= maxMeters
  let metricDist = METRIC_STEPS[0]!;
  for (const step of METRIC_STEPS) {
    if (step <= maxMeters) {
      metricDist = step;
    } else {
      break;
    }
  }

  const metricWidthPx = Math.max(20, Math.round(metricDist / mpp));
  const metricLabel = metricDist >= 1000 ? `${metricDist / 1000} km` : `${metricDist} m`;

  // Imperial (1 meter = 3.28084 feet)
  const maxFeet = maxMeters * 3.28084;
  let imperialFeet = IMPERIAL_STEPS[0]!;
  for (const step of IMPERIAL_STEPS) {
    if (step <= maxFeet) {
      imperialFeet = step;
    } else {
      break;
    }
  }

  const imperialMeters = imperialFeet / 3.28084;
  const imperialWidthPx = Math.max(20, Math.round(imperialMeters / mpp));
  const imperialLabel =
    imperialFeet >= 5280
      ? `${(imperialFeet / 5280).toFixed(imperialFeet % 5280 === 0 ? 0 : 1)} mi`
      : `${imperialFeet} ft`;

  return {
    metricDistance: metricDist,
    metricLabel,
    metricWidthPx,
    imperialDistance: imperialFeet,
    imperialLabel,
    imperialWidthPx,
  };
}
