-- ==============================================================================
-- Migration: 20261119000004_storage_and_realtime.sql
-- Description: Provision Supabase storage buckets, storage object RLS security,
--              and Supabase Realtime publication configuration with REPLICA IDENTITY.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Storage Buckets Creation
-- ------------------------------------------------------------------------------

-- Ensure storage schema exists
CREATE SCHEMA IF NOT EXISTS storage;

-- Insert or update default storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'place-photos',
    'place-photos',
    true,
    10485760, -- 10 MiB
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'collection-covers',
    'collection-covers',
    true,
    10485760, -- 10 MiB
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'geojson-imports',
    'geojson-imports',
    false,
    52428800, -- 50 MiB
    ARRAY['application/geo+json', 'application/json']::text[]
  ),
  (
    'map-attachments',
    'map-attachments',
    false,
    52428800, -- 50 MiB
    ARRAY['application/pdf', 'text/csv', 'application/zip']::text[]
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ------------------------------------------------------------------------------
-- 2. Storage Object Security (RLS on storage.objects)
-- ------------------------------------------------------------------------------

-- Configure policies on storage.objects (RLS is already pre-enabled by Supabase)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    -- Drop existing modern-maps policies if re-running
    DROP POLICY IF EXISTS "Public read for place-photos and collection-covers" ON storage.objects;
    DROP POLICY IF EXISTS "Owner read for private buckets" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users upload to own folder" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users update own files" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users delete own files" ON storage.objects;

    -- Public read policy for photos and covers
    CREATE POLICY "Public read for place-photos and collection-covers"
      ON storage.objects FOR SELECT
      USING (bucket_id IN ('place-photos', 'collection-covers'));

    -- Owner read policy for private buckets
    CREATE POLICY "Owner read for private buckets"
      ON storage.objects FOR SELECT
      USING (
        bucket_id IN ('geojson-imports', 'map-attachments')
        AND (storage.foldername(name))[1] = auth.uid()::text
      );

    -- Upload policy: Users must upload to their own user_id directory
    CREATE POLICY "Authenticated users upload to own folder"
      ON storage.objects FOR INSERT
      WITH CHECK (
        auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );

    -- Update policy
    CREATE POLICY "Authenticated users update own files"
      ON storage.objects FOR UPDATE
      USING (
        auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );

    -- Delete policy
    CREATE POLICY "Authenticated users delete own files"
      ON storage.objects FOR DELETE
      USING (
        auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. Supabase Realtime Publication Configuration
-- ------------------------------------------------------------------------------

-- Ensure supabase_realtime publication exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Configure publication tables
DO $$
BEGIN
  -- Add saved_places to realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'saved_places'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_places;
  END IF;

  -- Add user_map_features to realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_map_features'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_map_features;
  END IF;

  -- Add place_collections to realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'place_collections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.place_collections;
  END IF;

  -- Add location_shares to realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'location_shares'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.location_shares;
  END IF;
END $$;

-- Set REPLICA IDENTITY FULL to transmit full row data on UPDATE and DELETE events
ALTER TABLE public.saved_places REPLICA IDENTITY FULL;
ALTER TABLE public.user_map_features REPLICA IDENTITY FULL;
ALTER TABLE public.place_collections REPLICA IDENTITY FULL;
ALTER TABLE public.location_shares REPLICA IDENTITY FULL;
