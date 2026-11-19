import type {
  BoundingBox,
  Coordinate,
  DirectionsRequest,
  DirectionsResponse,
  Maneuver,
  ManeuverModifier,
  ManeuverType,
  Route,
  RouteLeg,
  RouteStep,
  TravelMode,
} from '@modern-maps/types';
import type { DirectionsProvider } from './types.js';

export interface OsrmConfig {
  baseUrl?: string;
  userAgent?: string;
}

export function mapTravelModeToOsrmProfile(mode?: TravelMode): string {
  switch (mode) {
    case 'walking':
      return 'foot';
    case 'cycling':
      return 'bike';
    case 'driving':
    default:
      return 'driving';
  }
}

export function mapOsrmManeuverType(type: string): ManeuverType {
  const t = (type || '').toLowerCase();
  switch (t) {
    case 'depart':
      return 'depart';
    case 'arrive':
      return 'arrive';
    case 'turn':
    case 'end of road':
    case 'fork':
      return 'turn-right';
    case 'continue':
    case 'new name':
      return 'continue';
    case 'roundabout':
    case 'rotary':
      return 'roundabout';
    case 'merge':
      return 'merge';
    case 'on ramp':
      return 'on-ramp';
    case 'off ramp':
      return 'off-ramp';
    default:
      return 'continue';
  }
}

export function mapOsrmManeuverModifier(modifier?: string): ManeuverModifier | undefined {
  if (!modifier) return undefined;
  const m = modifier.toLowerCase();
  switch (m) {
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
    case 'uturn':
      return 'uturn';
    default:
      return undefined;
  }
}

export function computeBboxFromCoordinates(coords: Coordinate[]): BoundingBox {
  if (coords.length === 0) return [0, 0, 0, 0];
  let minLng = coords[0]![0];
  let minLat = coords[0]![1];
  let maxLng = coords[0]![0];
  let maxLat = coords[0]![1];

  for (let i = 1; i < coords.length; i++) {
    const [lng, lat] = coords[i]!;
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }

  return [minLng, minLat, maxLng, maxLat];
}

export function buildOsrmRouteUrl(
  request: DirectionsRequest,
  baseUrl: string = 'https://router.project-osrm.org'
): string {
  const profile = mapTravelModeToOsrmProfile(request.mode);
  const coords: Coordinate[] = [request.origin];
  if (request.waypoints && request.waypoints.length > 0) {
    coords.push(...request.waypoints);
  }
  coords.push(request.destination);

  const coordStr = coords.map(([lng, lat]) => `${lng},${lat}`).join(';');
  const url = new URL(`/route/v1/${profile}/${coordStr}`, baseUrl);

  url.searchParams.set('overview', 'full');
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('steps', 'true');
  url.searchParams.set('alternatives', request.alternatives ? 'true' : 'false');

  return url.toString();
}

export class OsrmDirectionsAdapter implements DirectionsProvider {
  readonly name = 'osrm';
  private baseUrl: string;
  private userAgent: string;

  constructor(config: OsrmConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://router.project-osrm.org';
    this.userAgent = config.userAgent || 'ModernMaps/1.0';
  }

  async getRoute(request: DirectionsRequest): Promise<DirectionsResponse> {
    if (!request.origin || !request.destination) {
      return {
        routes: [],
        status: 'INVALID_REQUEST',
        errorMessage: 'Origin and destination coordinates are required.',
      };
    }

    try {
      const url = buildOsrmRouteUrl(request, this.baseUrl);
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return {
          routes: [],
          status: 'ERROR',
          errorMessage: `OSRM routing HTTP error: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();
      if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
        return {
          routes: [],
          status: data.code === 'NoRoute' ? 'ZERO_RESULTS' : 'ERROR',
          errorMessage: data.message || `No route found`,
        };
      }

      const routes: Route[] = data.routes.map((r: any, idx: number) => {
        const routeCoords: Coordinate[] = (r.geometry?.coordinates || []).map(
          ([lng, lat]: [number, number]) => [lng, lat]
        );
        const bbox = computeBboxFromCoordinates(routeCoords);

        const legs: RouteLeg[] = (r.legs || []).map((leg: any) => {
          const steps: RouteStep[] = (leg.steps || []).map((st: any) => {
            const stepCoords: Coordinate[] = (st.geometry?.coordinates || []).map(
              ([lng, lat]: [number, number]) => [lng, lat]
            );

            const maneuver: Maneuver = {
              instruction: st.maneuver?.instruction || `${st.maneuver?.type || 'Proceed'} on ${st.name || 'unnamed road'}`,
              type: mapOsrmManeuverType(st.maneuver?.type),
              modifier: mapOsrmManeuverModifier(st.maneuver?.modifier),
              location: st.maneuver?.location ? [st.maneuver.location[0], st.maneuver.location[1]] : [0, 0],
              distanceMeters: Math.round(st.distance || 0),
              durationSeconds: Math.round(st.duration || 0),
            };

            return {
              name: st.name || '',
              distanceMeters: Math.round(st.distance || 0),
              durationSeconds: Math.round(st.duration || 0),
              geometry: {
                type: 'LineString',
                coordinates: stepCoords,
              },
              maneuver,
            };
          });

          return {
            distanceMeters: Math.round(leg.distance || 0),
            durationSeconds: Math.round(leg.duration || 0),
            summary: leg.summary || '',
            steps,
            startLocation: steps[0]?.maneuver.location || request.origin,
            endLocation: steps[steps.length - 1]?.maneuver.location || request.destination,
          };
        });

        return {
          id: `osrm-route-${idx}-${Date.now()}`,
          name: legs[0]?.summary || `Route ${idx + 1}`,
          mode: request.mode || 'driving',
          distanceMeters: Math.round(r.distance || 0),
          durationSeconds: Math.round(r.duration || 0),
          bbox,
          geometry: {
            type: 'LineString',
            coordinates: routeCoords,
          },
          legs,
        };
      });

      return {
        routes,
        status: 'OK',
      };
    } catch (err) {
      return {
        routes: [],
        status: 'ERROR',
        errorMessage: err instanceof Error ? err.message : 'Unknown routing error',
      };
    }
  }
}
