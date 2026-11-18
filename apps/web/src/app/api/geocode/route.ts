import { NextRequest, NextResponse } from 'next/server';
import { PlaceSearchService } from '@modern-maps/place-search';
import { MOCK_PLACES } from '@/data/mockPlaces';

const searchService = new PlaceSearchService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('address') || '';

    if (!query.trim()) {
      return NextResponse.json(
        { error: 'Missing address or query parameter' },
        { status: 400 }
      );
    }

    try {
      const results = await searchService.search({ query, limit: 5 });
      return NextResponse.json({ results });
    } catch {
      const q = query.toLowerCase().trim();
      const matched = MOCK_PLACES.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
      );
      return NextResponse.json({
        results: matched.map((p, idx) => ({
          place: p,
          relevanceScore: 1 - idx * 0.1,
        })),
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Geocoding failed', details: String(error) },
      { status: 500 }
    );
  }
}
