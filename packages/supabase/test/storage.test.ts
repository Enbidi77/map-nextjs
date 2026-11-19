import { describe, it, expect, vi } from 'vitest';
import {
  validateStorageFile,
  uploadStorageFile,
  getPublicStorageUrl,
  createSignedStorageUrl,
  BUCKET_CONFIGS,
} from '../src/storage/storageManager.js';
import { ValidationError } from '../src/client/errors.js';

describe('Storage Manager', () => {
  it('validates file size within limit', () => {
    const res = validateStorageFile('place-photos', {
      name: 'photo.jpg',
      size: 5 * 1024 * 1024,
      type: 'image/jpeg',
    });
    expect(res.valid).toBe(true);
  });

  it('rejects file size exceeding limit', () => {
    const res = validateStorageFile('place-photos', {
      name: 'huge.jpg',
      size: 15 * 1024 * 1024,
      type: 'image/jpeg',
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceeds maximum allowed');
  });

  it('rejects disallowed MIME type', () => {
    const res = validateStorageFile('place-photos', {
      name: 'script.exe',
      size: 1024,
      type: 'application/x-msdownload',
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain('MIME type');
  });

  it('allows valid geojson file in geojson-imports', () => {
    const res = validateStorageFile('geojson-imports', {
      name: 'routes.geojson',
      size: 1024 * 1024,
      type: 'application/geo+json',
    });
    expect(res.valid).toBe(true);
  });

  it('calls upload and resolves public URL for public bucket', async () => {
    const mockStorage = {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'places/photo1.jpg', fullPath: 'place-photos/places/photo1.jpg' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/place-photos/places/photo1.jpg' },
        }),
      }),
    };

    const mockClient = {
      storage: mockStorage,
    } as any;

    const result = await uploadStorageFile(
      mockClient,
      'place-photos',
      'places/photo1.jpg',
      'dummy-content',
      { name: 'photo1.jpg', size: 1024, type: 'image/jpeg' }
    );

    expect(result.path).toBe('places/photo1.jpg');
    expect(result.url).toContain('https://test.supabase.co');
  });

  it('fails validation on upload if file invalid', async () => {
    const mockClient = {} as any;
    await expect(
      uploadStorageFile(
        mockClient,
        'place-photos',
        'bad.exe',
        'bad-data',
        { name: 'bad.exe', size: 1024, type: 'application/exe' }
      )
    ).rejects.toThrow(ValidationError);
  });
});
