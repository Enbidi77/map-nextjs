import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@modern-maps/supabase';

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function getSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'http://localhost:54321'
  );
}

export function getSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder-anon-key'
  );
}

/**
 * Creates or retrieves the singleton browser Supabase client.
 */
export function createClient() {
  if (typeof window === 'undefined') {
    return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
  }

  if (!clientInstance) {
    clientInstance = createBrowserClient<Database>(
      getSupabaseUrl(),
      getSupabaseAnonKey()
    );
  }

  return clientInstance;
}

export const getBrowserSupabaseClient = createClient;
