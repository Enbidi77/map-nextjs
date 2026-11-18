import { NextRequest, NextResponse } from 'next/server';
import { RoutingService, type RouteRequest, type TravelMode } from '@modern-maps/routing';

const routingService = new RoutingService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const originStr = searchParams.get('origin');
    const destStr = searchParams.get('destination');
    const mode = (searchParams.get('mode') || 'driving') as TravelMode;
    const alternatives = searchParams.get('alternatives') === 'true';

    if (!originStr || !destStr) {
      return NextResponse.json(
        { error: 'Missing origin or destination coordinates (lng,lat)' },
        { status: 400 }
      );
    }

    const [oLng, oLat] = originStr.split(',').map((s) => parseFloat(s.trim()));
    const [dLng, dLat] = destStr.split(',').map((s) => parseFloat(s.trim()));

    if (
      oLng === undefined ||
      oLat === undefined ||
      dLng === undefined ||
      dLat === undefined ||
      isNaN(oLng) ||
      isNaN(oLat) ||
      isNaN(dLng) ||
      isNaN(dLat)
    ) {
      return NextResponse.json(
        { error: 'Invalid coordinate format. Expected lng,lat' },
        { status: 400 }
      );
    }

    const routeRequest: RouteRequest = {
      origin: [oLng, oLat],
      destination: [dLng, dLat],
      mode,
      alternatives,
    };

    const response = await routingService.calculateRoute(routeRequest);
    return NextResponse.json(response);
  } catch (error) {
    console.error('API /api/directions error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate route', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, mode = 'driving', waypoints, alternatives = false } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Missing origin or destination' },
        { status: 400 }
      );
    }

    const routeRequest: RouteRequest = {
      origin,
      destination,
      mode,
      waypoints,
      alternatives,
    };

    const response = await routingService.calculateRoute(routeRequest);
    return NextResponse.json(response);
  } catch (error) {
    console.error('API POST /api/directions error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate route', details: String(error) },
      { status: 500 }
    );
  }
}
