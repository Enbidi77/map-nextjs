import { describe, it, expect } from 'vitest';
import type { Coordinate, BoundingBox } from '@modern-maps/types';
import {
  calculateDistance,
  haversineDistanceMeters,
  calculatePathLength,
  calculateBearing,
  normalizeBearing,
  calculateCompassHeading,
  calculateDestination,
  getCompassDirection,
  computeBoundingBox,
  isPointInBoundingBox,
  boundingBoxCenter,
  boundingBoxToPolygon,
  boundingBoxDimensions,
  expandBoundingBox,
  isPointInPolygon,
  calculatePolygonArea,
  calculatePolygonCentroid,
  formatCoordinates,
  parseDMS,
  formatDistance,
  formatDuration,
} from '../src/index.js';

describe('Geospatial Distance Calculations', () => {
  // San Francisco: Ferry Building to Golden Gate Bridge
  const ferryBuilding: Coordinate = [-122.3937, 37.7955];
  const goldenGateBridge: Coordinate = [-122.4783, 37.8199];

  it('calculates distance accurately in meters and kilometers', () => {
    const distMeters = calculateDistance(ferryBuilding, goldenGateBridge, 'meters');
    const distKm = calculateDistance(ferryBuilding, goldenGateBridge, 'kilometers');
    const distMiles = calculateDistance(ferryBuilding, goldenGateBridge, 'miles');

    // Approx 7.8 - 8.2 km
    expect(distKm).toBeGreaterThan(7.5);
    expect(distKm).toBeLessThan(8.5);
    expect(distMeters).toBeCloseTo(distKm * 1000, -1);
    expect(distMiles).toBeCloseTo(distKm * 0.621371, 0);
  });

  it('matches fast haversine formula closely with Turf distance', () => {
    const turfDist = calculateDistance(ferryBuilding, goldenGateBridge, 'meters');
    const haversineDist = haversineDistanceMeters(ferryBuilding, goldenGateBridge);
    const diff = Math.abs(turfDist - haversineDist);

    // Difference between Turf spherical model and our haversine should be under 0.1%
    expect(diff / turfDist).toBeLessThan(0.001);
  });

  it('calculates path length for multi-segment lines', () => {
    const coords: Coordinate[] = [
      [-122.3937, 37.7955],
      [-122.4194, 37.7749],
      [-122.4783, 37.8199],
    ];
    const pathLength = calculatePathLength(coords, 'meters');
    expect(pathLength).toBeGreaterThan(10000);
  });
});

describe('Bearing and Orientation', () => {
  const origin: Coordinate = [0, 0];
  const north: Coordinate = [0, 1];
  const east: Coordinate = [1, 0];
  const south: Coordinate = [0, -1];
  const west: Coordinate = [-1, 0];

  it('calculates cardinal bearings and headings', () => {
    expect(calculateBearing(origin, north)).toBeCloseTo(0, 1);
    expect(calculateCompassHeading(origin, north)).toBeCloseTo(0, 1);
    expect(calculateCompassHeading(origin, east)).toBeCloseTo(90, 1);
    expect(calculateCompassHeading(origin, south)).toBeCloseTo(180, 1);
    expect(calculateCompassHeading(origin, west)).toBeCloseTo(270, 1);
  });

  it('normalizes negative bearings', () => {
    expect(normalizeBearing(-90)).toBe(270);
    expect(normalizeBearing(360)).toBe(0);
    expect(normalizeBearing(450)).toBe(90);
  });

  it('computes correct compass directions', () => {
    expect(getCompassDirection(0)).toBe('N');
    expect(getCompassDirection(90)).toBe('E');
    expect(getCompassDirection(180)).toBe('S');
    expect(getCompassDirection(270)).toBe('W');
    expect(getCompassDirection(45)).toBe('NE');
    expect(getCompassDirection(225)).toBe('SW');
  });

  it('projects destination coordinates correctly', () => {
    const start: Coordinate = [-122.4194, 37.7749];
    const dest = calculateDestination(start, 5000, 90); // 5km East
    // Longitude should increase, latitude should stay roughly constant
    expect(dest[0]).toBeGreaterThan(start[0]);
    expect(dest[1]).toBeCloseTo(start[1], 2);
  });
});

