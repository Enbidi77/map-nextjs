import { describe, it, expect } from 'vitest';
import {
  BASEMAP_STYLES,
  getBasemapStyle,
  getAllBasemapStyles,
  getDefaultBasemapStyle,
  isDarkBasemap,
} from '../src/basemaps/styles.js';

describe('Basemaps Registry', () => {
  it('contains expected default basemap styles', () => {
    expect(BASEMAP_STYLES['carto-positron']).toBeDefined();
    expect(BASEMAP_STYLES['carto-dark-matter']).toBeDefined();
    expect(BASEMAP_STYLES['carto-voyager']).toBeDefined();
    expect(BASEMAP_STYLES['osm-standard']).toBeDefined();
  });

  it('retrieves default basemap style', () => {
    const defaultStyle = getDefaultBasemapStyle();
    expect(defaultStyle.id).toBe('carto-voyager');
    expect(defaultStyle.url).toContain('voyager-gl-style');
    expect(defaultStyle.isDark).toBe(false);
  });

  it('identifies dark mode styles correctly', () => {
    expect(isDarkBasemap('carto-dark-matter')).toBe(true);
    expect(isDarkBasemap('carto-positron')).toBe(false);
  });

  it('falls back to default style on unknown style id', () => {
    const style = getBasemapStyle('non-existent-style');
    expect(style.id).toBe('carto-voyager');
  });

  it('lists all basemap styles with valid properties', () => {
    const all = getAllBasemapStyles();
    expect(all.length).toBeGreaterThanOrEqual(4);
    for (const style of all) {
      expect(style.name).toBeDefined();
      expect(style.url).toBeDefined();
      expect(style.attribution).toBeDefined();
      expect(style.provider).toBeDefined();
    }
  });
});
