import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@modern-maps/database';

const DEFAULT_USER_ID = 'default-user';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || DEFAULT_USER_ID;

    const db = getDatabase();
    const collections = await db.listCollections(userId);

    return NextResponse.json({ collections });
  } catch (error) {
    console.error('API /api/collections GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections', details: String(error) },
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
      description,
      color = '#3b82f6',
      icon = 'folder',
      isPublic = false,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Missing collection name' }, { status: 400 });
    }

    const db = getDatabase();
    const newCollection = await db.createCollection({
      userId,
      name,
      description,
      color,
      icon,
      isPublic,
    });

    return NextResponse.json({ collection: newCollection }, { status: 201 });
  } catch (error) {
    console.error('API /api/collections POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create collection', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing collection id' }, { status: 400 });
    }

    const db = getDatabase();
    await db.deleteCollection(id);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('API /api/collections DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete collection', details: String(error) },
      { status: 500 }
    );
  }
}