describe('Bounding Box Operations', () => {
  const coords: Coordinate[] = [
    [-122.45, 37.75],
    [-122.40, 37.80],
    [-122.42, 37.78],
  ];

  it('computes accurate bounding box', () => {
    const bbox = computeBoundingBox(coords);
    expect(bbox).toEqual([-122.45, 37.75, -122.40, 37.80]);
  });

  it('checks point containment within bbox', () => {
    const bbox: BoundingBox = [-122.5, 37.7, -122.3, 37.9];
    expect(isPointInBoundingBox([-122.4, 37.8], bbox)).toBe(true);
    expect(isPointInBoundingBox([-122.6, 37.8], bbox)).toBe(false);
    expect(isPointInBoundingBox([-122.4, 37.6], bbox)).toBe(false);
  });

  it('computes dimensions and centers of bounding boxes', () => {
    const bbox: BoundingBox = [-122.45, 37.75, -122.40, 37.80];
    const dims = boundingBoxDimensions(bbox);
    expect(dims.widthMeters).toBeGreaterThan(0);
    expect(dims.heightMeters).toBeGreaterThan(0);

    const center = boundingBoxCenter(bbox);
    expect(center[0]).toBeCloseTo(-122.425, 3);
    expect(center[1]).toBeCloseTo(37.775, 3);

    const poly = boundingBoxToPolygon(bbox);
    expect(poly[0]).toHaveLength(5);
  });

  it('expands bounding box with padding factor', () => {
    const bbox: BoundingBox = [0, 0, 10, 10];
    const expanded = expandBoundingBox(bbox, 0.1);
    expect(expanded).toEqual([-1, -1, 11, 11]);
  });
});

describe('Polygon Operations', () => {
  // Square polygon from (-1, -1) to (1, 1)
  const squareRing: Coordinate[][] = [
    [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
      [-1, -1],
    ],
  ];

  it('checks point-in-polygon correctly', () => {
    expect(isPointInPolygon([0, 0], squareRing)).toBe(true);
    expect(isPointInPolygon([0.5, 0.5], squareRing)).toBe(true);
    expect(isPointInPolygon([2, 2], squareRing)).toBe(false);
  });

  it('calculates polygon area and centroid', () => {
    const area = calculatePolygonArea(squareRing, 'meters');
    expect(area).toBeGreaterThan(0);

    const centroid = calculatePolygonCentroid(squareRing);
    expect(centroid[0]).toBeCloseTo(0, 1);
    expect(centroid[1]).toBeCloseTo(0, 1);
  });
});

describe('Formatting Utilities', () => {
  it('formats decimal degrees and DMS coordinates', () => {
    const coord: Coordinate = [-122.4194, 37.7749];
    const dd = formatCoordinates(coord, 'dd', 4);
    expect(dd).toBe('37.7749°, -122.4194°');

    const dms = formatCoordinates(coord, 'dms');
    expect(dms).toContain('37°');
    expect(dms).toContain('N');
    expect(dms).toContain('122°');
    expect(dms).toContain('W');
  });

  it('parses DMS strings back to coordinates', () => {
    const dmsStr = `37°46'29.6"N 122°25'09.8"W`;
    const parsed = parseDMS(dmsStr);
    expect(parsed).not.toBeNull();
    expect(parsed![1]).toBeCloseTo(37.7749, 2);
    expect(parsed![0]).toBeCloseTo(-122.4194, 2);
  });

  it('formats distance in metric and imperial', () => {
    expect(formatDistance(500, 'metric')).toBe('500 m');
    expect(formatDistance(2500, 'metric')).toBe('2.5 km');
    expect(formatDistance(15000, 'metric')).toBe('15 km');
    expect(formatDistance(150, 'imperial')).toBe('492 ft');
    expect(formatDistance(500, 'imperial')).toBe('0.3 mi');
  });

  it('formats duration nicely', () => {
    expect(formatDuration(45)).toBe('45 sec');
    expect(formatDuration(300)).toBe('5 min');
    expect(formatDuration(3600)).toBe('1 hr');
    expect(formatDuration(5400)).toBe('1 hr 30 min');
  });
});
