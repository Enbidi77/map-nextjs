import maplibregl, { type Map as MapLibreMapInstance } from 'maplibre-gl';
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
import type { MapRenderer } from './MapRenderer.js';
import { defaultStyleProvider } from '../styles/MapStyleProvider.js';
import { StyleLoadError } from '../utils/errors.js';

/**
 * Production-ready MapLibre GL implementation of MapRenderer.
 */
export class MapLibreRenderer implements MapRenderer {
  private _map: MapLibreMapInstance | null = null;
  private _container: HTMLElement | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _isLoaded: boolean = false;
  private _eventListeners: Map<string, Set<MapEventHandler>> = new Map();
  private _options: MapRendererOptions | null = null;
  private _fallbackAttempted: boolean = false;

  getOptions(): MapRendererOptions | null {
    return this._options;
  }

  constructor(customMap?: unknown) {
    if (customMap) {
      this._map = customMap as MapLibreMapInstance;
      const customAny = customMap as any;
      if (typeof customAny.isLoaded === 'function') {
        this._isLoaded = customAny.isLoaded();
      } else if (typeof customAny.loaded === 'function') {
        this._isLoaded = customAny.loaded();
      } else {
        this._isLoaded = true;
      }

      customAny.on?.('load', () => {
        this._isLoaded = true;
      });
    }
  }

