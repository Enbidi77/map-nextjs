-- ==============================================================================
-- Migration: 20261119000002_postgis_indexes_and_functions.sql
-- Description: Spatial GiST indexes, relational performance indexes, and
--              high-performance PostGIS stored procedure RPC functions.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Spatial GiST Indexes
-- ------------------------------------------------------------------------------

-- Spatial index on saved places geography point
CREATE INDEX IF NOT EXISTS idx_saved_places_location
  ON public.saved_places USING GIST (location);

-- Spatial index on user map feature vector geometries (Points, Lines, Polygons)
CREATE INDEX IF NOT EXISTS idx_user_map_features_geom
  ON public.user_map_features USING GIST (geom);

-- Spatial index on search history audit points
CREATE INDEX IF NOT EXISTS idx_search_history_location
  ON public.search_history USING GIST (location);

-- Spatial index on active location shares
CREATE INDEX IF NOT EXISTS idx_location_shares_current_location
  ON public.location_shares USING GIST (current_location);

-- ------------------------------------------------------------------------------
-- 2. Foreign Key & Query Performance B-Tree Indexes
-- ------------------------------------------------------------------------------

-- User Preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
  ON public.user_preferences (user_id);

-- Saved Places
CREATE INDEX IF NOT EXISTS idx_saved_places_user_id
  ON public.saved_places (user_id);

CREATE INDEX IF NOT EXISTS idx_saved_places_category
  ON public.saved_places (category);

CREATE INDEX IF NOT EXISTS idx_saved_places_created_at
  ON public.saved_places (created_at DESC);

-- Collections & Items
CREATE INDEX IF NOT EXISTS idx_place_collections_user_id
  ON public.place_collections (user_id);

CREATE INDEX IF NOT EXISTS idx_place_collections_is_public
  ON public.place_collections (is_public);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id
  ON public.collection_items (collection_id);

CREATE INDEX IF NOT EXISTS idx_collection_items_saved_place_id
  ON public.collection_items (saved_place_id);

CREATE INDEX IF NOT EXISTS idx_collection_items_sort_order
  ON public.collection_items (collection_id, sort_order ASC);

-- Search History
CREATE INDEX IF NOT EXISTS idx_search_history_user_id_created
  ON public.search_history (user_id, created_at DESC);

-- User Map Features
CREATE INDEX IF NOT EXISTS idx_user_map_features_user_id
  ON public.user_map_features (user_id);

CREATE INDEX IF NOT EXISTS idx_user_map_features_type
  ON public.user_map_features (feature_type);

-- Shared Collections
CREATE INDEX IF NOT EXISTS idx_shared_collections_collection_id
  ON public.shared_collections (collection_id);

CREATE INDEX IF NOT EXISTS idx_shared_collections_shared_with
  ON public.shared_collections (shared_with_user_id);

-- Map Layer Preferences
CREATE INDEX IF NOT EXISTS idx_map_layer_preferences_user_id
  ON public.map_layer_preferences (user_id);

-- Location Shares
CREATE INDEX IF NOT EXISTS idx_location_shares_user_id
  ON public.location_shares (user_id);

CREATE INDEX IF NOT EXISTS idx_location_shares_share_token
  ON public.location_shares (share_token);

CREATE INDEX IF NOT EXISTS idx_location_shares_status
  ON public.location_shares (is_active, expires_at);

-- ------------------------------------------------------------------------------
-- 3. PostGIS Spatial RPC Functions
-- ------------------------------------------------------------------------------

