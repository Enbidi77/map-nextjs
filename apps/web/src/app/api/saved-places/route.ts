import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@modern-maps/database';
import { MOCK_PLACES } from '@/data/mockPlaces';

const DEFAULT_USER_ID = 'default-user';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || DEFAULT_USER_ID;

    const db = getDatabase();
    const saved = await db.listSavedPlaces(userId);

    // If database returned places, return them, else fallback to initial mock saved places
    if (saved && saved.length > 0) {
      return NextResponse.json({ places: saved });
    }

    return NextResponse.json({ places: [MOCK_PLACES[0]!, MOCK_PLACES[3]!] });
  } catch (error) {
    console.error('API /api/saved-places GET error:', error);
    return NextResponse.json({ places: [MOCK_PLACES[0]!, MOCK_PLACES[3]!] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId = DEFAULT_USER_ID,
      name,
      formattedAddress = '',
      category = 'other',
      latitude,
      longitude,
      notes,
      customColor,
      customIcon,
    } = body;

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing name, latitude, or longitude' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const newPlace = await db.createSavedPlace({
      userId,
      name,
      formattedAddress,
      category,
      latitude,
      longitude,
      notes,
      customColor,
      customIcon,
    });

    return NextResponse.json({ place: newPlace }, { status: 201 });
  } catch (error) {
    console.error('API /api/saved-places POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save place', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const db = getDatabase();
    await db.deleteSavedPlace(id);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('API /api/saved-places DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete place', details: String(error) },
      { status: 500 }
    );
  }
}
