import type { Coordinate } from '../types.js';
import type { MapRenderer } from '../renderer/MapRenderer.js';
import { calculatePathLength, calculatePolygonArea, formatDistance } from '@modern-maps/geospatial';
import { formatArea } from './formatArea.js';

export type MeasurementMode = 'none' | 'distance' | 'area';

export interface MeasurementResult {
  mode: MeasurementMode;
  points: Coordinate[];
  distanceMeters: number;
  formattedDistance: string;
  areaSqMeters: number;
  formattedArea: string;
  isComplete: boolean;
}

export type MeasurementChangeListener = (result: MeasurementResult) => void;

const SOURCE_ID = 'measure-tool-source';
const LINE_LAYER_ID = 'measure-tool-line';
const FILL_LAYER_ID = 'measure-tool-fill';
const POINT_LAYER_ID = 'measure-tool-points';

/**
 * Interactive Distance and Area Measurement Controller.
 */
export class MeasurementTool {
  private _map: MapRenderer | null = null;
  private _mode: MeasurementMode = 'none';
  private _points: Coordinate[] = [];
  private _cursorPoint: Coordinate | null = null;
  private _isComplete: boolean = false;
  private _listeners: Set<MeasurementChangeListener> = new Set();
  private _unitSystem: 'metric' | 'imperial' = 'metric';

  constructor(map?: MapRenderer, unitSystem: 'metric' | 'imperial' = 'metric') {
    this._map = map ?? null;
    this._unitSystem = unitSystem;
    if (this._map) {
      this._bindMapEvents();
    }
  }

  setMap(map: MapRenderer | null): void {
    this._unbindMapEvents();
    this._map = map;
    if (this._map) {
      this._bindMapEvents();
      this._syncLayers();
    }
  }

  setUnitSystem(unitSystem: 'metric' | 'imperial'): void {
    this._unitSystem = unitSystem;
    this._notify();
  }

  getMode(): MeasurementMode {
    return this._mode;
  }

  setMode(mode: MeasurementMode): void {
    if (this._mode === mode) return;
    this._mode = mode;
    this.clear();

    const container = this._map?.getContainer();
    if (container && container.style) {
      container.style.cursor = mode === 'none' ? '' : 'crosshair';
    }
  }

  getPoints(): Coordinate[] {
    return [...this._points];
  }

  addPoint(coord: Coordinate): void {
    if (this._mode === 'none' || this._isComplete) return;

    this._points.push(coord);
    this._cursorPoint = null;
    this._syncLayers();
    this._notify();
  }

  updateCursor(coord: Coordinate | null): void {
    if (this._mode === 'none' || this._isComplete || this._points.length === 0) return;
    this._cursorPoint = coord;
    this._syncLayers();
  }

  undo(): void {
    if (this._points.length === 0) return;
    this._points.pop();
    this._isComplete = false;
    this._syncLayers();
    this._notify();
  }

  finish(): void {
    if (this._points.length < 2) return;
    this._isComplete = true;
    this._cursorPoint = null;
    this._syncLayers();
    this._notify();
  }

  clear(): void {
    this._points = [];
    this._cursorPoint = null;
    this._isComplete = false;
    this._syncLayers();
    this._notify();
  }

  getMeasurement(): MeasurementResult {
    const activePoints = [...this._points];
    if (this._cursorPoint && !this._isComplete) {
      activePoints.push(this._cursorPoint);
    }

    let distanceMeters = 0;
    let areaSqMeters = 0;

    if (this._mode === 'distance' && activePoints.length >= 2) {
      distanceMeters = calculatePathLength(activePoints, 'meters');
    } else if (this._mode === 'area' && activePoints.length >= 3) {
      // Close polygon ring if needed
      const ring = [...activePoints];
      const first = ring[0]!;
      const last = ring[ring.length - 1]!;
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push(first);
      }
      areaSqMeters = calculatePolygonArea([ring], 'meters');
      distanceMeters = calculatePathLength(ring, 'meters');
    }

