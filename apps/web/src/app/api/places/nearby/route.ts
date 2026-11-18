import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@modern-maps/database';
import { MOCK_PLACES } from '@/data/mockPlaces';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius') || searchParams.get('radiusMeters') || '5000';
    const category = searchParams.get('category');

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: 'Missing lat or lng query parameter' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const radiusMeters = parseFloat(radiusStr);

    // Query database spatial index
    try {
      const db = getDatabase();
      const dbResults = await db.findNearbyPlaces(
        'default-user',
        [lng, lat],
        radiusMeters
      );

      if (dbResults.length > 0) {
        const filtered = category
          ? dbResults.filter((p) => p.category === category)
          : dbResults;
        return NextResponse.json({ places: filtered });
      }
    } catch {
      // Fallback to in-memory mock places
    }

    // Fallback: calculate distance from MOCK_PLACES
    const R = 6371000; // meters
    const nearby = MOCK_PLACES.map((p) => {
      const [pLng, pLat] = p.coordinates;
      const dLat = ((pLat - lat) * Math.PI) / 180;
      const dLon = ((pLng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((pLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = Math.round(R * c);
      return { place: p, distanceMeters: dist };
    })
      .filter((item) => item.distanceMeters <= radiusMeters)
      .filter((item) => (category ? item.place.category === category : true))
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .map((item) => item.place);

    return NextResponse.json({ places: nearby });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch nearby places', details: String(error) },
      { status: 500 }
    );
  }
}
