import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Sanitizes a redirect path to strictly prevent open redirect vulnerabilities.
 * Only relative, internal paths beginning with a single '/' are permitted.
 */
function sanitizeRedirectPath(path: string | null): string {
  if (!path) return '/onboarding/create';

  // Reject paths that do not start with '/' or start with '//' or '/\'
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
    return '/onboarding/create';
  }

  // Reject strings containing schemes/protocols or dangerous characters
  if (path.includes('://') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) {
    return '/onboarding/create';
  }

  return path;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next');
  const safeNext = sanitizeRedirectPath(rawNext);

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Redirect to sanitized internal destination
        return NextResponse.redirect(`${origin}${safeNext}`);
      }
      console.error('Supabase code exchange error:', error.message);
    }
  }

  // Return to login with error parameter if verification failed or code is missing
  return NextResponse.redirect(`${origin}/login?error=verification-failed`);
}
