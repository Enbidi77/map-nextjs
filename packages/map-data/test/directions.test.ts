import { describe, it, expect } from 'vitest';
import {
  buildOsrmRouteUrl,
  computeBboxFromCoordinates,
  mapOsrmManeuverModifier,
  mapOsrmManeuverType,
  mapTravelModeToOsrmProfile,
} from '../src/directions/osrm.js';
import { MockDirectionsAdapter } from '../src/directions/mock.js';

describe('Directions Adapters', () => {
  it('maps travel modes to OSRM profiles', () => {
    expect(mapTravelModeToOsrmProfile('driving')).toBe('driving');
    expect(mapTravelModeToOsrmProfile('walking')).toBe('foot');
    expect(mapTravelModeToOsrmProfile('cycling')).toBe('bike');
  });

  it('builds OSRM route URL properly', () => {
    const url = buildOsrmRouteUrl({
      origin: [-122.4194, 37.7749],
      destination: [-122.4089, 37.7833],
      mode: 'driving',
      alternatives: true,
    });

    expect(url).toContain('/route/v1/driving/-122.4194,37.7749;-122.4089,37.7833');
    expect(url).toContain('overview=full');
    expect(url).toContain('geometries=geojson');
    expect(url).toContain('steps=true');
    expect(url).toContain('alternatives=true');
  });

  it('computes bounding box from coordinates', () => {
    const bbox = computeBboxFromCoordinates([
      [-122.5, 37.7],
      [-122.4, 37.8],
      [-122.3, 37.75],
    ]);
    expect(bbox).toEqual([-122.5, 37.7, -122.3, 37.8]);
  });

  it('maps maneuver types and modifiers', () => {
    expect(mapOsrmManeuverType('depart')).toBe('depart');
    expect(mapOsrmManeuverType('arrive')).toBe('arrive');
    expect(mapOsrmManeuverType('roundabout')).toBe('roundabout');
    expect(mapOsrmManeuverModifier('slight right')).toBe('slight right');
    expect(mapOsrmManeuverModifier('sharp left')).toBe('sharp left');
  });

  it('MockDirectionsAdapter generates valid Route objects', async () => {
    const adapter = new MockDirectionsAdapter();

    const response = await adapter.getRoute({
      origin: [-122.4194, 37.7749],
      destination: [-122.4089, 37.7833],
      mode: 'walking',
    });

    expect(response.status).toBe('OK');
    expect(response.routes).toHaveLength(1);

    const route = response.routes[0]!;
    expect(route.mode).toBe('walking');
    expect(route.geometry.type).toBe('LineString');
    expect(route.geometry.coordinates.length).toBeGreaterThanOrEqual(2);
    expect(route.legs).toHaveLength(1);
    expect(route.legs[0]!.steps.length).toBeGreaterThanOrEqual(2);
    expect(route.distanceMeters).toBeGreaterThan(0);
    expect(route.durationSeconds).toBeGreaterThan(0);
  });
});
