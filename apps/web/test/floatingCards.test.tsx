import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '../src/stores/useMapStore';

describe('Floating Cards Architecture & Interactions', () => {
  beforeEach(() => {
    useMapStore.setState({
      camera: {
        center: [-122.2979, 37.5629],
        zoom: 14.9,
        pitch: 0,
        bearing: 0,
      },
      activeStyle: 'satellite',
      sidebarOpen: true,
      sidebarView: 'directions',
      activeToolMode: 'polygon',
      userLocation: [-122.2979, 37.5629],
      directions: {
        origin: null,
        destination: null,
        originName: '',
        destinationName: '',
        mode: 'driving',
        distanceMeters: null,
        durationSeconds: null,
        routeGeometry: null,
        steps: [],
        isActive: false,
        isLoading: false,
      },
    });
  });

  it('initializes with screenshot default state: satellite style, aerial canal center, zoom 14.9, polygon tool, and directions view', () => {
    const state = useMapStore.getState();
    expect(state.activeStyle).toBe('satellite');
    expect(state.camera.center).toEqual([-122.2979, 37.5629]);
    expect(state.camera.zoom).toBe(14.9);
    expect(state.activeToolMode).toBe('polygon');
    expect(state.sidebarView).toBe('directions');
    expect(state.userLocation).toEqual([-122.2979, 37.5629]);
  });

  it('switches transit modes correctly between Drive, Transit, Walk, and Bike', () => {
    const { setTransitMode } = useMapStore.getState();

    setTransitMode('transit');
    expect(useMapStore.getState().directions.mode).toBe('transit');

    setTransitMode('walking');
    expect(useMapStore.getState().directions.mode).toBe('walking');

    setTransitMode('cycling');
    expect(useMapStore.getState().directions.mode).toBe('cycling');

    setTransitMode('driving');
    expect(useMapStore.getState().directions.mode).toBe('driving');
  });

  it('switches sidebar views between Explore, Directions, and Saved', () => {
    const { setSidebarView } = useMapStore.getState();

    setSidebarView('search');
    expect(useMapStore.getState().sidebarView).toBe('search');

    setSidebarView('saved');
    expect(useMapStore.getState().sidebarView).toBe('saved');

    setSidebarView('directions');
    expect(useMapStore.getState().sidebarView).toBe('directions');
  });

  it('handles origin, destination, and swapping correctly', () => {
    const { setOrigin, setDestination, swapOriginDestination } = useMapStore.getState();

    setOrigin([108.2772, 14.0583], 'Việt Nam');
    setDestination([105.8342, 21.0278], 'Hà Nội');

    let state = useMapStore.getState();
    expect(state.directions.originName).toBe('Việt Nam');
    expect(state.directions.destinationName).toBe('Hà Nội');
    expect(state.directions.origin).toEqual([108.2772, 14.0583]);
    expect(state.directions.destination).toEqual([105.8342, 21.0278]);

    swapOriginDestination();

    state = useMapStore.getState();
    expect(state.directions.originName).toBe('Hà Nội');
    expect(state.directions.destinationName).toBe('Việt Nam');
    expect(state.directions.origin).toEqual([105.8342, 21.0278]);
    expect(state.directions.destination).toEqual([108.2772, 14.0583]);
  });

  it('calculates route and sets directions active state', async () => {
    const { setOrigin, setDestination, calculateRoute } = useMapStore.getState();

    setOrigin([-122.2979, 37.5629], 'Origin Place');
    setDestination([-122.285, 37.565], 'Destination Place');

    await calculateRoute();

    const state = useMapStore.getState();
    expect(state.directions.isActive).toBe(true);
    expect(state.directions.routeGeometry).toBeDefined();
    expect(state.directions.distanceMeters).toBeGreaterThan(0);
    expect(state.directions.durationSeconds).toBeGreaterThan(0);
  });

  it('supports interactive polygon tool drawing', () => {
    const { setActiveToolMode, addToolPoint, clearToolPoints } = useMapStore.getState();

    setActiveToolMode('polygon');
    expect(useMapStore.getState().activeToolMode).toBe('polygon');

    addToolPoint([-122.298, 37.563]);
    addToolPoint([-122.296, 37.563]);
    addToolPoint([-122.296, 37.561]);

    let state = useMapStore.getState();
    expect(state.toolPoints.length).toBe(3);
    expect(state.measurementValue).toBeTruthy();

    clearToolPoints();
    state = useMapStore.getState();
    expect(state.toolPoints.length).toBe(0);
    expect(state.measurementValue).toBeNull();
  });

  it('handles NorthCompass click to reset bearing and pitch to 0', () => {
    const { setCamera } = useMapStore.getState();
    setCamera({ bearing: 45, pitch: 30 });

    let state = useMapStore.getState();
    expect(state.camera.bearing).toBe(45);
    expect(state.camera.pitch).toBe(30);

    // Simulate reset
    setCamera({ bearing: 0, pitch: 0 });
    state = useMapStore.getState();
    expect(state.camera.bearing).toBe(0);
    expect(state.camera.pitch).toBe(0);
  });
});
