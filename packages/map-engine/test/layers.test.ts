import { describe, it, expect, vi } from 'vitest';
import { LayerManager } from '../src/layers/LayerManager.js';
import { MarkerManager } from '../src/layers/MarkerManager.js';
import { MockMapLibreMap } from '@modern-maps/testing';

describe('LayerManager', () => {
  it('adds, checks, updates, and removes GeoJSON sources', () => {
    const mockMap = new MockMapLibreMap();
    const layerManager = new LayerManager(mockMap);

    const geojsonData: any = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-122.4, 37.7] },
          properties: { name: 'SF' },
        },
      ],
    };

    layerManager.addGeoJSONSource('sf-points', { data: geojsonData });
    expect(layerManager.hasSource('sf-points')).toBe(true);

    const updatedData: any = {
      type: 'FeatureCollection',
      features: [],
    };
    layerManager.updateGeoJSONData('sf-points', updatedData);

    layerManager.removeSource('sf-points');
    expect(mockMap.getSource('sf-points')).toBeUndefined();
  });

  it('adds Line, Polygon (2D and 3D extrusion), and Circle layers', () => {
    const mockMap = new MockMapLibreMap();
    const layerManager = new LayerManager(mockMap);

    layerManager.addGeoJSONSource('geo-src', {});

    // Line layer
    layerManager.addLineLayer({
      id: 'route-line',
      sourceId: 'geo-src',
      color: '#ff0000',
      width: 4,
    });
    expect(layerManager.hasLayer('route-line')).toBe(true);
    const lineLayer = mockMap.getLayer('route-line') as any;
    expect(lineLayer.type).toBe('line');
    expect(lineLayer.paint['line-color']).toBe('#ff0000');
    expect(lineLayer.paint['line-width']).toBe(4);

    // Polygon 2D layer
    layerManager.addPolygonLayer({
      id: 'boundary-poly',
      sourceId: 'geo-src',
      fillColor: '#00ff00',
      fillOpacity: 0.5,
    });
    expect(layerManager.hasLayer('boundary-poly')).toBe(true);
    const polyLayer = mockMap.getLayer('boundary-poly') as any;
    expect(polyLayer.type).toBe('fill');
    expect(polyLayer.paint['fill-color']).toBe('#00ff00');

    // Polygon 3D extrusion layer
    layerManager.addPolygonLayer({
      id: 'buildings-3d',
      sourceId: 'geo-src',
      extrusionHeight: 50,
      extrusionBase: 0,
      extrusionColor: '#334155',
    });
    expect(layerManager.hasLayer('buildings-3d')).toBe(true);
    const extrusionLayer = mockMap.getLayer('buildings-3d') as any;
    expect(extrusionLayer.type).toBe('fill-extrusion');
    expect(extrusionLayer.paint['fill-extrusion-height']).toBe(50);

    // Circle layer
    layerManager.addCircleLayer({
      id: 'poi-dots',
      sourceId: 'geo-src',
      radius: 8,
      color: '#3b82f6',
    });
    expect(layerManager.hasLayer('poi-dots')).toBe(true);
    const circleLayer = mockMap.getLayer('poi-dots') as any;
    expect(circleLayer.type).toBe('circle');
    expect(circleLayer.paint['circle-radius']).toBe(8);
  });

  it('adds cluster layers with color steps and count labels', () => {
    const mockMap = new MockMapLibreMap();
    const layerManager = new LayerManager(mockMap);

    layerManager.addGeoJSONSource('clustered-pois', { cluster: true, clusterRadius: 40 });
    layerManager.addClusterLayers({
      sourceId: 'clustered-pois',
    });

    expect(layerManager.hasLayer('clustered-pois-clusters')).toBe(true);
    expect(layerManager.hasLayer('clustered-pois-cluster-count')).toBe(true);
    expect(layerManager.hasLayer('clustered-pois-unclustered-point')).toBe(true);
  });

  it('controls layer visibility and opacity', () => {
    const mockMap = new MockMapLibreMap();
    const layerManager = new LayerManager(mockMap);

    layerManager.addGeoJSONSource('test-src', {});
    layerManager.addLineLayer({ id: 'test-line', sourceId: 'test-src' });

    layerManager.setLayerVisibility('test-line', false);
    const layerAfterVis = mockMap.getLayer('test-line') as any;
    expect(layerAfterVis.layout.visibility).toBe('none');

    layerManager.setLayerOpacity('test-line', 0.6);
    const layerAfterOpacity = mockMap.getLayer('test-line') as any;
    expect(layerAfterOpacity.paint['line-opacity']).toBe(0.6);
  });

  it('handles feature hover and selection state without errors', () => {
    const mockMap = new MockMapLibreMap();
    (mockMap as any).setFeatureState = vi.fn();

    const layerManager = new LayerManager(mockMap);
    layerManager.setFeatureHoverState('pois', 123, true);
    expect((mockMap as any).setFeatureState).toHaveBeenCalledWith(
      { source: 'pois', id: 123 },
      { hover: true }
    );

    layerManager.setFeatureSelectState('pois', 123, true);
    expect((mockMap as any).setFeatureState).toHaveBeenCalledWith(
      { source: 'pois', id: 123 },
      { selected: true }
    );
  });

  it('clears all managed layers and sources', () => {
    const mockMap = new MockMapLibreMap();
    const layerManager = new LayerManager(mockMap);

    layerManager.addGeoJSONSource('s1', {});
    layerManager.addLineLayer({ id: 'l1', sourceId: 's1' });

    expect(layerManager.hasLayer('l1')).toBe(true);
    expect(layerManager.hasSource('s1')).toBe(true);

    layerManager.clear();
    expect(layerManager.hasLayer('l1')).toBe(false);
    expect(layerManager.hasSource('s1')).toBe(false);
  });
});

describe('MarkerManager', () => {
  it('manages markers with mock or native implementations', () => {
    const mockMap = new MockMapLibreMap();
    const markerManager = new MarkerManager(mockMap);

    expect(markerManager.getMarker('marker-1')).toBeUndefined();
    markerManager.clear();
  });
});
