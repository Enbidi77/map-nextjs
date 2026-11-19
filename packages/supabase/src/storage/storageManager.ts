import type { TypedSupabaseClient } from '../client/client.js';
import { normalizeSupabaseError, StorageError, ValidationError } from '../client/errors.js';

export type StorageBucket =
  | 'place-photos'
  | 'collection-covers'
  | 'geojson-imports'
  | 'map-attachments';

export interface StorageBucketConfig {
  isPublic: boolean;
  maxSizeBytes: number;
  allowedMimeTypes: string[];
}

export const BUCKET_CONFIGS: Record<StorageBucket, StorageBucketConfig> = {
  'place-photos': {
    isPublic: true,
    maxSizeBytes: 10 * 1024 * 1024, // 10 MiB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  },
  'collection-covers': {
    isPublic: true,
    maxSizeBytes: 10 * 1024 * 1024, // 10 MiB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  },
  'geojson-imports': {
    isPublic: false,
    maxSizeBytes: 50 * 1024 * 1024, // 50 MiB
    allowedMimeTypes: ['application/geo+json', 'application/json'],
  },
  'map-attachments': {
    isPublic: false,
    maxSizeBytes: 50 * 1024 * 1024, // 50 MiB
    allowedMimeTypes: [
      'application/pdf',
      'text/csv',
      'application/zip',
      'image/jpeg',
      'image/png',
      'application/json',
    ],
  },
};

export interface FileValidationInput {
  name: string;
  size: number;
  type: string;
}

export interface UploadOptions {
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
}

/**
 * Validates a file before upload against bucket rules (size limit, mime type).
 */
export function validateStorageFile(
  bucket: StorageBucket,
  file: FileValidationInput
): { valid: boolean; error?: string } {
  const config = BUCKET_CONFIGS[bucket];
  if (!config) {
    return { valid: false, error: `Unknown storage bucket: "${bucket}"` };
  }

  if (file.size > config.maxSizeBytes) {
    const maxMb = (config.maxSizeBytes / (1024 * 1024)).toFixed(1);
    const actualMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${actualMb} MB) exceeds maximum allowed for bucket "${bucket}" (${maxMb} MB)`,
    };
  }

  if (file.type && !config.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `MIME type "${file.type}" is not allowed for bucket "${bucket}". Allowed: ${config.allowedMimeTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Uploads a file buffer or Blob to Supabase Storage with bucket validation.
 */
export async function uploadStorageFile(
  client: TypedSupabaseClient,
  bucket: StorageBucket,
  path: string,
  fileBody: any,
  validation?: FileValidationInput,
  options?: UploadOptions
): Promise<{ path: string; fullPath: string; url?: string }> {
  try {
    if (validation) {
      const check = validateStorageFile(bucket, validation);
      if (!check.valid) {
        throw new ValidationError(check.error!);
      }
    }

    const { data, error } = await client.storage
      .from(bucket)
      .upload(path, fileBody, {
        cacheControl: options?.cacheControl ?? '3600',
        contentType: options?.contentType ?? validation?.type,
        upsert: options?.upsert ?? false,
      });

    if (error) throw error;
    if (!data) throw new StorageError({ message: 'Upload succeeded but no data returned' });

    let url: string | undefined;
    if (BUCKET_CONFIGS[bucket].isPublic) {
      url = getPublicStorageUrl(client, bucket, data.path);
    }

    return {
      path: data.path,
      fullPath: data.fullPath,
      url,
    };
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

/**
 * Returns public URL for a file in a public bucket.
 */
export function getPublicStorageUrl(
  client: TypedSupabaseClient,
  bucket: StorageBucket,
  path: string
): string {
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Creates a signed URL for a file in a private bucket with an expiration time.
 */
export async function createSignedStorageUrl(
  client: TypedSupabaseClient,
  bucket: StorageBucket,
  path: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  try {
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error) throw error;
    if (!data?.signedUrl) throw new StorageError({ message: 'Failed to create signed URL' });

    return data.signedUrl;
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

/**
 * Downloads a file from Supabase Storage.
 */
export async function downloadStorageFile(
  client: TypedSupabaseClient,
  bucket: StorageBucket,
  path: string
): Promise<Blob> {
  try {
    const { data, error } = await client.storage.from(bucket).download(path);
    if (error) throw error;
    if (!data) throw new StorageError({ message: `File at path "${path}" is empty or not found` });

    return data;
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

/**
 * Deletes one or multiple files from a bucket.
 */
export async function deleteStorageFiles(
  client: TypedSupabaseClient,
  bucket: StorageBucket,
  paths: string[]
): Promise<void> {
  try {
    const { error } = await client.storage.from(bucket).remove(paths);
    if (error) throw error;
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}

/**
 * Lists files in a storage folder.
 */
export async function listStorageFiles(
  client: TypedSupabaseClient,
  bucket: StorageBucket,
  folder?: string,
  options?: { limit?: number; offset?: number; sortBy?: { column: string; order: string } }
): Promise<Array<{ name: string; id: string; updatedAt: string; createdAt: string; metadata?: Record<string, unknown> }>> {
  try {
    const { data, error } = await client.storage.from(bucket).list(folder || '', options);
    if (error) throw error;

    return (data || []).map((file: any) => ({
      name: file.name,
      id: file.id,
      updatedAt: file.updated_at,
      createdAt: file.created_at,
      metadata: file.metadata as Record<string, unknown> | undefined,
    }));
  } catch (err) {
    throw normalizeSupabaseError(err);
  }
}
