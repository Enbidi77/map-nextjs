import { useMapContext } from '../MapContext.js';
import type { MapRenderer } from '../../renderer/MapRenderer.js';
import type { LayerManager } from '../../layers/LayerManager.js';
import type { MarkerManager } from '../../layers/MarkerManager.js';
import type { MapControlsController } from '../../controls/controls.js';

export interface UseMapInstanceResult {
  map: MapRenderer | null;
  isLoaded: boolean;
  layerManager: LayerManager | null;
  markerManager: MarkerManager | null;
  controls: MapControlsController | null;
  error: Error | null;
}

/**
 * Access the active MapRenderer, LayerManager, MarkerManager, and Controls from context.
 */
export function useMapInstance(): UseMapInstanceResult {
  const context = useMapContext();
  return {
    map: context.map,
    isLoaded: context.isLoaded,
    layerManager: context.layerManager,
    markerManager: context.markerManager,
    controls: context.controls,
    error: context.error,
  };
}
