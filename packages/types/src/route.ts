import type { BoundingBox, Coordinate } from './coordinates.js';
import type { GeoJSONLineString } from './geojson.js';

export type TravelMode = 'driving' | 'walking' | 'cycling' | 'transit';

export type ManeuverType =
  | 'depart'
  | 'arrive'
  | 'turn-left'
  | 'turn-right'
  | 'turn-slight-left'
  | 'turn-slight-right'
  | 'turn-sharp-left'
  | 'turn-sharp-right'
  | 'continue'
  | 'u-turn'
  | 'merge'
  | 'on-ramp'
  | 'off-ramp'
  | 'fork'
  | 'roundabout';

export type ManeuverModifier =
  | 'left'
  | 'right'
  | 'slight left'
  | 'slight right'
  | 'sharp left'
  | 'sharp right'
  | 'straight'
  | 'uturn';

export interface Maneuver {
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

export interface RouteStep {
  name: string;
  distanceMeters: number;
  durationSeconds: number;
  geometry: GeoJSONLineString;
  maneuver: Maneuver;
}

export interface RouteLeg {
  distanceMeters: number;
  durationSeconds: number;
  summary: string;
  steps: RouteStep[];
  startLocation: Coordinate;
  endLocation: Coordinate;
  startAddress?: string;
  endAddress?: string;
}

export interface ElevationPoint {
  distance: number; // meters along route
  elevation: number; // meters above sea level
}

export interface Route {
  id: string;
  name: string;
  mode: TravelMode;
  distanceMeters: number;
  durationSeconds: number;
  bbox: BoundingBox;
  geometry: GeoJSONLineString;
  legs: RouteLeg[];
  warnings?: string[];
  elevationProfile?: ElevationPoint[];
  tollCost?: { currency: string; amount: number };
}

export interface DirectionsRequest {
  origin: Coordinate;
  destination: Coordinate;
  waypoints?: Coordinate[];
  mode?: TravelMode;
  alternatives?: boolean;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidFerries?: boolean;
}

export interface DirectionsResponse {
  routes: Route[];
  status: 'OK' | 'ZERO_RESULTS' | 'NOT_FOUND' | 'INVALID_REQUEST' | 'ERROR';
  errorMessage?: string;
}
