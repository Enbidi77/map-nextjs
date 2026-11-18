import { useEffect, useRef, useState, useCallback } from 'react';
import { useMapInstance } from './useMapInstance.js';
import {
  MeasurementTool,
  type MeasurementMode,
  type MeasurementResult,
} from '../../measure/MeasurementTool.js';
import type { Coordinate } from '../../types.js';

export interface UseMeasurementResult extends MeasurementResult {
  isMeasuring: boolean;
  setMode: (mode: MeasurementMode) => void;
  addPoint: (coord: Coordinate) => void;
  undo: () => void;
  clear: () => void;
  finish: () => void;
}

/**
 * React hook for interactive distance and area measurements.
 */
export function useMeasurement(unitSystem: 'metric' | 'imperial' = 'metric'): UseMeasurementResult {
  const { map, isLoaded } = useMapInstance();
  const toolRef = useRef<MeasurementTool | null>(null);

  const [measurement, setMeasurement] = useState<MeasurementResult>({
    mode: 'none',
    points: [],
    distanceMeters: 0,
    formattedDistance: '0 m',
    areaSqMeters: 0,
    formattedArea: '0 m²',
    isComplete: false,
  });

  useEffect(() => {
    if (!map || !isLoaded) return;

    const tool = new MeasurementTool(map, unitSystem);
    toolRef.current = tool;

    const unsubscribe = tool.onMeasurementChange((res) => {
      setMeasurement(res);
    });

    return () => {
      unsubscribe();
      tool.destroy();
      toolRef.current = null;
    };
  }, [map, isLoaded, unitSystem]);

  const setMode = useCallback((mode: MeasurementMode) => {
    toolRef.current?.setMode(mode);
    setMeasurement((prev) => ({ ...prev, mode }));
  }, []);

  const addPoint = useCallback((coord: Coordinate) => {
    toolRef.current?.addPoint(coord);
  }, []);

  const undo = useCallback(() => {
    toolRef.current?.undo();
  }, []);

  const clear = useCallback(() => {
    toolRef.current?.clear();
  }, []);

  const finish = useCallback(() => {
    toolRef.current?.finish();
  }, []);

  return {
    ...measurement,
    isMeasuring: measurement.mode !== 'none',
    setMode,
    addPoint,
    undo,
    clear,
    finish,
  };
}
