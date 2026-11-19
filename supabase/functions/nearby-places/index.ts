// ==============================================================================
// Supabase Edge Function: nearby-places
// Description: Discovers points of interest within a given radius of a center
//              coordinate, invoking PostGIS spatial RPC functions with fallback.
// ==============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface NearbyPlace {
  id: string;
  name: string;
  formattedAddress: string;
  category: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  rating?: number;
  notes?: string;
  customColor?: string;
  customIcon?: string;
  metadata?: Record<string, unknown>;
}

// Haversine distance in meters
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    let latStr = url.searchParams.get('lat') || url.searchParams.get('latitude');
    let lngStr = url.searchParams.get('lng') || url.searchParams.get('longitude');
    let radiusStr = url.searchParams.get('radius') || url.searchParams.get('radiusMeters');
    let category = url.searchParams.get('category');
    let limitStr = url.searchParams.get('limit') || '20';

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.latitude !== undefined) latStr = String(body.latitude);
        if (body.lat !== undefined) latStr = String(body.lat);
        if (body.longitude !== undefined) lngStr = String(body.longitude);
        if (body.lng !== undefined) lngStr = String(body.lng);
        if (body.radius !== undefined) radiusStr = String(body.radius);
        if (body.radiusMeters !== undefined) radiusStr = String(body.radiusMeters);
        if (body.category) category = body.category;
        if (body.limit !== undefined) limitStr = String(body.limit);
      } catch {
        // Fallback to URL search parameters
      }
    }

    // Input Validation
    if (!latStr || !lngStr) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters "lat" and "lng".' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const radiusMeters = parseFloat(radiusStr || '5000');
    const limit = Math.min(parseInt(limitStr, 10) || 20, 100);

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      return new Response(
        JSON.stringify({ error: 'Coordinates out of valid range: lat [-90, 90], lng [-180, 180].' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isNaN(radiusMeters) || radiusMeters <= 0) {
      return new Response(
        JSON.stringify({ error: 'radiusMeters must be a positive number.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const authHeader = req.headers.get('Authorization');

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    // Execute PostGIS RPC function: nearby_saved_places
    const { data, error } = await supabase.rpc('nearby_saved_places', {
      center_lng: lng,
      center_lat: lat,
      radius_meters: radiusMeters,
      max_results: limit,
      category_filter: category || null,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      const places: NearbyPlace[] = data.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        name: String(row.name),
        formattedAddress: String(row.formatted_address),
        category: String(row.category),
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        distanceMeters: Number(row.distance_meters),
        rating: row.rating ? Number(row.rating) : undefined,
        notes: row.notes ? String(row.notes) : undefined,
        customColor: row.custom_color ? String(row.custom_color) : undefined,
        customIcon: row.custom_icon ? String(row.custom_icon) : undefined,
        metadata: (row.metadata as Record<string, unknown>) || {},
      }));

      return new Response(
        JSON.stringify({
          center: [lng, lat],
          radiusMeters,
          count: places.length,
          places,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback POI Discovery using Overpass API if DB has no nearby places
    try {
      const overpassQuery = `[out:json][timeout:5];
        (
          node["amenity"](around:${Math.min(radiusMeters, 2000)},${lat},${lng});
          node["tourism"](around:${Math.min(radiusMeters, 2000)},${lat},${lng});
          node["leisure"](around:${Math.min(radiusMeters, 2000)},${lat},${lng});
        );
        out body ${limit};`;

      const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });

      if (overpassRes.ok) {
        const overpassData = await overpassRes.json();
        if (Array.isArray(overpassData.elements) && overpassData.elements.length > 0) {
          const fallbackPlaces: NearbyPlace[] = overpassData.elements
            .filter((el: Record<string, unknown>) => el.tags && (el.tags as Record<string, string>).name)
            .slice(0, limit)
            .map((el: Record<string, unknown>) => {
              const tags = el.tags as Record<string, string>;
              const placeLat = Number(el.lat);
              const placeLon = Number(el.lon);
              const dist = haversineMeters(lat, lng, placeLat, placeLon);

              return {
                id: `osm-${el.id}`,
                name: tags.name,
                formattedAddress: `${tags['addr:street'] || tags.name}, ${tags['addr:city'] || ''}`,
                category: tags.amenity || tags.tourism || tags.leisure || 'other',
                latitude: placeLat,
                longitude: placeLon,
                distanceMeters: dist,
                metadata: tags,
              };
            });

          return new Response(
            JSON.stringify({
              center: [lng, lat],
              radiusMeters,
              count: fallbackPlaces.length,
              places: fallbackPlaces,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (_overpassErr) {
      // Return empty list if external fallback fails
    }

    return new Response(
      JSON.stringify({
        center: [lng, lat],
        radiusMeters,
        count: 0,
        places: [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
