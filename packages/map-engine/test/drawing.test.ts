import { describe, it, expect, vi } from 'vitest';
import { DrawingTool } from '../src/drawing/DrawingTool.js';
import { MapLibreRenderer } from '../src/renderer/MapLibreRenderer.js';
import { MockMapLibreMap } from '@modern-maps/testing';

describe('DrawingTool', () => {
  it('manages drawing modes and features collection', () => {
    const mockMap = new MockMapLibreMap();
    const renderer = new MapLibreRenderer(mockMap);
    const tool = new DrawingTool(renderer);

    const featureListener = vi.fn();
    const selectListener = vi.fn();
    tool.onFeaturesChange(featureListener);
    tool.onSelectChange(selectListener);

    tool.setMode('point');
    expect(tool.getMode()).toBe('point');

    // Add manual feature
    tool.addFeature({
      type: 'Feature',
      id: 'f-1',
      geometry: { type: 'Point', coordinates: [-122.4, 37.7] },
      properties: { id: 'f-1', name: 'Marker 1', createdAt: Date.now() },
    });

    expect(tool.getFeatures().features.length).toBe(1);
    expect(featureListener).toHaveBeenCalled();

    tool.selectFeature('f-1');
    expect(tool.getSelectedFeature()?.properties.id).toBe('f-1');
    expect(selectListener).toHaveBeenCalled();

    tool.deleteSelectedFeature();
    expect(tool.getFeatures().features.length).toBe(0);
    expect(tool.getSelectedFeature()).toBeNull();
  });

  it('exports and imports GeoJSON cleanly', () => {
    const mockMap = new MockMapLibreMap();
    const renderer = new MapLibreRenderer(mockMap);
    const tool = new DrawingTool(renderer);

    tool.addFeature({
      type: 'Feature',
      id: 'poly-1',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      },
      properties: { id: 'poly-1', name: 'Zone A', createdAt: Date.now() },
    });

    const exported = tool.exportGeoJSON();
    expect(exported).toContain('FeatureCollection');
    expect(exported).toContain('Zone A');

    tool.clear();
    expect(tool.getFeatures().features.length).toBe(0);

    tool.importGeoJSON(exported);
    expect(tool.getFeatures().features.length).toBe(1);
    expect(tool.getFeatures().features[0]?.properties.name).toBe('Zone A');
  });
});
