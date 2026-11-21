import React, { useEffect, useRef, useState, useMemo } from 'react';
import type {
  CameraState,
  Coordinate,
  MapInteractionEvent,
  MapRendererOptions,
  MapStyleId,
} from '../types.js';
import type { MapRenderer } from '../renderer/MapRenderer.js';
import { MapLibreRenderer } from '../renderer/MapLibreRenderer.js';
import { LayerManager } from '../layers/LayerManager.js';
import { MarkerManager } from '../layers/MarkerManager.js';
import { MapControlsController } from '../controls/controls.js';
import { MapProvider, type MapContextValue } from './MapContext.js';
import { MapErrorBoundary } from './ErrorBoundary.js';
import { FloatingControls } from './components/FloatingControls.js';
import { CoordinateBadge } from './components/CoordinateBadge.js';

export interface MapContainerProps {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  mapStyle?: MapStyleId | string | object;
  initialCenter?: Coordinate;
  initialZoom?: number;
  initialPitch?: number;
  initialBearing?: number;
  interactive?: boolean;
  minZoom?: number;
  maxZoom?: number;
  showControls?: boolean;
  showScale?: boolean;
  showCoordinates?: boolean;
  onMapReady?: (map: MapRenderer) => void;
  onCameraChange?: (camera: CameraState) => void;
  onClick?: (event: MapInteractionEvent) => void;
  loadingFallback?: React.ReactNode;
  errorFallback?: (error: Error, reset: () => void) => React.ReactNode;
  children?: React.ReactNode;
  customRenderer?: MapRenderer;
}

const MapContainerInner: React.FC<MapContainerProps> = ({
  id = 'modern-map-canvas',
  className,
  style,
  mapStyle = 'streets',
  initialCenter = [-122.4194, 37.7749], // San Francisco default
  initialZoom = 12,
  initialPitch = 0,
  initialBearing = 0,
  interactive = true,
  minZoom,
  maxZoom,
  showControls = true,
  showScale = true,
  showCoordinates = true,
  onMapReady,
  onCameraChange,
  onClick,
  loadingFallback,
  children,
  customRenderer,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<MapRenderer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [camera, setCamera] = useState<CameraState>({
    center: initialCenter,
    zoom: initialZoom,
    pitch: initialPitch,
    bearing: initialBearing,
  });
  const [error, setError] = useState<Error | null>(null);

  const [layerManager, setLayerManager] = useState<LayerManager | null>(null);
  const [markerManager, setMarkerManager] = useState<MarkerManager | null>(null);
  const [controls, setControls] = useState<MapControlsController | null>(null);

  // Keep latest callbacks in refs to prevent stale closure bugs
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  const onCameraChangeRef = useRef(onCameraChange);
  onCameraChangeRef.current = onCameraChange;

  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    onCameraChangeRef.current = onCameraChange;
  }, [onCameraChange]);

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    const renderer = customRenderer ?? new MapLibreRenderer();

    const init = async () => {
      try {
        const options: MapRendererOptions = {
          container: containerRef.current!,
          style: mapStyle,
          center: initialCenter,
          zoom: initialZoom,
          pitch: initialPitch,
          bearing: initialBearing,
          interactive,
          minZoom,
          maxZoom,
          fallbackStyle: 'streets',
        };

        await renderer.initialize(options);

        if (!isMounted) {
          renderer.destroy();
          return;
        }

        const native = renderer.getNativeMap();
        const lManager = new LayerManager(native);
        const mManager = new MarkerManager(native);
        const ctrl = new MapControlsController(renderer);

        setMapInstance(renderer);
        setLayerManager(lManager);
        setMarkerManager(mManager);
        setControls(ctrl);
        setIsLoaded(true);

        // Listen for camera motion
        const handleCameraUpdate = () => {
          if (!isMounted) return;
          const currentCam = renderer.getCameraState();
          setCamera(currentCam);
          onCameraChangeRef.current?.(currentCam);
        };

        renderer.on('move', handleCameraUpdate);
        renderer.on('zoom', handleCameraUpdate);
        renderer.on('pitch', handleCameraUpdate);
        renderer.on('rotate', handleCameraUpdate);

        // Listen for map clicks
        renderer.on('click', (e: any) => {
          if (!isMounted || !onClickRef.current) return;
          const point = e.point ?? { x: 0, y: 0 };
          const coordinate: Coordinate = e.lngLat
            ? [e.lngLat.lng, e.lngLat.lat]
            : renderer.unproject(point);

          onClickRef.current({
            type: 'click',
            coordinate,
            point,
            features: e.features,
            originalEvent: e.originalEvent,
          });
        });

        onMapReadyRef.current?.(renderer);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      renderer.destroy();
      setMapInstance(null);
      setIsLoaded(false);
      setLayerManager(null);
      setMarkerManager(null);
      setControls(null);
    };
  }, [mapStyle]);

  const contextValue: MapContextValue = useMemo(
    () => ({
      map: mapInstance,
      isLoaded,
      camera,
      layerManager,
      markerManager,
      controls,
      error,
    }),
    [mapInstance, isLoaded, camera, layerManager, markerManager, controls, error]
  );

  return (
    <MapProvider value={contextValue}>
      <div
        className={`modern-map-container ${className ?? ''}`}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: '#f1f5f9',
          ...style,
        }}
      >
        {/* Map Canvas Mount */}
        <div
          ref={containerRef}
          id={id}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />

        {/* Loading Spinner / Overlay */}
        {!isLoaded && !error && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(248, 250, 252, 0.75)',
              backdropFilter: 'blur(2px)',
              zIndex: 5,
            }}
          >
            {loadingFallback ?? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#475569',
                  fontSize: '13px',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid #e2e8f0',
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span>Loading map...</span>
              </div>
            )}
          </div>
        )}

        {/* Built-in Floating Controls */}
        {showControls && isLoaded && <FloatingControls position="top-right" />}

        {/* Coordinate & Scale Readout */}
        {(showCoordinates || showScale) && isLoaded && (
          <CoordinateBadge
            position="bottom-left"
            showCoordinates={showCoordinates}
            showScale={showScale}
          />
        )}

        {/* Layer / Marker / Consumer children */}
        {children}
      </div>
    </MapProvider>
  );
};

export const MapContainer: React.FC<MapContainerProps> = (props) => {
  return (
    <MapErrorBoundary fallback={props.errorFallback}>
      <MapContainerInner {...props} />
    </MapErrorBoundary>
  );
};
