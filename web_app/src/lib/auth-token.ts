/**
 * Client-side auth token utilities
 *
 * SECURITY MODEL (HttpOnly Cookie):
 * - JWT stored in HttpOnly cookie set by BFF (/api/auth/login, /api/auth/register)
 * - Client JS cannot read, write, or delete the token
 * - Auth state derived from AuthContext which calls /api/auth/me on mount
 * - Logout via POST /api/auth/logout (clears HttpOnly cookie server-side)
 *
 * The deprecated exports below are backward-compat no-ops.
 * Real auth logic lives server-side.
 */

// ─── Constants ───────────────────────────────────────────

const CSRF_COOKIE_NAME = 'csrf_token';
const LOGOUT_PATH      = '/api/auth/logout';

// ─── Deprecated No-ops ───────────────────────────────────

/**
 * @deprecated Token is in an HttpOnly cookie — client JS cannot read it.
 * Use AuthContext `isAuthenticated` instead.
 */
export function getAuthToken(): null {
  return null;
}

/**
 * @deprecated Token is set by the BFF login route handler via Set-Cookie.
 * This is a no-op.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setAuthToken(_token: string): void {
  // no-op
}

/**
 * @deprecated Use `logoutAndClearCookie()` or POST /api/auth/logout directly.
 */
export function removeAuthToken(): void {
  logoutAndClearCookie();
}

// ─── Cookie Utilities ────────────────────────────────────

/**
 * Read a non-HttpOnly cookie by name.
 * Returns null in SSR environments where `document` is unavailable.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Get the CSRF double-submit token from the non-HttpOnly `csrf_token` cookie.
 * Must be sent as the `x-csrf-token` header on all mutation requests.
 */
export function getCsrfToken(): string | null {
  return getCookie(CSRF_COOKIE_NAME);
}

/**
 * Clear the HttpOnly auth cookie by calling the BFF logout endpoint.
 * This is the ONLY way to remove the token since client JS cannot access it.
 */
export async function logoutAndClearCookie(): Promise<void> {
  try {
    await fetch(LOGOUT_PATH, { method: 'POST' });
  } catch {
    // Best-effort — cookie will expire eventually
  }
}
