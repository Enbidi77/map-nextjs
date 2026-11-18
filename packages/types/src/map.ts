import type { Coordinate } from './coordinates.js';
import type { GeoJSONFeature } from './geojson.js';

export type MapStyleId =
  | 'streets'
  | 'satellite'
  | 'terrain'
  | 'dark'
  | 'light'
  | 'outdoors'
  | 'navigation';

export interface MapStyle {
  id: MapStyleId | string;
  name: string;
  url: string;
  rasterFallbackUrl?: string;
  thumbnail?: string;
  attribution: string;
  description?: string;
  isDark?: boolean;
}

export type MapLayerType =
  | 'symbol'
  | 'line'
  | 'fill'
  | 'circle'
  | 'raster'
  | 'heatmap'
  | 'fill-extrusion';

export interface MapLayerDefinition {
  id: string;
  name?: string;
  type: MapLayerType;
  sourceId: string;
  sourceLayer?: string;
  minZoom?: number;
  maxZoom?: number;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
  filter?: unknown[];
  interactive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface MapInteractionEvent {
  type: 'click' | 'hover' | 'mousemove' | 'drag' | 'dragstart' | 'dragend' | 'zoom';
  coordinate: Coordinate;
  point: { x: number; y: number };
  features?: GeoJSONFeature[];
  originalEvent?: unknown;
}

export interface LayerToggleState {
  layerId: string;
  visible: boolean;
  opacity: number;
}
