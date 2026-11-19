import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Route handler for Supabase OAuth and PKCE authentication callbacks.
 * Exchanges the temporary authorization code for a session and sets cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth provider error (e.g., user denied consent)
  if (error) {
    console.error('OAuth callback error:', error, errorDescription);
    const redirectUrl = new URL('/', origin);
    redirectUrl.searchParams.set('auth_error', errorDescription || error);
    return NextResponse.redirect(redirectUrl);
  }

  // Safe internal path redirect to prevent open redirect vulnerabilities
  const next = searchParams.get('next') ?? '/';
  const safePath = next.startsWith('/') && !next.startsWith('//') ? next : '/';

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${safePath}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${safePath}`);
      } else {
        return NextResponse.redirect(`${origin}${safePath}`);
      }
    } else {
      console.error('Failed to exchange auth code for session:', exchangeError);
      const redirectUrl = new URL('/', origin);
      redirectUrl.searchParams.set('auth_error', exchangeError.message);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Fallback redirect if no authorization code is present
  return NextResponse.redirect(`${origin}${safePath}`);
}
