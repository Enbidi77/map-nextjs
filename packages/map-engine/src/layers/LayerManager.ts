import type { Map as MapLibreMapInstance, GeoJSONSource } from 'maplibre-gl';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type {
  Building3DLayerOptions,
  CircleLayerOptions,
  ClusterLayerOptions,
  GeoJSONSourceOptions,
  HeatmapLayerOptions,
  LineLayerOptions,
  PolygonLayerOptions,
} from '../types.js';

/**
 * Manages GeoJSON sources, vector layers, clustering, and hover/click interactions.
 */
export class LayerManager {
  private _map: MapLibreMapInstance | any;
  private _sources: Set<string> = new Set();
  private _layers: Set<string> = new Set();
  private _hoveredFeatureId: { source: string; id: string | number } | null = null;
  private _layerClickHandlers: Map<string, (e: any) => void> = new Map();
  private _layerHoverHandlers: Map<string, (e: any) => void> = new Map();

  constructor(map: unknown) {
    this._map = map;
  }

  /**
   * Adds or registers a GeoJSON source.
   */
  addGeoJSONSource(id: string, options: GeoJSONSourceOptions = {}): void {
    if (!this._map) return;

    if (this._sources.has(id)) {
      if (options.data) {
        this.updateGeoJSONData(id, options.data as any);
      }
      return;
    }

    const sourceConfig: any = {
      type: 'geojson',
      data: options.data ?? { type: 'FeatureCollection', features: [] },
      cluster: options.cluster ?? false,
      generateId: options.generateId ?? true,
    };

    if (options.cluster) {
      sourceConfig.clusterRadius = options.clusterRadius ?? 50;
      sourceConfig.clusterMaxZoom = options.clusterMaxZoom ?? 14;
      if (options.clusterProperties) {
        sourceConfig.clusterProperties = options.clusterProperties;
      }
    }

    if (options.tolerance !== undefined) {
      sourceConfig.tolerance = options.tolerance;
    }

    this._map.addSource(id, sourceConfig);
    this._sources.add(id);
  }

  /**
   * Updates data for an existing GeoJSON source.
   */
  updateGeoJSONData(sourceId: string, data: Feature | FeatureCollection<Geometry> | string): void {
    if (!this._map) return;
    const source = this._map.getSource(sourceId) as GeoJSONSource | undefined;
    if (source && typeof source.setData === 'function') {
      source.setData(data as any);
    }
  }

  /**
   * Checks if source exists.
   */
  hasSource(sourceId: string): boolean {
    return this._sources.has(sourceId) || (this._map?.getSource?.(sourceId) !== undefined);
  }

  /**
   * Removes a GeoJSON source and its associated layers.
   */
  removeSource(sourceId: string): void {
    if (!this._map) return;

    // Remove any layers referencing this source
    for (const layerId of Array.from(this._layers)) {
      const layer = this._map.getLayer?.(layerId);
      if (layer && layer.source === sourceId) {
        this.removeLayer(layerId);
      }
    }

    if (this._map.getSource?.(sourceId)) {
      this._map.removeSource(sourceId);
    }
    this._sources.delete(sourceId);
  }

  /**
   * Adds a Line Layer (e.g. routes, paths, borders).
   */
  addLineLayer(options: LineLayerOptions): void {
    if (!this._map) return;
    if (this._layers.has(options.id)) {
      this.removeLayer(options.id);
    }

    const paint: Record<string, unknown> = {
      'line-color': options.color ?? '#3b82f6',
      'line-width': options.width ?? 3,
      'line-opacity': options.opacity ?? 1,
    };

    if (options.dashArray) {
      paint['line-dasharray'] = options.dashArray;
    }

    const layout: Record<string, unknown> = {
      'line-cap': options.cap ?? 'round',
      'line-join': options.join ?? 'round',
      visibility: 'visible',
    };

    this._map.addLayer(
      {
        id: options.id,
        type: 'line',
        source: options.sourceId,
        sourceLayer: options.sourceLayer,
        minzoom: options.minZoom,
        maxzoom: options.maxZoom,
        layout,
        paint,
      },
      options.beforeId
    );

    this._layers.add(options.id);

    if (options.interactive) {
      this._setupLayerInteractivity(options.id);
    }
  }

