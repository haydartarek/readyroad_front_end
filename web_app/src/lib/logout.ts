/**
 * Client-side logout utility — HttpOnly Cookie Edition
 *
 * JWT is in an HttpOnly cookie — client JS cannot clear it directly.
 * Must call the BFF logout endpoint to clear the cookie server-side.
 *
 * @see src/contexts/auth-context.tsx  — preferred logout (via useAuth)
 * @see src/app/api/auth/logout/route.ts — BFF route that clears the cookie
 */

import { ROUTES } from '@/lib/constants';
import { getCsrfToken } from '@/lib/auth-token';

// ─── Constants ───────────────────────────────────────────

const LOGOUT_PATH  = '/api/auth/logout';
const CSRF_HEADER  = 'x-csrf-token';

// ─── Utilities ───────────────────────────────────────────

/**
 * Perform client-side logout:
 * 1. Call BFF /api/auth/logout to clear the HttpOnly cookie server-side
 * 2. Redirect to login page (always — even if the request fails)
 */
export async function logoutClientSide(): Promise<void> {
  try {
    const csrf = getCsrfToken();
    await fetch(LOGOUT_PATH, {
      method:  'POST',
      headers: csrf ? { [CSRF_HEADER]: csrf } : {},
    });
  } catch (error) {
    console.warn('[logout] Request failed:', error);
  }

  // Always redirect — cookie will expire eventually if request failed
  window.location.href = ROUTES.LOGIN;
}

/**
 * @deprecated Use `useAuth().isAuthenticated` from AuthContext instead.
 * Client JS cannot determine auth state from HttpOnly cookies.
 */
export function isAuthenticated(): false {
  return false;
}
