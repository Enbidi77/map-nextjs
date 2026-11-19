import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema/index.js';
import { InMemoryDatabaseAdapter } from './adapters/in-memory.js';
import { PostgresDatabaseAdapter, type DrizzleDatabase } from './adapters/postgres.js';
import { SupabaseDatabaseAdapter } from './adapters/supabase.js';
import type { DatabaseAdapter } from './adapters/types.js';

export interface DatabaseClientOptions {
  connectionString?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  useMemoryFallback?: boolean;
  forceMemory?: boolean;
}

let cachedAdapter: DatabaseAdapter | null = null;

function isConfiguredConnectionString(connStr?: string): boolean {
  if (!connStr || typeof connStr !== 'string') return false;
  const trimmed = connStr.trim();
  if (!trimmed) return false;
  // Check for common unconfigured placeholders
  if (
    trimmed.includes('[YOUR-PASSWORD]') ||
    trimmed.includes('[PASSWORD]') ||
    trimmed.includes('YOUR_PASSWORD') ||
    trimmed.includes('<password>')
  ) {
    return false;
  }
  return true;
}

/**
 * Creates or retrieves a typed database adapter.
 * Automatically switches to Supabase PostgreSQL when a direct DATABASE_URL is not configured.
 * Falls back to an in-memory storage adapter for offline testing or isolated CI runs.
 */
export function createDatabaseClient(options: DatabaseClientOptions = {}): DatabaseAdapter {
  const {
    connectionString = process.env.DATABASE_URL,
    supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    useMemoryFallback = true,
    forceMemory = false,
  } = options;

  if (forceMemory) {
    return new InMemoryDatabaseAdapter();
  }

  // 1. If a valid, non-placeholder direct Postgres connection string is provided, try PostgresDatabaseAdapter
  if (isConfiguredConnectionString(connectionString)) {
    try {
      return new PostgresDatabaseAdapter(connectionString!);
    } catch (error) {
      console.warn(
        '[modern-maps:database] Failed to initialize direct Postgres adapter, checking Supabase fallback:',
        error
      );
    }
  }

  // 2. If direct Postgres is not configured (or failed), use Supabase Postgres via Supabase client
  if (supabaseUrl && supabaseKey) {
    try {
      return new SupabaseDatabaseAdapter({ supabaseUrl, supabaseKey });
    } catch (error) {
      console.warn(
        '[modern-maps:database] Failed to initialize Supabase PostgreSQL adapter:',
        error
      );
    }
  }

  // 3. Fallback to in-memory adapter if permitted
  if (useMemoryFallback) {
    console.warn(
      '[modern-maps:database] Neither direct PostgreSQL nor Supabase is configured; falling back to in-memory adapter.'
    );
    return new InMemoryDatabaseAdapter();
  }

  throw new Error(
    'No valid database configuration found. Please configure DATABASE_URL or Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).'
  );
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
