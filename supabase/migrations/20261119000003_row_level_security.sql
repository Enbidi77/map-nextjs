-- ==============================================================================
-- Migration: 20261119000003_row_level_security.sql
-- Description: Strict Row-Level Security (RLS) policies for all platform tables.
--              Enforces tenant isolation via auth.uid(), shared collaboration
--              access delegation, and zero-table-scan index guarantees.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Enable RLS on all tables
-- ------------------------------------------------------------------------------

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_map_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_layer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_shares ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. user_profiles Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "Profiles are viewable by all authenticated and anon users"
  ON public.user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON public.user_profiles FOR DELETE
  USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 3. user_preferences Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. place_collections Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "Collections viewable by owner, collaborators, or if public"
  ON public.place_collections FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_public = true
    OR EXISTS (
      SELECT 1 FROM public.shared_collections sc
      WHERE sc.collection_id = place_collections.id
        AND sc.shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create collections"
  ON public.place_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Collections updatable by owner or authorized collaborator"
  ON public.place_collections FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.shared_collections sc
      WHERE sc.collection_id = place_collections.id
        AND sc.shared_with_user_id = auth.uid()
        AND sc.permission IN ('edit', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.shared_collections sc
      WHERE sc.collection_id = place_collections.id
        AND sc.shared_with_user_id = auth.uid()
        AND sc.permission IN ('edit', 'admin')
    )
  );

CREATE POLICY "Collections deletable only by owner"
  ON public.place_collections FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 5. saved_places Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "Places viewable by owner or via accessible collections"
  ON public.saved_places FOR SELECT
  USING (
    auth.uid() = user_id
    OR user_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.collection_items ci
      JOIN public.place_collections pc ON pc.id = ci.collection_id
      WHERE ci.saved_place_id = saved_places.id
        AND (
          pc.is_public = true
          OR pc.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.shared_collections sc
            WHERE sc.collection_id = pc.id
              AND sc.shared_with_user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Users can create their own saved places"
  ON public.saved_places FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved places"
  ON public.saved_places FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved places"
  ON public.saved_places FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. collection_items Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "Collection items viewable if collection is viewable"
  ON public.collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.place_collections pc
      WHERE pc.id = collection_items.collection_id
        AND (
          pc.user_id = auth.uid()
          OR pc.is_public = true
          OR EXISTS (
            SELECT 1 FROM public.shared_collections sc
            WHERE sc.collection_id = pc.id
              AND sc.shared_with_user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Collection items insertable by collection owner or editor"
  ON public.collection_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.place_collections pc
      WHERE pc.id = collection_items.collection_id
        AND (
          pc.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.shared_collections sc
            WHERE sc.collection_id = pc.id
              AND sc.shared_with_user_id = auth.uid()
              AND sc.permission IN ('edit', 'admin')
          )
        )
    )
  );

CREATE POLICY "Collection items updatable by collection owner or editor"
  ON public.collection_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.place_collections pc
      WHERE pc.id = collection_items.collection_id
        AND (
          pc.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.shared_collections sc
            WHERE sc.collection_id = pc.id
              AND sc.shared_with_user_id = auth.uid()
              AND sc.permission IN ('edit', 'admin')
          )
        )
    )
  );

CREATE POLICY "Collection items deletable by collection owner or editor"
  ON public.collection_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.place_collections pc
      WHERE pc.id = collection_items.collection_id
        AND (
          pc.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.shared_collections sc
            WHERE sc.collection_id = pc.id
              AND sc.shared_with_user_id = auth.uid()
              AND sc.permission IN ('edit', 'admin')
          )
        )
    )
  );

-- ------------------------------------------------------------------------------
-- 7. shared_collections Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "Shares viewable by collection owner or shared recipient"
  ON public.shared_collections FOR SELECT
  USING (
    auth.uid() = shared_with_user_id
    OR EXISTS (
      SELECT 1 FROM public.place_collections pc
      WHERE pc.id = shared_collections.collection_id
        AND pc.user_id = auth.uid()
    )
  );

CREATE POLICY "Shares insertable by collection owner"
  ON public.shared_collections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.place_collections pc
      WHERE pc.id = shared_collections.collection_id
        AND pc.user_id = auth.uid()
    )
  );

CREATE POLICY "Shares updatable by collection owner"
  ON public.shared_collections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.place_collections pc
      WHERE pc.id = shared_collections.collection_id
        AND pc.user_id = auth.uid()
    )
  );

CREATE POLICY "Shares deletable by collection owner or recipient (leave share)"
  ON public.shared_collections FOR DELETE
  USING (
    auth.uid() = shared_with_user_id
    OR EXISTS (
      SELECT 1 FROM public.place_collections pc
      WHERE pc.id = shared_collections.collection_id
        AND pc.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- 8. search_history Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "Users can view their own search history"
  ON public.search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their search history"
  ON public.search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their search history"
  ON public.search_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their search history"
  ON public.search_history FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 9. user_map_features Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "Map features viewable by owner or if unassigned"
  ON public.user_map_features FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert map features"
  ON public.user_map_features FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own map features"
  ON public.user_map_features FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own map features"
  ON public.user_map_features FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 10. map_layer_preferences Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "Users have full control over their layer preferences"
  ON public.map_layer_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 11. location_shares Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "Location shares viewable by owner or active share token holders"
  ON public.location_shares FOR SELECT
  USING (
    auth.uid() = user_id
    OR (is_active = true AND expires_at > timezone('utc'::text, now()))
  );

CREATE POLICY "Users can create location shares"
  ON public.location_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their location shares"
  ON public.location_shares FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their location shares"
  ON public.location_shares FOR DELETE
  USING (auth.uid() = user_id);
