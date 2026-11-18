import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDatabase,
  createDatabaseClient,
  resetDatabaseClient,
  InMemoryDatabaseAdapter,
} from '../src/index.js';

describe('Database Adapter and Client Factory', () => {
  beforeEach(() => {
    resetDatabaseClient();
  });

  it('createDatabaseClient defaults to InMemoryDatabaseAdapter when no connection string is provided', () => {
    const db = createDatabaseClient({ forceMemory: true });
    expect(db).toBeInstanceOf(InMemoryDatabaseAdapter);
    expect(db.isMemory).toBe(true);
  });

  it('getDatabase returns a singleton instance', () => {
    const db1 = getDatabase({ forceMemory: true });
    const db2 = getDatabase();
    expect(db1).toBe(db2);
  });

  it('in-memory adapter comes pre-seeded with San Francisco landmarks', async () => {
    const db = new InMemoryDatabaseAdapter();
    const places = await db.listSavedPlaces();

    expect(places.length).toBeGreaterThanOrEqual(5);

    const names = places.map((p) => p.name);
    expect(names).toContain('Ferry Building Marketplace');
    expect(names).toContain('Golden Gate Bridge');
    expect(names).toContain('Palace of Fine Arts');
    expect(names).toContain('Coit Tower');
    expect(names).toContain('Mission Dolores Park');

    const collections = await db.listCollections();
    expect(collections.length).toBeGreaterThanOrEqual(1);
    expect(collections[0]!.name).toBe('San Francisco Highlights');
  });

  it('supports clear() to empty in-memory collections for testing isolation', async () => {
    const db = new InMemoryDatabaseAdapter();
    db.clear();

    const places = await db.listSavedPlaces();
    expect(places).toHaveLength(0);

    const collections = await db.listCollections();
    expect(collections).toHaveLength(0);
  });
});
