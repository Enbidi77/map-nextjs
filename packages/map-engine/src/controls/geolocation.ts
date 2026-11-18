import type { GeolocationPosition, GeolocationStatus } from '../types.js';
import type { MapRenderer } from '../renderer/MapRenderer.js';

export interface GeolocationHandlerOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  flyToUser?: boolean;
  zoomLevel?: number;
  onPositionChange?: (pos: GeolocationPosition) => void;
  onError?: (err: GeolocationPositionError | Error) => void;
  onStatusChange?: (status: GeolocationStatus) => void;
}

/**
 * Handles HTML5 Geolocation with map centering and status management.
 */
export class GeolocationHandler {
  private _status: GeolocationStatus = 'idle';
  private _currentPosition: GeolocationPosition | null = null;
  private _watchId: number | null = null;
  private _map: MapRenderer | null = null;
  private _options: GeolocationHandlerOptions;

  constructor(map?: MapRenderer, options: GeolocationHandlerOptions = {}) {
    this._map = map ?? null;
    this._options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      flyToUser: true,
      zoomLevel: 15,
      ...options,
    };
  }

  setMap(map: MapRenderer | null): void {
    this._map = map;
  }

  getStatus(): GeolocationStatus {
    return this._status;
  }

  getCurrentPosition(): GeolocationPosition | null {
    return this._currentPosition;
  }

  /**
   * Triggers a single geolocation request.
   */
  async locate(): Promise<GeolocationPosition> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this._setStatus('unavailable');
      const err = new Error('Geolocation is not supported in this browser.');
      this._options.onError?.(err);
      throw err;
    }

    this._setStatus('locating');

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result: GeolocationPosition = {
            coordinate: [pos.coords.longitude, pos.coords.latitude],
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
          };

          this._currentPosition = result;
          this._setStatus('located');
          this._options.onPositionChange?.(result);

          if (this._options.flyToUser && this._map) {
            this._map.flyTo({
              center: result.coordinate,
              zoom: this._options.zoomLevel ?? 15,
              duration: 1200,
            });
          }

          resolve(result);
        },
        (err) => {
          let status: GeolocationStatus = 'unavailable';
          if (err.code === err.PERMISSION_DENIED) {
            status = 'denied';
          } else if (err.code === err.TIMEOUT) {
            status = 'timeout';
          }
          this._setStatus(status);
          this._options.onError?.(err);
          reject(err);
        },
        {
          enableHighAccuracy: this._options.enableHighAccuracy,
          timeout: this._options.timeout,
          maximumAge: this._options.maximumAge,
        }
      );
    });
  }

  /**
   * Starts continuously watching user position.
   */
  startWatch(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    if (this._watchId !== null) return;

    this._setStatus('locating');

    this._watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const result: GeolocationPosition = {
          coordinate: [pos.coords.longitude, pos.coords.latitude],
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        };

        this._currentPosition = result;
        this._setStatus('located');
        this._options.onPositionChange?.(result);
      },
      (err) => {
        const status = err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable';
        this._setStatus(status);
        this._options.onError?.(err);
      },
      {
        enableHighAccuracy: this._options.enableHighAccuracy,
        timeout: this._options.timeout,
        maximumAge: this._options.maximumAge,
      }
    );
  }

  /**
   * Stops watching position.
   */
  stopWatch(): void {
    if (this._watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(this._watchId);
      this._watchId = null;
    }
  }

  private _setStatus(status: GeolocationStatus): void {
    this._status = status;
    this._options.onStatusChange?.(status);
  }
}
