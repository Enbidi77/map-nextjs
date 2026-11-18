import type { CameraState, Coordinate, BoundingBox } from '@modern-maps/types';

export type MapEventHandler = (event: unknown) => void;

/**
 * Headless mock implementation of MapLibre GL Map for unit and integration testing.
 */
export class MockMapLibreMap {
  private _center: Coordinate;
  private _zoom: number;
  private _pitch: number;
  private _bearing: number;
  private _loaded: boolean = false;
  private _layers: Map<string, unknown> = new Map();
  private _sources: Map<string, unknown> = new Map();
  private _eventListeners: Map<string, Set<MapEventHandler>> = new Map();
  private _container: HTMLElement;

  constructor(options: {
    container?: string | HTMLElement;
    center?: Coordinate;
    zoom?: number;
    pitch?: number;
    bearing?: number;
  } = {}) {
    this._center = options.center ?? [0, 0];
    this._zoom = options.zoom ?? 1;
    this._pitch = options.pitch ?? 0;
    this._bearing = options.bearing ?? 0;

    if (typeof options.container === 'string') {
      this._container = typeof document !== 'undefined'
        ? (document.getElementById(options.container) ?? document.createElement('div'))
        : ({} as HTMLElement);
    } else {
      this._container = options.container ?? ({} as HTMLElement);
    }

    setTimeout(() => {
      this._loaded = true;
      this.fire('load', { target: this });
    }, 0);
  }

  getContainer(): HTMLElement {
    return this._container;
  }

  isLoaded(): boolean {
    return this._loaded;
  }

  getCenter(): { lng: number; lat: number } {
    return { lng: this._center[0], lat: this._center[1] };
  }

  setCenter(center: Coordinate | { lng: number; lat: number }): this {
    if (Array.isArray(center)) {
      this._center = [center[0], center[1]];
    } else {
      this._center = [center.lng, center.lat];
    }
    this.fire('move', { center: this._center });
    return this;
  }

  getZoom(): number {
    return this._zoom;
  }

  setZoom(zoom: number): this {
    this._zoom = zoom;
    this.fire('zoom', { zoom: this._zoom });
    return this;
  }

  getPitch(): number {
    return this._pitch;
  }

  setPitch(pitch: number): this {
    this._pitch = pitch;
    this.fire('pitch', { pitch: this._pitch });
    return this;
  }

  getBearing(): number {
    return this._bearing;
  }

  setBearing(bearing: number): this {
    this._bearing = bearing;
    this.fire('rotate', { bearing: this._bearing });
    return this;
  }

  getCameraState(): CameraState {
    return {
      center: this._center,
      zoom: this._zoom,
      pitch: this._pitch,
      bearing: this._bearing,
    };
  }

  flyTo(options: { center?: Coordinate; zoom?: number; pitch?: number; bearing?: number }): this {
    if (options.center) this.setCenter(options.center);
    if (options.zoom !== undefined) this.setZoom(options.zoom);
    if (options.pitch !== undefined) this.setPitch(options.pitch);
    if (options.bearing !== undefined) this.setBearing(options.bearing);
    this.fire('moveend', { target: this });
    return this;
  }

  easeTo(options: { center?: Coordinate; zoom?: number; pitch?: number; bearing?: number }): this {
    return this.flyTo(options);
  }

  jumpTo(options: { center?: Coordinate; zoom?: number; pitch?: number; bearing?: number }): this {
    return this.flyTo(options);
  }

  fitBounds(bounds: BoundingBox | [[number, number], [number, number]]): this {
    let bbox: BoundingBox;
    if (Array.isArray(bounds[0])) {
      const [[w, s], [e, n]] = bounds as [[number, number], [number, number]];
      bbox = [w, s, e, n];
    } else {
      bbox = bounds as BoundingBox;
    }
    const [w, s, e, n] = bbox;
    this.setCenter([(w + e) / 2, (s + n) / 2]);
    this.fire('zoomend', { bounds: bbox });
    return this;
  }

  addSource(id: string, source: unknown): this {
    this._sources.set(id, source);
    this.fire('sourcedata', { sourceId: id });
    return this;
  }

  getSource(id: string): unknown {
    return this._sources.get(id);
  }

  removeSource(id: string): this {
    this._sources.delete(id);
    return this;
  }

  addLayer(layer: { id: string; [key: string]: unknown }): this {
    this._layers.set(layer.id, layer);
    this.fire('data', { dataType: 'style' });
    return this;
  }

  getLayer(id: string): unknown {
    return this._layers.get(id);
  }

  removeLayer(id: string): this {
    this._layers.delete(id);
    return this;
  }

  setLayoutProperty(layerId: string, name: string, value: unknown): this {
    const layer = this._layers.get(layerId) as Record<string, unknown> | undefined;
    if (layer) {
      layer['layout'] = { ...((layer['layout'] as object) || {}), [name]: value };
    }
    return this;
  }

  setPaintProperty(layerId: string, name: string, value: unknown): this {
    const layer = this._layers.get(layerId) as Record<string, unknown> | undefined;
    if (layer) {
      layer['paint'] = { ...((layer['paint'] as object) || {}), [name]: value };
    }
    return this;
  }

  resize(): this {
    this.fire('resize', {});
    return this;
  }

  remove(): void {
    this._eventListeners.clear();
    this._layers.clear();
    this._sources.clear();
    this.fire('remove', {});
  }

  on(type: string, listener: MapEventHandler): this {
    if (!this._eventListeners.has(type)) {
      this._eventListeners.set(type, new Set());
    }
    this._eventListeners.get(type)!.add(listener);
    return this;
  }

  off(type: string, listener: MapEventHandler): this {
    this._eventListeners.get(type)?.delete(listener);
    return this;
  }

  once(type: string, listener: MapEventHandler): this {
    const wrapper: MapEventHandler = (e) => {
      this.off(type, wrapper);
      listener(e);
    };
    return this.on(type, wrapper);
  }

  fire(type: string, data: unknown = {}): this {
    const listeners = this._eventListeners.get(type);
    if (listeners) {
      for (const listener of listeners) {
        listener(data);
      }
    }
    return this;
  }
}
