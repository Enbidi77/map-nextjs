import type { Coordinate } from '../types.js';
import type { MapRenderer } from '../renderer/MapRenderer.js';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

export type DrawingMode = 'none' | 'point' | 'line' | 'polygon' | 'select';

export interface DrawnFeatureProperties {
  id: string;
  name?: string;
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  createdAt: number;
  [key: string]: unknown;
}

export type DrawnFeature = Feature<Geometry, DrawnFeatureProperties>;

export type FeaturesChangeListener = (features: FeatureCollection<Geometry, DrawnFeatureProperties>) => void;
export type SelectionChangeListener = (selected: DrawnFeature | null) => void;

const SOURCE_ID = 'drawing-tool-source';
const ACTIVE_SOURCE_ID = 'drawing-tool-active-source';

const POLYGON_FILL_LAYER = 'drawing-polygons-fill';
const POLYGON_STROKE_LAYER = 'drawing-polygons-stroke';
const LINE_LAYER = 'drawing-lines';
const POINT_LAYER = 'drawing-points';

const ACTIVE_FILL_LAYER = 'drawing-active-fill';
const ACTIVE_LINE_LAYER = 'drawing-active-line';
const ACTIVE_POINTS_LAYER = 'drawing-active-points';

/**
 * Interactive Vector Drawing and GeoJSON Feature Authoring Controller.
 */
export class DrawingTool {
  private _map: MapRenderer | null = null;
  private _mode: DrawingMode = 'none';
  private _features: Map<string, DrawnFeature> = new Map();
  private _selectedFeatureId: string | null = null;
  private _activeCoordinates: Coordinate[] = [];
  private _cursorCoordinate: Coordinate | null = null;

  private _featureListeners: Set<FeaturesChangeListener> = new Set();
  private _selectionListeners: Set<SelectionChangeListener> = new Set();

  private _defaultColor = '#3b82f6';
  private _defaultFillColor = '#60a5fa';

