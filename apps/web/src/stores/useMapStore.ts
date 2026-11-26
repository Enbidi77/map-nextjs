import { create } from 'zustand';
import type { CameraState, Coordinate, PlaceModel, PlaceSearchResult } from '@modern-maps/types';
import type { UserMapFeature, MapFeatureType } from '@modern-maps/database';
import type { MeasurementDrawingMode } from '@modern-maps/ui';
import { calculatePolygonArea, calculatePathLength } from '@modern-maps/geospatial';
import { MOCK_PLACES } from '../data/mockPlaces';

export type SidebarView = 'search' | 'place' | 'directions' | 'saved';
export type TransitMode = 'driving' | 'walking' | 'cycling' | 'transit';

export interface OverlayLayerState {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
}

export interface DirectionStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  type?: string;
  modifier?: string;
  streetName?: string;
}

export interface DirectionsState {
  origin: Coordinate | null;
  destination: Coordinate | null;
  originName: string;
  destinationName: string;
  mode: TransitMode;
  distanceMeters: number | null;
  durationSeconds: number | null;
  routeGeometry: Coordinate[] | null;
  steps: DirectionStep[];
  isActive: boolean;
  isLoading: boolean;
}

export interface PlaceCollectionItem {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  placesCount?: number;
}

interface MapStoreState {
  // Camera
  camera: CameraState;
  setCamera: (camera: Partial<CameraState> | ((prev: CameraState) => CameraState)) => void;

  // Active Base Style
  activeStyle: string;
  setActiveStyle: (styleId: string) => void;

  // Sidebar Layout
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  sidebarView: SidebarView;
  setSidebarView: (view: SidebarView) => void;

  // Search & Places
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedPlace: PlaceModel | null;
  setSelectedPlace: (place: PlaceModel | null) => void;
  savedPlaces: PlaceModel[];
  toggleSavePlace: (place: PlaceModel) => void;
  isPlaceSaved: (placeId: string) => boolean;

  // Live API Search Results
  liveSearchResults: PlaceSearchResult[];
  isSearching: boolean;
  isViewportOutOfSync: boolean;
  setIsViewportOutOfSync: (outOfSync: boolean) => void;
  executeSearch: (query: string, category?: string | null) => Promise<void>;
  searchThisArea: (bounds?: [number, number, number, number]) => Promise<void>;

  // Collections
  collections: PlaceCollectionItem[];
  createCollection: (data: { name: string; description?: string; color?: string; icon?: string }) => void;
  deleteCollection: (id: string) => void;

  // Map Overlays
  overlays: OverlayLayerState[];
  toggleOverlay: (id: string, visible?: boolean) => void;
  setOverlayOpacity: (id: string, opacity: number) => void;

  // Advanced Tools: Measurement & Drawing
  activeToolMode: MeasurementDrawingMode;
  setActiveToolMode: (mode: MeasurementDrawingMode) => void;
  measurementValue: string | null;
  setMeasurementValue: (val: string | null) => void;
  toolPoints: Coordinate[];
  addToolPoint: (pt: Coordinate) => void;
  clearToolPoints: () => void;

  // Persistent User Map Features & Spatial Polygon Search
  savedFeatures: UserMapFeature[];
  isLoadingFeatures: boolean;
  activeSearchPolygon: Coordinate[][] | null;
  fetchMapFeatures: () => Promise<void>;
  saveDrawnFeature: (name: string, properties?: Record<string, unknown>) => Promise<UserMapFeature | null>;
  deleteMapFeature: (id: string) => Promise<void>;
  importGeoJSON: (geojson: unknown) => Promise<number>;
  exportGeoJSON: () => string;
  searchWithinPolygon: (polygon: Coordinate[][], category?: string | null) => Promise<void>;
  clearSearchPolygon: () => void;

  // Directions
  directions: DirectionsState;
  setOrigin: (coord: Coordinate | null, name?: string) => void;
  setDestination: (coord: Coordinate | null, name?: string) => void;
  setTransitMode: (mode: TransitMode) => void;
  calculateRoute: () => Promise<void>;
  swapOriginDestination: () => void;
  clearDirections: () => void;

  // User Geolocation
  userLocation: Coordinate | null;
  setUserLocation: (coord: Coordinate | null) => void;
  isLocating: boolean;
  setIsLocating: (isLocating: boolean) => void;
}

