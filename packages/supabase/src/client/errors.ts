import type { PostgrestError } from '@supabase/supabase-js';

export interface AppErrorDetails {
  code?: string;
  message: string;
  details?: string | null;
  hint?: string | null;
  status?: number;
  cause?: unknown;
}

export class SupabaseAppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: string | null;
  readonly hint?: string | null;

  constructor(opts: AppErrorDetails) {
    super(opts.message);
    this.name = 'SupabaseAppError';
    this.code = opts.code || 'UNKNOWN_ERROR';
    this.status = opts.status || 500;
    this.details = opts.details;
    this.hint = opts.hint;
    if (opts.cause) {
      this.cause = opts.cause;
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DatabaseError extends SupabaseAppError {
  constructor(opts: AppErrorDetails) {
    super({ ...opts, code: opts.code || 'DATABASE_ERROR', status: opts.status || 500 });
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends SupabaseAppError {
  constructor(opts: AppErrorDetails) {
    super({ ...opts, code: opts.code || 'AUTH_ERROR', status: opts.status || 401 });
    this.name = 'AuthenticationError';
  }
}

export class StorageError extends SupabaseAppError {
  constructor(opts: AppErrorDetails) {
    super({ ...opts, code: opts.code || 'STORAGE_ERROR', status: opts.status || 500 });
    this.name = 'StorageError';
  }
}

export class NotFoundError extends SupabaseAppError {
  constructor(resource: string, id?: string) {
    super({
      message: `${resource}${id ? ` with id '${id}'` : ''} not found`,
      code: 'NOT_FOUND',
      status: 404,
    });
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends SupabaseAppError {
  constructor(message: string, details?: string | null) {
    super({
      message,
      code: 'VALIDATION_ERROR',
      status: 400,
      details,
    });
    this.name = 'ValidationError';
  }
}

export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  );
}

export function normalizeSupabaseError(error: unknown): SupabaseAppError {
  if (error instanceof SupabaseAppError) {
    return error;
  }

  const err = error as any;
  if (isPostgrestError(err)) {
    // Postgrest 404 / empty
    if (err.code === 'PGRST116') {
      return new NotFoundError('Record');
    }
    return new DatabaseError({
      code: err.code,
      message: err.message,
      details: err.details,
      hint: err.hint,
      status: err.code === '42501' ? 403 : 400,
      cause: err,
    });
  }

  if (err instanceof Error) {
    if (err.name === 'AuthApiError' || err.name === 'AuthRetryableFetchError') {
      return new AuthenticationError({
        message: err.message,
        code: err.name,
        cause: err,
      });
    }
    if (err.name === 'StorageApiError') {
      return new StorageError({
        message: err.message,
        code: err.name,
        cause: err,
      });
    }
    return new SupabaseAppError({
      message: err.message,
      code: err.name || 'UNKNOWN_ERROR',
      cause: err,
    });
  }

  return new SupabaseAppError({
    message: typeof error === 'string' ? error : 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    cause: error,
  });
}
