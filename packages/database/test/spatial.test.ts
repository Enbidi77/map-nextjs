import { describe, it, expect, beforeEach } from 'vitest';
import type { Coordinate, BoundingBox } from '@modern-maps/types';
import { InMemoryDatabaseAdapter } from '../src/adapters/in-memory.js';
import { findNearbyPlaces, findPlacesInBBox } from '../src/queries/spatial.js';

describe('Spatial Query Functions', () => {
  let db: InMemoryDatabaseAdapter;

  // Ferry Building coordinates: [-122.3937, 37.7955]
  const ferryBuildingCoord: Coordinate = [-122.3937, 37.7955];

  beforeEach(() => {
    db = new InMemoryDatabaseAdapter();
  });

  it('findNearbyPlaces returns places within radius ordered by distance ascending', async () => {
    // Search within 2km (2000m) of Ferry Building
    const nearby = await findNearbyPlaces(db, null, ferryBuildingCoord, 2000);

    expect(nearby.length).toBeGreaterThan(0);
    // Ferry building should be closest (0m)
    expect(nearby[0]!.id).toBe('place-ferry-building');
    expect(nearby[0]!.distanceMeters).toBeLessThan(100);

    // Coit Tower is ~1.5km away and should be included
    const coitTower = nearby.find((p) => p.id === 'place-coit-tower');
    expect(coitTower).toBeDefined();
    expect(coitTower!.distanceMeters).toBeGreaterThan(1000);
    expect(coitTower!.distanceMeters).toBeLessThan(2000);

    // Golden Gate Bridge is ~8km away and should NOT be in a 2km radius
    const goldenGate = nearby.find((p) => p.id === 'place-golden-gate');
    expect(goldenGate).toBeUndefined();

    // Verify results are strictly sorted by distance ascending
    for (let i = 0; i < nearby.length - 1; i++) {
      expect(nearby[i]!.distanceMeters).toBeLessThanOrEqual(nearby[i + 1]!.distanceMeters);
    }
  });

  it('findNearbyPlaces expands search radius to include further landmarks', async () => {
    // 10km (10000m) search radius includes Golden Gate Bridge
    const wideNearby = await findNearbyPlaces(db, null, ferryBuildingCoord, 10000);
    const goldenGate = wideNearby.find((p) => p.id === 'place-golden-gate');

    expect(goldenGate).toBeDefined();
    expect(goldenGate!.distanceMeters).toBeGreaterThan(7000);
    expect(goldenGate!.distanceMeters).toBeLessThan(9000);
  });

  it('findPlacesInBBox filters places correctly inside bounding box', async () => {
    // Bounding box covering Downtown SF / Waterfront: [-122.42, 37.78, -122.38, 37.81]
    const bbox: BoundingBox = [-122.42, 37.78, -122.38, 37.81];
    const placesInBox = await findPlacesInBBox(db, null, bbox);

    const ids = placesInBox.map((p) => p.id);
    expect(ids).toContain('place-ferry-building');
    expect(ids).toContain('place-coit-tower');

    // Golden Gate Bridge is at [-122.4783, 37.8199], outside this bbox
    expect(ids).not.toContain('place-golden-gate');
  });

  it('filters spatial queries by userId', async () => {
    const userA = 'user-alice-123';
    const userB = 'user-bob-456';

    await db.createSavedPlace({
      userId: userA,
      name: "Alice's Secret Cafe",
      formattedAddress: '100 Market St, San Francisco, CA',
      category: 'food_drink',
      latitude: 37.794,
      longitude: -122.395,
    });

    await db.createSavedPlace({
      userId: userB,
      name: "Bob's Bookshop",
      formattedAddress: '200 Market St, San Francisco, CA',
      category: 'shopping',
      latitude: 37.793,
      longitude: -122.396,
    });

    // Query for Alice
    const aliceNearby = await findNearbyPlaces(db, userA, ferryBuildingCoord, 1000);
    const names = aliceNearby.map((p) => p.name);
    expect(names).toContain("Alice's Secret Cafe");
    expect(names).not.toContain("Bob's Bookshop");
  });
});
