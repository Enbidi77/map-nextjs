import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PLACES } from '@/data/mockPlaces';
import { getDatabase } from '@modern-maps/database';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check mock places
    const foundMock = MOCK_PLACES.find((p) => p.id === id);
    if (foundMock) {
      return NextResponse.json({ place: foundMock });
    }

    // Check database saved places
    try {
      const db = getDatabase();
      const saved = await db.getSavedPlaceById(id);
      if (saved) {
        return NextResponse.json({ place: saved });
      }
    } catch {
      // ignore
    }

    return NextResponse.json(
      { error: 'Place not found' },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch place', details: String(error) },
      { status: 500 }
    );
  }
}
