import type { Coordinate } from '../types.js';
import type { MapRenderer } from '../renderer/MapRenderer.js';
import { formatCoordinates } from '@modern-maps/geospatial';

/**
 * Controller helper for built-in map actions.
 */
export class MapControlsController {
  private _map: MapRenderer;

  constructor(map: MapRenderer) {
    this._map = map;
  }

  /**
   * Zooms in by a step amount.
   */
  zoomIn(step: number = 1): void {
    const currentZoom = this._map.getCameraState().zoom;
    this._map.easeTo({
      zoom: currentZoom + step,
      duration: 300,
    });
  }

  /**
   * Zooms out by a step amount.
   */
  zoomOut(step: number = 1): void {
    const currentZoom = this._map.getCameraState().zoom;
    this._map.easeTo({
      zoom: Math.max(0, currentZoom - step),
      duration: 300,
    });
  }

  /**
   * Resets bearing to True North (0°).
   */
  resetBearing(): void {
    this._map.resetNorth({ duration: 400 });
  }

  /**
   * Toggles pitch between 2D (0°) and 3D (targetPitch°, default 60°).
   */
  togglePitch(targetPitch: number = 60): number {
    return this._map.toggle3D(targetPitch);
  }

  /**
   * Formats coordinates for display in DD or DMS.
   */
  formatCoord(coord: Coordinate, format: 'dd' | 'dms' = 'dd', precision: number = 4): string {
    return formatCoordinates(coord, format, precision);
  }
}
