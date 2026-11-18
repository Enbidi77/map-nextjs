import { describe, it, expect, vi } from 'vitest';
import { MapLibreRenderer } from '../src/renderer/MapLibreRenderer.js';
import { MockMapLibreMap } from '@modern-maps/testing';

describe('MapLibreRenderer', () => {
  it('correctly wraps MockMapLibreMap and reports loaded status', async () => {
    const mockMap = new MockMapLibreMap({
      center: [-122.4194, 37.7749],
      zoom: 12,
      pitch: 0,
      bearing: 0,
    });

    const renderer = new MapLibreRenderer(mockMap);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(renderer.isLoaded()).toBe(true);

    const camera = renderer.getCameraState();
    expect(camera.center).toEqual([-122.4194, 37.7749]);
    expect(camera.zoom).toBe(12);
    expect(camera.pitch).toBe(0);
    expect(camera.bearing).toBe(0);
  });

  it('updates camera state on flyTo, easeTo, jumpTo, setCameraState', () => {
    const mockMap = new MockMapLibreMap({ center: [0, 0], zoom: 2 });
    const renderer = new MapLibreRenderer(mockMap);

    renderer.flyTo({ center: [10, 20], zoom: 8, pitch: 45, bearing: 90 });
    let camera = renderer.getCameraState();
    expect(camera.center).toEqual([10, 20]);
    expect(camera.zoom).toBe(8);
    expect(camera.pitch).toBe(45);
    expect(camera.bearing).toBe(90);

    renderer.easeTo({ center: [30, 40], zoom: 10 });
    camera = renderer.getCameraState();
    expect(camera.center).toEqual([30, 40]);
    expect(camera.zoom).toBe(10);

    renderer.jumpTo({ center: [-74.006, 40.7128], zoom: 14 });
    camera = renderer.getCameraState();
    expect(camera.center).toEqual([-74.006, 40.7128]);
    expect(camera.zoom).toBe(14);

    renderer.setCameraState({ pitch: 30, bearing: 180 });
    camera = renderer.getCameraState();
    expect(camera.pitch).toBe(30);
    expect(camera.bearing).toBe(180);
  });

  it('correctly toggles 3D pitch and resets bearing to north', () => {
    const mockMap = new MockMapLibreMap({ center: [0, 0], zoom: 5, pitch: 0, bearing: 45 });
    const renderer = new MapLibreRenderer(mockMap);

    // Toggle 3D from 0 deg -> 60 deg
    const pitch1 = renderer.toggle3D(60);
    expect(pitch1).toBe(60);
    expect(renderer.getPitch()).toBe(60);

    // Toggle 3D from 60 deg -> 0 deg
    const pitch2 = renderer.toggle3D(60);
    expect(pitch2).toBe(0);
    expect(renderer.getPitch()).toBe(0);

    // Reset North
    expect(renderer.getBearing()).toBe(45);
    renderer.resetNorth();
    expect(renderer.getBearing()).toBe(0);
  });

  it('fits bounds properly', () => {
    const mockMap = new MockMapLibreMap({ center: [0, 0], zoom: 1 });
    const renderer = new MapLibreRenderer(mockMap);

    renderer.fitBounds([-122.5, 37.7, -122.3, 37.9]);
    const camera = renderer.getCameraState();
    expect(camera.center[0]).toBeCloseTo(-122.4, 2);
    expect(camera.center[1]).toBeCloseTo(37.8, 2);
  });

  it('handles event listeners properly', () => {
    const mockMap = new MockMapLibreMap();
    const renderer = new MapLibreRenderer(mockMap);

    const moveListener = vi.fn();
    renderer.on('move', moveListener);

    mockMap.fire('move', { type: 'move' });
    expect(moveListener).toHaveBeenCalledTimes(1);

    renderer.off('move', moveListener);
    mockMap.fire('move', { type: 'move' });
    expect(moveListener).toHaveBeenCalledTimes(1);
  });

  it('safely destroys map instance', async () => {
    const mockMap = new MockMapLibreMap();
    const renderer = new MapLibreRenderer(mockMap);
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(renderer.isLoaded()).toBe(true);
    renderer.destroy();
    expect(renderer.getNativeMap()).toBeNull();
  });

  it('does not pass easing: undefined to map on easeTo or flyTo', () => {
    const mockMap = new MockMapLibreMap();
    const easeToSpy = vi.spyOn(mockMap, 'easeTo');
    const flyToSpy = vi.spyOn(mockMap, 'flyTo');
    const renderer = new MapLibreRenderer(mockMap);

    renderer.easeTo({ zoom: 5, duration: 300 });
    expect(easeToSpy).toHaveBeenCalled();
    const easeCallArg = easeToSpy.mock.calls[0]![0];
    expect(easeCallArg).not.toHaveProperty('easing');
    expect('easing' in easeCallArg).toBe(false);

    renderer.flyTo({ center: [10, 10], duration: 500 });
    expect(flyToSpy).toHaveBeenCalled();
    const flyCallArg = flyToSpy.mock.calls[0]![0];
    expect(flyCallArg).not.toHaveProperty('easing');
    expect('easing' in flyCallArg).toBe(false);

    // With explicit valid easing function
    const customEasing = (t: number) => t * t;
    renderer.easeTo({ zoom: 6, easing: customEasing });
    const easeCustomArg = easeToSpy.mock.calls[1]![0];
    expect(easeCustomArg).toHaveProperty('easing', customEasing);
  });
});
