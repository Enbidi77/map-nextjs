import { describe, it, expect, vi } from 'vitest';
import { MapControlsController } from '../src/controls/controls.js';
import { calculateScale, getMetersPerPixel } from '../src/controls/scale.js';
import { GeolocationHandler } from '../src/controls/geolocation.js';
import { MapLibreRenderer } from '../src/renderer/MapLibreRenderer.js';
import { MockMapLibreMap } from '@modern-maps/testing';

describe('MapControlsController', () => {
  it('zooms in and out smoothly', () => {
    const mockMap = new MockMapLibreMap({ center: [0, 0], zoom: 10 });
    const renderer = new MapLibreRenderer(mockMap);
    const controller = new MapControlsController(renderer);

    controller.zoomIn(1);
    expect(renderer.getCameraState().zoom).toBe(11);

    controller.zoomOut(2);
    expect(renderer.getCameraState().zoom).toBe(9);
  });

  it('resets bearing and toggles 3D pitch', () => {
    const mockMap = new MockMapLibreMap({ center: [0, 0], zoom: 5, bearing: 60, pitch: 0 });
    const renderer = new MapLibreRenderer(mockMap);
    const controller = new MapControlsController(renderer);

    controller.resetBearing();
    expect(renderer.getCameraState().bearing).toBe(0);

    const pitch1 = controller.togglePitch(60);
    expect(pitch1).toBe(60);
    expect(renderer.getCameraState().pitch).toBe(60);

    const pitch2 = controller.togglePitch(60);
    expect(pitch2).toBe(0);
    expect(renderer.getCameraState().pitch).toBe(0);
  });

  it('formats coordinates correctly in DD and DMS', () => {
    const mockMap = new MockMapLibreMap();
    const renderer = new MapLibreRenderer(mockMap);
    const controller = new MapControlsController(renderer);

    const dd = controller.formatCoord([-122.4194, 37.7749], 'dd');
    expect(dd).toBe('37.7749°, -122.4194°');

    const dms = controller.formatCoord([-122.4194, 37.7749], 'dms');
    expect(dms).toContain('37°');
    expect(dms).toContain('122°');
  });
});

describe('Scale calculations', () => {
  it('calculates meters per pixel accurately according to latitude and zoom', () => {
    // Equator at zoom 0
    const mppEquatorZ0 = getMetersPerPixel(0, 0);
    expect(mppEquatorZ0).toBeCloseTo(156543, -1);

    // Zoom 1 is half the meters per pixel of zoom 0
    const mppEquatorZ1 = getMetersPerPixel(0, 1);
    expect(mppEquatorZ1).toBeCloseTo(mppEquatorZ0 / 2, 0);

    // 60 degrees latitude has cos(60) = 0.5 of equator
    const mpp60Lat = getMetersPerPixel(60, 0);
    expect(mpp60Lat).toBeCloseTo(mppEquatorZ0 * 0.5, 0);
  });

  it('calculates human-readable scale bar distances in metric and imperial', () => {
    const scale = calculateScale(37.7749, 14, 100);
    expect(scale.metricDistance).toBeGreaterThan(0);
    expect(scale.metricLabel).toMatch(/\d+\s*(m|km)/);
    expect(scale.metricWidthPx).toBeGreaterThanOrEqual(20);
    expect(scale.imperialLabel).toMatch(/\d+(\.\d+)?\s*(ft|mi)/);
  });
});

describe('GeolocationHandler', () => {
  it('handles simulated geolocation position success', async () => {
    const mockCoords = {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 15,
      altitude: null,
      heading: null,
      speed: null,
    };

    (globalThis as any).navigator = {
      geolocation: {
        getCurrentPosition: (success: (pos: any) => void) => {
          success({
            coords: mockCoords,
            timestamp: Date.now(),
          });
        },
        watchPosition: vi.fn(),
        clearWatch: vi.fn(),
      },
    };

    const mockMap = new MockMapLibreMap();
    const renderer = new MapLibreRenderer(mockMap);
    const handler = new GeolocationHandler(renderer, { flyToUser: true, zoomLevel: 16 });

    handler.setMap(renderer);

    const pos = await handler.locate();
    expect(pos.coordinate).toEqual([-122.4194, 37.7749]);
    expect(handler.getStatus()).toBe('located');
    expect(renderer.getCameraState().center).toEqual([-122.4194, 37.7749]);
  });
});
