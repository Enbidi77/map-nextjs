import { useEffect, useRef, useState, useCallback } from 'react';
import { useMapInstance } from './useMapInstance.js';
import {
  DrawingTool,
  type DrawingMode,
  type DrawnFeature,
  type DrawnFeatureProperties,
} from '../../drawing/DrawingTool.js';
import type { FeatureCollection, Geometry } from 'geojson';

export interface UseDrawingResult {
  mode: DrawingMode;
  features: FeatureCollection<Geometry, DrawnFeatureProperties>;
  selectedFeature: DrawnFeature | null;
  selectedFeatureId: string | null;
  isDrawing: boolean;
  setMode: (mode: DrawingMode) => void;
  selectFeature: (id: string | null) => void;
  deleteSelectedFeature: () => void;
  deleteFeature: (id: string) => void;
  clear: () => void;
  exportGeoJSON: () => string;
  importGeoJSON: (data: string | FeatureCollection) => void;
}

/**
 * React hook for interactive vector feature authoring and editing.
 */
export function useDrawing(): UseDrawingResult {
  const { map, isLoaded } = useMapInstance();
  const toolRef = useRef<DrawingTool | null>(null);

  const [mode, setModeState] = useState<DrawingMode>('none');
  const [features, setFeatures] = useState<FeatureCollection<Geometry, DrawnFeatureProperties>>({
    type: 'FeatureCollection',
    features: [],
  });
  const [selectedFeature, setSelectedFeature] = useState<DrawnFeature | null>(null);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const tool = new DrawingTool(map);
    toolRef.current = tool;

    const unsubFeatures = tool.onFeaturesChange((fc) => {
      setFeatures({ ...fc });
    });

    const unsubSelection = tool.onSelectChange((sel) => {
      setSelectedFeature(sel ? { ...sel } : null);
    });

    return () => {
      unsubFeatures();
      unsubSelection();
      tool.destroy();
      toolRef.current = null;
    };
  }, [map, isLoaded]);

  const setMode = useCallback((newMode: DrawingMode) => {
    toolRef.current?.setMode(newMode);
    setModeState(newMode);
  }, []);

  const selectFeature = useCallback((id: string | null) => {
    toolRef.current?.selectFeature(id);
  }, []);

  const deleteSelectedFeature = useCallback(() => {
    toolRef.current?.deleteSelectedFeature();
  }, []);

  const deleteFeature = useCallback((id: string) => {
    toolRef.current?.deleteFeature(id);
  }, []);

  const clear = useCallback(() => {
    toolRef.current?.clear();
  }, []);

  const exportGeoJSON = useCallback(() => {
    return toolRef.current?.exportGeoJSON() ?? '{"type":"FeatureCollection","features":[]}';
  }, []);

  const importGeoJSON = useCallback((data: string | FeatureCollection) => {
    toolRef.current?.importGeoJSON(data);
  }, []);

  return {
    mode,
    features,
    selectedFeature,
    selectedFeatureId: selectedFeature?.properties.id ?? null,
    isDrawing: mode !== 'none' && mode !== 'select',
    setMode,
    selectFeature,
    deleteSelectedFeature,
    deleteFeature,
    clear,
    exportGeoJSON,
    importGeoJSON,
  };
}
