import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/map-features/import/route';

const mockCreateMapFeature = vi.fn();

vi.mock('@modern-maps/database', () => ({
  getDatabase: vi.fn(() => ({
    createMapFeature: mockCreateMapFeature,
  })),
}));

describe('POST /api/map-features/import', () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    mockCreateMapFeature.mockImplementation(async (input) => ({
      id: `feat-${Math.random().toString(36).slice(2, 8)}`,
      userId: input.userId ?? 'default-user',
      name: input.name,
      featureType: input.featureType,
      geojson: input.geojson,
      properties: input.properties ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  it('imports a GeoJSON FeatureCollection via database fallback and returns 201', async () => {
    const req = new NextRequest('http://localhost:3000/api/map-features/import', {
      method: 'POST',
      body: JSON.stringify({
        geojson: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [105.8342, 21.0278] },
              properties: { name: 'Hanoi Point' },
            },
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [105.8, 21.0],
                  [105.9, 21.1],
                ],
              },
              properties: { title: 'Hanoi Line' },
            },
          ],
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.importedCount).toBe(2);
    expect(data.features).toHaveLength(2);
    expect(mockCreateMapFeature).toHaveBeenCalledTimes(2);
    expect(mockCreateMapFeature).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: 'Hanoi Point',
        featureType: 'point',
      })
    );
    expect(mockCreateMapFeature).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        name: 'Hanoi Line',
        featureType: 'linestring',
      })
    );
  });

  it('imports a single GeoJSON Feature or Geometry', async () => {
    const req = new NextRequest('http://localhost:3000/api/map-features/import', {
      method: 'POST',
      body: JSON.stringify({
        geojson: {
          type: 'Polygon',
          coordinates: [
            [
              [105.8, 21.0],
              [105.9, 21.0],
              [105.9, 21.1],
              [105.8, 21.1],
              [105.8, 21.0],
            ],
          ],
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.importedCount).toBe(1);
    expect(data.features[0].featureType).toBe('polygon');
  });

  it('returns 400 for unrecognized GeoJSON or out-of-range coordinates', async () => {
    const badFormatReq = new NextRequest('http://localhost:3000/api/map-features/import', {
      method: 'POST',
      body: JSON.stringify({ geojson: { foo: 'bar' } }),
    });
    const badFormatRes = await POST(badFormatReq);
    expect(badFormatRes.status).toBe(400);

    const badCoordsReq = new NextRequest('http://localhost:3000/api/map-features/import', {
      method: 'POST',
      body: JSON.stringify({
        geojson: {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [250, 95] },
          properties: {},
        },
      }),
    });
    const badCoordsRes = await POST(badCoordsReq);
    expect(badCoordsRes.status).toBe(400);
  });

  it('forwards to Supabase Edge Function import-geojson when NEXT_PUBLIC_SUPABASE_URL and Authorization are present', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          importedCount: 1,
          features: [{ id: 'edge-1', name: 'Edge Point', featureType: 'point' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const req = new NextRequest('http://localhost:3000/api/map-features/import', {
      method: 'POST',
      headers: { Authorization: 'Bearer user-jwt-token' },
      body: JSON.stringify({
        geojson: {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [105.8342, 21.0278] },
          properties: { name: 'Edge Point' },
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.importedCount).toBe(1);
    expect(data.features).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.supabase.co/functions/v1/import-geojson',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer user-jwt-token',
          apikey: 'anon-key',
        }),
      })
    );
    expect(mockCreateMapFeature).not.toHaveBeenCalled();
  });
});
