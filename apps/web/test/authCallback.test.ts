import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/auth/callback/route';

const mockExchangeCodeForSession = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  })),
}));

describe('Auth Callback Route Handler (GET /auth/callback)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exchanges valid code and redirects to origin default path', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const request = new NextRequest('http://localhost:3000/auth/callback?code=valid-code-123');
    const response = await GET(request);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-code-123');
    expect(response.status).toBe(307); // NextResponse.redirect default status
    expect(response.headers.get('location')).toBe('http://localhost:3000/');
  });

  it('redirects to the target specified by "next" parameter after exchange', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const request = new NextRequest(
      'http://localhost:3000/auth/callback?code=valid-code-123&next=/saved'
    );
    const response = await GET(request);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-code-123');
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/saved');
  });

  it('prevents open redirect attacks when "next" contains external URLs', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const request = new NextRequest(
      'http://localhost:3000/auth/callback?code=valid-code-123&next=https://malicious.site'
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/');
  });

  it('redirects to home with auth_error when code exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      error: new Error('Invalid code verifier'),
    });

    const request = new NextRequest('http://localhost:3000/auth/callback?code=bad-code');
    const response = await GET(request);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('bad-code');
    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('auth_error=Invalid+code+verifier');
  });

  it('handles provider-level errors (e.g. user canceled Google login) without code exchange', async () => {
    const request = new NextRequest(
      'http://localhost:3000/auth/callback?error=access_denied&error_description=User+denied+access'
    );
    const response = await GET(request);

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('auth_error=User+denied+access');
  });
});
