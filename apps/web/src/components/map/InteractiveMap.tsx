'use client';

import * as React from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { RotateCw } from 'lucide-react';
import { MapContainer, type MapRenderer } from '@modern-maps/map-engine';
import { MeasurementDrawingToolbar } from '@modern-maps/ui';
import { useMapStore } from '../../stores/useMapStore';
import { useTranslation } from '../../features/i18n';
import { MapControlsOverlay } from './MapControlsOverlay';
import type {
  GeoJSONFeatureCollection,
  GeoJSONPoint,
  GeoJSONLineString,
  GeoJSONFeature,
  Coordinate,
} from '@modern-maps/types';

export interface InteractiveMapProps {
  isLayerSelectorOpen: boolean;
  onToggleLayerSelector: () => void;
}

export function InteractiveMap({
  isLayerSelectorOpen,
  onToggleLayerSelector,
}: InteractiveMapProps) {
  const { t } = useTranslation();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [mapInstance, setMapInstance] = React.useState<MapRenderer | null>(null);

  const camera = useMapStore((state) => state.camera);
  const setCamera = useMapStore((state) => state.setCamera);
  const activeStyle = useMapStore((state) => state.activeStyle);
  const selectedPlace = useMapStore((state) => state.selectedPlace);
  const setSelectedPlace = useMapStore((state) => state.setSelectedPlace);
  const directions = useMapStore((state) => state.directions);
  const overlays = useMapStore((state) => state.overlays);
  const liveSearchResults = useMapStore((state) => state.liveSearchResults);
  const isViewportOutOfSync = useMapStore((state) => state.isViewportOutOfSync);
  const setIsViewportOutOfSync = useMapStore((state) => state.setIsViewportOutOfSync);
  const isSearching = useMapStore((state) => state.isSearching);
  const searchThisArea = useMapStore((state) => state.searchThisArea);

  const lastCenterRef = React.useRef<Coordinate | null>(null);

  React.useEffect(() => {
    lastCenterRef.current = camera.center;
    setIsViewportOutOfSync(false);
  }, [liveSearchResults, setIsViewportOutOfSync]);

  // Automatically fly camera or fit bounds when selectedPlace changes
  React.useEffect(() => {
    if (!mapInstance || !selectedPlace) return;

    const bbox = selectedPlace.metadata?.bbox as [number, number, number, number] | undefined;
    if (bbox && Array.isArray(bbox) && bbox.length === 4) {
      mapInstance.fitBounds(bbox, { padding: 40, duration: 1200 });
    } else {
      const isRegion =
        selectedPlace.metadata?.type === 'administrative' ||
        selectedPlace.metadata?.osm_type === 'relation' ||
        selectedPlace.metadata?.addresstype === 'country';

      mapInstance.flyTo({
        center: selectedPlace.coordinates,
        zoom: isRegion ? 6 : 14,
        duration: 1200,
      });
    }
  }, [mapInstance, selectedPlace]);

  // Measurement & Drawing Tools State
  const activeToolMode = useMapStore((state) => state.activeToolMode);
  const setActiveToolMode = useMapStore((state) => state.setActiveToolMode);
  const measurementValue = useMapStore((state) => state.measurementValue);
  const toolPoints = useMapStore((state) => state.toolPoints);
  const addToolPoint = useMapStore((state) => state.addToolPoint);
  const clearToolPoints = useMapStore((state) => state.clearToolPoints);

  // Synchronize camera state from MapContainer and detect viewport drift
  const handleCameraChange = React.useCallback(
    (cam: typeof camera) => {
      setCamera(cam);

      if (lastCenterRef.current) {
        const [lastLng, lastLat] = lastCenterRef.current;
        const [currLng, currLat] = cam.center;
        const dLng = Math.abs(currLng - lastLng);
        const dLat = Math.abs(currLat - lastLat);
        // If moved > 0.03 degrees (~3km) away from results center
        if (dLng > 0.03 || dLat > 0.03) {
          setIsViewportOutOfSync(true);
        }
      }
    },
    [setCamera, setIsViewportOutOfSync]
  );

  const handleSearchThisArea = React.useCallback(() => {
    lastCenterRef.current = camera.center;
    let bounds: [number, number, number, number] | undefined;
    if (mapInstance) {
      const native = mapInstance.getNativeMap() as MapLibreMap | null;
      if (native && typeof native.getBounds === 'function') {
        const b = native.getBounds();
        bounds = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
      }
    }
    searchThisArea(bounds);
  }, [camera.center, mapInstance, searchThisArea]);

  // Map Click Handler (delegates to tool points if tool active, else POI clicks)
  const handleMapClick = React.useCallback(
    (e: any) => {
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
          addToolPoint(coord);
        }
      }
    },
    [addToolPoint]
  );

  // Initialize Places Layer when native MapLibre instance is available
  React.useEffect(() => {
    if (!mapInstance) return;
    const native = mapInstance.getNativeMap() as MapLibreMap | null;
    if (!native) return;

    const setupLayers = () => {
      try {
        const placesGeoJSON: GeoJSONFeatureCollection<GeoJSONPoint> = {
          type: 'FeatureCollection',
          features: liveSearchResults.map(({ place }) => ({
            type: 'Feature',
            id: place.id,
            properties: {
              id: place.id,
              name: place.name,
              category: place.category,
              rating: place.rating,
              address: place.address,
            },
            geometry: {
              type: 'Point',
              coordinates: place.coordinates,
            },
          })),
        };

        const existingSource = native.getSource('places-poi-source') as any;
        if (existingSource && typeof existingSource.setData === 'function') {
          existingSource.setData(placesGeoJSON);
        } else if (!existingSource) {
          native.addSource('places-poi-source', {
            type: 'geojson',
            data: placesGeoJSON as any,
          });

          // Outer halo
          native.addLayer({
            id: 'places-poi-halo',
            type: 'circle',
            source: 'places-poi-source',
            paint: {
              'circle-radius': 14,
              'circle-color': '#3b82f6',
              'circle-opacity': 0.25,
            },
          });

          // Inner marker pin
          native.addLayer({
            id: 'places-poi-circle',
            type: 'circle',
            source: 'places-poi-source',
            paint: {
              'circle-radius': 7,
              'circle-color': '#2563eb',
              'circle-stroke-width': 2.5,
              'circle-stroke-color': '#ffffff',
            },
          });

          // Click handler to open place details
          native.on('click', 'places-poi-circle', (e: { features?: Array<{ properties?: { id?: string } }> }) => {
            const feat = e.features?.[0];
            if (feat) {
              const placeId = feat.properties?.id;
              const found = liveSearchResults.find(({ place }) => place.id === placeId);
              if (found) {
                setSelectedPlace(found.place);
              }
            }
          });

          native.on('mouseenter', 'places-poi-circle', () => {
            if (native.getCanvas()) {
              native.getCanvas().style.cursor =
                useMapStore.getState().activeToolMode !== 'none' ? 'crosshair' : 'pointer';
            }
          });
          native.on('mouseleave', 'places-poi-circle', () => {
            if (native.getCanvas()) {
              native.getCanvas().style.cursor =
                useMapStore.getState().activeToolMode !== 'none' ? 'crosshair' : '';
            }
          });
        }
      } catch {
        // layer might already exist
      }
    };

    if (native.isStyleLoaded?.()) {
      setupLayers();
    } else {
      native.once?.('load', setupLayers);
      native.on?.('styledata', setupLayers);
    }

    return () => {
      native.off?.('styledata', setupLayers);
    };
  }, [mapInstance, liveSearchResults, setSelectedPlace]);

  // Synchronize Active Measurement / Drawing on Map
  React.useEffect(() => {
    if (!mapInstance) return;
    const native = mapInstance.getNativeMap() as MapLibreMap | null;
    if (!native) return;

    const syncToolLayers = () => {
      try {
        // Update map canvas cursor: crosshair when tool active, reset when none
        const canvas = native.getCanvas?.();
        if (canvas) {
          canvas.style.cursor = activeToolMode !== 'none' ? 'crosshair' : '';
        }

        if (activeToolMode !== 'none') {
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

          const featureCollection: GeoJSONFeatureCollection = {
            type: 'FeatureCollection',
            features,
          };

          const existingSource = native.getSource('tool-active-source') as any;
          if (existingSource && typeof existingSource.setData === 'function') {
            existingSource.setData(featureCollection);
          } else if (!existingSource) {
            native.addSource('tool-active-source', {
              type: 'geojson',
              data: featureCollection as any,
            });
          }

          // Fill for area / polygon
          if (!native.getLayer('tool-active-fill')) {
            native.addLayer({
              id: 'tool-active-fill',
              type: 'fill',
              source: 'tool-active-source',
              filter: ['==', '$type', 'Polygon'],
              paint: {
                'fill-color': '#10b981',
                'fill-opacity': 0.25,
              },
            });
          }

          // Line stroke
          if (!native.getLayer('tool-active-line')) {
            native.addLayer({
              id: 'tool-active-line',
              type: 'line',
              source: 'tool-active-source',
              filter: ['==', '$type', 'LineString'],
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#10b981',
                'line-width': 3,
                'line-dasharray': [2, 1.5],
              },
            });
          }

          // Active points (crisp green dots with white border)
          if (!native.getLayer('tool-active-points')) {
            native.addLayer({
              id: 'tool-active-points',
              type: 'circle',
              source: 'tool-active-source',
              filter: ['==', '$type', 'Point'],
              paint: {
                'circle-radius': 5,
                'circle-color': '#10b981',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
              },
            });
          }
        } else {
          if (native.getLayer?.('tool-active-points')) native.removeLayer('tool-active-points');
          if (native.getLayer?.('tool-active-line')) native.removeLayer('tool-active-line');
          if (native.getLayer?.('tool-active-fill')) native.removeLayer('tool-active-fill');
          if (native.getSource?.('tool-active-source')) native.removeSource('tool-active-source');
        }
      } catch {
        // ignore
      }
    };

    if (native.isStyleLoaded?.()) {
      syncToolLayers();
    } else {
      native.once?.('load', syncToolLayers);
      native.on?.('styledata', syncToolLayers);
    }

    return () => {
      native.off?.('styledata', syncToolLayers);
      try {
        const c = native.getCanvas?.();
        if (c && c.style.cursor === 'crosshair') {
          c.style.cursor = '';
        }
      } catch {
        // ignore
      }
    };
  }, [mapInstance, activeToolMode, toolPoints, activeStyle]);

  // Synchronize Directions Route Line
  React.useEffect(() => {
    if (!mapInstance) return;
    const native = mapInstance.getNativeMap() as MapLibreMap | null;
    if (!native) return;

    try {
      if (directions.isActive && directions.routeGeometry && directions.routeGeometry.length > 1) {
        const routeData: GeoJSONFeature<GeoJSONLineString> = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: directions.routeGeometry,
          },
        };

        const existingSource = native.getSource('active-route-source') as
          | { setData?: (data: unknown) => void }
          | undefined;

        if (existingSource && typeof existingSource.setData === 'function') {
          existingSource.setData(routeData);
        } else {
          native.addSource('active-route-source', {
            type: 'geojson',
            data: routeData as any,
          });

          // Glow outline
          native.addLayer({
            id: 'active-route-glow',
            type: 'line',
            source: 'active-route-source',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#60a5fa',
              'line-width': 8,
              'line-opacity': 0.4,
            },
          });

          // Main crisp line
          native.addLayer({
            id: 'active-route-line',
            type: 'line',
            source: 'active-route-source',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#2563eb',
              'line-width': 4.5,
              'line-opacity': 1,
            },
          });
        }
      } else {
        if (native.getLayer?.('active-route-line')) native.removeLayer('active-route-line');
        if (native.getLayer?.('active-route-glow')) native.removeLayer('active-route-glow');
        if (native.getSource?.('active-route-source')) native.removeSource('active-route-source');
      }
    } catch {
      // ignore
    }
  }, [mapInstance, directions.isActive, directions.routeGeometry]);

  // Automatically fit map camera to active directions route
  React.useEffect(() => {
    if (
      !mapInstance ||
      !directions.isActive ||
      !directions.routeGeometry ||
      directions.routeGeometry.length < 2
    ) {
      return;
    }

    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;

    for (const [lng, lat] of directions.routeGeometry) {
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }

    if (minLng !== Infinity && minLat !== Infinity) {
      mapInstance.fitBounds([minLng, minLat, maxLng, maxLat], {
        padding: { top: 80, bottom: 80, left: 340, right: 80 },
        duration: 1200,
      });
    }
  }, [mapInstance, directions.isActive, directions.routeGeometry]);

  // Synchronize overlay layers visibility & 3D buildings
  React.useEffect(() => {
    if (!mapInstance) return;
    const native = mapInstance.getNativeMap() as MapLibreMap | null;
    if (!native || !native.setLayoutProperty) return;

    overlays.forEach((overlay) => {
      if (overlay.id === 'places-layer') {
        const vis = overlay.visible ? 'visible' : 'none';
        if (native.getLayer?.('places-poi-circle')) {
          native.setLayoutProperty('places-poi-circle', 'visibility', vis);
        }
        if (native.getLayer?.('places-poi-halo')) {
          native.setLayoutProperty('places-poi-halo', 'visibility', vis);
        }
      }
    });
  }, [mapInstance, overlays]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-full w-full overflow-hidden bg-slate-100 dark:bg-slate-900"
    >
      <MapContainer
        mapStyle={activeStyle}
        initialCenter={camera.center}
        initialZoom={camera.zoom}
        initialPitch={camera.pitch}
        initialBearing={camera.bearing}
        showControls={false}
        showCoordinates={false}
        showScale={false}
        onMapReady={(renderer) => {
          setMapInstance(renderer);
        }}
        onCameraChange={handleCameraChange}
        onClick={handleMapClick}
        className="w-full h-full"
      />

      {/* Viewport Synchronization: Floating "Search this area" pill */}
      {isViewportOutOfSync && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 z-20 transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
            activeToolMode !== 'none' ? 'top-16' : 'top-4'
          }`}
        >
          <button
            type="button"
            onClick={handleSearchThisArea}
            className="flex items-center gap-2 rounded-full border border-black/5 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 px-4 py-2 text-xs font-semibold text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-white dark:hover:bg-slate-800 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <RotateCw className={`h-3.5 w-3.5 text-primary ${isSearching ? 'animate-spin' : ''}`} />
            <span>{t('search.searchThisArea')}</span>
          </button>
        </div>
      )}

      {/* Measurement & Drawing Interactive Floating Toolbar */}
      <MeasurementDrawingToolbar
        activeMode={activeToolMode}
        onModeChange={(mode) => setActiveToolMode(mode)}
        onClose={() => setActiveToolMode('none')}
        onClear={clearToolPoints}
        onFinish={() => {
          setActiveToolMode('none');
        }}
        canClear={toolPoints.length > 0}
        canFinish={
          ((activeToolMode === 'distance' || activeToolMode === 'line') && toolPoints.length >= 2) ||
          ((activeToolMode === 'area' || activeToolMode === 'polygon') && toolPoints.length >= 3) ||
          (activeToolMode === 'point' && toolPoints.length >= 1)
        }
        measurementValue={measurementValue}
        pointsCount={toolPoints.length}
        position="top-center"
        className="top-4"
        labels={{
          distance: t('measure.distance'),
          area: t('measure.area'),
          point: t('measure.point'),
          line: t('measure.line'),
          polygon: t('measure.polygon'),
          clickToStart: t('measure.clickToStart'),
          complete: t('measure.complete'),
          clear: t('measure.clear'),
          close: t('measure.close'),
        }}
      />

      {/* Floating Controls Overlay */}
      <MapControlsOverlay
        mapInstance={mapInstance}
        containerRef={containerRef}
        isLayerSelectorOpen={isLayerSelectorOpen}
        onToggleLayerSelector={onToggleLayerSelector}
      />
    </div>
  );
}
