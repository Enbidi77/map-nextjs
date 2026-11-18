import { describe, it, expect } from 'vitest';
import type { Coordinate } from '@modern-maps/types';
import {
  encodePolyline,
  decodePolyline,
  buildManeuverInstruction,
  getManeuverIcon,
  MockRoutingProvider,
  OsrmRoutingProvider,
  RoutingService,
} from '../src/index.js';

describe('Polyline Encoding and Decoding', () => {
  const points: Coordinate[] = [
    [-122.4194, 37.7749],
    [-122.4002, 37.8052],
    [-122.4488, 37.8029],
  ];

  it('encodes and decodes polyline coordinates with high fidelity', () => {
    const encoded = encodePolyline(points, 5);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodePolyline(encoded, 5);
    expect(decoded.length).toBe(points.length);

    for (let i = 0; i < points.length; i++) {
      expect(decoded[i]![0]).toBeCloseTo(points[i]![0], 4);
      expect(decoded[i]![1]).toBeCloseTo(points[i]![1], 4);
    }
  });
});

describe('Maneuver Instructions and Icons', () => {
  it('formats turn-by-turn maneuver descriptions correctly', () => {
    expect(buildManeuverInstruction('depart', undefined, 'Market St')).toBe(
      'Head out on Market St'
    );
    expect(buildManeuverInstruction('turn-left', 'left', 'Van Ness Ave')).toBe(
      'Turn left onto Van Ness Ave'
    );
    expect(buildManeuverInstruction('turn-right', 'right', 'Mission St')).toBe(
      'Turn right onto Mission St'
    );
    expect(buildManeuverInstruction('arrive', undefined, 'City Hall')).toBe(
      'Arrive at destination on City Hall'
    );
    expect(buildManeuverInstruction('u-turn')).toBe('Make a U-turn');
  });

  it('maps maneuver types to appropriate icon names', () => {
    expect(getManeuverIcon('depart')).toBe('navigation');
    expect(getManeuverIcon('arrive')).toBe('map-pin');
    expect(getManeuverIcon('turn-left')).toBe('corner-up-left');
    expect(getManeuverIcon('turn-right')).toBe('corner-up-right');
    expect(getManeuverIcon('merge')).toBe('git-merge');
  });
});

describe('Routing Providers and Service', () => {
  const origin: Coordinate = [-122.4194, 37.7749]; // SF Civic Center
  const destination: Coordinate = [-122.3937, 37.7955]; // Ferry Building

  it('computes driving route using MockRoutingProvider', async () => {
    const provider = new MockRoutingProvider();
    const response = await provider.route({
      origin,
      destination,
      mode: 'driving',
      alternatives: true,
    });

    expect(response.status).toBe('OK');
    expect(response.routes.length).toBe(2);

    const route = response.routes[0]!;
    expect(route.distanceMeters).toBeGreaterThan(0);
    expect(route.durationSeconds).toBeGreaterThan(0);
    expect(route.geometry.coordinates.length).toBeGreaterThan(2);
    expect(route.legs.length).toBe(1);
    expect(route.legs[0]!.steps.length).toBeGreaterThan(0);
  });

  it('handles routing with OsrmRoutingProvider in fallback mode', async () => {
    const osrm = new OsrmRoutingProvider({ mockFallback: true });
    const response = await osrm.route({ origin, destination, mode: 'driving' });
    expect(response.status).toBe('OK');
    expect(response.routes.length).toBeGreaterThan(0);
  });

  it('computes walking route with appropriate duration', async () => {
    const provider = new MockRoutingProvider();
    const drive = await provider.route({ origin, destination, mode: 'driving' });
    const walk = await provider.route({ origin, destination, mode: 'walking' });

    expect(walk.routes[0]!.durationSeconds).toBeGreaterThan(
      drive.routes[0]!.durationSeconds
    );
  });

  it('routes through intermediate waypoints', async () => {
    const waypoint: Coordinate = [-122.4058, 37.8024]; // Coit Tower
    const provider = new MockRoutingProvider();
    const response = await provider.route({
      origin,
      destination,
      waypoints: [waypoint],
      mode: 'driving',
    });

    expect(response.status).toBe('OK');
    const route = response.routes[0]!;
    expect(route.legs.length).toBe(2); // Two legs: origin->waypoint, waypoint->destination
  });

  it('caches routes in RoutingService', async () => {
    const service = new RoutingService({
      primaryProvider: new MockRoutingProvider(),
    });

    const res1 = await service.calculateRoute({ origin, destination, mode: 'driving' });
    const res2 = await service.calculateRoute({ origin, destination, mode: 'driving' });

    expect(res1).toEqual(res2);
  });
});
