-- ==============================================================================
-- Modern Maps Platform - Reproducible Seed Dataset
-- Description: Test users, profiles, preferences, spatial points of interest,
--              curated collections, vector map features, shares, and search audit.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Demo Auth Users & User Profiles
-- ------------------------------------------------------------------------------

DO $$
BEGIN
  -- Insert test users if auth schema is present (Supabase local development)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES
    (
      '00000000-0000-0000-0000-000000000000',
      'd0000000-0000-0000-0000-000000000001',
      'authenticated',
      'authenticated',
      'alice@modernmaps.io',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"alice_mapper","full_name":"Alice Cartographer","avatar_url":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"}',
      now(),
      now()
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      'd0000000-0000-0000-0000-000000000002',
      'authenticated',
      'authenticated',
      'bob@modernmaps.io',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"bob_explorer","full_name":"Bob Navigator","avatar_url":"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}',
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- User Profiles
INSERT INTO public.user_profiles (id, username, full_name, avatar_url, bio, website)
VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'alice_mapper',
    'Alice Cartographer',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    'Geospatial engineer and urban hiker mapping the San Francisco Bay Area.',
    'https://modernmaps.io'
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'bob_explorer',
    'Bob Navigator',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'Surveyor and outdoor trail coordinator.',
    'https://github.com/modern-maps'
  )
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio;

-- User Preferences
INSERT INTO public.user_preferences (id, user_id, default_style, default_zoom, default_center_lng, default_center_lat, theme, distance_unit)
VALUES
  (
    'e0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'streets',
    13.0,
    -122.4194,
    37.7749,
    'dark',
    'metric'
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000002',
    'outdoors',
    14.0,
    -122.4465,
    37.7544,
    'system',
    'imperial'
  )
ON CONFLICT (user_id) DO UPDATE SET
  default_style = EXCLUDED.default_style,
  default_zoom = EXCLUDED.default_zoom,
  default_center_lng = EXCLUDED.default_center_lng,
  default_center_lat = EXCLUDED.default_center_lat,
  theme = EXCLUDED.theme,
  distance_unit = EXCLUDED.distance_unit;

-- ------------------------------------------------------------------------------
-- 2. Saved Places (San Francisco & NYC Landmarks)
-- ------------------------------------------------------------------------------