  /**
   * Initializes the MapLibre map instance.
   */
  async initialize(options: MapRendererOptions): Promise<void> {
    this._options = options;

    let containerElem: HTMLElement;
    if (typeof options.container === 'string') {
      const el = typeof document !== 'undefined' ? document.getElementById(options.container) : null;
      if (!el) {
        throw new Error(`Map container element #${options.container} not found in document.`);
      }
      containerElem = el;
    } else {
      containerElem = options.container;
    }
    this._container = containerElem;

    const initialCenter: [number, number] = options.center ?? [0, 0];
    const initialZoom = options.zoom ?? 1;
    const initialPitch = options.pitch ?? 0;
    const initialBearing = options.bearing ?? 0;

    // Resolve initial style
    let styleToApply: string | object;
    if (options.style) {
      if (typeof options.style === 'string') {
        const resolved = defaultStyleProvider.getStyle(options.style);
        styleToApply = resolved.styleObject ?? resolved.url;
      } else {
        styleToApply = options.style;
      }
    } else {
      const defaultSt = defaultStyleProvider.getCurrentStyle();
      styleToApply = defaultSt.styleObject ?? defaultSt.url;
    }

    if (this._map) {
      this._isLoaded = true;
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const mapOptions: any = {
          container: containerElem,
          style: styleToApply as any,
          center: initialCenter,
          zoom: initialZoom,
          pitch: initialPitch,
          bearing: initialBearing,
          interactive: options.interactive ?? true,
          attributionControl: (options.attributionControl === false ? false : undefined) as any,
          minZoom: options.minZoom,
          maxZoom: options.maxZoom,
          maxBounds: options.maxBounds
            ? [
                [options.maxBounds[0], options.maxBounds[1]],
                [options.maxBounds[2], options.maxBounds[3]],
              ]
            : undefined,
          transformRequest: options.transformRequest as any,
        };

        if (options.preserveDrawingBuffer !== undefined) {
          mapOptions.preserveDrawingBuffer = options.preserveDrawingBuffer;
        }

        const map = new maplibregl.Map(mapOptions);

        this._map = map;

        // Auto-resize observer
        if (typeof ResizeObserver !== 'undefined') {
          this._resizeObserver = new ResizeObserver(() => {
            if (this._map) {
              this._map.resize();
            }
          });
          this._resizeObserver.observe(containerElem);
        }

        // Setup event bridges
        const forwardEvents = [
          'move',
          'movestart',
          'moveend',
          'zoom',
          'zoomstart',
          'zoomend',
          'rotate',
          'pitch',
          'render',
          'click',
          'dblclick',
          'contextmenu',
          'mousemove',
        ];

        for (const evt of forwardEvents) {
          map.on(evt, (e) => this._emit(evt, e));
        }

        // Error & degradation handling
        map.on('error', (e: unknown) => {
          this._emit('error', e);

          // Graceful fallback if style or tiles fail to load
          if (!this._fallbackAttempted && options.fallbackStyle) {
            this._fallbackAttempted = true;
            console.warn('[MapEngine] Tile/Style error detected, applying fallback style.');
            this.setStyle(options.fallbackStyle).catch(() => {});
          }
        });

        map.once('load', () => {
          this._isLoaded = true;
          this._emit('load', { target: this });
          resolve();
        });

        map.on('style.load', () => {
          this._emit('styleload', { target: this });
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Cleans up map resources, listeners, and container.
   */
  destroy(): void {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }

    if (this._map) {
      try {
        this._map.remove();
      } catch {
        // Safe cleanup
      }
      this._map = null;
    }

    this._eventListeners.clear();
    this._container = null;
    this._isLoaded = false;
  }

  /**
   * Resizes map to fit container.
   */
  resize(): void {
    this._map?.resize();
  }

  getContainer(): HTMLElement | null {
    return this._container ?? this._map?.getContainer() ?? null;
  }

  isLoaded(): boolean {
    if (this._isLoaded) return true;
    if (!this._map) return false;
    const mapAny = this._map as any;
    if (typeof mapAny.isLoaded === 'function') return mapAny.isLoaded();
    if (typeof mapAny.loaded === 'function') return mapAny.loaded();
    return false;
  }

  /**
   * Gets current camera state.
   */
  getCameraState(): CameraState {
    if (!this._map) {
      return {
        center: [0, 0],
        zoom: 0,
        pitch: 0,
        bearing: 0,
      };
    }

    const center = this._map.getCenter();
    return {
      center: [center.lng, center.lat],
      zoom: this._map.getZoom(),
      pitch: this._map.getPitch(),
      bearing: this._map.getBearing(),
    };
  }

  /**
   * Sets camera state immediately or smoothly.
   */
  setCameraState(state: Partial<CameraState>): void {
    if (!this._map) return;
    if (state.center) {
      this._map.setCenter(state.center);
    }
    if (state.zoom !== undefined) {
      this._map.setZoom(state.zoom);
    }
    if (state.pitch !== undefined) {
      this._map.setPitch(state.pitch);
    }
    if (state.bearing !== undefined) {
      this._map.setBearing(state.bearing);
    }
  }

  /**
   * Smoothly animates camera to new position with curve.
   */
  flyTo(options: FlyToOptions): void {
    if (!this._map) return;
    const flyOpts: Record<string, any> = {};
    if (options.center !== undefined) flyOpts.center = options.center;
    if (options.zoom !== undefined) flyOpts.zoom = options.zoom;
    if (options.pitch !== undefined) flyOpts.pitch = options.pitch;
    if (options.bearing !== undefined) flyOpts.bearing = options.bearing;
    if (options.duration !== undefined) flyOpts.duration = options.duration;
    if (options.curve !== undefined) flyOpts.curve = options.curve;
    if (options.speed !== undefined) flyOpts.speed = options.speed;
    if (options.screenSpeed !== undefined) flyOpts.screenSpeed = options.screenSpeed;
    if (options.maxDuration !== undefined) flyOpts.maxDuration = options.maxDuration;
    if (options.animate !== undefined) flyOpts.animate = options.animate;
    if (typeof options.easing === 'function') flyOpts.easing = options.easing;
    if (options.padding !== undefined) flyOpts.padding = options.padding;
    this._map.flyTo(flyOpts as any);
  }

  /**
   * Eases camera to position with smooth linear or custom easing.
   */
  easeTo(options: EaseToOptions): void {
    if (!this._map) return;
    const easeOpts: Record<string, any> = {};
    if (options.center !== undefined) easeOpts.center = options.center;
    if (options.zoom !== undefined) easeOpts.zoom = options.zoom;
    if (options.pitch !== undefined) easeOpts.pitch = options.pitch;
    if (options.bearing !== undefined) easeOpts.bearing = options.bearing;
    if (options.duration !== undefined) easeOpts.duration = options.duration;
    if (options.animate !== undefined) easeOpts.animate = options.animate;
    if (options.padding !== undefined) easeOpts.padding = options.padding;
    if (typeof options.easing === 'function') easeOpts.easing = options.easing;
    this._map.easeTo(easeOpts as any);
  }

  /**
   * Instantly moves camera without animation.
   */
  jumpTo(options: { center?: Coordinate; zoom?: number; pitch?: number; bearing?: number }): void {
    if (!this._map) return;
    const jumpOpts: Record<string, any> = {};
    if (options.center !== undefined) jumpOpts.center = options.center;
    if (options.zoom !== undefined) jumpOpts.zoom = options.zoom;
    if (options.pitch !== undefined) jumpOpts.pitch = options.pitch;
    if (options.bearing !== undefined) jumpOpts.bearing = options.bearing;
    this._map.jumpTo(jumpOpts as any);
  }

  /**
   * Fits camera to a given bounding box [minLng, minLat, maxLng, maxLat].
   */
  fitBounds(bounds: BoundingBox, options?: FitBoundsOptions): void {
    if (!this._map) return;
    const [minLng, minLat, maxLng, maxLat] = bounds;
    const fitOpts: Record<string, any> = {};
    if (options?.padding !== undefined) fitOpts.padding = options.padding;
    if (options?.maxZoom !== undefined) fitOpts.maxZoom = options.maxZoom;
    if (options?.duration !== undefined) fitOpts.duration = options.duration;
    if (options?.animate !== undefined) fitOpts.animate = options.animate;
    if (options?.linear !== undefined) fitOpts.linear = options.linear;
    if (options?.offset !== undefined) fitOpts.offset = options.offset;
    if (typeof options?.easing === 'function') fitOpts.easing = options.easing;
    this._map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      fitOpts as any
    );
  }

  /**
   * Stops any ongoing camera movement or animation.
   */
  stop(): void {
    this._map?.stop();
  }

  getPitch(): number {
    return this._map?.getPitch() ?? 0;
  }

  setPitch(pitch: number, options?: { duration?: number }): void {
    if (!this._map) return;
    if (options?.duration) {
      this._map.easeTo({ pitch, duration: options.duration });
    } else {
      this._map.setPitch(pitch);
    }
  }

  getBearing(): number {
    return this._map?.getBearing() ?? 0;
  }

  setBearing(bearing: number, options?: { duration?: number }): void {
    if (!this._map) return;
    if (options?.duration) {
      this._map.easeTo({ bearing, duration: options.duration });
    } else {
      this._map.setBearing(bearing);
    }
  }

  /**
   * Resets map rotation to True North (bearing = 0).
   */
  resetNorth(options?: { duration?: number }): void {
    this.setBearing(0, { duration: options?.duration ?? 400 });
  }

  /**
   * Toggles pitch between 2D top-down (0 deg) and 3D perspective (e.g. 60 deg).
   */
  toggle3D(targetPitch: number = 60): number {
    const current = this.getPitch();
    const next = current > 10 ? 0 : targetPitch;
    this.setPitch(next, { duration: 500 });
    return next;
  }

  /**
   * Changes the active map style.
   */
  async setStyle(style: string | object): Promise<void> {
    if (!this._map) return;

    let styleData: string | object = style;
    if (typeof style === 'string') {
      const resolved = defaultStyleProvider.getStyle(style);
      styleData = resolved.styleObject ?? resolved.url;
    }

    return new Promise((resolve, reject) => {
      if (!this._map) return resolve();

      const onLoaded = () => {
        this._map?.off('style.load', onLoaded);
        this._map?.off('error', onError);
        resolve();
      };

      const onError = (_e: unknown) => {
        this._map?.off('style.load', onLoaded);
        this._map?.off('error', onError);
        reject(new StyleLoadError('Failed to apply style', typeof style === 'string' ? style : 'custom-object'));
      };

      this._map.once('style.load', onLoaded);
      this._map.once('error', onError);

      try {
        this._map.setStyle(styleData as any);
      } catch (err) {
        reject(err);
      }
    });
  }

  getStyle(): unknown {
    return this._map?.getStyle();
  }

  /**
   * Event registration.
   */
  on(type: string, listener: MapEventHandler): void {
    if (!this._eventListeners.has(type)) {
      this._eventListeners.set(type, new Set());
    }
    this._eventListeners.get(type)!.add(listener);

    // If native map is present, wire directly for custom events
    if (this._map) {
      this._map.on(type as any, listener as any);
    }
  }

  off(type: string, listener: MapEventHandler): void {
    this._eventListeners.get(type)?.delete(listener);
    if (this._map) {
      this._map.off(type as any, listener as any);
    }
  }

  once(type: string, listener: MapEventHandler): void {
    const wrapper: MapEventHandler = (e) => {
      this.off(type, wrapper);
      listener(e);
    };
    this.on(type, wrapper);
  }

  private _emit(type: string, event: unknown): void {
    const listeners = this._eventListeners.get(type);
    if (listeners) {
      for (const fn of listeners) {
        try {
          fn(event);
        } catch (err) {
          console.error(`[MapEngine] Error in '${type}' event listener:`, err);
        }
      }
    }
  }

  /**
   * Geographic [lng, lat] coordinate to container pixel point {x, y}.
   */
  project(coord: Coordinate): { x: number; y: number } {
    if (!this._map) return { x: 0, y: 0 };
    const p = this._map.project([coord[0], coord[1]]);
    return { x: p.x, y: p.y };
  }

  /**
   * Container pixel point {x, y} to geographic [lng, lat] coordinate.
   */
  unproject(point: { x: number; y: number }): Coordinate {
    if (!this._map) return [0, 0];
    const c = this._map.unproject([point.x, point.y]);
    return [c.lng, c.lat];
  }

  getNativeMap(): MapLibreMapInstance | null {
    return this._map;
  }
}
