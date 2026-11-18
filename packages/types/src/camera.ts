import type { BoundingBox, Coordinate } from './coordinates.js';

/**
 * Camera viewport and positioning state.
 */
export interface CameraPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface CameraState {
  /**
   * Map center in [longitude, latitude]
   */
  center: Coordinate;
  /**
   * Zoom level (typically 0 - 24)
   */
  zoom: number;
  /**
   * Camera pitch / tilt in degrees (0 = nadir/top-down, up to 60-85 degrees)
   */
  pitch: number;
  /**
   * Bearing / rotation in degrees (-180 to 180 or 0 to 360, 0 = True North)
   */
  bearing: number;
  /**
   * Optional padding around the view
   */
  padding?: CameraPadding;
}

export interface Viewport {
  width: number;
  height: number;
  bounds: BoundingBox;
  camera: CameraState;
}

export interface CameraTransitionOptions {
  /**
   * Transition duration in milliseconds
   */
  duration?: number;
  /**
   * CSS easing function or preset name
   */
  easing?: (t: number) => number;
  /**
   * Whether to animate camera transition
   */
  animate?: boolean;
}

export interface FlyToOptions extends CameraTransitionOptions {
  center?: Coordinate;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  curve?: number;
  speed?: number;
  screenSpeed?: number;
  maxDuration?: number;
  padding?: Partial<CameraPadding>;
}

export interface EaseToOptions extends CameraTransitionOptions {
  center?: Coordinate;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  padding?: Partial<CameraPadding>;
}

export interface FitBoundsOptions extends CameraTransitionOptions {
  padding?: number | Partial<CameraPadding>;
  maxZoom?: number;
  offset?: [number, number];
  linear?: boolean;
}
