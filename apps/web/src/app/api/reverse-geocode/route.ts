import { NextRequest, NextResponse } from 'next/server';
import { PlaceSearchService } from '@modern-maps/place-search';
import { MOCK_PLACES } from '@/data/mockPlaces';

const searchService = new PlaceSearchService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: 'Missing lat or lng parameter' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    try {
      const place = await searchService.reverse({ coordinate: [lng, lat] });
      if (place) {
        return NextResponse.json({ place });
      }
    } catch {
      // Fallback: nearest mock place
    }

    // Fallback: find nearest place from MOCK_PLACES
    const nearest = MOCK_PLACES.reduce<{ place: (typeof MOCK_PLACES)[0]; dist: number } | null>(
      (acc, p) => {
        const [pLng, pLat] = p.coordinates;
        const d = Math.hypot(pLng - lng, pLat - lat);
        if (!acc || d < acc.dist) {
          return { place: p, dist: d };
        }
        return acc;
      },
      null
    );

    return NextResponse.json({ place: nearest?.place ?? null });
  } catch (error) {
    return NextResponse.json(
      { error: 'Reverse geocoding failed', details: String(error) },
      { status: 500 }
    );
  }
}
