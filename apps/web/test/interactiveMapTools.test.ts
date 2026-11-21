import { describe, it, expect } from 'vitest';
import type {
  Coordinate,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  GeoJSONPoint,
  GeoJSONLineString,
  GeoJSONPolygon,
} from '@modern-maps/types';
import type { MeasurementDrawingMode } from '@modern-maps/ui';
import { useMapStore } from '../src/stores/useMapStore';

/**
 * Pure helper mirroring the GeoJSON synchronization logic in InteractiveMap.tsx
 */
function buildToolGeoJSON(
  activeToolMode: MeasurementDrawingMode,
  toolPoints: Coordinate[]
): GeoJSONFeatureCollection {
  const features: GeoJSONFeature[] = [];

  // 1. Point features for all clicked vertices
  toolPoints.forEach((pt, index) => {
    features.push({
      type: 'Feature',
      id: `tool-point-${index}`,
      properties: { index },
      geometry: {
        type: 'Point',
        coordinates: pt,
      },
    });
  });

  // 2. LineString feature (if >= 2 points) - excludes point mode
  if (activeToolMode !== 'point' && toolPoints.length >= 2) {
    const isPoly = activeToolMode === 'area' || activeToolMode === 'polygon';
    const lineCoords =
      isPoly && toolPoints.length >= 3
        ? [...toolPoints, toolPoints[0]!]
        : toolPoints;

    features.push({
      type: 'Feature',
      id: 'tool-line',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: lineCoords,
      },
    });
  }

  // 3. Polygon feature (if mode is area or polygon and >= 3 points)
  if (
    (activeToolMode === 'area' || activeToolMode === 'polygon') &&
    toolPoints.length >= 3
  ) {
    features.push({
      type: 'Feature',
      id: 'tool-polygon',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[...toolPoints, toolPoints[0]!]],
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Helper determining canFinish condition as used in InteractiveMap
 */
function computeCanFinish(mode: MeasurementDrawingMode, pointsCount: number): boolean {
  return (
    ((mode === 'distance' || mode === 'line') && pointsCount >= 2) ||
    ((mode === 'area' || mode === 'polygon') && pointsCount >= 3) ||
    (mode === 'point' && pointsCount >= 1)
  );
}

describe('InteractiveMap Measurement and Drawing Tools', () => {
  describe('GeoJSON Synchronization', () => {
    it('never creates an invalid 1-point LineString for 1 clicked vertex', () => {
      const singlePoint: Coordinate[] = [[-122.4194, 37.7749]];
      const geojson = buildToolGeoJSON('distance', singlePoint);

      expect(geojson.type).toBe('FeatureCollection');
      expect(geojson.features).toHaveLength(1);
      expect(geojson.features[0]!.geometry.type).toBe('Point');
      const pointGeom = geojson.features[0]!.geometry as GeoJSONPoint;
      expect(pointGeom.coordinates).toEqual(singlePoint[0]);

      // Ensure NO LineString feature exists
      const lineFeature = geojson.features.find((f) => f.geometry.type === 'LineString');
      expect(lineFeature).toBeUndefined();
    });

    it('creates Point features and a LineString for 2 points in distance and line modes', () => {
      const twoPoints: Coordinate[] = [
        [-122.4194, 37.7749],
        [-122.4094, 37.7849],
      ];

      const distanceGeoJSON = buildToolGeoJSON('distance', twoPoints);
      expect(distanceGeoJSON.features).toHaveLength(3); // 2 Points + 1 LineString

      const points = distanceGeoJSON.features.filter((f) => f.geometry.type === 'Point');
      expect(points).toHaveLength(2);

      const line = distanceGeoJSON.features.find((f) => f.geometry.type === 'LineString');
      expect(line).toBeDefined();
      const lineGeom = line!.geometry as GeoJSONLineString;
      expect(lineGeom.coordinates).toEqual(twoPoints);

      const lineModeGeoJSON = buildToolGeoJSON('line', twoPoints);
      expect(lineModeGeoJSON.features).toHaveLength(3);
    });

    it('creates Point features, closed LineString, and Polygon for >= 3 points in area/polygon modes', () => {
      const triangle: Coordinate[] = [
        [-122.42, 37.77],
        [-122.41, 37.77],
        [-122.415, 37.78],
      ];

      const geojson = buildToolGeoJSON('area', triangle);
      expect(geojson.features).toHaveLength(5); // 3 Points + 1 LineString + 1 Polygon

      const polygon = geojson.features.find((f) => f.geometry.type === 'Polygon');
      expect(polygon).toBeDefined();
      const polyGeom = polygon!.geometry as GeoJSONPolygon;
      expect(polyGeom.coordinates).toEqual([
        [...triangle, triangle[0]],
      ]);

      const line = geojson.features.find((f) => f.geometry.type === 'LineString');
      expect(line).toBeDefined();
      const lineGeom = line!.geometry as GeoJSONLineString;
      expect(lineGeom.coordinates).toEqual([...triangle, triangle[0]]);
    });

    it('supports point mode where all clicked points are individual point features without LineStrings', () => {
      const markers: Coordinate[] = [
        [-122.41, 37.77],
        [-122.42, 37.78],
        [-122.43, 37.79],
      ];

      const geojson = buildToolGeoJSON('point', markers);
      expect(geojson.features).toHaveLength(3);
      geojson.features.forEach((f, idx) => {
        expect(f.geometry.type).toBe('Point');
        const pointGeom = f.geometry as GeoJSONPoint;
        expect(pointGeom.coordinates).toEqual(markers[idx]);
      });

      const line = geojson.features.find((f) => f.geometry.type === 'LineString');
      expect(line).toBeUndefined();
    });
  });

  describe('canFinish Toolbar Rules', () => {
    it('correctly determines when drawing/measurement can finish', () => {
      // Distance: requires >= 2
      expect(computeCanFinish('distance', 0)).toBe(false);
      expect(computeCanFinish('distance', 1)).toBe(false);
      expect(computeCanFinish('distance', 2)).toBe(true);
      expect(computeCanFinish('distance', 5)).toBe(true);

      // Line: requires >= 2
      expect(computeCanFinish('line', 1)).toBe(false);
      expect(computeCanFinish('line', 2)).toBe(true);

      // Area: requires >= 3
      expect(computeCanFinish('area', 2)).toBe(false);
      expect(computeCanFinish('area', 3)).toBe(true);
      expect(computeCanFinish('area', 4)).toBe(true);

      // Polygon: requires >= 3
      expect(computeCanFinish('polygon', 2)).toBe(false);
      expect(computeCanFinish('polygon', 3)).toBe(true);

      // Point: requires >= 1
      expect(computeCanFinish('point', 0)).toBe(false);
      expect(computeCanFinish('point', 1)).toBe(true);
      expect(computeCanFinish('point', 3)).toBe(true);

      // None: cannot finish
      expect(computeCanFinish('none', 10)).toBe(false);
    });
  });

  describe('Store Integration and Map Click Handling', () => {
    it('reliably reads activeToolMode and adds coordinates on simulated map click', () => {
      useMapStore.setState({ activeToolMode: 'none', toolPoints: [] });

      // Simulated map click handler identical to InteractiveMap.tsx
      const handleMapClick = (e: any) => {
        const mode = useMapStore.getState().activeToolMode;
        if (mode !== 'none') {
          const coord: Coordinate | undefined =
            e?.coordinate || (e?.lngLat ? [e.lngLat.lng, e.lngLat.lat] : undefined);
          if (
            coord &&
            typeof coord[0] === 'number' &&
            !isNaN(coord[0]) &&
            typeof coord[1] === 'number' &&
            !isNaN(coord[1])
          ) {
            useMapStore.getState().addToolPoint(coord);
          }
        }
      };

      // Click when mode is 'none' -> ignored
      handleMapClick({ coordinate: [-122.4194, 37.7749] });
      expect(useMapStore.getState().toolPoints).toHaveLength(0);

      // Activate distance mode
      useMapStore.setState({ activeToolMode: 'distance' });
      handleMapClick({ coordinate: [-122.4194, 37.7749] });
      expect(useMapStore.getState().toolPoints).toHaveLength(1);
      expect(useMapStore.getState().toolPoints[0]).toEqual([-122.4194, 37.7749]);

      // Add second point via lngLat object fallback
      handleMapClick({ lngLat: { lng: -122.4094, lat: 37.7849 } });
      expect(useMapStore.getState().toolPoints).toHaveLength(2);
      expect(useMapStore.getState().measurementValue).toBeTruthy();
    });
  });
});
