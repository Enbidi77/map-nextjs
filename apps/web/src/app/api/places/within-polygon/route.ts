import { NextRequest, NextResponse } from 'next/server';
import { isPointInPolygon } from '@modern-maps/geospatial';
import { PlaceSearchService } from '@modern-maps/place-search';
import type { BoundingBox, Coordinate, PlaceCategory, PlaceSearchResult } from '@modern-maps/types';
import { MOCK_PLACES } from '@/data/mockPlaces';

const searchService = new PlaceSearchService({
  enableCache: true,
  cacheTtlMs: 5 * 60 * 1000,
});

function isValidCoordinate(coord: unknown): coord is Coordinate {
  if (!Array.isArray(coord) || coord.length < 2) return false;
  const [lng, lat] = coord;
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

function isValidPolygon(polygon: unknown): polygon is Coordinate[][] {
  if (!Array.isArray(polygon) || polygon.length < 1) return false;

  return polygon.every((ring) => {
    if (!Array.isArray(ring) || ring.length < 4) return false;
    if (!ring.every(isValidCoordinate)) return false;

    const first = ring[0];
    const last = ring[ring.length - 1];
    if (!first || !last) return false;
    return first[0] === last[0] && first[1] === last[1];
  });
}

function computeBoundingBox(outerRing: Coordinate[]): BoundingBox {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of outerRing) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  return [minLng, minLat, maxLng, maxLat];
}

export async function POST(request: NextRequest) {
  try {
    let body: { polygon?: unknown; category?: string | null };
    try {
      body = (await request.json()) as { polygon?: unknown; category?: string | null };
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const { polygon, category } = body ?? {};

    if (!isValidPolygon(polygon)) {
      return NextResponse.json(
        {
          error:
            'Invalid polygon: expected at least 1 closed ring with at least 4 [lng, lat] coordinates.',
        },
        { status: 400 }
      );
    }

    const outerRing = polygon[0];
    if (!outerRing) {
      return NextResponse.json({ error: 'Invalid polygon outer ring.' }, { status: 400 });
    }

    const bbox = computeBoundingBox(outerRing);
    const proximity: Coordinate = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
    const categories: PlaceCategory[] | undefined =
      typeof category === 'string' && category.trim().length > 0
        ? [category.trim() as PlaceCategory]
        : undefined;

    let candidates: PlaceSearchResult[] = [];
    try {
      candidates = await searchService.search({
        query: category?.trim() || 'place',
        bbox,
        proximity,
        categories,
        limit: 50,
      });
    } catch (err) {
      console.warn('PlaceSearchService within-polygon search failed:', err);
    }

    if (!candidates || candidates.length === 0) {
      candidates = MOCK_PLACES.map((place, idx) => ({
        place,
        relevanceScore: Math.max(0.1, 1 - idx * 0.05),
      }));
    }

    const normalizedCategory =
      typeof category === 'string' && category.trim().length > 0 ? category.trim() : null;

    const results = candidates.filter((item) => {
      if (normalizedCategory && item.place.category !== normalizedCategory) {
        return false;
      }
      try {
        return isPointInPolygon(item.place.coordinates, polygon);
      } catch {
        return false;
      }
    });

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error('API /api/places/within-polygon POST error:', error);
    return NextResponse.json(
      { error: 'Failed to search places within polygon', details: String(error) },
      { status: 500 }
    );
  }
}