INSERT INTO public.saved_places (
  id,
  user_id,
  provider_id,
  name,
  formatted_address,
  category,
  latitude,
  longitude,
  location,
  notes,
  custom_color,
  custom_icon,
  rating,
  metadata
) VALUES
  (
    'f0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'osm-node-101',
    'Golden Gate Bridge',
    'Golden Gate Bridge, San Francisco, CA 94129',
    'attraction',
    37.8199,
    -122.4783,
    ST_SetSRID(ST_MakePoint(-122.4783, 37.8199), 4326)::geography,
    'Iconic suspension bridge spanning the Golden Gate strait. Best panoramic views at dawn.',
    '#EF4444',
    'bridge',
    4.90,
    '{"website":"https://goldengate.org","elevation":67,"tags":["viewpoint","architecture"]}'::jsonb
  ),
  (
    'f0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000001',
    'osm-node-102',
    'Ferry Building Marketplace',
    '1 Ferry Building, San Francisco, CA 94111',
    'food_drink',
    37.7955,
    -122.3937,
    ST_SetSRID(ST_MakePoint(-122.3937, 37.7955), 4326)::geography,
    'Historic 1898 terminal hub featuring artisan food markets, farmers market, and ferry berths.',
    '#3B82F6',
    'utensils',
    4.75,
    '{"farmers_market_days":["Tuesday","Thursday","Saturday"],"tags":["food","market","transit"]}'::jsonb
  ),
  (
    'f0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'osm-node-103',
    'Coit Tower & Telegraph Hill',
    '1 Telegraph Hill Blvd, San Francisco, CA 94133',
    'attraction',
    37.8024,
    -122.4058,
    ST_SetSRID(ST_MakePoint(-122.4058, 37.8024), 4326)::geography,
    'Art deco tower offering 360-degree views of the city and bay.',
    '#10B981',
    'binoculars',
    4.60,
    '{"elevation":87,"wheelchair_accessible":true}'::jsonb
  ),
  (
    'f0000000-0000-0000-0000-000000000004',
    'd0000000-0000-0000-0000-000000000001',
    'osm-node-104',
    'Blue Bottle Coffee Ferry Building',
    '1 Ferry Building #7, San Francisco, CA 94111',
    'food_drink',
    37.7952,
    -122.3934,
    ST_SetSRID(ST_MakePoint(-122.3934, 37.7952), 4326)::geography,
    'Single-origin pour-overs and New Orleans iced coffee.',
    '#0EA5E9',
    'coffee',
    4.55,
    '{"wifi":false,"outdoor_seating":true}'::jsonb
  ),
  (
    'f0000000-0000-0000-0000-000000000005',
    'd0000000-0000-0000-0000-000000000001',
    'osm-node-105',
    'Sightglass Coffee SOMA',
    '270 7th St, San Francisco, CA 94103',
    'food_drink',
    37.7768,
    -122.4087,
    ST_SetSRID(ST_MakePoint(-122.4087, 37.7768), 4326)::geography,
    'Spacious roastery with top-notch espresso and cold brew flights.',
    '#D97706',
    'coffee',
    4.70,
    '{"roastery":true,"wheelchair_accessible":true}'::jsonb
  ),
  (
    'f0000000-0000-0000-0000-000000000006',
    'd0000000-0000-0000-0000-000000000001',
    'osm-node-106',
    'SFMOMA Museum of Modern Art',
    '151 3rd St, San Francisco, CA 94103',
    'entertainment',
    37.7857,
    -122.4011,
    ST_SetSRID(ST_MakePoint(-122.4011, 37.7857), 4326)::geography,
    'World-class contemporary art museum with 7 floors of modern exhibitions.',
    '#8B5CF6',
    'palette',
    4.80,
    '{"museum_type":"modern_art","admission_fee":25}'::jsonb
  ),
  (
    'f0000000-0000-0000-0000-000000000007',
    'd0000000-0000-0000-0000-000000000001',
    'osm-node-107',
    'Mission Dolores Park',
    'Dolores St & 19th St, San Francisco, CA 94114',
    'nature',
    37.7596,
    -122.4269,
    ST_SetSRID(ST_MakePoint(-122.4269, 37.7596), 4326)::geography,
    'Vibrant 16-acre hillside park with skyline views, palm trees, and tennis courts.',
    '#22C55E',
    'trees',
    4.85,
    '{"dog_friendly":true,"restrooms":true,"tennis_courts":6}'::jsonb
  ),
  (
    'f0000000-0000-0000-0000-000000000008',
    'd0000000-0000-0000-0000-000000000002',
    'osm-node-108',
    'Twin Peaks Summit Viewpoint',
    '501 Twin Peaks Blvd, San Francisco, CA 94114',
    'nature',
    37.7544,
    -122.4465,
    ST_SetSRID(ST_MakePoint(-122.4465, 37.7544), 4326)::geography,
    'Second highest point in SF with 360-degree vistas across the whole Bay Area.',
    '#6366F1',
    'mountain',
    4.70,
    '{"elevation":282,"parking":true}'::jsonb
  ),
  (
    'f0000000-0000-0000-0000-000000000009',
    'd0000000-0000-0000-0000-000000000002',
    'osm-node-109',
    'Salesforce Transit Center & Park',
    '425 Mission St, San Francisco, CA 94105',
    'transit',
    37.7897,
    -122.3972,
    ST_SetSRID(ST_MakePoint(-122.3972, 37.7897), 4326)::geography,
    '5.4-acre public rooftop park suspended four stories above the street level transit hub.',
    '#06B6D4',
    'bus',
    4.65,
    '{"gondola":true,"gardens":true,"wifi":true}'::jsonb
  ),
  (
    'f0000000-0000-0000-0000-000000000010',
    'd0000000-0000-0000-0000-000000000002',
    'osm-node-110',
    'Central Park Bethesda Terrace',
    '72nd St, New York, NY 10021',
    'nature',
    40.7738,
    -73.9712,
    ST_SetSRID(ST_MakePoint(-73.9712, 40.7738), 4326)::geography,
    'Heart of Central Park overlooking the lake and Angel of the Waters fountain.',
    '#10B981',
    'trees',
    4.90,
    '{"city":"New York","historic":true}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. Place Collections
-- ------------------------------------------------------------------------------

INSERT INTO public.place_collections (id, user_id, name, description, color, icon, cover_image_url, is_public)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'San Francisco Highlights',
    'Must-visit architectural landmarks, iconic viewpoints, and historic bayfront locations.',
    '#3B82F6',
    'landmark',
    'https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?w=800',
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000001',
    'Specialty Coffee Crawl',
    'Handpicked third-wave coffee roasters and espresso bars.',
    '#F59E0B',
    'coffee',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000001',
    'Field Survey Inspection Points 2026',
    'Geodetic benchmarks and infrastructure survey points for active field work.',
    '#10B981',
    'clipboard-check',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
    false
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. Collection Items (Junction)
-- ------------------------------------------------------------------------------

INSERT INTO public.collection_items (id, collection_id, saved_place_id, sort_order, notes)
VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001', -- Golden Gate
    1,
    'Stop 1: Northern vista point at sunrise.'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000002', -- Ferry Building
    2,
    'Stop 2: Lunch and waterfront walk.'
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000006', -- SFMOMA
    3,
    'Stop 3: Afternoon galleries.'
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000002',
    'f0000000-0000-0000-0000-000000000004', -- Blue Bottle
    1,
    'Embarcadero morning starter.'
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000002',
    'f0000000-0000-0000-0000-000000000005', -- Sightglass SOMA
    2,
    'Mid-day tasting flight.'
  ),
  (
    'b0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000003',
    'f0000000-0000-0000-0000-000000000008', -- Twin Peaks
    1,
    'Primary trigonometric station benchmark.'
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. Shared Collections (Collaboration)
-- ------------------------------------------------------------------------------

-- Alice shares her private survey collection with Bob with 'edit' rights
INSERT INTO public.shared_collections (id, collection_id, shared_with_user_id, permission)
VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000002',
    'edit'
  )
