import type {
  Coordinate,
  DirectionsRequest,
  DirectionsResponse,
  Route,
  RouteLeg,
  RouteStep,
  Maneuver,
} from '@modern-maps/types';
import type { DirectionsProvider } from './types.js';
import { computeBboxFromCoordinates } from './osrm.js';

export class MockDirectionsAdapter implements DirectionsProvider {
  readonly name = 'mock';

  async getRoute(request: DirectionsRequest): Promise<DirectionsResponse> {
    if (!request.origin || !request.destination) {
      return {
        routes: [],
        status: 'INVALID_REQUEST',
        errorMessage: 'Origin and destination are required',
      };
    }

    const [oLng, oLat] = request.origin;
    const [dLng, dLat] = request.destination;

    // Generate intermediate waypoint
    const midLng = (oLng + dLng) / 2 + 0.005;
    const midLat = (oLat + dLat) / 2 - 0.005;

    const coordinates: Coordinate[] = [
      [oLng, oLat],
      [midLng, midLat],
      [dLng, dLat],
    ];

    const dLngDeg = dLng - oLng;
    const dLatDeg = dLat - oLat;
    const approxDistMeters = Math.round(
      Math.sqrt(dLngDeg * dLngDeg + dLatDeg * dLatDeg) * 111000
    );

    const speedMps = request.mode === 'walking' ? 1.4 : request.mode === 'cycling' ? 4.5 : 12.0;
    const durationSeconds = Math.round(approxDistMeters / speedMps);

    const step1Maneuver: Maneuver = {
      instruction: 'Head north on Main St',
      type: 'depart',
      location: [oLng, oLat],
      distanceMeters: Math.round(approxDistMeters / 2),
      durationSeconds: Math.round(durationSeconds / 2),
    };

    const step2Maneuver: Maneuver = {
      instruction: 'Turn right onto Grand Ave',
      type: 'turn-right',
      modifier: 'right',
      location: [midLng, midLat],
      distanceMeters: Math.round(approxDistMeters / 2),
      durationSeconds: Math.round(durationSeconds / 2),
    };

    const step3Maneuver: Maneuver = {
      instruction: 'Arrive at your destination',
      type: 'arrive',
      location: [dLng, dLat],
      distanceMeters: 0,
      durationSeconds: 0,
    };

    const steps: RouteStep[] = [
      {
        name: 'Main St',
        distanceMeters: Math.round(approxDistMeters / 2),
        durationSeconds: Math.round(durationSeconds / 2),
        geometry: {
          type: 'LineString',
          coordinates: [
            [oLng, oLat],
            [midLng, midLat],
          ],
        },
        maneuver: step1Maneuver,
      },
      {
        name: 'Grand Ave',
        distanceMeters: Math.round(approxDistMeters / 2),
        durationSeconds: Math.round(durationSeconds / 2),
        geometry: {
          type: 'LineString',
          coordinates: [
            [midLng, midLat],
            [dLng, dLat],
          ],
        },
        maneuver: step2Maneuver,
      },
      {
        name: 'Destination',
        distanceMeters: 0,
        durationSeconds: 0,
        geometry: {
          type: 'LineString',
          coordinates: [[dLng, dLat]],
        },
        maneuver: step3Maneuver,
      },
    ];

    const leg: RouteLeg = {
      distanceMeters: approxDistMeters,
      durationSeconds,
      summary: 'Main St to Grand Ave',
      steps,
      startLocation: [oLng, oLat],
      endLocation: [dLng, dLat],
    };

    const route: Route = {
      id: `mock-route-${Date.now()}`,
      name: 'Main St to Grand Ave',
      mode: request.mode || 'driving',
      distanceMeters: approxDistMeters,
      durationSeconds,
      bbox: computeBboxFromCoordinates(coordinates),
      geometry: {
        type: 'LineString',
        coordinates,
      },
      legs: [leg],
    };

    return {
      routes: [route],
      status: 'OK',
    };
  }
}
