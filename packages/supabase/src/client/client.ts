import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';
import { ValidationError } from './errors.js';

export type TypedSupabaseClient = SupabaseClient<Database, any, any>;

export interface SupabaseClientConfig {
  supabaseUrl: string;
  supabaseKey: string;
  options?: SupabaseClientOptions<'public'>;
}

/**
 * Creates a strongly-typed Supabase client for Modern Maps.
 */
export function createSupabaseClient(
  supabaseUrl: string,
  supabaseKey: string,
  options?: SupabaseClientOptions<'public'>
): TypedSupabaseClient {
  if (!supabaseUrl) {
    throw new ValidationError('supabaseUrl is required to instantiate Supabase client');
  }
  if (!supabaseKey) {
    throw new ValidationError('supabaseKey is required to instantiate Supabase client');
  }

  const defaultOptions: SupabaseClientOptions<'public'> = {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    ...options,
  };

  return createClient<Database>(supabaseUrl, supabaseKey, defaultOptions);
}

/**
 * Validates whether the given URL is a syntactically valid Supabase project URL.
 */
export function isValidSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
