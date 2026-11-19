import type { MapStyle } from '@modern-maps/types';

export interface BasemapConfig extends MapStyle {
  provider: 'carto' | 'osm' | 'maplibre' | 'stamen' | 'custom';
  category: 'street' | 'satellite' | 'terrain' | 'dark' | 'light' | 'artistic';
  minZoom?: number;
  maxZoom?: number;
  tileSize?: number;
}
