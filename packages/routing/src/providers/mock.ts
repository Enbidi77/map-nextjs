import type {
  Coordinate,
  Route,
  RouteLeg,
  RouteStep,
  TravelMode,
} from '@modern-maps/types';
import { calculateDistance, computeBoundingBox, calculateBearing } from '@modern-maps/geospatial';
import type { RouteRequest, RouteResponse, RoutingProvider } from '../types.js';
import { buildManeuverInstruction } from '../formatter.js';

export class MockRoutingProvider implements RoutingProvider {
  readonly name = 'mock';

  async route(request: RouteRequest): Promise<RouteResponse> {
    const { origin, destination, waypoints = [], mode = 'driving' } = request;
    const points: Coordinate[] = [origin, ...waypoints, destination];

    const legs: RouteLeg[] = [];
    const allCoords: Coordinate[] = [];
    let totalDist = 0;
    let totalDur = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i]!;
      const end = points[i + 1]!;
      const legResult = this._createLeg(start, end, mode, i === 0, i === points.length - 2);

      legs.push(legResult.leg);
      allCoords.push(...legResult.coords);
      totalDist += legResult.leg.distanceMeters;
      totalDur += legResult.leg.durationSeconds;
    }

    const bbox = computeBoundingBox(allCoords);

    const primaryRoute: Route = {
      id: `mock-route-${Date.now()}`,
      name: `Route via ${mode === 'driving' ? 'Highway' : 'Main Corridor'}`,
      mode,
      distanceMeters: Math.round(totalDist),
      durationSeconds: Math.round(totalDur),
      bbox,
      geometry: {
        type: 'LineString',
        coordinates: allCoords,
      },
      legs,
    };

    const routes: Route[] = [primaryRoute];

    // Optional alternative route
    if (request.alternatives) {
      const altCoords = allCoords.map(([lng, lat], idx) => {
        if (idx === 0 || idx === allCoords.length - 1) return [lng, lat] as Coordinate;
        const offset = 0.002 * Math.sin(idx);
        return [lng + offset, lat + offset] as Coordinate;
      });

      routes.push({
        id: `mock-route-alt-${Date.now()}`,
        name: `Alternative route`,
        mode,
        distanceMeters: Math.round(totalDist * 1.15),
        durationSeconds: Math.round(totalDur * 1.2),
        bbox: computeBoundingBox(altCoords),
        geometry: {
          type: 'LineString',
          coordinates: altCoords,
        },
        legs,
      });
    }

    return {
      status: 'OK',
      code: 'Ok',
      routes,
    };
  }

  private _createLeg(
    start: Coordinate,
    end: Coordinate,
    mode: TravelMode,
    isFirst: boolean,
    isLast: boolean
  ): { leg: RouteLeg; coords: Coordinate[] } {
    const directDist = calculateDistance(start, end, 'meters');
    const speedMps = mode === 'walking' ? 1.4 : mode === 'cycling' ? 4.5 : 12.0;

    // Generate 4-6 intermediate realistic road-like zigzag coordinates
    const stepsCount = 4;
    const coords: Coordinate[] = [start];

    for (let s = 1; s < stepsCount; s++) {
      const t = s / stepsCount;
      const midLng = start[0] + (end[0] - start[0]) * t;
      const midLat = start[1] + (end[1] - start[1]) * t;
      const jitter = (s % 2 === 0 ? 1 : -1) * 0.001;
      coords.push([midLng + jitter, midLat - jitter]);
    }
    coords.push(end);

    const steps: RouteStep[] = [];
    for (let j = 0; j < coords.length - 1; j++) {
      const segStart = coords[j]!;
      const segEnd = coords[j + 1]!;
      const segDist = calculateDistance(segStart, segEnd, 'meters');
      const segDur = segDist / speedMps;
      const bearing = calculateBearing(segStart, segEnd);

      const type =
        j === 0 && isFirst
          ? 'depart'
          : j === coords.length - 2 && isLast
          ? 'arrive'
          : j % 2 === 0
          ? 'turn-right'
          : 'continue';

      const street = `Way ${j + 1}`;
      const instruction = buildManeuverInstruction(type, undefined, street);

      steps.push({
        name: street,
        distanceMeters: Math.round(segDist),
        durationSeconds: Math.round(segDur),
        geometry: {
          type: 'LineString',
          coordinates: [segStart, segEnd],
        },
        maneuver: {
          instruction,
          type,
          location: segStart,
          distanceMeters: Math.round(segDist),
          durationSeconds: Math.round(segDur),
          bearingAfter: bearing,
        },
      });
    }

    const legDist = directDist * 1.2;
    const legDur = legDist / speedMps;

    return {
      leg: {
        distanceMeters: Math.round(legDist),
        durationSeconds: Math.round(legDur),
        summary: `Fastest route for ${mode}`,
        startLocation: start,
        endLocation: end,
        steps,
      },
      coords,
    };
  }
}
