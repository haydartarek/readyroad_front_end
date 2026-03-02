/**
 * Server-side authentication utilities
 *
 * Shared constants and helpers for BFF auth route handlers and the API proxy.
 * Runs ONLY on the server (Next.js Route Handlers / Middleware).
 *
 * Security model:
 * - JWT stored in HttpOnly cookie (invisible to client JS)
 * - SameSite=Lax prevents CSRF on state-changing requests
 * - CSRF double-submit cookie adds an extra layer for mutations
 */

import { cookies } from 'next/headers';

// ─── Constants ───────────────────────────────────────────

/** Cookie name for the JWT auth token (HttpOnly) */
export const AUTH_COOKIE_NAME = 'token';

/** Cookie name for the CSRF double-submit token (non-HttpOnly, readable by JS) */
export const CSRF_COOKIE_NAME = 'csrf_token';

/** CSRF header name that the client must send on mutation requests */
export const CSRF_HEADER_NAME = 'x-csrf-token';

const IS_PROD    = process.env.NODE_ENV === 'production';
const COOKIE_TTL = 7 * 24 * 60 * 60; // 7 days — matches backend JWT expiry

const COOKIE_BASE = {
  secure:   IS_PROD,
  sameSite: 'lax' as const,
  path:     '/',
  maxAge:   COOKIE_TTL,
};

/** HttpOnly cookie options for the JWT token */
export const AUTH_COOKIE_OPTIONS = { ...COOKIE_BASE, httpOnly: true  };

/** Non-HttpOnly cookie options for the CSRF token (must be readable by client JS) */
export const CSRF_COOKIE_OPTIONS = { ...COOKIE_BASE, httpOnly: false };

// ─── Helpers ─────────────────────────────────────────────

/**
 * Get the backend API base URL (server-side only).
 * Prefers the non-public BACKEND_URL env var, falls back to the public one.
 */
export function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:8890/api'
  );
}

/**
 * Read the JWT auth token from the HttpOnly cookie.
 * Only callable from server-side code (Route Handlers, Server Components, Middleware).
 */
export async function getAuthTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

/**
 * Generate a cryptographically random CSRF token.
 */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Decode a JWT payload without signature verification.
 * Used in middleware to read the role claim for RBAC checks.
 * The backend has already validated the token — we just need the claims.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
