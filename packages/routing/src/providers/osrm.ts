import type {
  Coordinate,
  Route,
  RouteLeg,
  RouteStep,
  ManeuverType,
  ManeuverModifier,
} from '@modern-maps/types';
import { computeBoundingBox } from '@modern-maps/geospatial';
import type { RouteRequest, RouteResponse, RoutingProvider } from '../types.js';
import { decodePolyline } from '../polyline.js';
import { buildManeuverInstruction } from '../formatter.js';
import { MockRoutingProvider } from './mock.js';

export interface OsrmProviderConfig {
  baseUrl?: string;
  mockFallback?: boolean;
  timeoutMs?: number;
}

interface OsrmManeuverRaw {
  type: string;
  modifier?: string;
  location: [number, number];
  bearing_before?: number;
  bearing_after?: number;
  exit?: number;
}

interface OsrmStepRaw {
  name: string;
  distance: number;
  duration: number;
  geometry: { coordinates: [number, number][]; type: string } | string;
  maneuver: OsrmManeuverRaw;
}

interface OsrmLegRaw {
  distance: number;
  duration: number;
  summary: string;
  steps: OsrmStepRaw[];
}

interface OsrmRouteRaw {
  distance: number;
  duration: number;
  geometry: { coordinates: [number, number][]; type: string } | string;
  legs: OsrmLegRaw[];
}

interface OsrmResponseRaw {
  code: string;
  routes?: OsrmRouteRaw[];
  message?: string;
}

export class OsrmRoutingProvider implements RoutingProvider {
  readonly name = 'osrm';
  private _baseUrl: string;
  private _mockFallback: boolean;
  private _mockProvider = new MockRoutingProvider();
  private _timeoutMs: number;

  constructor(config: OsrmProviderConfig = {}) {
    this._baseUrl = config.baseUrl ?? 'https://router.project-osrm.org';
    this._mockFallback = config.mockFallback ?? true;
    this._timeoutMs = config.timeoutMs ?? 8000;
  }

  async route(request: RouteRequest): Promise<RouteResponse> {
    const { origin, destination, waypoints = [], mode = 'driving', alternatives = false } = request;

    const profile = mode === 'walking' ? 'foot' : mode === 'cycling' ? 'bike' : 'driving';
    const allCoords: Coordinate[] = [origin, ...waypoints, destination];
    const coordString = allCoords.map(([lng, lat]) => `${lng},${lat}`).join(';');

    const url = `${this._baseUrl}/route/v1/${profile}/${coordString}?overview=full&geometries=geojson&steps=true&alternatives=${alternatives}`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this._timeoutMs);

      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`OSRM HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as OsrmResponseRaw;

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(`OSRM error code: ${data.code} - ${data.message || 'No route found'}`);
      }

      const routes: Route[] = data.routes.map((rawRoute, idx) => {
        const coords: Coordinate[] =
          typeof rawRoute.geometry === 'string'
            ? decodePolyline(rawRoute.geometry, 5)
            : rawRoute.geometry.coordinates;

        const legs: RouteLeg[] = (rawRoute.legs || []).map((rawLeg, legIdx) => {
          const legStart = allCoords[legIdx]!;
          const legEnd = allCoords[legIdx + 1]!;

          const steps: RouteStep[] = (rawLeg.steps || []).map((rawStep) => {
            const stepCoords: Coordinate[] =
              typeof rawStep.geometry === 'string'
                ? decodePolyline(rawStep.geometry, 5)
                : rawStep.geometry.coordinates;

            const mappedType = this._mapManeuverType(rawStep.maneuver.type);
            const mappedMod = this._mapModifier(rawStep.maneuver.modifier);
            const instruction = buildManeuverInstruction(mappedType, mappedMod, rawStep.name);

            return {
              name: rawStep.name || 'Unnamed Road',
              distanceMeters: Math.round(rawStep.distance),
              durationSeconds: Math.round(rawStep.duration),
              geometry: {
                type: 'LineString',
                coordinates: stepCoords,
              },
              maneuver: {
                instruction,
                type: mappedType,
                modifier: mappedMod,
                location: rawStep.maneuver.location,
                distanceMeters: Math.round(rawStep.distance),
                durationSeconds: Math.round(rawStep.duration),
                bearingBefore: rawStep.maneuver.bearing_before,
                bearingAfter: rawStep.maneuver.bearing_after,
                exit: rawStep.maneuver.exit,
              },
            };
          });

          return {
            distanceMeters: Math.round(rawLeg.distance),
            durationSeconds: Math.round(rawLeg.duration),
            summary: rawLeg.summary || `Via ${mode}`,
            steps,
            startLocation: legStart,
            endLocation: legEnd,
          };
        });

        const bbox = computeBoundingBox(coords);

        return {
          id: `osrm-route-${Date.now()}-${idx}`,
          name: legs[0]?.summary || `Route ${idx + 1}`,
          mode,
          distanceMeters: Math.round(rawRoute.distance),
          durationSeconds: Math.round(rawRoute.duration),
          bbox,
          geometry: {
            type: 'LineString',
            coordinates: coords,
          },
          legs,
        };
      });

      return {
        status: 'OK',
        code: 'Ok',
        routes,
      };
    } catch (err) {
      if (this._mockFallback) {
        return this._mockProvider.route(request);
      }
      return {
        status: 'ERROR',
        code: 'Error',
        message: err instanceof Error ? err.message : String(err),
        routes: [],
      };
    }
  }

  private _mapManeuverType(osrmType: string): ManeuverType {
    switch (osrmType) {
      case 'depart':
        return 'depart';
      case 'arrive':
        return 'arrive';
      case 'turn':
        return 'turn-right';
      case 'new name':
      case 'continue':
        return 'continue';
      case 'merge':
        return 'merge';
      case 'on ramp':
        return 'on-ramp';
      case 'off ramp':
        return 'off-ramp';
      case 'fork':
        return 'fork';
      case 'roundabout':
      case 'rotary':
        return 'roundabout';
      default:
        return 'continue';
    }
  }

  private _mapModifier(osrmMod?: string): ManeuverModifier | undefined {
    if (!osrmMod) return undefined;
    switch (osrmMod) {
      case 'left':
        return 'left';
      case 'right':
        return 'right';
      case 'slight left':
        return 'slight left';
      case 'slight right':
        return 'slight right';
      case 'sharp left':
        return 'sharp left';
      case 'sharp right':
        return 'sharp right';
      case 'straight':
        return 'straight';
      case 'u-turn':
        return 'uturn';
      default:
        return undefined;
    }
  }
}
