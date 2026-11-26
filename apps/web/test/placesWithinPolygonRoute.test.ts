import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/places/within-polygon/route';

const { mockSearch } = vi.hoisted(() => ({
  mockSearch: vi.fn(),
}));

vi.mock('@modern-maps/place-search', () => ({
  PlaceSearchService: vi.fn().mockImplementation(() => ({
    search: mockSearch,
  })),
}));

// Bounding box around Hanoi ([105.75, 20.95] to [105.95, 21.10])
const hanoiPolygon = [
  [
    [105.75, 20.95],
    [105.95, 20.95],
    [105.95, 21.10],
    [105.75, 21.10],
    [105.75, 20.95],
  ],
];

describe('POST /api/places/within-polygon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when polygon is missing, has < 4 coordinates, or is not closed', async () => {
    const unclosedReq = new NextRequest('http://localhost:3000/api/places/within-polygon', {
      method: 'POST',
      body: JSON.stringify({
        polygon: [
          [
            [105.75, 20.95],
            [105.95, 20.95],
            [105.95, 21.10],
            [105.75, 21.10],
          ],
        ],
      }),
    });
    expect((await POST(unclosedReq)).status).toBe(400);

    const tooFewReq = new NextRequest('http://localhost:3000/api/places/within-polygon', {
      method: 'POST',
      body: JSON.stringify({
        polygon: [
          [
            [105.75, 20.95],
            [105.95, 20.95],
            [105.75, 20.95],
          ],
        ],
      }),
    });
    expect((await POST(tooFewReq)).status).toBe(400);
  });

  it('filters PlaceSearchService results strictly by polygon and optional category', async () => {
    mockSearch.mockResolvedValueOnce([
      {
        place: {
          id: 'inside-food',
          name: 'Pho Inside',
          category: 'food_drink',
          coordinates: [105.8342, 21.0278],
          address: 'Hanoi',
        },
        relevanceScore: 0.9,
      },
      {
        place: {
          id: 'inside-nature',
          name: 'Lake Inside',
          category: 'nature',
          coordinates: [105.85, 21.03],
          address: 'Hanoi',
        },
        relevanceScore: 0.85,
      },
      {
        place: {
          id: 'outside-food',
          name: 'Saigon Pho',
          category: 'food_drink',
          coordinates: [106.6297, 10.8231],
          address: 'HCMC',
        },
        relevanceScore: 0.8,
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/places/within-polygon', {
      method: 'POST',
      body: JSON.stringify({
        polygon: hanoiPolygon,
        category: 'food_drink',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        bbox: [105.75, 20.95, 105.95, 21.1],
        categories: ['food_drink'],
      })
    );
    expect(data.results).toHaveLength(1);
    expect(data.results[0].place.id).toBe('inside-food');
  });

  it('falls back to MOCK_PLACES when PlaceSearchService returns empty', async () => {
    mockSearch.mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost:3000/api/places/within-polygon', {
      method: 'POST',
      body: JSON.stringify({
        polygon: hanoiPolygon,
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.results.length).toBeGreaterThan(0);
    // All returned results must be strictly inside hanoiPolygon
    for (const r of data.results) {
      const [lng, lat] = r.place.coordinates;
      expect(lng).toBeGreaterThanOrEqual(105.75);
      expect(lng).toBeLessThanOrEqual(105.95);
      expect(lat).toBeGreaterThanOrEqual(20.95);
      expect(lat).toBeLessThanOrEqual(21.1);
    }
  });
});
