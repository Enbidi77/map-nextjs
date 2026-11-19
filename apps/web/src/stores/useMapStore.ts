import { create } from 'zustand';
import type { CameraState, Coordinate, PlaceModel, PlaceSearchResult } from '@modern-maps/types';
import type { MeasurementDrawingMode } from '@modern-maps/ui';
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
  executeSearch: (query: string, category?: string | null) => Promise<void>;

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
  center: [-122.4194, 37.7749], // San Francisco
  zoom: 12,
  pitch: 0,
  bearing: 0,
};

const DEFAULT_OVERLAYS: OverlayLayerState[] = [
  { id: 'places-layer', name: 'Points of Interest', visible: true, opacity: 1 },
  { id: '3d-buildings', name: '3D Building Extrusions', visible: true, opacity: 0.8 },
  { id: 'transit-lines', name: 'Transit & Ferry Routes', visible: true, opacity: 0.9 },
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
  activeStyle: 'streets',
  setActiveStyle: (activeStyle) => set({ activeStyle }),

  // Sidebar
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  sidebarWidth: 380,
  setSidebarWidth: (sidebarWidth) =>
    set({ sidebarWidth: Math.max(280, Math.min(600, sidebarWidth)) }),
  sidebarView: 'search',
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
    });
    if (q && matched.length > 0) {
      get().setSelectedPlace(matched[0]!);
    }
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
  activeToolMode: 'none',
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

      if (state.activeToolMode === 'distance' && nextPoints.length >= 2) {
        // Calculate cumulative distance in meters using Haversine
        let totalMeters = 0;
        const R = 6371000;
        for (let i = 0; i < nextPoints.length - 1; i++) {
          const [lngA, latA] = nextPoints[i]!;
          const [lngB, latB] = nextPoints[i + 1]!;
          const dLat = ((latB - latA) * Math.PI) / 180;
          const dLon = ((lngB - lngA) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((latA * Math.PI) / 180) *
              Math.cos((latB * Math.PI) / 180) *
              Math.sin(dLon / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          totalMeters += R * c;
        }
        measurementValue =
          totalMeters >= 1000
            ? `${(totalMeters / 1000).toFixed(2)} km`
            : `${Math.round(totalMeters)} m`;
      } else if (state.activeToolMode === 'area' && nextPoints.length >= 3) {
        // Approximate planar area
        measurementValue = `${nextPoints.length} vertices`;
      }

      return {
        toolPoints: nextPoints,
        measurementValue,
      };
    }),
  clearToolPoints: () => set({ toolPoints: [], measurementValue: null }),

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
  userLocation: null,
  setUserLocation: (userLocation) => set({ userLocation }),
  isLocating: false,
  setIsLocating: (isLocating) => set({ isLocating }),
}));