const DEFAULT_CAMERA: CameraState = {
  center: [-122.2979, 37.5629], // Scenic aerial canal view matching screenshot
  zoom: 14.9,
  pitch: 0,
  bearing: 0,
};

const DEFAULT_OVERLAYS: OverlayLayerState[] = [
  { id: 'places-layer', name: 'Points of Interest', visible: true, opacity: 1 },
  { id: '3d-buildings', name: '3D Building Extrusions', visible: true, opacity: 0.8 },
  { id: 'transit-lines', name: 'Transit & Ferry Routes', visible: true, opacity: 0.9 },
  { id: 'user-features', name: 'Saved Drawings', visible: true, opacity: 0.85 },
];

const INITIAL_COLLECTIONS: PlaceCollectionItem[] = [
  {
    id: 'col-1',
    name: 'Top SF Landmarks',
    description: 'Iconic architectural marvels and scenic bay viewpoints',
    color: '#3b82f6',
    icon: 'star',
    placesCount: 4,
  },
  {
    id: 'col-2',
    name: 'Artisan Eats & Coffee',
    description: 'Local sourdough, craft roasteries, and bayfront dining',
    color: '#f59e0b',
    icon: 'utensils',
    placesCount: 2,
  },
];

export const useMapStore = create<MapStoreState>((set, get) => ({
  // Camera
  camera: DEFAULT_CAMERA,
  setCamera: (update) =>
    set((state) => ({
      camera:
        typeof update === 'function'
          ? update(state.camera)
          : { ...state.camera, ...update },
    })),

  // Style
  activeStyle: 'satellite',
  setActiveStyle: (activeStyle) => set({ activeStyle }),

  // Sidebar
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  sidebarWidth: 380,
  setSidebarWidth: (sidebarWidth) =>
    set({ sidebarWidth: Math.max(280, Math.min(600, sidebarWidth)) }),
  sidebarView: 'directions',
  setSidebarView: (sidebarView) => set({ sidebarView, sidebarOpen: true }),

  // Search & Places
  searchQuery: '',
  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().executeSearch(searchQuery, get().selectedCategory);
  },
  selectedCategory: null,
  setSelectedCategory: (selectedCategory) => {
    set({ selectedCategory });
    get().executeSearch(get().searchQuery, selectedCategory);
  },
  selectedPlace: null,
  setSelectedPlace: (selectedPlace) => {
    set({
      selectedPlace,
      sidebarView: selectedPlace ? 'place' : 'search',
      sidebarOpen: true,
    });
    if (selectedPlace) {
      const isCountryOrRegion =
        selectedPlace.metadata?.type === 'administrative' ||
        selectedPlace.metadata?.osm_type === 'relation' ||
        selectedPlace.metadata?.addresstype === 'country';
      const targetZoom = isCountryOrRegion ? 6 : Math.max(14, get().camera.zoom);

      set((state) => ({
        camera: {
          ...state.camera,
          center: selectedPlace.coordinates,
          zoom: targetZoom,
        },
      }));
    }
  },
  savedPlaces: [MOCK_PLACES[0]!, MOCK_PLACES[3]!],
  toggleSavePlace: (place) =>
    set((state) => {
      const exists = state.savedPlaces.some((p) => p.id === place.id);
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
        if (!exists) {
          fetch('/api/saved-places', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: place.id,
              name: place.name,
              formattedAddress: place.address,
              category: place.category,
              latitude: place.coordinates[1],
              longitude: place.coordinates[0],
              notes: place.description,
            }),
          }).catch((err) => console.warn('Could not persist saved place to Supabase:', err));
        } else {
          fetch(`/api/saved-places?id=${encodeURIComponent(place.id)}`, {
            method: 'DELETE',
          }).catch((err) => console.warn('Could not delete saved place from Supabase:', err));
        }
      }
      return {
        savedPlaces: exists
          ? state.savedPlaces.filter((p) => p.id !== place.id)
          : [...state.savedPlaces, place],
      };
    }),
  isPlaceSaved: (placeId) => {
    return get().savedPlaces.some((p) => p.id === placeId);
  },

  // Live API Search
  liveSearchResults: MOCK_PLACES.map((p, idx) => ({
    place: p,
    relevanceScore: 1 - idx * 0.1,
  })),
  isSearching: false,
  executeSearch: async (query, category) => {
    const q = query.trim();
    if (!q) {
      // Default highlights
      const filtered = category && category !== 'all'
        ? MOCK_PLACES.filter((p) => p.category === category)
        : MOCK_PLACES;
      set({
        liveSearchResults: filtered.map((p, idx) => ({
          place: p,
          relevanceScore: 1 - idx * 0.1,
        })),
        isSearching: false,
      });
      return;
    }

    set({ isSearching: true });
    if (
      process.env.NODE_ENV !== 'test' &&
      typeof window !== 'undefined' &&
      window.location?.origin
    ) {
      try {
        const url = new URL('/api/search', window.location.origin);
        url.searchParams.set('q', q);
        if (category && category !== 'all') {
          url.searchParams.set('categories', category);
        }
        const [lng, lat] = get().camera.center;
        url.searchParams.set('lat', lat.toString());
        url.searchParams.set('lng', lng.toString());

        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            set({ liveSearchResults: data.results, isSearching: false });
            if (q) {
              get().setSelectedPlace(data.results[0].place);
            }
            return;
          }
        }
      } catch {
        // ignore
      }
    }

    // Fallback to local mock matching
    const lower = q.toLowerCase();
    const normalizedQ = lower.replace(/\s+/g, '');
    const matched = MOCK_PLACES.filter((p) => {
      const matchCat = category && category !== 'all' ? p.category === category : true;
      const matchText =
        p.name.toLowerCase().includes(lower) ||
        p.address.toLowerCase().includes(lower) ||
        (p.country?.toLowerCase().includes(lower) ?? false) ||
        (p.city?.toLowerCase().includes(lower) ?? false) ||
        (p.description?.toLowerCase().includes(lower) ?? false) ||
        (p.tags?.some((t) => t.toLowerCase().includes(lower)) ?? false);
      const normalizedName = p.name.toLowerCase().replace(/\s+/g, '');
      const matchNormalized = normalizedName.includes(normalizedQ);
      return matchCat && (matchText || matchNormalized);
    });

    set({
      liveSearchResults: matched.map((p, idx) => ({
        place: p,
        relevanceScore: 1 - idx * 0.1,
      })),
      isSearching: false,
      isViewportOutOfSync: false,
    });
    if (q && matched.length > 0) {
      get().setSelectedPlace(matched[0]!);
    }
  },
  isViewportOutOfSync: false,
  setIsViewportOutOfSync: (isViewportOutOfSync) => set({ isViewportOutOfSync }),
  searchThisArea: async (bounds) => {
    set({ isSearching: true, isViewportOutOfSync: false });
    const [centerLng, centerLat] = get().camera.center;
    const cat = get().selectedCategory;

    // Filter places inside bounds if explicit bounds provided
    let matched: typeof MOCK_PLACES = [];
    if (bounds && bounds.length === 4) {
      const [w, s, e, n] = bounds;
      matched = MOCK_PLACES.filter((p) => {
        const [lng, lat] = p.coordinates;
        const inBounds = lng >= w && lng <= e && lat >= s && lat <= n;
        const matchCat = cat && cat !== 'all' ? p.category === cat : true;
        return inBounds && matchCat;
      });
    }

    // If no places inside explicit bounds or no bounds provided, query by distance to center
    if (matched.length === 0) {
      const R = 6371; // km
      const sorted = [...MOCK_PLACES]
        .filter((p) => (cat && cat !== 'all' ? p.category === cat : true))
        .map((p) => {
          const [pLng, pLat] = p.coordinates;
          const dLat = ((pLat - centerLat) * Math.PI) / 180;
          const dLon = ((pLng - centerLng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((centerLat * Math.PI) / 180) *
              Math.cos((pLat * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return { place: p, dist: R * c };
        })
        .sort((a, b) => a.dist - b.dist);

      matched = sorted.slice(0, 8).map((s) => s.place);
    }

    set({
      liveSearchResults: matched.map((p, idx) => ({
        place: p,
        relevanceScore: Math.max(0.1, 1 - idx * 0.1),
      })),
      isSearching: false,
      isViewportOutOfSync: false,
    });
  },

  // Collections
  collections: INITIAL_COLLECTIONS,
  createCollection: (data) =>
    set((state) => ({
      collections: [
        ...state.collections,
        {
          id: `col-${Date.now()}`,
          name: data.name,
          description: data.description,
          color: data.color || '#3b82f6',
          icon: data.icon || 'folder',
          placesCount: 0,
        },
      ],
    })),
  deleteCollection: (id) =>
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
    })),

  // Overlays
  overlays: DEFAULT_OVERLAYS,
  toggleOverlay: (id, visible) =>
    set((state) => ({
      overlays: state.overlays.map((layer) =>
        layer.id === id
          ? { ...layer, visible: visible !== undefined ? visible : !layer.visible }
          : layer
      ),
    })),
  setOverlayOpacity: (id, opacity) =>
    set((state) => ({
      overlays: state.overlays.map((layer) =>
        layer.id === id ? { ...layer, opacity: Math.max(0, Math.min(1, opacity)) } : layer
      ),
    })),

  // Advanced Tools: Measurement & Drawing
  activeToolMode: 'polygon',
  setActiveToolMode: (activeToolMode) =>
    set({
      activeToolMode,
      toolPoints: [],
      measurementValue: null,
    }),
  measurementValue: null,
  setMeasurementValue: (measurementValue) => set({ measurementValue }),
  toolPoints: [],
  addToolPoint: (pt) =>
    set((state) => {
      const nextPoints = [...state.toolPoints, pt];
      let measurementValue: string | null = null;

      if (
        (state.activeToolMode === 'distance' || state.activeToolMode === 'line') &&
        nextPoints.length >= 2
      ) {
        const totalMeters = calculatePathLength(nextPoints, 'meters');
        measurementValue =
          totalMeters >= 1000
            ? `${(totalMeters / 1000).toFixed(2)} km`
            : `${Math.round(totalMeters)} m`;
      } else if (
        (state.activeToolMode === 'area' || state.activeToolMode === 'polygon') &&
        nextPoints.length >= 3
      ) {
        try {
          const ring = [...nextPoints, nextPoints[0]!];
          const areaSqMeters = calculatePolygonArea([ring], 'meters');
          if (areaSqMeters >= 1_000_000) {
            measurementValue = `${(areaSqMeters / 1_000_000).toFixed(2)} km²`;
          } else if (areaSqMeters >= 10_000) {
            measurementValue = `${(areaSqMeters / 10_000).toFixed(2)} ha`;
          } else {
            measurementValue = `${Math.round(areaSqMeters)} m²`;
          }
        } catch {
          measurementValue = null;
        }
      }

      return {
        toolPoints: nextPoints,
        measurementValue,
      };
    }),
  clearToolPoints: () => set({ toolPoints: [], measurementValue: null }),

  // Persistent User Map Features & Spatial Polygon Search
  savedFeatures: [],
  isLoadingFeatures: false,
  activeSearchPolygon: null,
  fetchMapFeatures: async () => {
    set({ isLoadingFeatures: true });
    try {
      const res = await fetch('/api/map-features');
      if (res.ok) {
        const data = (await res.json()) as { features?: UserMapFeature[] };
        set({ savedFeatures: data.features ?? [], isLoadingFeatures: false });
        return;
      }
    } catch (err) {
      console.warn('Could not fetch map features:', err);
    }
    set({ isLoadingFeatures: false });
  },
  saveDrawnFeature: async (name, properties) => {
    const { activeToolMode, toolPoints, measurementValue } = get();
    if (activeToolMode === 'none' || toolPoints.length === 0) {
      return null;
    }

    let featureType: MapFeatureType;
    let geometry: Record<string, unknown>;

    if (activeToolMode === 'point') {
      featureType = 'point';
      geometry = {
        type: 'Point',
        coordinates: toolPoints[0]!,
      };
    } else if (activeToolMode === 'line' || activeToolMode === 'distance') {
      if (toolPoints.length < 2) return null;
      featureType = 'linestring';
      geometry = {
        type: 'LineString',
        coordinates: [...toolPoints],
      };
    } else if (activeToolMode === 'polygon' || activeToolMode === 'area') {
      if (toolPoints.length < 3) return null;
      featureType = 'polygon';
      const first = toolPoints[0]!;
      const last = toolPoints[toolPoints.length - 1]!;
      const isClosed = first[0] === last[0] && first[1] === last[1];
      const ring = isClosed ? [...toolPoints] : [...toolPoints, first];
      geometry = {
        type: 'Polygon',
        coordinates: [ring],
      };
    } else {
      return null;
    }

    const mergedProperties: Record<string, unknown> = {
      ...(measurementValue ? { measurement: measurementValue } : {}),
      ...(properties ?? {}),
    };

    try {
      const res = await fetch('/api/map-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || `Drawn ${featureType}`,
          featureType,
          geojson: geometry,
          properties: mergedProperties,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { feature?: UserMapFeature };
        if (data.feature) {
          set((state) => ({
            savedFeatures: [...state.savedFeatures, data.feature!],
            toolPoints: [],
            measurementValue: null,
            activeToolMode: 'none',
          }));
          return data.feature;
        }
      }
    } catch (err) {
      console.warn('Could not save drawn feature:', err);
    }
    return null;
  },
  deleteMapFeature: async (id) => {
    try {
      const res = await fetch(`/api/map-features?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        set((state) => ({
          savedFeatures: state.savedFeatures.filter((f) => f.id !== id),
        }));
      }
    } catch (err) {
      console.warn('Could not delete map feature:', err);
    }
  },
  importGeoJSON: async (geojson) => {
    try {
      const res = await fetch('/api/map-features/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geojson }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          features?: UserMapFeature[];
          importedCount?: number;
        };
        const incoming = data.features ?? [];
        set((state) => {
          const existingIds = new Set(state.savedFeatures.map((f) => f.id));
          const merged = [
            ...state.savedFeatures,
            ...incoming.filter((f) => !existingIds.has(f.id)),
          ];
          return { savedFeatures: merged };
        });
        return data.importedCount ?? incoming.length;
      }
    } catch (err) {
      console.warn('Could not import GeoJSON:', err);
    }
    return 0;
  },
  exportGeoJSON: () => {
    const features = get().savedFeatures.map((f) => {
      const raw = f.geojson as Record<string, unknown>;
      const geometry =
        raw && raw.type === 'Feature' && raw.geometry ? raw.geometry : raw;
      return {
        type: 'Feature' as const,
        id: f.id,
        geometry,
        properties: {
          name: f.name,
          featureType: f.featureType,
          ...(f.properties ?? {}),
        },
      };
    });
    return JSON.stringify(
      {
        type: 'FeatureCollection',
        features,
      },
      null,
      2
    );
  },
  searchWithinPolygon: async (polygon, category) => {
    const effectiveCategory =
      category !== undefined ? category : get().selectedCategory;
    set({
      activeSearchPolygon: polygon,
      isSearching: true,
      isViewportOutOfSync: false,
      sidebarView: 'search',
      sidebarOpen: true,
    });
    try {
      const res = await fetch('/api/places/within-polygon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          polygon,
          category: effectiveCategory,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { results?: PlaceSearchResult[] };
        set({
          liveSearchResults: data.results ?? [],
          isSearching: false,
        });
        return;
      }
    } catch (err) {
      console.warn('Could not search within polygon:', err);
    }
    set({ isSearching: false });
  },
  clearSearchPolygon: () => set({ activeSearchPolygon: null }),

  // Directions
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
  setOrigin: (origin, name) =>
    set((state) => {
      const next = {
        ...state.directions,
        origin,
        originName: name ?? (origin ? `${origin[1].toFixed(4)}, ${origin[0].toFixed(4)}` : ''),
      };
      return { directions: next };
    }),
  setDestination: (destination, name) =>
    set((state) => {
      const next = {
        ...state.directions,
        destination,
        destinationName:
          name ?? (destination ? `${destination[1].toFixed(4)}, ${destination[0].toFixed(4)}` : ''),
      };
      return { directions: next };
    }),
  setTransitMode: (mode) =>
    set((state) => ({
      directions: { ...state.directions, mode },
    })),
  calculateRoute: async () => {
    const { origin, destination, mode } = get().directions;
    if (!origin || !destination) return;

    set((state) => ({
      directions: { ...state.directions, isLoading: true },
    }));

    if (
      process.env.NODE_ENV !== 'test' &&
      typeof window !== 'undefined' &&
      window.location?.origin
    ) {
      try {
        const res = await fetch('/api/directions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin,
            destination,
            mode: mode === 'transit' ? 'driving' : mode,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes[0]) {
            const primary = data.routes[0];
            const [lng1] = origin;
            const [lng2] = destination;
            const [, lat1] = origin;
            const [, lat2] = destination;

            const routeDistance =
              typeof primary.distanceMeters === 'number' && !isNaN(primary.distanceMeters)
                ? primary.distanceMeters
                : typeof primary.distance === 'number' && !isNaN(primary.distance)
                ? primary.distance
                : 0;

            const routeDuration =
              typeof primary.durationSeconds === 'number' && !isNaN(primary.durationSeconds)
                ? primary.durationSeconds
                : typeof primary.duration === 'number' && !isNaN(primary.duration)
                ? primary.duration
                : 0;

            const steps: DirectionStep[] = (primary.legs?.[0]?.steps || []).map((s: any) => ({
              instruction: s.maneuver?.instruction || s.name || 'Proceed',
              distanceMeters: Math.round(s.distanceMeters ?? s.distance ?? 0),
              durationSeconds: Math.round(s.durationSeconds ?? s.duration ?? 0),
              type: s.maneuver?.type,
              modifier: s.maneuver?.modifier,
              streetName: s.name,
            }));

            const km = Math.max(0.1, routeDistance / 1000);
            const computedZoom = Math.min(14, Math.max(2, 14 - Math.log2(km)));

            set((state) => ({
              directions: {
                ...state.directions,
                distanceMeters: Math.round(routeDistance),
                durationSeconds: Math.round(routeDuration),
                routeGeometry: primary.geometry?.coordinates || [origin, destination],
                steps:
                  steps.length > 0
                    ? steps
                    : [
                        {
                          instruction: 'Head toward destination',
                          distanceMeters: Math.round(routeDistance * 0.5),
                          durationSeconds: Math.round(routeDuration * 0.5),
                        },
                        {
                          instruction: 'Arrive at destination',
                          distanceMeters: Math.round(routeDistance * 0.5),
                          durationSeconds: Math.round(routeDuration * 0.5),
                        },
                      ],
                isActive: true,
                isLoading: false,
              },
              camera: {
                ...state.camera,
                center: [(lng1 + lng2) / 2, (lat1 + lat2) / 2],
                zoom: computedZoom,
              },
            }));
            return;
          }
        }
      } catch {
        // Fallback
      }
    }

    // High quality offline fallback calculation
    const [lng1, lat1] = origin;
    const [lng2, lat2] = destination;
    const dx = lng2 - lng1;
    const dy = lat2 - lat1;

    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distMeters = Math.round(R * c);

    const speeds: Record<TransitMode, number> = {
      driving: 13.4,
      cycling: 4.5,
      walking: 1.3,
      transit: 8.9,
    };
    const durationSec = Math.round(distMeters / speeds[mode]);

    const numPoints = 12;
    const routeGeometry: Coordinate[] = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const jitter = Math.sin(t * Math.PI) * 0.003;
      routeGeometry.push([lng1 + dx * t + jitter, lat1 + dy * t]);
    }

    const steps: DirectionStep[] = [
      {
        instruction: `Head ${dy >= 0 ? 'north' : 'south'} from origin`,
        distanceMeters: Math.round(distMeters * 0.3),
        durationSeconds: Math.round(durationSec * 0.3),
        type: 'depart',
      },
      {
        instruction: `Turn ${dx >= 0 ? 'right' : 'left'} onto scenic boulevard`,
        distanceMeters: Math.round(distMeters * 0.4),
        durationSeconds: Math.round(durationSec * 0.4),
        type: 'turn',
        modifier: dx >= 0 ? 'right' : 'left',
      },
      {
        instruction: 'Arrive at destination on the right',
        distanceMeters: Math.round(distMeters * 0.3),
        durationSeconds: Math.round(durationSec * 0.3),
        type: 'arrive',
      },
    ];

    set((state) => ({
      directions: {
        ...state.directions,
        distanceMeters: distMeters,
        durationSeconds: durationSec,
        routeGeometry,
        steps,
        isActive: true,
        isLoading: false,
      },
      camera: {
        ...state.camera,
        center: [(lng1 + lng2) / 2, (lat1 + lat2) / 2],
        zoom: Math.max(11, 14 - Math.log2(Math.max(1, distMeters / 1000))),
      },
    }));
  },
  swapOriginDestination: () =>
    set((state) => {
      const { origin, destination, originName, destinationName } = state.directions;
      return {
        directions: {
          ...state.directions,
          origin: destination,
          originName: destinationName,
          destination: origin,
          destinationName: originName,
        },
      };
    }),
  clearDirections: () =>
    set((state) => ({
      directions: {
        ...state.directions,
        origin: null,
        destination: null,
        originName: '',
        destinationName: '',
        distanceMeters: null,
        durationSeconds: null,
        routeGeometry: null,
        steps: [],
        isActive: false,
        isLoading: false,
      },
    })),

  // Geolocation
  userLocation: [-122.2979, 37.5629],
  setUserLocation: (userLocation) => set({ userLocation }),
  isLocating: false,
  setIsLocating: (isLocating) => set({ isLocating }),
}));