ON CONFLICT (collection_id, shared_with_user_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. User Map Features (Points, LineStrings, Polygons)
-- ------------------------------------------------------------------------------

INSERT INTO public.user_map_features (id, user_id, name, feature_type, geom, geojson, properties)
VALUES
  -- 1) Point: Ferry Building Tower
  (
    '10000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Ferry Building Historic Clock Tower',
    'point',
    ST_SetSRID(ST_MakePoint(-122.3937, 37.7955), 4326),
    '{"type":"Point","coordinates":[-122.3937, 37.7955]}'::jsonb,
    '{"marker_symbol":"clock","marker_color":"#3B82F6","height_meters":74.7}'::jsonb
  ),

  -- 2) LineString: The Embarcadero Promenade Corridor
  (
    '10000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000001',
    'Embarcadero Bayside Promenade Path',
    'linestring',
    ST_SetSRID(
      ST_MakeLine(ARRAY[
        ST_MakePoint(-122.3892, 37.7891),
        ST_MakePoint(-122.3937, 37.7955),
        ST_MakePoint(-122.4001, 37.8028),
        ST_MakePoint(-122.4068, 37.8085)
      ]),
      4326
    ),
    '{"type":"LineString","coordinates":[[-122.3892,37.7891],[-122.3937,37.7955],[-122.4001,37.8028],[-122.4068,37.8085]]}'::jsonb,
    '{"stroke":"#0EA5E9","stroke_width":4,"surface":"paved","bicycle_allowed":true}'::jsonb
  ),

  -- 3) Polygon: Mission Dolores Park Recreation Boundary
  (
    '10000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000001',
    'Mission Dolores Park Boundary',
    'polygon',
    ST_SetSRID(
      ST_MakePolygon(
        ST_MakeLine(ARRAY[
          ST_MakePoint(-122.4285, 37.7580),
          ST_MakePoint(-122.4255, 37.7580),
          ST_MakePoint(-122.4255, 37.7610),
          ST_MakePoint(-122.4285, 37.7610),
          ST_MakePoint(-122.4285, 37.7580)
        ])
      ),
      4326
    ),
    '{"type":"Polygon","coordinates":[[[-122.4285,37.7580],[-122.4255,37.7580],[-122.4255,37.7610],[-122.4285,37.7610],[-122.4285,37.7580]]]}'::jsonb,
    '{"fill":"#22C55E","fill_opacity":0.3,"stroke":"#15803D","stroke_width":2,"zone_name":"public_park"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7. Search History
-- ------------------------------------------------------------------------------

INSERT INTO public.search_history (id, user_id, query, selected_place_id, selected_place_name, latitude, longitude, location, metadata)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Golden Gate Bridge',
    'osm-node-101',
    'Golden Gate Bridge',
    37.8199,
    -122.4783,
    ST_SetSRID(ST_MakePoint(-122.4783, 37.8199), 4326)::geography,
    '{"source":"search_bar","device":"desktop"}'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000001',
    'Sightglass Coffee',
    'osm-node-105',
    'Sightglass Coffee SOMA',
    37.7768,
    -122.4087,
    ST_SetSRID(ST_MakePoint(-122.4087, 37.7768), 4326)::geography,
    '{"source":"category_filter","device":"desktop"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 8. Map Layer Preferences
-- ------------------------------------------------------------------------------

INSERT INTO public.map_layer_preferences (id, user_id, layer_id, visible, opacity, style_overrides)
VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'saved-places-markers',
    true,
    1.0,
    '{"cluster":false,"labelVisibility":true}'::jsonb
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000001',
    'user-vector-features',
    true,
    0.85,
    '{"polygonFill":true,"lineSmoothing":true}'::jsonb
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000001',
    'terrain-contours',
    false,
    0.5,
    '{}'::jsonb
  )
ON CONFLICT (user_id, layer_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 9. Location Shares
-- ------------------------------------------------------------------------------

INSERT INTO public.location_shares (
  id,
  user_id,
  share_token,
  current_location,
  heading,
  speed,
  accuracy,
  battery_level,
  expires_at,
  is_active
) VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'demo_share_token_sf_live',
    ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography,
    45.0,
    1.35, -- m/s
    4.5,  -- meters
    0.89, -- 89% battery
    timezone('utc'::text, now()) + INTERVAL '24 hours',
    true
  )
ON CONFLICT (id) DO NOTHING;
