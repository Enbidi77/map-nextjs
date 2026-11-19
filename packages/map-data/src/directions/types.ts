import type {
  DirectionsRequest,
  DirectionsResponse,
  Route,
  RouteLeg,
  RouteStep,
  Maneuver,
  TravelMode,
} from '@modern-maps/types';

export type {
  DirectionsRequest,
  DirectionsResponse,
  Route,
  RouteLeg,
  RouteStep,
  Maneuver,
  TravelMode,
};

export interface DirectionsProvider {
  readonly name: string;
  getRoute(request: DirectionsRequest): Promise<DirectionsResponse>;
}
