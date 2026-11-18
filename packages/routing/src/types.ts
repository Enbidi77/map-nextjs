import type {
  Coordinate,
  BoundingBox,
  TravelMode,
  ManeuverType,
  ManeuverModifier,
  GeoJSONLineString,
  Route,
  RouteStep,
  RouteLeg,
} from '@modern-maps/types';

export type {
  BoundingBox,
  GeoJSONLineString,
  TravelMode,
  ManeuverType,
  ManeuverModifier,
  Route,
  RouteStep,
  RouteLeg,
};

export interface RouteManeuver {
  instruction: string;
  type: ManeuverType;
  modifier?: ManeuverModifier;
  location: Coordinate;
  distanceMeters: number;
  durationSeconds: number;
  bearingBefore?: number;
  bearingAfter?: number;
  exit?: number;
}

export type RouteAlternative = Route;

export interface RouteRequest {
  origin: Coordinate;
  destination: Coordinate;
  waypoints?: Coordinate[];
  mode?: TravelMode;
  alternatives?: boolean;
  steps?: boolean;
  overview?: 'full' | 'simplified' | 'false';
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
  language?: string;
}

export interface RouteResponse {
  routes: Route[];
  status: 'OK' | 'ZERO_RESULTS' | 'NOT_FOUND' | 'INVALID_REQUEST' | 'ERROR';
  code?: string;
  message?: string;
}

export interface RoutingProvider {
  readonly name: string;
  route(request: RouteRequest): Promise<RouteResponse>;
}
