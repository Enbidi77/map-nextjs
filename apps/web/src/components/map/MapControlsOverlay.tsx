'use client';

import * as React from 'react';
import {
  FloatingMapControls,
  CoordinateBadge,
  LayerSelector,
  DEFAULT_MAP_STYLES,
} from '@modern-maps/ui';
import { useMapStore } from '../../stores/useMapStore';
import type { MapRenderer } from '@modern-maps/map-engine';
import type { Coordinate } from '@modern-maps/types';

export interface MapControlsOverlayProps {
  mapInstance: MapRenderer | null;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  isLayerSelectorOpen: boolean;
  onToggleLayerSelector: () => void;
}

export function MapControlsOverlay({
  mapInstance,
  containerRef,
  isLayerSelectorOpen,
  onToggleLayerSelector,
}: MapControlsOverlayProps) {
  const camera = useMapStore((state) => state.camera);
  const setCamera = useMapStore((state) => state.setCamera);
  const activeStyle = useMapStore((state) => state.activeStyle);
  const setActiveStyle = useMapStore((state) => state.setActiveStyle);
  const overlays = useMapStore((state) => state.overlays);
  const toggleOverlay = useMapStore((state) => state.toggleOverlay);
  const setOverlayOpacity = useMapStore((state) => state.setOverlayOpacity);
  const isLocating = useMapStore((state) => state.isLocating);
  const setIsLocating = useMapStore((state) => state.setIsLocating);
  const setUserLocation = useMapStore((state) => state.setUserLocation);
  const userLocation = useMapStore((state) => state.userLocation);

  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Monitor fullscreen change events
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Zoom handlers
  const handleZoomIn = () => {
    if (mapInstance) {
      mapInstance.easeTo({ zoom: mapInstance.getCameraState().zoom + 1, duration: 300 });
    } else {
      setCamera((prev) => ({ ...prev, zoom: Math.min(22, prev.zoom + 1) }));
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      mapInstance.easeTo({ zoom: Math.max(1, mapInstance.getCameraState().zoom - 1), duration: 300 });
    } else {
      setCamera((prev) => ({ ...prev, zoom: Math.max(1, prev.zoom - 1) }));
    }
  };

  // Bearing / Compass reset
  const handleResetBearing = () => {
    if (mapInstance) {
      mapInstance.resetNorth();
    } else {
      setCamera((prev) => ({ ...prev, bearing: 0 }));
    }
  };

  // 3D / Pitch toggle
  const is3D = camera.pitch > 10;
  const handleToggle3D = () => {
    const targetPitch = is3D ? 0 : 60;
    if (mapInstance) {
      mapInstance.easeTo({ pitch: targetPitch, duration: 600 });
    } else {
      setCamera((prev) => ({ ...prev, pitch: targetPitch }));
    }
  };

  // Geolocation with browser permissions & fallbacks
  const handleGeolocate = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coord: Coordinate = [pos.coords.longitude, pos.coords.latitude];
        setUserLocation(coord);
        setIsLocating(false);

        if (mapInstance) {
          mapInstance.flyTo({
            center: coord,
            zoom: 15,
            duration: 1500,
          });
        } else {
          setCamera({
            center: coord,
            zoom: 15,
          });
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setIsLocating(false);
        // Fallback to San Francisco downtown if permission denied
        const fallbackSF: Coordinate = [-122.4194, 37.7749];
        setUserLocation(fallbackSF);
        if (mapInstance) {
          mapInstance.flyTo({ center: fallbackSF, zoom: 14, duration: 1000 });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    const target = containerRef?.current ?? document.documentElement;
    if (!document.fullscreenElement) {
      target.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Scale approximation text (e.g. 500m, 1km, 5km)
  const scaleText = React.useMemo(() => {
    const z = Math.round(camera.zoom);
    if (z >= 17) return '50 m';
    if (z >= 15) return '200 m';
    if (z >= 13) return '500 m';
    if (z >= 11) return '2 km';
    if (z >= 9) return '10 km';
    if (z >= 7) return '50 km';
    if (z >= 5) return '200 km';
    return '1000 km';
  }, [camera.zoom]);

  const [lng, lat] = camera.center;

  return (
    <>
      {/* Floating Control Buttons (Top-Right) */}
      <FloatingMapControls
        position="top-right"
        className="top-16 right-4 sm:top-18"
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        bearing={camera.bearing}
        onResetBearing={handleResetBearing}
        is3D={is3D}
        onToggle3D={handleToggle3D}
        isLocating={isLocating}
        isLocationActive={!!userLocation}
        onGeolocate={handleGeolocate}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        isLayerMenuOpen={isLayerSelectorOpen}
        onToggleLayerMenu={onToggleLayerSelector}
        showLayerToggle={true}
      />

      {/* Layer & Style Picker Popover (positioned next to controls) */}
      {isLayerSelectorOpen && (
        <div className="absolute top-16 right-16 z-30 animate-in fade-in zoom-in-95 duration-200">
          <LayerSelector
            styles={DEFAULT_MAP_STYLES}
            activeStyleId={activeStyle}
            onSelectStyle={(styleId) => {
              setActiveStyle(styleId);
            }}
            overlays={overlays}
            onToggleOverlay={(id, visible) => toggleOverlay(id, visible)}
            onOverlayOpacityChange={(id, opacity) => setOverlayOpacity(id, opacity)}
            showOverlays={true}
          />
        </div>
      )}

      {/* Coordinate & Scale Readout Badge (Bottom-Left) */}
      <div className="absolute bottom-5 left-4 z-20 pointer-events-auto">
        <CoordinateBadge
          longitude={lng}
          latitude={lat}
          zoom={camera.zoom}
          pitch={camera.pitch}
          bearing={camera.bearing}
          scaleText={scaleText}
          format="decimal"
          showCopyButton={true}
        />
      </div>
    </>
  );
}
