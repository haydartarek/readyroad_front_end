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
import type { NextRequest } from 'next/server';

// ─── Constants ───────────────────────────────────────────

/** Cookie name for the JWT auth token (HttpOnly) */
export const AUTH_COOKIE_NAME = 'token';

/** Cookie name for the CSRF double-submit token (non-HttpOnly, readable by JS) */
export const CSRF_COOKIE_NAME = 'csrf_token';

/** CSRF header name that the client must send on mutation requests */
export const CSRF_HEADER_NAME = 'x-csrf-token';

const COOKIE_TTL = 7 * 24 * 60 * 60; // 7 days — matches backend JWT expiry

type AuthCookieRequest = Pick<NextRequest, 'url' | 'headers'> | Request;

function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export function shouldUseSecureCookies(request: AuthCookieRequest): boolean {
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  if (forwardedProto === 'https') return true;
  if (forwardedProto === 'http') return false;

  try {
    const url = new URL(request.url);
    if (isLocalHostname(url.hostname)) return false;
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildCookieOptions(request: AuthCookieRequest, httpOnly: boolean, maxAge: number) {
  return {
    httpOnly,
    secure: shouldUseSecureCookies(request),
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

/** HttpOnly cookie options for the JWT token */
export function getAuthCookieOptions(request: AuthCookieRequest) {
  return buildCookieOptions(request, true, COOKIE_TTL);
}

/** Non-HttpOnly cookie options for the CSRF token (must be readable by client JS) */
export function getCsrfCookieOptions(request: AuthCookieRequest) {
  return buildCookieOptions(request, false, COOKIE_TTL);
}

/** Expired cookie options for clearing the JWT token */
export function getExpiredAuthCookieOptions(request: AuthCookieRequest) {
  return buildCookieOptions(request, true, 0);
}

/** Expired cookie options for clearing the CSRF token */
export function getExpiredCsrfCookieOptions(request: AuthCookieRequest) {
  return buildCookieOptions(request, false, 0);
}

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
 * Get the public frontend base URL used by server-side auth handlers.
 * Prefer explicit env config because request.url may resolve to container-internal
 * hosts like 0.0.0.0 when running behind Docker.
 */
export function getFrontendUrl(request?: AuthCookieRequest): string {
  if (request) {
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
    const host = forwardedHost || request.headers.get('host')?.trim();

    if (host && host !== '0.0.0.0:3000' && host !== '0.0.0.0') {
      const protocol =
        forwardedProto ||
        (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
      return `${protocol}://${host}`.replace(/\/+$/, '');
    }
  }

  const configured =
    process.env.FRONTEND_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000';

  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  if (request) {
    try {
      const url = new URL(request.url);
      return url.origin.replace(/\/+$/, '');
    } catch {}
  }

  return 'http://localhost:3000';
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
