import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDatabaseClient,
  resetDatabaseClient,
  SupabaseDatabaseAdapter,
  InMemoryDatabaseAdapter,
} from '../src/index.js';

describe('SupabaseDatabaseAdapter and Automatic Fallback', () => {
  beforeEach(() => {
    resetDatabaseClient();
  });

  it('createDatabaseClient automatically uses SupabaseDatabaseAdapter when direct DATABASE_URL has placeholder', () => {
    const db = createDatabaseClient({
      connectionString: 'postgresql://postgres:[YOUR-PASSWORD]@db.mrlxiodeuuallclssqai.supabase.co:5432/postgres',
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
    });

    expect(db).toBeInstanceOf(SupabaseDatabaseAdapter);
    expect(db.isMemory).toBe(false);
  });

  it('createDatabaseClient falls back to SupabaseDatabaseAdapter when DATABASE_URL is undefined', () => {
    const db = createDatabaseClient({
      connectionString: undefined,
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
    });

    expect(db).toBeInstanceOf(SupabaseDatabaseAdapter);
    expect(db.isMemory).toBe(false);
  });

  it('createDatabaseClient respects forceMemory option', () => {
    const db = createDatabaseClient({
      forceMemory: true,
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
    });

    expect(db).toBeInstanceOf(InMemoryDatabaseAdapter);
    expect(db.isMemory).toBe(true);
  });
});
