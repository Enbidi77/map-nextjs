import type { EngineMapStyle } from '../types.js';

/**
 * Generates a valid MapLibre GL Style Specification JSON object for a raster tile source.
 */
export function createRasterStyle(options: {
  tiles: string[];
  attribution: string;
  tileSize?: number;
  minZoom?: number;
  maxZoom?: number;
  sourceId?: string;
  layerId?: string;
  backgroundColor?: string;
}): object {
  const sourceId = options.sourceId ?? 'raster-tiles';
  const layerId = options.layerId ?? 'raster-layer';
  const tileSize = options.tileSize ?? 256;
  const minZoom = options.minZoom ?? 0;
  const maxZoom = options.maxZoom ?? 22;

  return {
    version: 8,
    name: 'Raster Basemap',
    sources: {
      [sourceId]: {
        type: 'raster',
        tiles: options.tiles,
        tileSize,
        attribution: options.attribution,
        minzoom: minZoom,
        maxzoom: maxZoom,
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': options.backgroundColor ?? '#e0e0e0',
        },
      },
      {
        id: layerId,
        type: 'raster',
        source: sourceId,
        minzoom: minZoom,
        maxzoom: maxZoom,
        paint: {
          'raster-opacity': 1,
          'raster-fade-duration': 150,
        },
      },
    ],
  };
}

/**
 * Standard Production Map Styles
 */
export const MAP_STYLES: Record<string, EngineMapStyle> = {
  streets: {
    id: 'streets',
    name: 'OpenStreetMap Streets',
    type: 'raster',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    rasterFallbackUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    description: 'Standard global OpenStreetMap cartography with roads and landmarks.',
    isDark: false,
    rasterFallbackTiles: [
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    ],
    styleObject: createRasterStyle({
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }),
  },

  light: {
    id: 'light',
    name: 'Carto Positron (Light)',
    type: 'raster',
    url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    rasterFallbackUrl: 'https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    description: 'Clean, light-themed basemap optimal for data visualization overlays.',
    isDark: false,
    rasterFallbackTiles: [
      'https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png',
    ],
    styleObject: createRasterStyle({
      tiles: ['https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png'],
      attribution: '&copy; OpenStreetMap, &copy; CARTO',
      backgroundColor: '#f5f5f3',
      maxZoom: 20,
    }),
  },

  dark: {
    id: 'dark',
    name: 'Carto Dark Matter',
    type: 'raster',
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    rasterFallbackUrl: 'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    description: 'High-contrast dark basemap tailored for night mode and glowing thematic layers.',
    isDark: true,
    rasterFallbackTiles: [
      'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
    ],
    styleObject: createRasterStyle({
      tiles: ['https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png'],
      attribution: '&copy; OpenStreetMap, &copy; CARTO',
      backgroundColor: '#121212',
      maxZoom: 20,
    }),
  },

  satellite: {
    id: 'satellite',
    name: 'Satellite (ESRI World Imagery)',
    type: 'raster',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    rasterFallbackUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    description: 'High-resolution global satellite photography and aerial imagery.',
    isDark: true,
    rasterFallbackTiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    ],
    styleObject: createRasterStyle({
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      attribution: 'Tiles &copy; Esri',
      backgroundColor: '#0a0a0a',
      maxZoom: 19,
    }),
  },

  terrain: {
    id: 'terrain',
    name: 'OpenTopoMap (Terrain)',
    type: 'raster',
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    rasterFallbackUrl: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    description: 'Topographic contour lines, hill shading, and elevation features.',
    isDark: false,
    rasterFallbackTiles: [
      'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    ],
    styleObject: createRasterStyle({
      tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
      attribution: '&copy; OpenStreetMap, SRTM, &copy; OpenTopoMap',
      backgroundColor: '#e6e4df',
      maxZoom: 17,
    }),
  },

  navigation: {
    id: 'navigation',
    name: 'Carto Voyager',
    type: 'raster',
    url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    rasterFallbackUrl: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    description: 'Vibrant, high-legibility cartography optimized for route navigation and POI discovery.',
    isDark: false,
    rasterFallbackTiles: [
      'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    ],
    styleObject: createRasterStyle({
      tiles: ['https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'],
      attribution: '&copy; OpenStreetMap, &copy; CARTO',
      backgroundColor: '#f7f6f4',
      maxZoom: 20,
    }),
  },

  outdoors: {
    id: 'outdoors',
    name: 'Outdoors Topo',
    type: 'raster',
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    rasterFallbackUrl: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap, &copy; OpenTopoMap',
    description: 'Hiking trails, contour lines, and natural terrain.',
    isDark: false,
    rasterFallbackTiles: [
      'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    ],
    styleObject: createRasterStyle({
      tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
      attribution: '&copy; OpenStreetMap, &copy; OpenTopoMap',
      backgroundColor: '#e6e4df',
      maxZoom: 17,
    }),
  },
};

export const DEFAULT_STYLE_ID = 'streets';
