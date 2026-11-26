import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, type MapFeatureType, type UserMapFeature } from '@modern-maps/database';

const DEFAULT_USER_ID = 'default-user';
const MAX_BATCH_SIZE = 500;

interface RawGeometry {
  type: string;
  coordinates: unknown;
}

interface RawFeature {
  type?: string;
  id?: string | number;
  geometry?: RawGeometry;
  properties?: Record<string, unknown> | null;
}

const ALLOWED_GEOMETRY_TYPES = new Set([
  'point',
  'linestring',
  'polygon',
  'multipoint',
  'multilinestring',
  'multipolygon',
]);

function validateCoordinates(coords: unknown): boolean {
  if (!Array.isArray(coords) || coords.length === 0) return false;

  if (
    coords.length >= 2 &&
    typeof coords[0] === 'number' &&
    typeof coords[1] === 'number'
  ) {
    const lng = coords[0];
    const lat = coords[1];
    return (
      Number.isFinite(lng) &&
      Number.isFinite(lat) &&
      lng >= -180 &&
      lng <= 180 &&
      lat >= -90 &&
      lat <= 90
    );
  }

  return coords.every((child) => validateCoordinates(child));
}

function normalizeFeatureType(geometryType: string): MapFeatureType | null {
  const lower = geometryType.toLowerCase();
  if (lower === 'point' || lower === 'multipoint') return 'point';
  if (lower === 'linestring' || lower === 'multilinestring') return 'linestring';
  if (lower === 'polygon' || lower === 'multipolygon') return 'polygon';
  return null;
}

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const rawGeojson = (body.geojson ?? body) as Record<string, unknown>;
    if (!rawGeojson || typeof rawGeojson !== 'object') {
      return NextResponse.json({ error: 'Missing or invalid geojson payload' }, { status: 400 });
    }

    let featureList: RawFeature[] = [];

    if (rawGeojson.type === 'FeatureCollection' && Array.isArray(rawGeojson.features)) {
      featureList = rawGeojson.features as RawFeature[];
    } else if (rawGeojson.type === 'Feature' && rawGeojson.geometry) {
      featureList = [rawGeojson as unknown as RawFeature];
    } else if (typeof rawGeojson.type === 'string' && rawGeojson.coordinates) {
      featureList = [
        {
          type: 'Feature',
          geometry: rawGeojson as unknown as RawGeometry,
          properties: (body.properties as Record<string, unknown>) || {},
        },
      ];
    } else {
      return NextResponse.json(
        {
          error:
            'Unrecognized GeoJSON format. Expected FeatureCollection, Feature, or Geometry.',
        },
        { status: 400 }
      );
    }

    if (featureList.length === 0) {
      return NextResponse.json({ features: [], importedCount: 0 }, { status: 201 });
    }

    if (featureList.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        {
          error: `Batch size exceeds limit of ${MAX_BATCH_SIZE} features.`,
        },
        { status: 400 }
      );
    }

    // Validate all features before persisting or forwarding
    const validFeatures: Array<{
      name: string;
      featureType: MapFeatureType;
      geometry: RawGeometry;
      properties: Record<string, unknown>;
    }> = [];
    const errors: string[] = [];

    for (let i = 0; i < featureList.length; i++) {
      const feat = featureList[i];
      if (!feat?.geometry || typeof feat.geometry.type !== 'string' || !feat.geometry.coordinates) {
        errors.push(`Feature #${i}: Missing valid geometry or coordinates.`);
        continue;
      }

      const lowerType = feat.geometry.type.toLowerCase();
      if (!ALLOWED_GEOMETRY_TYPES.has(lowerType)) {
        errors.push(`Feature #${i}: Unsupported geometry type "${feat.geometry.type}".`);
        continue;
      }

      if (!validateCoordinates(feat.geometry.coordinates)) {
        errors.push(`Feature #${i}: Invalid coordinate range [-180, 180] / [-90, 90].`);
        continue;
      }

      const featureType = normalizeFeatureType(feat.geometry.type);
      if (!featureType) {
        errors.push(`Feature #${i}: Unsupported feature type "${feat.geometry.type}".`);
        continue;
      }

      const props = (feat.properties && typeof feat.properties === 'object' ? feat.properties : {}) as Record<string, unknown>;
      const name = String(
        props.name || props.title || feat.id || `Imported ${feat.geometry.type} #${i + 1}`
      ).slice(0, 200);

      validFeatures.push({
        name,
        featureType,
        geometry: feat.geometry,
        properties: props,
      });
    }

    if (validFeatures.length === 0) {
      return NextResponse.json(
        { error: 'No valid GeoJSON features found.', details: errors },
        { status: 400 }
      );
    }

    // Forward to Supabase Edge Function `import-geojson` when configured & authenticated
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const authHeader = request.headers.get('Authorization');

    if (supabaseUrl && authHeader) {
      try {
        const edgeUrl = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/import-geojson`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        };
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          headers.apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        }

        const edgeResponse = await fetch(edgeUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ geojson: rawGeojson }),
        });

        const edgeData = (await edgeResponse.json()) as {
          features?: UserMapFeature[];
          importedCount?: number;
          error?: string;
        };

        if (!edgeResponse.ok) {
          return NextResponse.json(
            { error: edgeData.error || 'Edge function import failed' },
            { status: edgeResponse.status }
          );
        }

        return NextResponse.json(
          {
            features: Array.isArray(edgeData.features) ? edgeData.features : [],
            importedCount: edgeData.importedCount ?? validFeatures.length,
          },
          { status: 201 }
        );
      } catch (edgeError) {
        console.warn('Edge function import-geojson unreachable, falling back to DB:', edgeError);
      }
    }

    // Fallback: persist each valid feature via getDatabase().createMapFeature(...)
    const userId = typeof body.userId === 'string' && body.userId ? body.userId : DEFAULT_USER_ID;
    const db = getDatabase();
    const createdFeatures: UserMapFeature[] = [];

    for (const item of validFeatures) {
      const created = await db.createMapFeature({
        userId,
        name: item.name,
        featureType: item.featureType,
        geojson: item.geometry as unknown as Record<string, unknown>,
        properties: item.properties,
      });
      createdFeatures.push(created);
    }

    return NextResponse.json(
      {
        features: createdFeatures,
        importedCount: createdFeatures.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API /api/map-features/import POST error:', error);
    return NextResponse.json(
      { error: 'Failed to import GeoJSON features', details: String(error) },
      { status: 500 }
    );
  }
}
