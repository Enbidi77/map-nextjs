'use client';

import * as React from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { RotateCw, Search, Check, X } from 'lucide-react';
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

  // Persistent Saved User Features & Spatial Search
  const savedFeatures = useMapStore((state) => state.savedFeatures);
  const fetchMapFeatures = useMapStore((state) => state.fetchMapFeatures);
  const saveDrawnFeature = useMapStore((state) => state.saveDrawnFeature);
  const searchWithinPolygon = useMapStore((state) => state.searchWithinPolygon);

  const [isNamingDrawing, setIsNamingDrawing] = React.useState(false);
  const [drawingName, setDrawingName] = React.useState('');
  const [isSavingDrawing, setIsSavingDrawing] = React.useState(false);

  React.useEffect(() => {
    fetchMapFeatures();
  }, [fetchMapFeatures]);

  React.useEffect(() => {
    if (activeToolMode === 'none') {
      setIsNamingDrawing(false);
    }
  }, [activeToolMode]);

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

      if (overlay.id === 'user-features') {
        const vis = overlay.visible ? 'visible' : 'none';
        const opacity = overlay.opacity ?? 0.85;
        if (native.getLayer?.('saved-user-features-fill')) {
          native.setLayoutProperty('saved-user-features-fill', 'visibility', vis);
          native.setPaintProperty?.('saved-user-features-fill', 'fill-opacity', 0.25 * opacity);
        }
        if (native.getLayer?.('saved-user-features-line')) {
          native.setLayoutProperty('saved-user-features-line', 'visibility', vis);
          native.setPaintProperty?.('saved-user-features-line', 'line-opacity', opacity);
        }
        if (native.getLayer?.('saved-user-features-circle')) {
          native.setLayoutProperty('saved-user-features-circle', 'visibility', vis);
          native.setPaintProperty?.('saved-user-features-circle', 'circle-opacity', opacity);
          native.setPaintProperty?.('saved-user-features-circle', 'circle-stroke-opacity', opacity);
        }
      }
    });
  }, [mapInstance, overlays]);

  // Synchronize Saved User Features on MapLibre GeoJSON source/layers
  React.useEffect(() => {
    if (!mapInstance) return;
    const native = mapInstance.getNativeMap() as MapLibreMap | null;
    if (!native) return;

    const setupSavedFeaturesLayers = () => {
      try {
        const userOverlay = useMapStore
          .getState()
          .overlays.find((o) => o.id === 'user-features');
        const vis = userOverlay?.visible === false ? 'none' : 'visible';
        const opacity = userOverlay?.opacity ?? 0.85;

        const features: GeoJSONFeature[] = [];
        for (const item of savedFeatures) {
          const raw = item.geojson as Record<string, unknown> | undefined;
          if (!raw) continue;
          const geometry =
            raw.type === 'Feature' && raw.geometry
              ? (raw.geometry as GeoJSONFeature['geometry'])
              : (raw as unknown as GeoJSONFeature['geometry']);
          if (!geometry || typeof geometry !== 'object' || !('type' in geometry)) continue;

          features.push({
            type: 'Feature',
            id: item.id,
            properties: {
              id: item.id,
              name: item.name,
              featureType: item.featureType,
              ...(item.properties ?? {}),
            },
            geometry,
          });
        }

        const fc: GeoJSONFeatureCollection = {
          type: 'FeatureCollection',
          features,
        };

        const existingSource = native.getSource('saved-user-features') as
          | { setData?: (data: unknown) => void }
          | undefined;
        if (existingSource && typeof existingSource.setData === 'function') {
          existingSource.setData(fc);
        } else if (!existingSource) {
          native.addSource('saved-user-features', {
            type: 'geojson',
            data: fc as any,
          });
        }

        if (!native.getLayer('saved-user-features-fill')) {
          native.addLayer({
            id: 'saved-user-features-fill',
            type: 'fill',
            source: 'saved-user-features',
            filter: ['==', '$type', 'Polygon'],
            layout: { visibility: vis },
            paint: {
              'fill-color': '#8b5cf6',
              'fill-opacity': 0.25 * opacity,
            },
          });
        }

        if (!native.getLayer('saved-user-features-line')) {
          native.addLayer({
            id: 'saved-user-features-line',
            type: 'line',
            source: 'saved-user-features',
            filter: ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']],
            layout: { 'line-join': 'round', 'line-cap': 'round', visibility: vis },
            paint: {
              'line-color': '#7c3aed',
              'line-width': 2.5,
              'line-opacity': opacity,
            },
          });
        }

        if (!native.getLayer('saved-user-features-circle')) {
          native.addLayer({
            id: 'saved-user-features-circle',
            type: 'circle',
            source: 'saved-user-features',
            filter: ['==', '$type', 'Point'],
            layout: { visibility: vis },
            paint: {
              'circle-radius': 6,
              'circle-color': '#7c3aed',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': opacity,
              'circle-stroke-opacity': opacity,
            },
          });
        }
      } catch {
        // ignore if style is not ready yet
      }
    };

    if (native.isStyleLoaded?.()) {
      setupSavedFeaturesLayers();
    } else {
      native.once?.('load', setupSavedFeaturesLayers);
      native.on?.('styledata', setupSavedFeaturesLayers);
    }

    return () => {
      native.off?.('styledata', setupSavedFeaturesLayers);
    };
  }, [mapInstance, savedFeatures, activeStyle]);

  const handleOpenSavePopover = React.useCallback(() => {
    const label = activeToolMode !== 'none' ? `Drawn ${activeToolMode}` : 'Drawing';
    setDrawingName(label);
    setIsNamingDrawing(true);
  }, [activeToolMode]);

  const handleConfirmSaveDrawing = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSavingDrawing) return;
      setIsSavingDrawing(true);
      try {
        await saveDrawnFeature(drawingName.trim() || `Drawn ${activeToolMode}`);
        setIsNamingDrawing(false);
        setDrawingName('');
      } finally {
        setIsSavingDrawing(false);
      }
    },
    [activeToolMode, drawingName, isSavingDrawing, saveDrawnFeature]
  );

  const handleSearchInsideArea = React.useCallback(() => {
    if (toolPoints.length < 3) return;
    const first = toolPoints[0]!;
    const last = toolPoints[toolPoints.length - 1]!;
    const isClosed = first[0] === last[0] && first[1] === last[1];
    const ring = isClosed ? [...toolPoints] : [...toolPoints, first];
    searchWithinPolygon([ring], useMapStore.getState().selectedCategory);
  }, [searchWithinPolygon, toolPoints]);

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
        onFinish={handleOpenSavePopover}
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

      {/* Inline Save Drawing Name Popover */}
      {isNamingDrawing && (
        <form
          onSubmit={handleConfirmSaveDrawing}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 px-3 py-2 shadow-xl backdrop-blur-md"
        >
          <input
            type="text"
            value={drawingName}
            onChange={(e) => setDrawingName(e.target.value)}
            placeholder="Name this drawing..."
            autoFocus
            className="h-7 w-44 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={isSavingDrawing}
            className="inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            <span>{isSavingDrawing ? 'Saving...' : 'Save'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNamingDrawing(false)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            aria-label="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      )}

      {/* Floating "Search inside area" pill when drawing a polygon/area >= 3 points */}
      {(activeToolMode === 'polygon' || activeToolMode === 'area') && toolPoints.length >= 3 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <button
            type="button"
            onClick={handleSearchInsideArea}
            className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search inside area</span>
          </button>
        </div>
      )}

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
