import type {
  BoundingBox,
  CameraState,
  Coordinate,
  EaseToOptions,
  FitBoundsOptions,
  FlyToOptions,
  MapEventHandler,
  MapRendererOptions,
} from '../types.js';

/**
 * Platform-agnostic map renderer interface.
 */
export interface MapRenderer {
  /**
   * Lifecycle
   */
  initialize(options: MapRendererOptions): Promise<void>;
  destroy(): void;
  resize(): void;
  getContainer(): HTMLElement | null;
  isLoaded(): boolean;

  /**
   * Camera controls
   */
  getCameraState(): CameraState;
  setCameraState(state: Partial<CameraState>): void;
  flyTo(options: FlyToOptions): void;
  easeTo(options: EaseToOptions): void;
  jumpTo(options: { center?: Coordinate; zoom?: number; pitch?: number; bearing?: number }): void;
  fitBounds(bounds: BoundingBox, options?: FitBoundsOptions): void;
  stop(): void;

  /**
   * 2D / 3D Pitch & Bearing
   */
  getPitch(): number;
  setPitch(pitch: number, options?: { duration?: number }): void;
  getBearing(): number;
  setBearing(bearing: number, options?: { duration?: number }): void;
  resetNorth(options?: { duration?: number }): void;
  toggle3D(targetPitch?: number): number;

  /**
   * Map Style
   */
  setStyle(style: string | object): Promise<void>;
  getStyle(): unknown;

  /**
   * Events
   */
  on(type: string, listener: MapEventHandler): void;
  off(type: string, listener: MapEventHandler): void;
  once(type: string, listener: MapEventHandler): void;

  /**
   * Projection
   */
  project(coord: Coordinate): { x: number; y: number };
  unproject(point: { x: number; y: number }): Coordinate;

  /**
   * Native instance access (e.g. maplibregl.Map)
   */
  getNativeMap(): unknown;
}