  constructor(map?: MapRenderer) {
    this._map = map ?? null;
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

  getMode(): DrawingMode {
    return this._mode;
  }

  setMode(mode: DrawingMode): void {
    if (this._mode === mode) return;
    this._mode = mode;
    this._activeCoordinates = [];
    this._cursorCoordinate = null;

    const container = this._map?.getContainer();
    if (container && container.style) {
      if (mode === 'none') {
        container.style.cursor = '';
      } else if (mode === 'select') {
        container.style.cursor = 'default';
      } else {
        container.style.cursor = 'crosshair';
      }
    }

    this._syncActiveLayer();
  }

  getFeatures(): FeatureCollection<Geometry, DrawnFeatureProperties> {
    return {
      type: 'FeatureCollection',
      features: Array.from(this._features.values()),
    };
  }

  setFeatures(collection: FeatureCollection<Geometry, DrawnFeatureProperties>): void {
    this._features.clear();
    for (const f of collection.features) {
      const id = String(f.id ?? f.properties?.id ?? `feature-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
      const featureWithId: DrawnFeature = {
        ...f,
        id,
        properties: {
          ...f.properties,
          id,
          createdAt: f.properties?.createdAt ?? Date.now(),
        },
      };
      this._features.set(id, featureWithId);
    }
    this._syncLayers();
    this._notifyFeatures();
  }

  addFeature(feature: DrawnFeature): void {
    this._features.set(feature.properties.id, feature);
    this._syncLayers();
    this._notifyFeatures();
  }

  getSelectedFeature(): DrawnFeature | null {
    if (!this._selectedFeatureId) return null;
    return this._features.get(this._selectedFeatureId) ?? null;
  }

  selectFeature(id: string | null): void {
    this._selectedFeatureId = id;
    this._syncLayers();
    this._notifySelection();
  }

  deleteSelectedFeature(): void {
    if (!this._selectedFeatureId) return;
    this.deleteFeature(this._selectedFeatureId);
  }

  deleteFeature(id: string): void {
    this._features.delete(id);
    if (this._selectedFeatureId === id) {
      this._selectedFeatureId = null;
      this._notifySelection();
    }
    this._syncLayers();
    this._notifyFeatures();
  }

  clear(): void {
    this._features.clear();
    this._selectedFeatureId = null;
    this._activeCoordinates = [];
    this._cursorCoordinate = null;
    this._syncLayers();
    this._syncActiveLayer();
    this._notifyFeatures();
    this._notifySelection();
  }

  exportGeoJSON(): string {
    return JSON.stringify(this.getFeatures(), null, 2);
  }

  importGeoJSON(geoJsonInput: string | FeatureCollection): void {
    try {
      const parsed: FeatureCollection =
        typeof geoJsonInput === 'string' ? JSON.parse(geoJsonInput) : geoJsonInput;

      if (!parsed || parsed.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) {
        throw new Error('Invalid GeoJSON FeatureCollection format.');
      }

      this.setFeatures(parsed as FeatureCollection<Geometry, DrawnFeatureProperties>);
    } catch (err) {
      console.error('[DrawingTool] Failed to import GeoJSON:', err);
      throw err;
    }
  }

  onFeaturesChange(listener: FeaturesChangeListener): () => void {
    this._featureListeners.add(listener);
    return () => this._featureListeners.delete(listener);
  }

  onSelectChange(listener: SelectionChangeListener): () => void {
    this._selectionListeners.add(listener);
    return () => this._selectionListeners.delete(listener);
  }

  private _notifyFeatures(): void {
    const fc = this.getFeatures();
    for (const listener of this._featureListeners) {
      listener(fc);
    }
  }

  private _notifySelection(): void {
    const sel = this.getSelectedFeature();
    for (const listener of this._selectionListeners) {
      listener(sel);
    }
  }

  private _handleClick = (e: any): void => {
    if (this._mode === 'none') return;

    const coord: Coordinate = e.lngLat
      ? [e.lngLat.lng, e.lngLat.lat]
      : this._map?.unproject(e.point ?? { x: 0, y: 0 }) ?? [0, 0];

    if (this._mode === 'point') {
      const id = `point-${Date.now()}`;
      const newFeature: DrawnFeature = {
        type: 'Feature',
        id,
        geometry: {
          type: 'Point',
          coordinates: coord,
        },
        properties: {
          id,
          name: `Point ${this._features.size + 1}`,
          color: this._defaultColor,
          createdAt: Date.now(),
        },
      };
      this.addFeature(newFeature);
      this.selectFeature(id);
    } else if (this._mode === 'line') {
      this._activeCoordinates.push(coord);
      this._syncActiveLayer();
    } else if (this._mode === 'polygon') {
      this._activeCoordinates.push(coord);
      this._syncActiveLayer();
    } else if (this._mode === 'select') {
      // Find clicked feature if available
      const features = e.features;
      if (features && features.length > 0 && features[0].properties?.id) {
        this.selectFeature(features[0].properties.id);
      } else {
        this.selectFeature(null);
      }
    }
  };

  private _handleMouseMove = (e: any): void => {
    if (this._mode !== 'line' && this._mode !== 'polygon') return;
    if (this._activeCoordinates.length === 0) return;

    const coord: Coordinate = e.lngLat
      ? [e.lngLat.lng, e.lngLat.lat]
      : this._map?.unproject(e.point ?? { x: 0, y: 0 }) ?? [0, 0];

    this._cursorCoordinate = coord;
    this._syncActiveLayer();
  };

  private _handleDblClick = (e: any): void => {
    if (this._mode === 'line') {
      e.preventDefault?.();
      if (this._activeCoordinates.length >= 2) {
        const id = `line-${Date.now()}`;
        const newFeature: DrawnFeature = {
          type: 'Feature',
          id,
          geometry: {
            type: 'LineString',
            coordinates: [...this._activeCoordinates],
          },
          properties: {
            id,
            name: `Line ${this._features.size + 1}`,
            color: this._defaultColor,
            strokeWidth: 3,
            createdAt: Date.now(),
          },
        };
        this.addFeature(newFeature);
        this.selectFeature(id);
      }
      this._activeCoordinates = [];
      this._cursorCoordinate = null;
      this._syncActiveLayer();
    } else if (this._mode === 'polygon') {
      e.preventDefault?.();
      if (this._activeCoordinates.length >= 3) {
        const ring = [...this._activeCoordinates];
        const first = ring[0]!;
        const last = ring[ring.length - 1]!;
        if (first[0] !== last[0] || first[1] !== last[1]) {
          ring.push(first);
        }

        const id = `poly-${Date.now()}`;
        const newFeature: DrawnFeature = {
          type: 'Feature',
          id,
          geometry: {
            type: 'Polygon',
            coordinates: [ring],
          },
          properties: {
            id,
            name: `Polygon ${this._features.size + 1}`,
            color: this._defaultColor,
            fillColor: this._defaultFillColor,
            fillOpacity: 0.35,
            strokeWidth: 2,
            createdAt: Date.now(),
          },
        };
        this.addFeature(newFeature);
        this.selectFeature(id);
      }
      this._activeCoordinates = [];
      this._cursorCoordinate = null;
      this._syncActiveLayer();
    }
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

    const fc = this.getFeatures();
    const source = nativeMap.getSource?.(SOURCE_ID);

    if (source && typeof source.setData === 'function') {
      source.setData(fc);
    } else if (nativeMap.addSource) {
      try {
        nativeMap.addSource(SOURCE_ID, {
          type: 'geojson',
          data: fc,
        });

        // Polygons Fill
        nativeMap.addLayer({
          id: POLYGON_FILL_LAYER,
          type: 'fill',
          source: SOURCE_ID,
          filter: ['==', '$type', 'Polygon'],
          paint: {
            'fill-color': ['coalesce', ['get', 'fillColor'], '#60a5fa'],
            'fill-opacity': ['coalesce', ['get', 'fillOpacity'], 0.35],
          },
        });

        // Polygons Stroke
        nativeMap.addLayer({
          id: POLYGON_STROKE_LAYER,
          type: 'line',
          source: SOURCE_ID,
          filter: ['==', '$type', 'Polygon'],
          paint: {
            'line-color': ['coalesce', ['get', 'color'], '#3b82f6'],
            'line-width': ['coalesce', ['get', 'strokeWidth'], 2],
          },
        });

        // Lines
        nativeMap.addLayer({
          id: LINE_LAYER,
          type: 'line',
          source: SOURCE_ID,
          filter: ['==', '$type', 'LineString'],
          paint: {
            'line-color': ['coalesce', ['get', 'color'], '#3b82f6'],
            'line-width': ['coalesce', ['get', 'strokeWidth'], 3],
          },
        });

        // Points
        nativeMap.addLayer({
          id: POINT_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['==', '$type', 'Point'],
          paint: {
            'circle-radius': 7,
            'circle-color': ['coalesce', ['get', 'color'], '#3b82f6'],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });
      } catch {
        // Safe layer initialization
      }
    }
  }

  private _syncActiveLayer(): void {
    const nativeMap = this._map?.getNativeMap() as any;
    if (!nativeMap || !this._map?.isLoaded()) return;

    const coords = [...this._activeCoordinates];
    if (this._cursorCoordinate) {
      coords.push(this._cursorCoordinate);
    }

    const features: any[] = [];

    // Points
    for (const pt of this._activeCoordinates) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: pt },
        properties: { isActiveVertex: true },
      });
    }

    // Line preview
    if (this._mode === 'line' && coords.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: { isActiveLine: true },
      });
    }

    // Polygon preview
    if (this._mode === 'polygon' && coords.length >= 3) {
      const ring = [...coords];
      const first = ring[0]!;
      const last = ring[ring.length - 1]!;
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push(first);
      }
      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [ring] },
        properties: { isActivePolygon: true },
      });
    }

    const activeData = {
      type: 'FeatureCollection',
      features,
    };

    const source = nativeMap.getSource?.(ACTIVE_SOURCE_ID);
    if (source && typeof source.setData === 'function') {
      source.setData(activeData);
    } else if (nativeMap.addSource) {
      try {
        nativeMap.addSource(ACTIVE_SOURCE_ID, {
          type: 'geojson',
          data: activeData,
        });

        nativeMap.addLayer({
          id: ACTIVE_FILL_LAYER,
          type: 'fill',
          source: ACTIVE_SOURCE_ID,
          filter: ['==', '$type', 'Polygon'],
          paint: {
            'fill-color': '#f59e0b',
            'fill-opacity': 0.25,
          },
        });

        nativeMap.addLayer({
          id: ACTIVE_LINE_LAYER,
          type: 'line',
          source: ACTIVE_SOURCE_ID,
          filter: ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']],
          paint: {
            'line-color': '#f59e0b',
            'line-width': 2,
            'line-dasharray': [2, 2],
          },
        });

        nativeMap.addLayer({
          id: ACTIVE_POINTS_LAYER,
          type: 'circle',
          source: ACTIVE_SOURCE_ID,
          filter: ['==', '$type', 'Point'],
          paint: {
            'circle-radius': 5,
            'circle-color': '#f59e0b',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
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
        nativeMap.removeLayer?.(ACTIVE_POINTS_LAYER);
        nativeMap.removeLayer?.(ACTIVE_LINE_LAYER);
        nativeMap.removeLayer?.(ACTIVE_FILL_LAYER);
        nativeMap.removeSource?.(ACTIVE_SOURCE_ID);

        nativeMap.removeLayer?.(POINT_LAYER);
        nativeMap.removeLayer?.(LINE_LAYER);
        nativeMap.removeLayer?.(POLYGON_STROKE_LAYER);
        nativeMap.removeLayer?.(POLYGON_FILL_LAYER);
        nativeMap.removeSource?.(SOURCE_ID);
      } catch {
        // Safe cleanup
      }
    }
    this._featureListeners.clear();
    this._selectionListeners.clear();
    this._features.clear();
    this._map = null;
  }
}