  /**
   * Adds a Polygon Layer (with fill, outline, or 3D extrusion).
   */
  addPolygonLayer(options: PolygonLayerOptions): void {
    if (!this._map) return;
    if (this._layers.has(options.id)) {
      this.removeLayer(options.id);
    }

    if (options.extrusionHeight !== undefined) {
      // 3D Extrusion Layer
      this._map.addLayer(
        {
          id: options.id,
          type: 'fill-extrusion',
          source: options.sourceId,
          sourceLayer: options.sourceLayer,
          minzoom: options.minZoom,
          maxzoom: options.maxZoom,
          paint: {
            'fill-extrusion-color': options.extrusionColor ?? options.fillColor ?? '#64748b',
            'fill-extrusion-height': options.extrusionHeight,
            'fill-extrusion-base': options.extrusionBase ?? 0,
            'fill-extrusion-opacity': options.extrusionOpacity ?? 0.85,
          },
        },
        options.beforeId
      );
    } else {
      // 2D Fill Layer
      this._map.addLayer(
        {
          id: options.id,
          type: 'fill',
          source: options.sourceId,
          sourceLayer: options.sourceLayer,
          minzoom: options.minZoom,
          maxzoom: options.maxZoom,
          paint: {
            'fill-color': options.fillColor ?? '#3b82f6',
            'fill-opacity': options.fillOpacity ?? 0.4,
            ...(options.outlineColor ? { 'fill-outline-color': options.outlineColor } : {}),
          },
        },
        options.beforeId
      );

      // Add separate crisp stroke layer if outlineWidth > 1
      if (options.outlineColor && options.outlineWidth && options.outlineWidth > 1) {
        const strokeLayerId = `${options.id}-stroke`;
        this.addLineLayer({
          id: strokeLayerId,
          sourceId: options.sourceId,
          sourceLayer: options.sourceLayer,
          color: options.outlineColor,
          width: options.outlineWidth,
          beforeId: options.beforeId,
        });
      }
    }

    this._layers.add(options.id);

    if (options.interactive) {
      this._setupLayerInteractivity(options.id);
    }
  }

  /**
   * Adds a Circle / Point Layer.
   */
  addCircleLayer(options: CircleLayerOptions): void {
    if (!this._map) return;
    if (this._layers.has(options.id)) {
      this.removeLayer(options.id);
    }

    this._map.addLayer(
      {
        id: options.id,
        type: 'circle',
        source: options.sourceId,
        sourceLayer: options.sourceLayer,
        minzoom: options.minZoom,
        maxzoom: options.maxZoom,
        paint: {
          'circle-radius': options.radius ?? 6,
          'circle-color': options.color ?? '#3b82f6',
          'circle-stroke-color': options.strokeColor ?? '#ffffff',
          'circle-stroke-width': options.strokeWidth ?? 2,
          'circle-opacity': options.opacity ?? 1,
        },
      },
      options.beforeId
    );

    this._layers.add(options.id);

    if (options.interactive) {
      this._setupLayerInteractivity(options.id);
    }
  }

  /**
   * Configures built-in clustering visualization on a clustered source.
   */
  addClusterLayers(options: ClusterLayerOptions): void {
    if (!this._map) return;
    const { sourceId } = options;
    const clusterLayerId = `${sourceId}-clusters`;
    const countLayerId = `${sourceId}-cluster-count`;
    const unclusteredLayerId = `${sourceId}-unclustered-point`;

    const colors: [number, string][] = options.clusterColors ?? [
      [0, '#3b82f6'],
      [20, '#10b981'],
      [100, '#f59e0b'],
      [500, '#ef4444'],
    ];

    // Cluster step expression
    const stepColor: unknown[] = ['step', ['get', 'point_count']];
    for (let i = 0; i < colors.length; i++) {
      const [threshold, color] = colors[i]!;
      if (i === 0) {
        stepColor.push(color);
      } else {
        stepColor.push(threshold, color);
      }
    }

    // 1. Cluster circle layer
    this._map.addLayer({
      id: clusterLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': stepColor as any,
        'circle-radius': ['step', ['get', 'point_count'], 18, 20, 24, 100, 30, 500, 36],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });
    this._layers.add(clusterLayerId);

    // 2. Cluster count labels
    this._map.addLayer({
      id: countLayerId,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 12,
      },
      paint: {
        'text-color': options.textColor ?? '#ffffff',
      },
    });
    this._layers.add(countLayerId);