    return {
      mode: this._mode,
      points: this._points,
      distanceMeters,
      formattedDistance: formatDistance(distanceMeters, this._unitSystem),
      areaSqMeters,
      formattedArea: formatArea(areaSqMeters, this._unitSystem),
      isComplete: this._isComplete,
    };
  }

  onMeasurementChange(listener: MeasurementChangeListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private _notify(): void {
    const result = this.getMeasurement();
    for (const listener of this._listeners) {
      listener(result);
    }
  }

  private _handleClick = (e: any): void => {
    if (this._mode === 'none') return;
    const coord: Coordinate = e.lngLat
      ? [e.lngLat.lng, e.lngLat.lat]
      : this._map?.unproject(e.point ?? { x: 0, y: 0 }) ?? [0, 0];
    this.addPoint(coord);
  };

  private _handleMouseMove = (e: any): void => {
    if (this._mode === 'none' || this._isComplete || this._points.length === 0) return;
    const coord: Coordinate = e.lngLat
      ? [e.lngLat.lng, e.lngLat.lat]
      : this._map?.unproject(e.point ?? { x: 0, y: 0 }) ?? [0, 0];
    this.updateCursor(coord);
  };

  private _handleDblClick = (e: any): void => {
    if (this._mode === 'none') return;
    e.preventDefault?.();
    this.finish();
  };

  private _bindMapEvents(): void {
    if (!this._map) return;
    this._map.on('click', this._handleClick);
    this._map.on('mousemove', this._handleMouseMove);
    this._map.on('dblclick', this._handleDblClick);
  }

  private _unbindMapEvents(): void {
    if (!this._map) return;
    this._map.off('click', this._handleClick);
    this._map.off('mousemove', this._handleMouseMove);
    this._map.off('dblclick', this._handleDblClick);
  }

  private _syncLayers(): void {
    const nativeMap = this._map?.getNativeMap() as any;
    if (!nativeMap || !this._map?.isLoaded()) return;

    const activePoints = [...this._points];
    if (this._cursorPoint && !this._isComplete) {
      activePoints.push(this._cursorPoint);
    }

    const features: any[] = [];

    // Points
    for (let i = 0; i < this._points.length; i++) {
      const pt = this._points[i]!;
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: pt },
        properties: { index: i + 1, isVertex: true },
      });
    }

    // Line
    if (this._mode === 'distance' && activePoints.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: activePoints },
        properties: { isLine: true },
      });
    }

    // Polygon
    if (this._mode === 'area' && activePoints.length >= 3) {
      const ring = [...activePoints];
      const first = ring[0]!;
      const last = ring[ring.length - 1]!;
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push(first);
      }
      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [ring] },
        properties: { isPolygon: true },
      });
    }

    const geojsonData = {
      type: 'FeatureCollection',
      features,
    };

    const source = nativeMap.getSource?.(SOURCE_ID);
    if (source && typeof source.setData === 'function') {
      source.setData(geojsonData);
    } else if (nativeMap.addSource) {
      try {
        nativeMap.addSource(SOURCE_ID, {
          type: 'geojson',
          data: geojsonData,
        });

        // Fill layer
        nativeMap.addLayer({
          id: FILL_LAYER_ID,
          type: 'fill',
          source: SOURCE_ID,
          filter: ['==', '$type', 'Polygon'],
          paint: {
            'fill-color': '#10b981',
            'fill-opacity': 0.25,
          },
        });

        // Line layer
        nativeMap.addLayer({
          id: LINE_LAYER_ID,
          type: 'line',
          source: SOURCE_ID,
          filter: ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']],
          paint: {
            'line-color': '#10b981',
            'line-width': 2.5,
            'line-dasharray': [2, 2],
          },
        });

        // Point vertex markers
        nativeMap.addLayer({
          id: POINT_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['==', '$type', 'Point'],
          paint: {
            'circle-radius': 5,
            'circle-color': '#ffffff',
            'circle-stroke-color': '#10b981',
            'circle-stroke-width': 2.5,
          },
        });
      } catch {
        // Safe layer initialization
      }
    }
  }

  destroy(): void {
    this._unbindMapEvents();
    const nativeMap = this._map?.getNativeMap() as any;
    if (nativeMap) {
      try {
        nativeMap.removeLayer?.(POINT_LAYER_ID);
        nativeMap.removeLayer?.(LINE_LAYER_ID);
        nativeMap.removeLayer?.(FILL_LAYER_ID);
        nativeMap.removeSource?.(SOURCE_ID);
      } catch {
        // Safe cleanup
      }
    }
    this._listeners.clear();
    this._points = [];
    this._map = null;
  }
}
