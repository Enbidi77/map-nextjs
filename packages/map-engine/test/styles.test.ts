import { describe, it, expect } from 'vitest';
import {
  MapStyleProvider,
  defaultStyleProvider,
  createRasterStyle,
  DEFAULT_STYLE_ID,
} from '../src/styles/index.js';

describe('MapStyleProvider and Styles', () => {
  it('contains default registered styles (streets, light, dark, satellite, terrain, navigation)', () => {
    const allStyles = defaultStyleProvider.getAllStyles();
    expect(allStyles.length).toBeGreaterThanOrEqual(6);

    const streets = defaultStyleProvider.getStyle('streets');
    expect(streets).toBeDefined();
    expect(streets.id).toBe('streets');
    expect(streets.attribution).toContain('OpenStreetMap');

    const dark = defaultStyleProvider.getStyle('dark');
    expect(dark.isDark).toBe(true);

    const light = defaultStyleProvider.getStyle('light');
    expect(light.isDark).toBe(false);
  });

  it('correctly resolves theme-based styles', () => {
    const provider = new MapStyleProvider();
    const darkStyle = provider.getThemeStyle(true);
    const lightStyle = provider.getThemeStyle(false);

    expect(darkStyle.id).toBe('dark');
    expect(darkStyle.isDark).toBe(true);

    expect(lightStyle.id).toBe('light');
    expect(lightStyle.isDark).toBe(false);
  });

  it('generates valid raster style specification objects with createRasterStyle', () => {
    const rasterStyle = createRasterStyle({
      tiles: ['https://example.com/tiles/{z}/{x}/{y}.png'],
      attribution: 'Test Attribution',
      minZoom: 2,
      maxZoom: 18,
    }) as any;

    expect(rasterStyle.version).toBe(8);
    expect(rasterStyle.sources['raster-tiles']).toBeDefined();
    expect(rasterStyle.sources['raster-tiles'].type).toBe('raster');
    expect(rasterStyle.sources['raster-tiles'].tiles).toEqual(['https://example.com/tiles/{z}/{x}/{y}.png']);
    expect(rasterStyle.sources['raster-tiles'].attribution).toBe('Test Attribution');
    expect(rasterStyle.layers.length).toBe(2);
    expect(rasterStyle.layers[1].type).toBe('raster');
  });

  it('handles graceful fallback resolution when a style fails', () => {
    const provider = new MapStyleProvider();
    let fallbackNotified = false;

    provider.onFallback((failedId, fallback) => {
      fallbackNotified = true;
      expect(failedId).toBe('invalid-or-broken-style');
      expect(fallback).toBeDefined();
      expect(fallback.id).toBe(DEFAULT_STYLE_ID);
    });

    const fallback = provider.resolveFallback('invalid-or-broken-style', new Error('Tile network timeout'));
    expect(fallback).toBeDefined();
    expect(fallbackNotified).toBe(true);
  });

  it('supports registering new custom styles', () => {
    const provider = new MapStyleProvider();
    provider.registerStyle({
      id: 'custom-contour',
      name: 'Custom Contour Map',
      url: 'https://example.com/contour.json',
      attribution: 'Custom Carto',
      isDark: false,
    });

    const custom = provider.getStyle('custom-contour');
    expect(custom).toBeDefined();
    expect(custom.name).toBe('Custom Contour Map');
  });
});
