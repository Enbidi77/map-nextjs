import { describe, it, expect } from 'vitest';
import { createDatabaseClient } from '../src/index.js';

const SUPABASE_URL = 'https://mrlxiodeuuallclssqai.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ybHhpb2RldXVhbGxjbHNzcWFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTA1NjYwNywiZXhwIjoyMTEwNjMyNjA3fQ.G80faSjdyDyijUNtc59Vh00JUIPCokb2tpuKMOGJ3e4';

describe('Live Supabase PostgreSQL integration', () => {
  it('connects to Supabase Postgres and lists real places and collections', async () => {
    const db = createDatabaseClient({
      connectionString: 'postgresql://postgres:[YOUR-PASSWORD]@db.mrlxiodeuuallclssqai.supabase.co:5432/postgres',
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_SERVICE_ROLE_KEY,
    });

    expect(db.isMemory).toBe(false);

    const places = await db.listSavedPlaces();
    expect(places.length).toBeGreaterThanOrEqual(5);

    const names = places.map(p => p.name);
    expect(names).toContain('Golden Gate Bridge');
    expect(names).toContain('Ferry Building Marketplace');

    const collections = await db.listCollections();
    expect(collections.length).toBeGreaterThanOrEqual(1);

    const colNames = collections.map(c => c.name);
    expect(colNames).toContain('San Francisco Highlights');
  });
});
