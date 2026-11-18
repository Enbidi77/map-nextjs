import { useEffect, useRef } from 'react';
import { useMapInstance } from './useMapInstance.js';
import type { Coordinate, MarkerOptions } from '../../types.js';

export interface UseMarkerConfig {
  id: string;
  coordinate: Coordinate;
  options?: MarkerOptions;
}

/**
 * Declaratively creates and manages a map marker with automatic cleanup.
 */
export function useMarker(config: UseMarkerConfig | null): void {
  const { markerManager, isLoaded } = useMapInstance();
  const prevCoordRef = useRef<Coordinate | null>(null);

  useEffect(() => {
    if (!markerManager || !isLoaded || !config) return;

    const { id, coordinate, options } = config;

    const managed = markerManager.getMarker(id);
    if (!managed) {
      markerManager.addMarker(id, coordinate, options);
      prevCoordRef.current = coordinate;
    } else if (
      !prevCoordRef.current ||
      prevCoordRef.current[0] !== coordinate[0] ||
      prevCoordRef.current[1] !== coordinate[1]
    ) {
      markerManager.updateMarker(id, coordinate);
      prevCoordRef.current = coordinate;
    }

    return () => {
      markerManager.removeMarker(id);
    };
  }, [markerManager, isLoaded, config]);
}
