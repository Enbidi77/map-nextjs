import { describe, it, expect } from 'vitest';
import { createSupabaseClient, isValidSupabaseUrl } from '../src/client/client.js';
import { ValidationError } from '../src/client/errors.js';

describe('Supabase Client Factory', () => {
  it('throws ValidationError if supabaseUrl is empty', () => {
    expect(() => createSupabaseClient('', 'anon-key')).toThrow(ValidationError);
  });

  it('throws ValidationError if supabaseKey is empty', () => {
    expect(() => createSupabaseClient('https://example.supabase.co', '')).toThrow(ValidationError);
  });

  it('instantiates SupabaseClient when valid params provided', () => {
    const client = createSupabaseClient('https://mock-project.supabase.co', 'mock-anon-key');
    expect(client).toBeDefined();
    expect(client.from).toBeTypeOf('function');
    expect(client.rpc).toBeTypeOf('function');
    expect(client.storage).toBeDefined();
  });

  it('validates URL correctly', () => {
    expect(isValidSupabaseUrl('https://xyz.supabase.co')).toBe(true);
    expect(isValidSupabaseUrl('http://localhost:54321')).toBe(true);
    expect(isValidSupabaseUrl('invalid-url')).toBe(false);
  });
});