    // 3. Unclustered individual points
    this._map.addLayer({
      id: unclusteredLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': options.pointColor ?? '#3b82f6',
        'circle-radius': options.pointRadius ?? 6,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#ffffff',
      },
    });
    this._layers.add(unclusteredLayerId);

    // Click cluster to expand
    if (options.onClickExpand !== false) {
      this._map.on('click', clusterLayerId, (e: any) => {
        const features = this._map.queryRenderedFeatures?.(e.point, { layers: [clusterLayerId] }) ?? e.features;
        if (!features || !features[0]) return;

        const clusterId = features[0].properties?.cluster_id;
        const source = this._map.getSource(sourceId) as any;

        if (source?.getClusterExpansionZoom && clusterId !== undefined) {
          source.getClusterExpansionZoom(clusterId, (err: Error | null, zoom: number) => {
            if (err) return;
            const coords = features[0].geometry.coordinates;
            this._map.easeTo({
              center: coords,
              zoom,
              duration: 500,
            });
          });
        }
      });

      this._map.on('mouseenter', clusterLayerId, () => {
        if (this._map.getCanvas) this._map.getCanvas().style.cursor = 'pointer';
      });
      this._map.on('mouseleave', clusterLayerId, () => {
        if (this._map.getCanvas) this._map.getCanvas().style.cursor = '';
      });
    }
  }

  /**
   * Adds or toggles a 3D Building Extrusion layer.
   */
  add3DBuildingsLayer(options: Building3DLayerOptions = {}): void {
    if (!this._map) return;
    const layerId = options.id ?? '3d-buildings';
    if (this._layers.has(layerId)) {
      this.removeLayer(layerId);
    }

    const sourceId = options.sourceId ?? 'openmaptiles';
    const sourceLayer = options.sourceLayer ?? 'building';
    const minZoom = options.minZoom ?? 15;

    const fillExtrusionColor: unknown = options.color ?? [
      'interpolate',
      ['linear'],
      ['coalesce', ['get', 'render_height'], ['get', 'height'], 15],
      0,
      options.lightColor ?? '#cbd5e1',
      50,
      '#94a3b8',
      100,
      '#64748b',
      200,
      options.darkColor ?? '#475569',
    ];

    try {
      this._map.addLayer(
        {
          id: layerId,
          source: sourceId,
          sourceLayer,
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: minZoom,
          paint: {
            'fill-extrusion-color': fillExtrusionColor as any,
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['coalesce', ['get', 'render_height'], ['get', 'height'], 15],
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
            ],
            'fill-extrusion-opacity': options.opacity ?? 0.85,
          },
        },
        options.beforeId
      );
      this._layers.add(layerId);
    } catch (err) {
      console.warn('[LayerManager] Failed to add 3D buildings layer:', err);
    }
  }

  /**
   * Toggles 3D buildings layer visibility.
   */
  toggle3DBuildings(enabled?: boolean, options?: Building3DLayerOptions): boolean {
    const layerId = options?.id ?? '3d-buildings';
    if (!this.hasLayer(layerId)) {
      this.add3DBuildingsLayer(options);
      return true;
    }

    const currentlyVisible = this.is3DBuildingsVisible(layerId);
    const nextState = enabled !== undefined ? enabled : !currentlyVisible;
    this.setLayerVisibility(layerId, nextState);
    return nextState;
  }

  /**
   * Returns whether 3D buildings are currently active and visible.
   */
  is3DBuildingsVisible(layerId: string = '3d-buildings'): boolean {
    if (!this.hasLayer(layerId)) return false;
    const layer = this._map?.getLayer?.(layerId);
    if (!layer) return false;
    return layer.layout?.visibility !== 'none';
  }

  /**
   * Adds a Heatmap visualization layer for dense point data.
   */
  addHeatmapLayer(options: HeatmapLayerOptions): void {
    if (!this._map) return;
    if (this._layers.has(options.id)) {
      this.removeLayer(options.id);
    }

    const weightProperty = options.weightProperty;
    const heatmapWeight = weightProperty
      ? ['interpolate', ['linear'], ['get', weightProperty], 0, 0, 6, 1]
      : 1;

    this._map.addLayer(
      {
        id: options.id,
        type: 'heatmap',
        source: options.sourceId,
        sourceLayer: options.sourceLayer,
        minzoom: options.minZoom,
        maxzoom: options.maxZoom,
        paint: {
          'heatmap-weight': heatmapWeight as any,
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            options.intensity ?? 1,
            9,
            (options.intensity ?? 1) * 3,
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(33,102,172,0)',
            0.2,
            'rgb(103,169,207)',
            0.4,
            'rgb(209,229,240)',
            0.6,
            'rgb(253,219,199)',
            0.8,
            'rgb(239,138,98)',
            1,
            'rgb(178,24,43)',
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            2,
            9,
            options.radius ?? 20,
          ],
          'heatmap-opacity': options.opacity ?? 0.8,
        },
      },
      options.beforeId
    );

    this._layers.add(options.id);
  }

  /**
   * Sets feature-state for hover styling.
   */
  setFeatureHoverState(sourceId: string, featureId: string | number, hovered: boolean): void {
    if (!this._map?.setFeatureState) return;

    if (this._hoveredFeatureId && !hovered) {
      this._map.setFeatureState(
        { source: this._hoveredFeatureId.source, id: this._hoveredFeatureId.id },
        { hover: false }
      );
      this._hoveredFeatureId = null;
    }

    if (hovered) {
      this._map.setFeatureState({ source: sourceId, id: featureId }, { hover: true });
      this._hoveredFeatureId = { source: sourceId, id: featureId };
    }
  }

  /**
   * Sets feature-state for selected styling.
   */
  setFeatureSelectState(sourceId: string, featureId: string | number, selected: boolean): void {
    if (!this._map?.setFeatureState) return;
    this._map.setFeatureState({ source: sourceId, id: featureId }, { selected });
  }

  /**
   * Toggles layer visibility.
   */
  setLayerVisibility(layerId: string, visible: boolean): void {
    if (!this._map?.setLayoutProperty) return;
    this._map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
  }

  /**
   * Adjusts layer opacity.
   */
  setLayerOpacity(layerId: string, opacity: number): void {
    if (!this._map?.setPaintProperty) return;
    const layer = this._map.getLayer?.(layerId);
    if (!layer) return;

    const type = layer.type;
    const propMap: Record<string, string> = {
      fill: 'fill-opacity',
      line: 'line-opacity',
      circle: 'circle-opacity',
      raster: 'raster-opacity',
      'fill-extrusion': 'fill-extrusion-opacity',
    };

    const prop = propMap[type];
    if (prop) {
      this._map.setPaintProperty(layerId, prop, opacity);
    }
  }

  /**
   * Checks if layer exists.
   */
  hasLayer(layerId: string): boolean {
    return this._layers.has(layerId) || (this._map?.getLayer?.(layerId) !== undefined);
  }

  /**
   * Removes a layer.
   */
  removeLayer(layerId: string): void {
    if (!this._map) return;
    if (this._map.getLayer?.(layerId)) {
      this._map.removeLayer(layerId);
    }
    this._layers.delete(layerId);
    this._layerClickHandlers.delete(layerId);
    this._layerHoverHandlers.delete(layerId);
  }

  /**
   * Registers click event for a specific layer.
   */
  onLayerClick(layerId: string, handler: (e: any) => void): void {
    if (!this._map) return;
    this._layerClickHandlers.set(layerId, handler);
    this._map.on('click', layerId, handler);
  }

  /**
   * Registers hover event for a specific layer.
   */
  onLayerHover(layerId: string, handler: (e: any) => void): void {
    if (!this._map) return;
    this._layerHoverHandlers.set(layerId, handler);
    this._map.on('mousemove', layerId, handler);
  }

  private _setupLayerInteractivity(layerId: string): void {
    if (!this._map) return;

    this._map.on('mouseenter', layerId, () => {
      if (this._map.getCanvas) {
        this._map.getCanvas().style.cursor = 'pointer';
      }
    });

    this._map.on('mouseleave', layerId, () => {
      if (this._map.getCanvas) {
        this._map.getCanvas().style.cursor = '';
      }
    });
  }

  /**
   * Cleans up all layers and sources managed by this instance.
   */
  clear(): void {
    if (!this._map) return;

    for (const layerId of Array.from(this._layers)) {
      this.removeLayer(layerId);
    }
    for (const sourceId of Array.from(this._sources)) {
      this.removeSource(sourceId);
    }

    this._layers.clear();
    this._sources.clear();
    this._hoveredFeatureId = null;
  }
}