-- 1) nearby_saved_places
-- Finds saved places within radius_meters of center [lng, lat], sorted by distance.
CREATE OR REPLACE FUNCTION public.nearby_saved_places(
  center_lng DOUBLE PRECISION,
  center_lat DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION DEFAULT 5000,
  max_results INT DEFAULT 50,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  provider_id TEXT,
  name TEXT,
  formatted_address TEXT,
  category TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  notes TEXT,
  custom_color TEXT,
  custom_icon TEXT,
  rating NUMERIC,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  ref_point GEOGRAPHY;
BEGIN
  ref_point := ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography;

  RETURN QUERY
  SELECT
    sp.id,
    sp.user_id,
    sp.provider_id,
    sp.name,
    sp.formatted_address,
    sp.category,
    sp.latitude,
    sp.longitude,
    sp.notes,
    sp.custom_color,
    sp.custom_icon,
    sp.rating,
    sp.metadata,
    sp.created_at,
    sp.updated_at,
    ROUND(ST_Distance(sp.location, ref_point)::numeric, 2)::DOUBLE PRECISION AS distance_meters
  FROM public.saved_places sp
  WHERE ST_DWithin(sp.location, ref_point, radius_meters)
    AND (category_filter IS NULL OR sp.category = category_filter)
  ORDER BY ST_Distance(sp.location, ref_point) ASC
  LIMIT max_results;
END;
$$;

-- 2) features_in_viewport
-- Returns all user map features intersecting the given bounding box coordinates.
CREATE OR REPLACE FUNCTION public.features_in_viewport(
  min_lng DOUBLE PRECISION,
  min_lat DOUBLE PRECISION,
  max_lng DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  max_features INT DEFAULT 100,
  feature_type_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  feature_type TEXT,
  geojson JSONB,
  properties JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  envelope GEOMETRY;
BEGIN
  envelope := ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326);

  RETURN QUERY
  SELECT
    umf.id,
    umf.user_id,
    umf.name,
    umf.feature_type,
    umf.geojson,
    umf.properties,
    umf.created_at,
    umf.updated_at
  FROM public.user_map_features umf
  WHERE ST_Intersects(umf.geom, envelope)
    AND (feature_type_filter IS NULL OR umf.feature_type = feature_type_filter)
  LIMIT max_features;
END;
$$;

-- 3) features_intersecting_geometry
-- Returns map features that intersect with a provided GeoJSON geometry (corridor, polygon, buffer).
CREATE OR REPLACE FUNCTION public.features_intersecting_geometry(
  target_geom JSONB,
  max_features INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  feature_type TEXT,
  geojson JSONB,
  properties JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  geom_parsed GEOMETRY;
BEGIN
  geom_parsed := ST_SetSRID(ST_GeomFromGeoJSON(target_geom), 4326);

  RETURN QUERY
  SELECT
    umf.id,
    umf.user_id,
    umf.name,
    umf.feature_type,
    umf.geojson,
    umf.properties,
    umf.created_at,
    umf.updated_at
  FROM public.user_map_features umf
  WHERE ST_Intersects(umf.geom, geom_parsed)
  LIMIT max_features;
END;
$$;

-- 4) spatial_distance
-- High-precision ellipsoidal geodesic distance between two [lng, lat] coordinates in meters.
CREATE OR REPLACE FUNCTION public.spatial_distance(
  p1_lng DOUBLE PRECISION,
  p1_lat DOUBLE PRECISION,
  p2_lng DOUBLE PRECISION,
  p2_lat DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT ROUND(
    ST_Distance(
      ST_SetSRID(ST_MakePoint(p1_lng, p1_lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p2_lng, p2_lat), 4326)::geography
    )::numeric,
    2
  )::DOUBLE PRECISION;
$$;

-- 5) paginated_places
-- Keyset-paginated place listing with category filtering and fuzzy address/name search.
CREATE OR REPLACE FUNCTION public.paginated_places(
  cursor_id UUID DEFAULT NULL,
  page_size INT DEFAULT 20,
  category_filter TEXT DEFAULT NULL,
  search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  provider_id TEXT,
  name TEXT,
  formatted_address TEXT,
  category TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  notes TEXT,
  custom_color TEXT,
  custom_icon TEXT,
  rating NUMERIC,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  cursor_created_at TIMESTAMPTZ;
BEGIN
  IF cursor_id IS NOT NULL THEN
    SELECT sp.created_at INTO cursor_created_at
    FROM public.saved_places sp
    WHERE sp.id = cursor_id;
  END IF;

  RETURN QUERY
  SELECT
    sp.id,
    sp.user_id,
    sp.provider_id,
    sp.name,
    sp.formatted_address,
    sp.category,
    sp.latitude,
    sp.longitude,
    sp.notes,
    sp.custom_color,
    sp.custom_icon,
    sp.rating,
    sp.metadata,
    sp.created_at,
    sp.updated_at
  FROM public.saved_places sp
  WHERE (category_filter IS NULL OR sp.category = category_filter)
    AND (
      search_query IS NULL
      OR sp.name ILIKE ('%' || search_query || '%')
      OR sp.formatted_address ILIKE ('%' || search_query || '%')
    )
    AND (
      cursor_created_at IS NULL
      OR (sp.created_at, sp.id) < (cursor_created_at, cursor_id)
    )
  ORDER BY sp.created_at DESC, sp.id DESC
  LIMIT page_size;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.nearby_saved_places TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.features_in_viewport TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.features_intersecting_geometry TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.spatial_distance TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.paginated_places TO anon, authenticated, service_role;
