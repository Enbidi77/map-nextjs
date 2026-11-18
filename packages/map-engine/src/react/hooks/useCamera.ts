import { useCallback } from 'react';
import { useMapContext } from '../MapContext.js';
import type {
  BoundingBox,
  CameraState,
  Coordinate,
  EaseToOptions,
  FitBoundsOptions,
  FlyToOptions,
} from '../../types.js';

export interface UseCameraResult {
  camera: CameraState;
  flyTo: (options: FlyToOptions) => void;
  easeTo: (options: EaseToOptions) => void;
  jumpTo: (options: { center?: Coordinate; zoom?: number; pitch?: number; bearing?: number }) => void;
  fitBounds: (bounds: BoundingBox, options?: FitBoundsOptions) => void;
  setCenter: (coord: Coordinate) => void;
  setZoom: (zoom: number) => void;
  setPitch: (pitch: number, options?: { duration?: number }) => void;
  setBearing: (bearing: number, options?: { duration?: number }) => void;
  resetBearing: (options?: { duration?: number }) => void;
  toggle3D: (targetPitch?: number) => number;
  zoomIn: (step?: number) => void;
  zoomOut: (step?: number) => void;
}

/**
 * Accesses camera state and provides navigation actions.
 */
export function useCamera(): UseCameraResult {
  const { map, camera, controls } = useMapContext();

  const flyTo = useCallback(
    (options: FlyToOptions) => {
      map?.flyTo(options);
    },
    [map]
  );

  const easeTo = useCallback(
    (options: EaseToOptions) => {
      map?.easeTo(options);
    },
    [map]
  );

  const jumpTo = useCallback(
    (options: { center?: Coordinate; zoom?: number; pitch?: number; bearing?: number }) => {
      map?.jumpTo(options);
    },
    [map]
  );

  const fitBounds = useCallback(
    (bounds: BoundingBox, options?: FitBoundsOptions) => {
      map?.fitBounds(bounds, options);
    },
    [map]
  );

  const setCenter = useCallback(
    (coord: Coordinate) => {
      map?.setCameraState({ center: coord });
    },
    [map]
  );

  const setZoom = useCallback(
    (zoom: number) => {
      map?.setCameraState({ zoom });
    },
    [map]
  );

  const setPitch = useCallback(
    (pitch: number, options?: { duration?: number }) => {
      map?.setPitch(pitch, options);
    },
    [map]
  );

  const setBearing = useCallback(
    (bearing: number, options?: { duration?: number }) => {
      map?.setBearing(bearing, options);
    },
    [map]
  );

  const resetBearing = useCallback(
    (options?: { duration?: number }) => {
      map?.resetNorth(options);
    },
    [map]
  );

  const toggle3D = useCallback(
    (targetPitch: number = 60) => {
      return map?.toggle3D(targetPitch) ?? 0;
    },
    [map]
  );

  const zoomIn = useCallback(
    (step: number = 1) => {
      controls?.zoomIn(step);
    },
    [controls]
  );

  const zoomOut = useCallback(
    (step: number = 1) => {
      controls?.zoomOut(step);
    },
    [controls]
  );

  return {
    camera,
    flyTo,
    easeTo,
    jumpTo,
    fitBounds,
    setCenter,
    setZoom,
    setPitch,
    setBearing,
    resetBearing,
    toggle3D,
    zoomIn,
    zoomOut,
  };
}
