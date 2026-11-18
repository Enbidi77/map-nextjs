import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  MapProvider,
  useMapInstance,
  useCamera,
  MapErrorBoundary,
  FloatingControls,
  CoordinateBadge,
  MeasurementToolbar,
  DrawingToolbar,
  Building3DToggle,
  type MapContextValue,
} from '../src/react/index.js';
import { MapLibreRenderer } from '../src/renderer/MapLibreRenderer.js';
import { MapControlsController } from '../src/controls/controls.js';
import { LayerManager } from '../src/layers/LayerManager.js';
import { MarkerManager } from '../src/layers/MarkerManager.js';
import { MockMapLibreMap } from '@modern-maps/testing';

// Test consumer component
const TestConsumer: React.FC = () => {
  const { isLoaded } = useMapInstance();
  const { camera, zoomIn, toggle3D } = useCamera();

  return (
    <div>
      <span data-testid="loaded">{isLoaded ? 'loaded' : 'not-loaded'}</span>
      <span data-testid="zoom">{camera.zoom}</span>
      <span data-testid="pitch">{camera.pitch}</span>
      <button data-testid="btn-zoom" onClick={() => zoomIn(1)}>
        Zoom
      </button>
      <button data-testid="btn-3d" onClick={() => toggle3D(60)}>
        3D
      </button>
    </div>
  );
};

describe('React Integration', () => {
  it('provides map context and hook values to consumers', () => {
    const mockMap = new MockMapLibreMap({ center: [-122.4, 37.7], zoom: 12, pitch: 0 });
    const renderer = new MapLibreRenderer(mockMap);
    const controls = new MapControlsController(renderer);
    const layerManager = new LayerManager(mockMap);
    const markerManager = new MarkerManager(mockMap);

    const contextValue: MapContextValue = {
      map: renderer,
      isLoaded: true,
      camera: renderer.getCameraState(),
      layerManager,
      markerManager,
      controls,
      error: null,
    };

    render(
      <MapProvider value={contextValue}>
        <TestConsumer />
        <FloatingControls />
        <CoordinateBadge />
      </MapProvider>
    );

    expect(screen.getByTestId('loaded').textContent).toBe('loaded');
    expect(screen.getByTestId('zoom').textContent).toBe('12');
    expect(screen.getByTestId('pitch').textContent).toBe('0');
  });

  it('renders MeasurementToolbar, DrawingToolbar, and Building3DToggle', () => {
    const mockMap = new MockMapLibreMap();
    const renderer = new MapLibreRenderer(mockMap);
    const controls = new MapControlsController(renderer);
    const layerManager = new LayerManager(mockMap);
    const markerManager = new MarkerManager(mockMap);

    const contextValue: MapContextValue = {
      map: renderer,
      isLoaded: true,
      camera: renderer.getCameraState(),
      layerManager,
      markerManager,
      controls,
      error: null,
    };

    render(
      <MapProvider value={contextValue}>
        <MeasurementToolbar />
        <DrawingToolbar />
        <Building3DToggle />
      </MapProvider>
    );

    expect(screen.getByText(/Distance/i)).toBeDefined();
    expect(screen.getByText(/Area/i)).toBeDefined();
    expect(screen.getByText(/Point/i)).toBeDefined();
    expect(screen.getByText(/Line/i)).toBeDefined();
    expect(screen.getByText(/Polygon/i)).toBeDefined();
    expect(screen.getByText(/3D Buildings/i)).toBeDefined();
  });

  it('catches render errors in MapErrorBoundary and displays fallback', () => {
    const ProblematicComponent: React.FC = () => {
      throw new Error('WebGL context lost');
    };

    // Suppress console.error in this error test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MapErrorBoundary>
        <ProblematicComponent />
      </MapErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Map Render Error')).toBeDefined();
    expect(screen.getByText('WebGL context lost')).toBeDefined();

    consoleSpy.mockRestore();
  });
});
