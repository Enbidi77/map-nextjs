// ==============================================================================
// Supabase Edge Function: import-geojson
// Description: Validates, sanitizes, and batch ingests GeoJSON FeatureCollections,
//              Features, and Geometries into the user_map_features database table.
// ==============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface GeoJSONGeometry {
  type: string;
  coordinates: unknown;
}

interface GeoJSONFeature {
  type: 'Feature';
  id?: string | number;
  geometry: GeoJSONGeometry;
  properties?: Record<string, unknown>;
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// Deep coordinate validator
function validateCoordinates(coords: unknown, depth = 0): boolean {
  if (!Array.isArray(coords)) return false;

  // Leaf coordinate pair [lng, lat]
  if (
    coords.length >= 2 &&
    typeof coords[0] === 'number' &&
    typeof coords[1] === 'number' &&
    !isNaN(coords[0]) &&
    !isNaN(coords[1])
  ) {
    const lng = coords[0];
    const lat = coords[1];
    return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
  }

  // Recursive check for LineStrings, Polygons, MultiPolygons
  return coords.every((child) => validateCoordinates(child, depth + 1));
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Authenticate user token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid auth session.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse JSON body
    let rawPayload: unknown;
    try {
      rawPayload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Malformed JSON payload.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!rawPayload || typeof rawPayload !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid GeoJSON payload.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize input to array of features
    const parsedPayload = rawPayload as Record<string, unknown>;
    const targetGeoJSON = (parsedPayload.geojson || parsedPayload) as Record<string, unknown>;

    let featureList: GeoJSONFeature[] = [];

    if (targetGeoJSON.type === 'FeatureCollection' && Array.isArray(targetGeoJSON.features)) {
      featureList = targetGeoJSON.features as GeoJSONFeature[];
    } else if (targetGeoJSON.type === 'Feature' && targetGeoJSON.geometry) {
      featureList = [targetGeoJSON as unknown as GeoJSONFeature];
    } else if (typeof targetGeoJSON.type === 'string' && targetGeoJSON.coordinates) {
      // Raw Geometry wrapped as Feature
      featureList = [
        {
          type: 'Feature',
          geometry: targetGeoJSON as unknown as GeoJSONGeometry,
          properties: (parsedPayload.properties as Record<string, unknown>) || {},
        },
      ];
    } else {
      return new Response(
        JSON.stringify({
          error: 'Unrecognized GeoJSON format. Expected FeatureCollection, Feature, or Geometry.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (featureList.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          totalFeatures: 0,
          importedCount: 0,
          errorCount: 0,
          errors: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Safety limit per batch
    const MAX_BATCH_SIZE = 500;
    if (featureList.length > MAX_BATCH_SIZE) {
      return new Response(
        JSON.stringify({
          error: `Batch size exceeds limit of ${MAX_BATCH_SIZE} features. Please split your file.`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validInserts: Array<{
      user_id: string;
      name: string;
      feature_type: string;
      geojson: unknown;
      properties: Record<string, unknown>;
    }> = [];
    const errors: string[] = [];

    const allowedTypes = new Set([
      'point',
      'linestring',
      'polygon',
      'multipoint',
      'multilinestring',
      'multipolygon',
      'geometrycollection',
    ]);

    for (let i = 0; i < featureList.length; i++) {
      const feat = featureList[i];
      if (!feat.geometry || !feat.geometry.type || !feat.geometry.coordinates) {
        errors.push(`Feature #${i}: Missing valid geometry or coordinates.`);
        continue;
      }

      const geomType = feat.geometry.type.toLowerCase();
      if (!allowedTypes.has(geomType)) {
        errors.push(`Feature #${i}: Unsupported geometry type "${feat.geometry.type}".`);
        continue;
      }

      if (!validateCoordinates(feat.geometry.coordinates)) {
        errors.push(`Feature #${i}: Invalid coordinate range [-180, 180] / [-90, 90].`);
        continue;
      }

      const props = feat.properties || {};
      const featureName = String(
        props.name || props.title || feat.id || `Imported ${feat.geometry.type} #${i + 1}`
      ).slice(0, 200);

      validInserts.push({
        user_id: user.id,
        name: featureName,
        feature_type: geomType,
        geojson: feat.geometry,
        properties: props,
      });
    }

    let insertedCount = 0;

    if (validInserts.length > 0) {
      const { data, error: insertError } = await supabase
        .from('user_map_features')
        .insert(validInserts)
        .select('id');

      if (insertError) {
        return new Response(
          JSON.stringify({
            error: 'Database insertion error',
            details: insertError.message,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      insertedCount = data?.length || 0;
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalFeatures: featureList.length,
        importedCount: insertedCount,
        errorCount: errors.length,
        errors,
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
