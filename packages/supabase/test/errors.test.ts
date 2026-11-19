import { describe, it, expect } from 'vitest';
import {
  normalizeSupabaseError,
  SupabaseAppError,
  DatabaseError,
  NotFoundError,
  ValidationError,
  isPostgrestError,
} from '../src/client/errors.js';

describe('Supabase Error Normalization', () => {
  it('identifies and normalizes PostgrestError', () => {
    const pgError = {
      code: '23505',
      message: 'duplicate key value violates unique constraint',
      details: 'Key (id)=(1) already exists.',
      hint: null,
    };

    expect(isPostgrestError(pgError)).toBe(true);

    const normalized = normalizeSupabaseError(pgError);
    expect(normalized).toBeInstanceOf(DatabaseError);
    expect(normalized.code).toBe('23505');
    expect(normalized.message).toContain('duplicate key');
    expect(normalized.status).toBe(400);
  });

  it('normalizes PGRST116 as NotFoundError', () => {
    const pgError = {
      code: 'PGRST116',
      message: 'JSON object requested, multiple (or no) rows returned',
      details: 'The result contains 0 rows',
      hint: null,
    };

    const normalized = normalizeSupabaseError(pgError);
    expect(normalized).toBeInstanceOf(NotFoundError);
    expect(normalized.status).toBe(404);
  });

  it('returns already normalized SupabaseAppError directly', () => {
    const valError = new ValidationError('Invalid name');
    expect(normalizeSupabaseError(valError)).toBe(valError);
  });

  it('normalizes standard Error and strings', () => {
    const err = new Error('Network failed');
    const normalized = normalizeSupabaseError(err);
    expect(normalized).toBeInstanceOf(SupabaseAppError);
    expect(normalized.message).toBe('Network failed');

    const strNormalized = normalizeSupabaseError('raw failure');
    expect(strNormalized.message).toBe('raw failure');
  });
});
