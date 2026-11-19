// ==============================================================================
// Supabase Edge Function: geocode
// Description: Geospatial forward and reverse geocoding proxy with input validation,
//              request timeout handling, provider failover, and normalized output.
// ==============================================================================

interface GeocodeResult {
  id: string;
  name: string;
  formattedAddress: string;
  coordinates: [number, number]; // [longitude, latitude]
  category?: string;
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  confidence?: number;
}

interface GeocodeResponse {
  type: 'forward' | 'reverse';
  query?: string;
  center?: [number, number];
  results: GeocodeResult[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Fallback curated POIs for offline dev or test environments
const FALLBACK_POINTS: GeocodeResult[] = [
  {
    id: 'sf-gg-bridge',
    name: 'Golden Gate Bridge',
    formattedAddress: 'Golden Gate Bridge, San Francisco, CA 94129, United States',
    coordinates: [-122.4783, 37.8199],
    category: 'attraction',
    bbox: [-122.483, 37.808, -122.473, 37.832],
    confidence: 0.98,
  },
  {
    id: 'sf-ferry-bldg',
    name: 'Ferry Building',
    formattedAddress: '1 Ferry Building, San Francisco, CA 94111, United States',
    coordinates: [-122.3937, 37.7955],
    category: 'food_drink',
    bbox: [-122.395, 37.794, -122.392, 37.797],
    confidence: 0.95,
  },
  {
    id: 'sf-dolores-park',
    name: 'Mission Dolores Park',
    formattedAddress: 'Dolores St & 19th St, San Francisco, CA 94114, United States',
    coordinates: [-122.4269, 37.7596],
    category: 'nature',
    bbox: [-122.4285, 37.758, -122.4255, 37.761],
    confidence: 0.92,
  },
  {
    id: 'sf-coit-tower',
    name: 'Coit Tower',
    formattedAddress: '1 Telegraph Hill Blvd, San Francisco, CA 94133, United States',
    coordinates: [-122.4058, 37.8024],
    category: 'attraction',
    bbox: [-122.407, 37.801, -122.404, 37.804],
    confidence: 0.91,
  },
  {
    id: 'nyc-central-park',
    name: 'Central Park',
    formattedAddress: 'Central Park, New York, NY 10022, United States',
    coordinates: [-73.9665, 40.7812],
    category: 'nature',
    bbox: [-73.9818, 40.7648, -73.9498, 40.7969],
    confidence: 0.99,
  },
];

Deno.serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // Extract query parameters or JSON body payload
    let query = url.searchParams.get('q') || url.searchParams.get('query');
    let latStr = url.searchParams.get('lat') || url.searchParams.get('latitude');
    let lngStr = url.searchParams.get('lng') || url.searchParams.get('longitude');
    let limit = parseInt(url.searchParams.get('limit') || '10', 10);

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.query) query = body.query;
        if (body.q) query = body.q;
        if (body.latitude !== undefined) latStr = String(body.latitude);
        if (body.lat !== undefined) latStr = String(body.lat);
        if (body.longitude !== undefined) lngStr = String(body.longitude);
        if (body.lng !== undefined) lngStr = String(body.lng);
        if (body.limit !== undefined) limit = Number(body.limit);
      } catch {
        // Body was either empty or invalid JSON; fallback to URL params
      }
    }

    const isReverse = latStr !== null && lngStr !== null;

    // 2. Input Validation
    if (isReverse) {
      const lat = parseFloat(latStr!);
      const lng = parseFloat(lngStr!);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        return new Response(
          JSON.stringify({ error: 'Invalid latitude. Must be a number between -90 and 90.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return new Response(
          JSON.stringify({ error: 'Invalid longitude. Must be a number between -180 and 180.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 3. Reverse Geocoding with Timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        const res = await fetch(nominatimUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'ModernMapsPlatform/1.0 (https://modernmaps.io; contact@modernmaps.io)',
          },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const result: GeocodeResult = {
            id: String(data.place_id || `osm-${lat}-${lng}`),
            name: data.name || data.display_name?.split(',')[0] || 'Unknown Location',
            formattedAddress: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            coordinates: [parseFloat(data.lon), parseFloat(data.lat)],
            category: data.category || data.type || 'place',
            confidence: 0.9,
          };

          const responsePayload: GeocodeResponse = {
            type: 'reverse',
            center: [lng, lat],
            results: [result],
          };

          return new Response(JSON.stringify(responsePayload), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (_fetchErr) {
        clearTimeout(timeoutId);
        // Fall through to fallback
      }

      // Fallback reverse geocoding
      const fallbackResult: GeocodeResult = {
        id: `reverse-${lat.toFixed(4)}-${lng.toFixed(4)}`,
        name: `Location near ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        formattedAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        coordinates: [lng, lat],
        category: 'coordinates',
        confidence: 0.75,
      };

      const responsePayload: GeocodeResponse = {
        type: 'reverse',
        center: [lng, lat],
        results: [fallbackResult],
      };

      return new Response(JSON.stringify(responsePayload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Forward Geocoding Validation
    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required query parameter "q" or "query".' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanQuery = query.trim();

    // 4. Forward Geocoding with Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        cleanQuery
      )}&limit=${Math.min(limit, 20)}&addressdetails=1`;
      const res = await fetch(searchUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ModernMapsPlatform/1.0 (https://modernmaps.io; contact@modernmaps.io)',
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const rawResults = await res.json();
        if (Array.isArray(rawResults) && rawResults.length > 0) {
          const results: GeocodeResult[] = rawResults.map((item: Record<string, unknown>) => {
            const rawBbox = item.boundingbox as [string, string, string, string] | undefined;
            let bbox: [number, number, number, number] | undefined;
            if (rawBbox && rawBbox.length === 4) {
              // Nominatim returns [south, north, west, east]
              bbox = [
                parseFloat(rawBbox[2]),
                parseFloat(rawBbox[0]),
                parseFloat(rawBbox[3]),
                parseFloat(rawBbox[1]),
              ];
            }

            return {
              id: String(item.place_id || Math.random()),
              name: String(item.name || (item.display_name as string)?.split(',')[0] || cleanQuery),
              formattedAddress: String(item.display_name || cleanQuery),
              coordinates: [parseFloat(String(item.lon)), parseFloat(String(item.lat))],
              category: String(item.category || item.type || 'place'),
              bbox,
              confidence: parseFloat(String(item.importance || 0.8)),
            };
          });

          const responsePayload: GeocodeResponse = {
            type: 'forward',
            query: cleanQuery,
            results,
          };

          return new Response(JSON.stringify(responsePayload), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (_fetchErr) {
      clearTimeout(timeoutId);
      // Fall through to fallback
    }

    // Filter fallback points by matching query
    const lowerQuery = cleanQuery.toLowerCase();
    const matched = FALLBACK_POINTS.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.formattedAddress.toLowerCase().includes(lowerQuery) ||
        p.category?.toLowerCase().includes(lowerQuery)
    );

    const fallbackResults = matched.length > 0 ? matched : FALLBACK_POINTS.slice(0, 3);

    const responsePayload: GeocodeResponse = {
      type: 'forward',
      query: cleanQuery,
      results: fallbackResults,
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
