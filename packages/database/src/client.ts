import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema/index.js';
import { InMemoryDatabaseAdapter } from './adapters/in-memory.js';
import { PostgresDatabaseAdapter, type DrizzleDatabase } from './adapters/postgres.js';
import type { DatabaseAdapter } from './adapters/types.js';

export interface DatabaseClientOptions {
  connectionString?: string;
  useMemoryFallback?: boolean;
  forceMemory?: boolean;
}

let cachedAdapter: DatabaseAdapter | null = null;

/**
 * Creates or retrieves a typed database adapter.
 * Automatically falls back to an in-memory storage adapter when PostgreSQL is not configured
 * or not accessible (offline development, CI, or test suites).
 */
export function createDatabaseClient(options: DatabaseClientOptions = {}): DatabaseAdapter {
  const {
    connectionString = process.env.DATABASE_URL,
    useMemoryFallback = true,
    forceMemory = false,
  } = options;

  if (forceMemory || !connectionString) {
    return new InMemoryDatabaseAdapter();
  }

  try {
    return new PostgresDatabaseAdapter(connectionString);
  } catch (error) {
    if (useMemoryFallback) {
      console.warn(
        '[modern-maps:database] Failed to connect to PostgreSQL; falling back to in-memory adapter:',
        error
      );
      return new InMemoryDatabaseAdapter();
    }
    throw error;
  }
}

/**
 * Singleton database accessor for server components and API route handlers.
 */
export function getDatabase(options?: DatabaseClientOptions): DatabaseAdapter {
  if (!cachedAdapter) {
    cachedAdapter = createDatabaseClient(options);
  }
  return cachedAdapter;
}

/**
 * Reset the cached database adapter (primarily for test isolation)
 */
export function resetDatabaseClient(): void {
  cachedAdapter = null;
}

/**
 * Direct Drizzle client constructor for advanced custom queries
 */
export function createDrizzleClient(connectionString: string): {
  client: postgres.Sql;
  db: DrizzleDatabase;
} {
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });
  return { client, db };
}
