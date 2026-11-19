-- ==============================================================================
-- Migration: 20261119000001_initial_schema.sql
-- Description: Creates core platform tables, spatial types, auto-updating triggers,
--              and automatic user profile provisioning.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Helper Trigger Functions
-- ------------------------------------------------------------------------------

-- Generic updated_at timestamp update function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 2. User Profiles & Preferences
-- ------------------------------------------------------------------------------

-- User Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER tr_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- User Preferences (mapping defaults, theme, distance units)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  default_style TEXT NOT NULL DEFAULT 'streets',
  default_zoom DOUBLE PRECISION NOT NULL DEFAULT 12,
  default_center_lng DOUBLE PRECISION NOT NULL DEFAULT -122.4194,
  default_center_lat DOUBLE PRECISION NOT NULL DEFAULT 37.7749,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  distance_unit TEXT NOT NULL DEFAULT 'metric' CHECK (distance_unit IN ('metric', 'imperial')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER tr_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 3. Saved Places & Spatial Sync
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.saved_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id TEXT,
  name TEXT NOT NULL,
  formatted_address TEXT NOT NULL,
  category TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  notes TEXT,
  custom_color TEXT,
  custom_icon TEXT,
  rating NUMERIC(3, 2) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER tr_saved_places_updated_at
  BEFORE UPDATE ON public.saved_places
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Automatically sync location geography and lat/lng coordinates
CREATE OR REPLACE FUNCTION public.sync_saved_places_spatial()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location IS NULL AND NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSIF NEW.location IS NOT NULL THEN
    NEW.latitude := ST_Y(NEW.location::geometry);
    NEW.longitude := ST_X(NEW.location::geometry);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_saved_places_sync_spatial
  BEFORE INSERT OR UPDATE OF latitude, longitude, location ON public.saved_places
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_saved_places_spatial();

-- ------------------------------------------------------------------------------
-- 4. Place Collections & Junction Items
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.place_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER tr_place_collections_updated_at
  BEFORE UPDATE ON public.place_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.place_collections(id) ON DELETE CASCADE,
  saved_place_id UUID NOT NULL REFERENCES public.saved_places(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_collection_place UNIQUE (collection_id, saved_place_id)
);

-- ------------------------------------------------------------------------------
-- 5. Search History
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  selected_place_id TEXT,
  selected_place_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location GEOGRAPHY(Point, 4326),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE OR REPLACE FUNCTION public.sync_search_history_spatial()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL AND NEW.location IS NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_search_history_sync_spatial
  BEFORE INSERT OR UPDATE OF latitude, longitude, location ON public.search_history
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_search_history_spatial();

-- ------------------------------------------------------------------------------
-- 6. User Map Features (Points, Lines, Polygons)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_map_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  feature_type TEXT NOT NULL CHECK (
    feature_type IN ('point', 'linestring', 'polygon', 'multipoint', 'multilinestring', 'multipolygon', 'geometrycollection')
  ),
  geom GEOMETRY(Geometry, 4326) NOT NULL,
  geojson JSONB NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER tr_user_map_features_updated_at
  BEFORE UPDATE ON public.user_map_features
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Automatically sync geom geometry and geojson representation
CREATE OR REPLACE FUNCTION public.sync_user_map_features_spatial()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.geom IS NULL AND NEW.geojson IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_GeomFromGeoJSON(NEW.geojson), 4326);
  ELSIF NEW.geojson IS NULL AND NEW.geom IS NOT NULL THEN
    NEW.geojson := ST_AsGeoJSON(NEW.geom)::jsonb;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_user_map_features_sync_spatial
  BEFORE INSERT OR UPDATE OF geom, geojson ON public.user_map_features
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_map_features_spatial();

-- ------------------------------------------------------------------------------
-- 7. Shared Collections (Collaborative Delegation)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.shared_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.place_collections(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL DEFAULT 'read' CHECK (permission IN ('read', 'edit', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_shared_collection_user UNIQUE (collection_id, shared_with_user_id)
);

-- ------------------------------------------------------------------------------
-- 8. Map Layer Preferences
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.map_layer_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  layer_id TEXT NOT NULL,
  visible BOOLEAN NOT NULL DEFAULT true,
  opacity DOUBLE PRECISION NOT NULL DEFAULT 1.0 CHECK (opacity >= 0.0 AND opacity <= 1.0),
  style_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_user_layer UNIQUE (user_id, layer_id)
);

CREATE TRIGGER tr_map_layer_preferences_updated_at
  BEFORE UPDATE ON public.map_layer_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 9. Location Shares (Ephemeral Live Location)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.location_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  current_location GEOGRAPHY(Point, 4326),
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  battery_level DOUBLE PRECISION,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER tr_location_shares_updated_at
  BEFORE UPDATE ON public.location_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 10. Automatic User Setup Trigger on Auth Sign-Up
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
BEGIN
  -- Determine username from user metadata or fallback to email prefix
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- Insert profile
  INSERT INTO public.user_profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    v_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert default user preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger fired after an auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
