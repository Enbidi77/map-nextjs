import type { Coordinate } from '@modern-maps/types';
import type { GeoJSONFeature, GeoJSONGeometry } from '@modern-maps/types';
import type {
  FeatureType,
  SharedCollectionPermission,
  UserThemePreference,
  DistanceUnit,
  Json,
} from './database.types.js';

export type {
  FeatureType,
  SharedCollectionPermission,
  UserThemePreference,
  DistanceUnit,
  Json,
};

export interface UserProfile {
  id: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  website: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  defaultStyle: string;
  defaultZoom: number;
  defaultCenterLng: number;
  defaultCenterLat: number;
  theme: UserThemePreference;
  distanceUnit: DistanceUnit;
  createdAt: string;
  updatedAt: string;
}

export interface SavedPlace {
  id: string;
  userId: string | null;
  providerId: string | null;
  name: string;
  formattedAddress: string;
  category: string;
  latitude: number;
  longitude: number;
  notes: string | null;
  customColor: string | null;
  customIcon: string | null;
  rating: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  distanceMeters?: number;
}

export interface PlaceCollection {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  color: string | null;
  icon: string | null;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  savedPlaceId: string;
  placeId?: string;
  sortOrder?: number;
  addedAt: string;
  notes: string | null;
  place?: SavedPlace;
}

export interface UserMapFeature {
  id: string;
  userId: string | null;
  name: string;
  featureType: FeatureType;
  geojson: GeoJSONFeature;
  properties: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SearchHistoryItem {
  id: string;
  userId: string | null;
  query: string;
  latitude: number | null;
  longitude: number | null;
  centerLng?: number | null;
  centerLat?: number | null;
  selectedPlaceId: string | null;
  selectedPlaceName?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SharedCollection {
  id: string;
  collectionId: string;
  sharedWithUserId: string;
  permission: SharedCollectionPermission;
  createdAt: string;
}

export interface MapLayerPreference {
  id: string;
  userId: string;
  layerId: string;
  visible: boolean;
  opacity: number;
  styleOverrides: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LocationShare {
  id: string;
  userId: string;
  shareToken: string;
  currentLocation: Coordinate | null;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  batteryLevel: number | null;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Input mutation types
export interface CreateSavedPlaceInput {
  userId?: string | null;
  providerId?: string | null;
  name: string;
  formattedAddress: string;
  category?: string;
  latitude: number;
  longitude: number;
  notes?: string | null;
  customColor?: string | null;
  customIcon?: string | null;
  rating?: number | null;
  metadata?: Record<string, unknown>;
}

export interface UpdateSavedPlaceInput {
  name?: string;
  formattedAddress?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  notes?: string | null;
  customColor?: string | null;
  customIcon?: string | null;
  rating?: number | null;
  metadata?: Record<string, unknown>;
}

export interface CreateCollectionInput {
  userId: string;
  name: string;
  description?: string | null;
  isPublic?: boolean;
  color?: string | null;
  icon?: string | null;
}

export interface UpdateCollectionInput {
  name?: string;
  description?: string | null;
  isPublic?: boolean;
  color?: string | null;
  icon?: string | null;
}

export interface CreateMapFeatureInput {
  userId?: string | null;
  name: string;
  featureType: FeatureType;
  geojson: GeoJSONFeature | Record<string, unknown>;
  properties?: Record<string, unknown>;
}

export interface UpdateMapFeatureInput {
  name?: string;
  featureType?: FeatureType;
  geojson?: GeoJSONFeature | Record<string, unknown>;
  properties?: Record<string, unknown>;
}

export interface ShareCollectionInput {
  collectionId: string;
  sharedWithUserId: string;
  permission?: SharedCollectionPermission;
}

// Filter / RPC query types
export interface NearbySavedPlacesFilter {
  centerLng: number;
  centerLat: number;
  radiusMeters?: number;
  maxResults?: number;
  categoryFilter?: string | null;
}

export interface FeaturesInViewportFilter {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
  maxFeatures?: number;
  featureTypeFilter?: string | null;
}

export interface FeaturesIntersectingGeometryFilter {
  targetGeom: GeoJSONGeometry | Record<string, unknown>;
  maxFeatures?: number;
}

export interface PaginatedPlacesOptions {
  cursorId?: string | null;
  pageSize?: number;
  categoryFilter?: string | null;
  searchQuery?: string | null;
}

// Realtime Presence & Collaboration
export interface UserPresenceState {
  userId: string;
  username: string;
  avatarUrl?: string;
  cursor?: Coordinate;
  center?: Coordinate;
  zoom?: number;
  activeLayer?: string;
  status?: 'active' | 'idle' | 'editing';
  lastSeen?: string;
}
