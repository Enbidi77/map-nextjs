import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMapStore } from '../src/stores/useMapStore';
import { MOCK_PLACES } from '../src/data/mockPlaces';

describe('useMapStore', () => {
  beforeEach(() => {
    useMapStore.setState({
      camera: {
        center: [-122.4194, 37.7749],
        zoom: 12,
        pitch: 0,
        bearing: 0,
      },
      activeStyle: 'streets',
      sidebarOpen: true,
      sidebarWidth: 380,
      sidebarView: 'search',
      searchQuery: '',
      selectedCategory: null,
      selectedPlace: null,
      savedPlaces: [MOCK_PLACES[0]!],
      activeToolMode: 'none',
      toolPoints: [],
      measurementValue: null,
    });
  });

  it('updates camera state correctly', () => {
    const { setCamera } = useMapStore.getState();
    setCamera({ zoom: 15, pitch: 45 });

    const state = useMapStore.getState();
    expect(state.camera.zoom).toBe(15);
    expect(state.camera.pitch).toBe(45);
    expect(state.camera.center).toEqual([-122.4194, 37.7749]);
  });

  it('switches map styles', () => {
    const { setActiveStyle } = useMapStore.getState();
    setActiveStyle('satellite');

    expect(useMapStore.getState().activeStyle).toBe('satellite');
  });

  it('controls sidebar visibility and width constraints', () => {
    const { toggleSidebar, setSidebarWidth } = useMapStore.getState();
    toggleSidebar();
    expect(useMapStore.getState().sidebarOpen).toBe(false);

    toggleSidebar();
    expect(useMapStore.getState().sidebarOpen).toBe(true);

    // Minimum width clamp (280)
    setSidebarWidth(100);
    expect(useMapStore.getState().sidebarWidth).toBe(280);

    // Maximum width clamp (600)
    setSidebarWidth(800);
    expect(useMapStore.getState().sidebarWidth).toBe(600);
  });

  it('handles place selection and auto-focuses camera', () => {
    const { setSelectedPlace } = useMapStore.getState();
    const place = MOCK_PLACES[1]!; // Fisherman's Wharf
    setSelectedPlace(place);

    const state = useMapStore.getState();
    expect(state.selectedPlace).toEqual(place);
    expect(state.sidebarView).toBe('place');
    expect(state.sidebarOpen).toBe(true);
    expect(state.camera.center).toEqual(place.coordinates);
  });

  it('toggles bookmarks in saved places', () => {
    const { toggleSavePlace, isPlaceSaved } = useMapStore.getState();
    const place = MOCK_PLACES[2]!; // Alcatraz Island

    expect(isPlaceSaved(place.id)).toBe(false);

    toggleSavePlace(place);
    expect(isPlaceSaved(place.id)).toBe(true);

    toggleSavePlace(place);
    expect(isPlaceSaved(place.id)).toBe(false);
  });

  it('calculates realistic directions and turn-by-turn guidance', async () => {
    const { setOrigin, setDestination, calculateRoute, clearDirections } = useMapStore.getState();
    const origin = MOCK_PLACES[0]!.coordinates; // Golden Gate Bridge
    const dest = MOCK_PLACES[5]!.coordinates;   // Ferry Building

    setOrigin(origin, 'Golden Gate Bridge');
    setDestination(dest, 'Ferry Building');
    await calculateRoute();

    const { directions } = useMapStore.getState();
    expect(directions.isActive).toBe(true);
    expect(directions.distanceMeters).toBeGreaterThan(1000);
    expect(directions.durationSeconds).toBeGreaterThan(60);
    expect(directions.routeGeometry?.length).toBeGreaterThan(2);
    expect(directions.steps.length).toBeGreaterThanOrEqual(2);

    clearDirections();
    expect(useMapStore.getState().directions.isActive).toBe(false);
  });

  it('handles API route format with distanceMeters/durationSeconds without producing NaN', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        routes: [
          {
            distanceMeters: 4500000,
            durationSeconds: 180000,
            geometry: {
              coordinates: [
                [105.8, 21.0],
                [116.4, 39.9],
              ],
            },
            legs: [
              {
                steps: [
                  {
                    name: 'AH1',
                    distanceMeters: 2000000,
                    durationSeconds: 80000,
                    maneuver: { instruction: 'Continue on AH1' },
                  },
                ],
              },
            ],
          },
        ],
      }),
    } as any);

    const originalLocation = (globalThis as any).window?.location;
    if (!(globalThis as any).window) (globalThis as any).window = {};
    (globalThis as any).window.location = { origin: 'http://localhost:3000' };

    const { setOrigin, setDestination, calculateRoute } = useMapStore.getState();
    setOrigin([105.8, 21.0], 'Viet');
    setDestination([116.4, 39.9], 'China');

    const originalNodeEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';

    try {
      await calculateRoute();
      const { directions } = useMapStore.getState();
      expect(directions.isActive).toBe(true);
      expect(directions.distanceMeters).toBe(4500000);
      expect(directions.durationSeconds).toBe(180000);
      expect(Number.isNaN(directions.distanceMeters)).toBe(false);
      expect(Number.isNaN(directions.durationSeconds)).toBe(false);
      expect(directions.steps[0]!.distanceMeters).toBe(2000000);
      expect(directions.steps[0]!.durationSeconds).toBe(80000);
    } finally {
      (process.env as any).NODE_ENV = originalNodeEnv;
      globalThis.fetch = originalFetch;
      if (originalLocation) {
        (globalThis as any).window.location = originalLocation;
      }
    }
  });

  it('manages measurement and drawing tools', () => {
    const { setActiveToolMode, addToolPoint, clearToolPoints } = useMapStore.getState();

    setActiveToolMode('distance');
    expect(useMapStore.getState().activeToolMode).toBe('distance');

    addToolPoint([-122.4194, 37.7749]);
    expect(useMapStore.getState().toolPoints.length).toBe(1);

    addToolPoint([-122.4094, 37.7849]);
    expect(useMapStore.getState().toolPoints.length).toBe(2);
    expect(useMapStore.getState().measurementValue).toBeTruthy();

    clearToolPoints();
    expect(useMapStore.getState().toolPoints.length).toBe(0);
    expect(useMapStore.getState().measurementValue).toBeNull();
  });

  it('manages collections CRUD', () => {
    const { createCollection, deleteCollection } = useMapStore.getState();

    createCollection({
      name: 'Weekend Getaways',
      description: 'Places to visit on a sunny weekend',
      color: '#10b981',
      icon: 'heart',
    });

    const collections = useMapStore.getState().collections;
    const created = collections.find((c) => c.name === 'Weekend Getaways');
    expect(created).toBeDefined();

    if (created) {
      deleteCollection(created.id);
      expect(useMapStore.getState().collections.some((c) => c.id === created.id)).toBe(false);
    }
  });

  it('searches for location "viet nam" and properly focuses camera on Vietnam', async () => {
    const { executeSearch } = useMapStore.getState();
    await executeSearch('viet nam');

    const state = useMapStore.getState();
    expect(state.liveSearchResults.length).toBeGreaterThan(0);
    const topResult = state.liveSearchResults[0]!;
    expect(topResult.place.name.toLowerCase()).toContain('việt nam');

    // Coordinates should be in Southeast Asia (lng ~102-110, lat ~8-23), NOT in California (-122, 37)
    expect(topResult.place.coordinates[0]).toBeGreaterThan(100);
    expect(topResult.place.coordinates[0]).toBeLessThan(120);
    expect(topResult.place.coordinates[1]).toBeGreaterThan(7);
    expect(topResult.place.coordinates[1]).toBeLessThan(25);

    // Selected place should be auto-set and camera updated to Vietnam coordinates
    expect(state.selectedPlace?.name.toLowerCase()).toContain('việt nam');
    expect(state.camera.center[0]).toBeGreaterThan(100);
    expect(state.camera.center[1]).toBeGreaterThan(7);
  });
});
