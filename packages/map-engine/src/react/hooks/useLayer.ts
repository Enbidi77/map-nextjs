import { useEffect } from 'react';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { useMapInstance } from './useMapInstance.js';
import type {
  CircleLayerOptions,
  ClusterLayerOptions,
  LineLayerOptions,
  PolygonLayerOptions,
} from '../../types.js';

export type LayerConfig =
  | {
      type: 'line';
      sourceId: string;
      data?: Feature | FeatureCollection<Geometry> | string;
      options: LineLayerOptions;
    }
  | {
      type: 'polygon';
      sourceId: string;
      data?: Feature | FeatureCollection<Geometry> | string;
      options: PolygonLayerOptions;
    }
  | {
      type: 'circle';
      sourceId: string;
      data?: Feature | FeatureCollection<Geometry> | string;
      options: CircleLayerOptions;
    }
  | {
      type: 'cluster';
      sourceId: string;
      data?: Feature | FeatureCollection<Geometry> | string;
      options: ClusterLayerOptions;
    };

/**
 * Declaratively adds and manages a GeoJSON layer with automatic lifecycle cleanup.
 */
export function useLayer(config: LayerConfig | null): void {
  const { layerManager, isLoaded } = useMapInstance();

  useEffect(() => {
    if (!layerManager || !isLoaded || !config) return;

    const { sourceId, data } = config;

    // 1. Ensure source exists
    const isCluster = config.type === 'cluster';
    if (!layerManager.hasSource(sourceId)) {
      layerManager.addGeoJSONSource(sourceId, {
        data: data as any,
        cluster: isCluster,
        clusterRadius: isCluster ? config.options.clusterRadius : undefined,
      });
    } else if (data) {
      layerManager.updateGeoJSONData(sourceId, data as any);
    }

    // 2. Add layer based on type
    if (config.type === 'line') {
      layerManager.addLineLayer(config.options);
    } else if (config.type === 'polygon') {
      layerManager.addPolygonLayer(config.options);
    } else if (config.type === 'circle') {
      layerManager.addCircleLayer(config.options);
    } else if (config.type === 'cluster') {
      layerManager.addClusterLayers(config.options);
    }

    // 3. Cleanup on unmount
    return () => {
      if (config.type === 'line' || config.type === 'polygon' || config.type === 'circle') {
        layerManager.removeLayer(config.options.id);
      } else if (config.type === 'cluster') {
        layerManager.removeLayer(`${sourceId}-clusters`);
        layerManager.removeLayer(`${sourceId}-cluster-count`);
        layerManager.removeLayer(`${sourceId}-unclustered-point`);
      }
    };
  }, [layerManager, isLoaded, config]);
}
