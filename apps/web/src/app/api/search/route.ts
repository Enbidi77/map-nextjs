import { NextRequest, NextResponse } from 'next/server';
import { PlaceSearchService } from '@modern-maps/place-search';
import { MOCK_PLACES } from '@/data/mockPlaces';
import type { PlaceCategory, PlaceSearchResult } from '@modern-maps/types';

// Singleton search service
const searchService = new PlaceSearchService({
  enableCache: true,
  cacheTtlMs: 5 * 60 * 1000,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const categoriesParam = searchParams.get('categories') || searchParams.get('category');
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    if (!query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const proximity: [number, number] | undefined =
      latParam && lngParam
        ? [parseFloat(lngParam), parseFloat(latParam)]
        : undefined;

    const categories: PlaceCategory[] | undefined = categoriesParam
      ? (categoriesParam.split(',').filter(Boolean) as PlaceCategory[])
      : undefined;

    // Search via PlaceSearchService (Nominatim / OSM)
    let results: PlaceSearchResult[] = [];
    try {
      results = await searchService.search({
        query,
        limit,
        proximity,
        categories,
      });
    } catch (err) {
      console.warn('PlaceSearchService search failed:', err);
    }

    // If no results from live OSM Nominatim, fallback to matching local curated places
    if (!results || results.length === 0) {
      const q = query.toLowerCase().trim();
      const normalizedQ = q.replace(/\s+/g, '');
      const matched = MOCK_PLACES.filter((p) => {
        const matchName = p.name.toLowerCase().includes(q);
        const matchAddress = p.address.toLowerCase().includes(q);
        const matchCountry = (p.country?.toLowerCase() ?? '').includes(q);
        const matchCity = (p.city?.toLowerCase() ?? '').includes(q);
        const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        const normalizedName = p.name.toLowerCase().replace(/\s+/g, '');
        const normalizedAddress = p.address.toLowerCase().replace(/\s+/g, '');
        const matchNormalized = normalizedName.includes(normalizedQ) || normalizedAddress.includes(normalizedQ);
        const matchCat = categories ? categories.includes(p.category) : true;
        return (matchName || matchAddress || matchCountry || matchCity || matchTags || matchNormalized) && matchCat;
      });

      results = matched.map((p, idx) => ({
        place: p,
        relevanceScore: Math.max(0.1, 1 - idx * 0.1),
      }));
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('API /api/search error:', error);
    return NextResponse.json(
      { error: 'Failed to search places', details: String(error) },
      { status: 500 }
    );
  }
}
