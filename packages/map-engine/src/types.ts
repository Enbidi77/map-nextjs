import type {
  BoundingBox,
  CameraPadding,
  CameraState,
  Coordinate,
  EaseToOptions,
  FitBoundsOptions,
  FlyToOptions,
  LatLng,
  MapInteractionEvent,
  MapLayerDefinition,
  MapLayerType,
  MapStyle,
  MapStyleId,
} from '@modern-maps/types';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

export type {
  BoundingBox,
  CameraPadding,
  CameraState,
  Coordinate,
  EaseToOptions,
  FitBoundsOptions,
  FlyToOptions,
  LatLng,
  MapInteractionEvent,
  MapLayerDefinition,
  MapLayerType,
  MapStyle,
  MapStyleId,
};

/**
 * Initialization options for MapRenderer.
 */
export interface MapRendererOptions {
  container: HTMLElement | string;
  style?: string | object;
  center?: Coordinate;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  minZoom?: number;
  maxZoom?: number;
  maxBounds?: BoundingBox;
  interactive?: boolean;
  attributionControl?: boolean;
  preserveDrawingBuffer?: boolean;
  transformRequest?: (url: string, resourceType?: any) => { url: string; headers?: Record<string, string> };
  fallbackStyle?: string | object;
}

/**
 * Event map for MapRenderer.
 */
export type MapEventType =
  | 'load'
  | 'error'
  | 'styleload'
  | 'render'
  | 'resize'
  | 'move'
  | 'movestart'
  | 'moveend'
  | 'zoom'
  | 'zoomstart'
  | 'zoomend'
  | 'rotate'
  | 'pitch'
  | 'click'
  | 'dblclick'
  | 'contextmenu'
  | 'mousemove'
  | 'mouseenter'
  | 'mouseleave';

export type MapEventHandler<T = unknown> = (event: T) => void;

/**
 * Extended Style Definition with Vector & Raster fallbacks.
 */
export interface EngineMapStyle extends MapStyle {
  type?: 'vector' | 'raster';
  styleObject?: object;
  rasterFallbackTiles?: string[];
  maxZoom?: number;
  minZoom?: number;
}

/**
 * GeoJSON Source configuration options.
 */
export interface GeoJSONSourceOptions {
  data?: Feature | FeatureCollection<Geometry> | string;
  cluster?: boolean;
  clusterRadius?: number;
  clusterMaxZoom?: number;
  clusterProperties?: Record<string, unknown>;
  generateId?: boolean;
  tolerance?: number;
}

/**
 * Layer styling options for Lines.
 */
export interface LineLayerOptions {
  id: string;
  sourceId: string;
  sourceLayer?: string;
  color?: string;
  width?: number;
  opacity?: number;
  dashArray?: number[];
  cap?: 'butt' | 'round' | 'square';
  join?: 'bevel' | 'round' | 'miter';
  minZoom?: number;
  maxZoom?: number;
  interactive?: boolean;
  beforeId?: string;
}

/**
 * Layer styling options for Polygons.
 */
export interface PolygonLayerOptions {
  id: string;
  sourceId: string;
  sourceLayer?: string;
  fillColor?: string;
  fillOpacity?: number;
  outlineColor?: string;
  outlineWidth?: number;
  extrusionHeight?: number | string;
  extrusionBase?: number | string;
  extrusionColor?: string;
  extrusionOpacity?: number;
  minZoom?: number;
  maxZoom?: number;
  interactive?: boolean;
  beforeId?: string;
}

/**
 * Layer styling options for Points / Circles.
 */
export interface CircleLayerOptions {
  id: string;
  sourceId: string;
  sourceLayer?: string;
  radius?: number;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  minZoom?: number;
  maxZoom?: number;
  interactive?: boolean;
  beforeId?: string;
}

/**
 * Cluster Layer options for automatic clustering visualization.
 */
export interface ClusterLayerOptions {
  sourceId: string;
  clusterRadius?: number;
  clusterColors?: [number, string][]; // e.g. [[0, '#3b82f6'], [20, '#10b981'], [100, '#ef4444']]
  pointColor?: string;
  pointRadius?: number;
  textColor?: string;
  onClickExpand?: boolean;
}

/**
 * Marker configuration.
 */
export interface MarkerOptions {
  element?: HTMLElement;
  color?: string;
  draggable?: boolean;
  popup?: HTMLElement | string;
  popupOptions?: {
    offset?: number | [number, number];
    closeButton?: boolean;
    closeOnClick?: boolean;
  };
  onDragEnd?: (coordinate: Coordinate) => void;
  onClick?: () => void;
}

/**
 * Geolocation status.
 */
export type GeolocationStatus = 'idle' | 'locating' | 'located' | 'denied' | 'unavailable' | 'timeout';

export interface GeolocationPosition {
  coordinate: Coordinate;
  accuracy: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

/**
 * 3D Building extrusion layer options.
 */
export interface Building3DLayerOptions {
  id?: string;
  sourceId?: string;
  sourceLayer?: string;
  color?: string;
  minZoom?: number;
  opacity?: number;
  lightColor?: string;
  darkColor?: string;
  beforeId?: string;
}

/**
 * Heatmap layer options.
 */
export interface HeatmapLayerOptions {
  id: string;
  sourceId: string;
  sourceLayer?: string;
  weightProperty?: string;
  intensity?: number;
  radius?: number;
  opacity?: number;
  minZoom?: number;
  maxZoom?: number;
  beforeId?: string;
}
