import { describe, it, expect } from 'vitest';
import { LayerManager } from '../src/layers/LayerManager.js';
import { MockMapLibreMap } from '@modern-maps/testing';

describe('Advanced Layers: 3D Buildings & Heatmaps', () => {
  it('adds and toggles 3D Building Extrusion layer', () => {
    const mockMap = new MockMapLibreMap();
    const layerManager = new LayerManager(mockMap);

    // Initial state
    expect(layerManager.is3DBuildingsVisible()).toBe(false);

    // Add 3D buildings
    layerManager.add3DBuildingsLayer();
    expect(layerManager.hasLayer('3d-buildings')).toBe(true);

    const layer = mockMap.getLayer('3d-buildings') as any;
    expect(layer.type).toBe('fill-extrusion');
    expect(layer.paint['fill-extrusion-height']).toBeDefined();

    // Toggle off
    const toggledOff = layerManager.toggle3DBuildings(false);
    expect(toggledOff).toBe(false);

    // Toggle on
    const toggledOn = layerManager.toggle3DBuildings(true);
    expect(toggledOn).toBe(true);
  });

  it('adds Heatmap visualization layer for dense points', () => {
    const mockMap = new MockMapLibreMap();
    const layerManager = new LayerManager(mockMap);

    layerManager.addGeoJSONSource('earthquakes', {});
    layerManager.addHeatmapLayer({
      id: 'eq-heatmap',
      sourceId: 'earthquakes',
      weightProperty: 'mag',
      intensity: 1.5,
      radius: 25,
      opacity: 0.9,
    });

    expect(layerManager.hasLayer('eq-heatmap')).toBe(true);
    const heatmapLayer = mockMap.getLayer('eq-heatmap') as any;
    expect(heatmapLayer.type).toBe('heatmap');
    expect(heatmapLayer.paint['heatmap-weight']).toBeDefined();
    expect(heatmapLayer.paint['heatmap-color']).toBeDefined();
  });
});
