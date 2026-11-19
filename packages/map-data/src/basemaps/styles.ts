import type { BasemapConfig } from './types.js';

export const BASEMAP_STYLES: Record<string, BasemapConfig> = {
  'carto-positron': {
    id: 'carto-positron',
    name: 'Carto Positron',
    description: 'Clean, light-themed vector basemap ideal for data visualization',
    url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    rasterFallbackUrl: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    isDark: false,
    provider: 'carto',
    category: 'light',
    minZoom: 0,
    maxZoom: 20,
  },
  'carto-dark-matter': {
    id: 'carto-dark-matter',
    name: 'Carto Dark Matter',
    description: 'Sleek, dark-themed vector basemap for high-contrast nighttime and analytical maps',
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    rasterFallbackUrl: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    isDark: true,
    provider: 'carto',
    category: 'dark',
    minZoom: 0,
    maxZoom: 20,
  },
  'carto-voyager': {
    id: 'carto-voyager',
    name: 'Carto Voyager',
    description: 'Vibrant, colorful street basemap tailored for general navigation and exploration',
    url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    rasterFallbackUrl: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    isDark: false,
    provider: 'carto',
    category: 'street',
    minZoom: 0,
    maxZoom: 20,
  },
  'osm-standard': {
    id: 'osm-standard',
    name: 'OpenStreetMap Standard',
    description: 'Crowdsourced, highly detailed worldwide street map',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    rasterFallbackUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    isDark: false,
    provider: 'osm',
    category: 'street',
    minZoom: 0,
    maxZoom: 19,
  },
  'maplibre-demo': {
    id: 'maplibre-demo',
    name: 'MapLibre Demotiles',
    description: 'Open-source vector tile demo style with global coverage',
    url: 'https://demotiles.maplibre.org/style.json',
    attribution: '&copy; <a href="https://maplibre.org">MapLibre</a> contributors',
    isDark: false,
    provider: 'maplibre',
    category: 'street',
    minZoom: 0,
    maxZoom: 14,
  },
  'opentopo': {
    id: 'opentopo',
    name: 'OpenTopoMap Terrain',
    description: 'Topographic map style emphasizing contours, elevation, and terrain features',
    url: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
    rasterFallbackUrl: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (&copy; OSM contributors)',
    isDark: false,
    provider: 'osm',
    category: 'terrain',
    minZoom: 0,
    maxZoom: 17,
  },
};

export const DEFAULT_BASEMAP_ID = 'carto-voyager';

export function getBasemapStyle(id: string): BasemapConfig {
  const style = BASEMAP_STYLES[id];
  if (!style) {
    const fallback = BASEMAP_STYLES[DEFAULT_BASEMAP_ID];
    if (fallback) return fallback;
    throw new Error(`Basemap style "${id}" not found and fallback unavailable.`);
  }
  return style;
}

export function getAllBasemapStyles(): BasemapConfig[] {
  return Object.values(BASEMAP_STYLES);
}

export function getDefaultBasemapStyle(): BasemapConfig {
  return getBasemapStyle(DEFAULT_BASEMAP_ID);
}

export function isDarkBasemap(id: string): boolean {
  return BASEMAP_STYLES[id]?.isDark ?? false;
}
