import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@modern-maps/database';

const DEFAULT_USER_ID = 'default-user';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || DEFAULT_USER_ID;

    const db = getDatabase();
    const features = await db.listMapFeatures(userId);

    return NextResponse.json({ features });
  } catch (error) {
    console.error('API /api/map-features GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch map features', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId = DEFAULT_USER_ID,
      name,
      featureType,
      geojson,
      properties,
    } = body;

    if (!name || !featureType || !geojson) {
      return NextResponse.json(
        { error: 'Missing required fields: name, featureType, or geojson' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const newFeature = await db.createMapFeature({
      userId,
      name,
      featureType,
      geojson,
      properties,
    });

    return NextResponse.json({ feature: newFeature }, { status: 201 });
  } catch (error) {
    console.error('API /api/map-features POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save map feature', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing feature id' }, { status: 400 });
    }

    const db = getDatabase();
    await db.deleteMapFeature(id);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('API /api/map-features DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete map feature', details: String(error) },
      { status: 500 }
    );
  }
}
