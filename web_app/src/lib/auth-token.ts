/**
 * Client-side auth token utilities
 *
 * SECURITY MODEL (HttpOnly Cookie):
 * - JWT stored in HttpOnly cookie set by BFF (/api/auth/login, /api/auth/register)
 * - Client JS cannot read, write, or delete the token
 * - Auth state derived from AuthContext which calls /api/auth/me on mount
 * - Logout via POST /api/auth/logout (clears HttpOnly cookie server-side)
 *
 * Real auth logic lives server-side.
 */

// ─── Constants ───────────────────────────────────────────

const CSRF_COOKIE_NAME = "csrf_token";

// ─── Cookie Utilities ────────────────────────────────────

/**
 * Read a non-HttpOnly cookie by name.
 * Returns null in SSR environments where `document` is unavailable.
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
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
