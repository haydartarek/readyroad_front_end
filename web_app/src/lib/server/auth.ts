/**
 * Server-side authentication utilities
 *
 * Shared constants and helpers for BFF auth route handlers and the API proxy.
 * These run ONLY on the server (Next.js Route Handlers / Middleware).
 *
 * Security model:
 * - JWT is stored in an HttpOnly cookie (invisible to client JS)
 * - SameSite=Lax prevents CSRF on state-changing requests
 * - CSRF double-submit cookie adds an extra layer for mutations
 */

import { cookies } from 'next/headers';

// ═══════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════

/** Cookie name for the JWT auth token (HttpOnly) */
export const AUTH_COOKIE_NAME = 'token';

/** Cookie name for the CSRF double-submit token (non-HttpOnly, readable by JS) */
export const CSRF_COOKIE_NAME = 'csrf_token';

/** CSRF header name that the client must send on mutation requests */
export const CSRF_HEADER_NAME = 'x-csrf-token';

/** HttpOnly cookie options for the JWT token */
export const AUTH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days (matches backend JWT expiry)
};

/** Non-HttpOnly cookie options for the CSRF token */
export const CSRF_COOKIE_OPTIONS = {
    httpOnly: false, // Must be readable by client JS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
};

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

/**
 * Get the backend API base URL (server-side only).
 * Prefers the non-public BACKEND_URL env var, falls back to the public one.
 */
export function getBackendUrl(): string {
    return (
        process.env.BACKEND_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
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
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
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
        const payload = parts[1];
        const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}
