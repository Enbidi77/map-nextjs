import React, { createContext, useContext } from 'react';
import type { CameraState } from '../types.js';
import type { MapRenderer } from '../renderer/MapRenderer.js';
import type { LayerManager } from '../layers/LayerManager.js';
import type { MarkerManager } from '../layers/MarkerManager.js';
import type { MapControlsController } from '../controls/controls.js';

export interface MapContextValue {
  map: MapRenderer | null;
  isLoaded: boolean;
  camera: CameraState;
  layerManager: LayerManager | null;
  markerManager: MarkerManager | null;
  controls: MapControlsController | null;
  error: Error | null;
}

export const defaultCameraState: CameraState = {
  center: [0, 0],
  zoom: 1,
  pitch: 0,
  bearing: 0,
};

export const MapContext = createContext<MapContextValue>({
  map: null,
  isLoaded: false,
  camera: defaultCameraState,
  layerManager: null,
  markerManager: null,
  controls: null,
  error: null,
});

export const MapProvider: React.FC<{
  value: MapContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export function useMapContext(): MapContextValue {
  return useContext(MapContext);
}
