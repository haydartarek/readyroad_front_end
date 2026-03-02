import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Route Configuration ─────────────────────────────────

const PROTECTED_ROUTES = [
  '/dashboard',
  '/exam',
  '/practice',
  '/analytics',
  '/progress',
  '/profile',
];

const ADMIN_ROUTES = ['/admin'];
const AUTH_ROUTES  = ['/login', '/register'];

// ─── JWT Utilities (edge-runtime compatible) ─────────────

/**
 * Basic JWT format check — prevents stale/empty cookies from causing
 * redirect loops. Does NOT verify the signature.
 */
function isValidTokenFormat(token: string | undefined): token is string {
  if (!token || token.length < 10) return false;
  const parts = token.split('.');
  return parts.length === 3 && token.startsWith('eyJ');
}

/**
 * Decode JWT payload without signature verification.
 * Uses atob() — available in Edge Runtime.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded  = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

/**
 * Extract user role from JWT. Handles:
 * - `"role": "ADMIN"` — direct string claim
 * - `"roles": ["ROLE_ADMIN"]` — Spring Security array
 * - `"authorities": [{ "authority": "ROLE_ADMIN" }]` — Spring Security objects
 */
function extractRole(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  if (typeof payload.role === 'string') return payload.role;

  if (Array.isArray(payload.roles) && payload.roles.length > 0) {
    return String(payload.roles[0]).replace(/^ROLE_/, '');
  }

  if (Array.isArray(payload.authorities) && payload.authorities.length > 0) {
    const auth      = payload.authorities[0];
    const authority = typeof auth === 'string'
      ? auth
      : (auth as Record<string, string>)?.authority;
    return authority ? authority.replace(/^ROLE_/, '') : null;
  }

  return null;
}

// ─── Helpers ─────────────────────────────────────────────

function matchesAny(pathname: string, routes: string[]): boolean {
  return routes.some(r => pathname.startsWith(r));
}

function redirectTo(url: string, request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL(url, request.url));
}

function redirectToLogin(pathname: string, request: NextRequest): NextResponse {
  const url = new URL('/login', request.url);
  url.searchParams.set('returnUrl', pathname);
  return NextResponse.redirect(url);
}

// ─── Middleware ───────────────────────────────────────────

export function middleware(request: NextRequest) {
  // Cookie name must match AUTH_COOKIE_NAME in server/auth.ts ('token')
  const rawToken     = request.cookies.get('token')?.value;
  const hasValidToken = isValidTokenFormat(rawToken);
  const { pathname } = request.nextUrl;

  // Invalid cookie format → clear and continue
  if (rawToken && !hasValidToken) {
    const response = NextResponse.next();
    response.cookies.delete('token');
    return response;
  }

  // Admin routes — require valid token + ADMIN role
  if (matchesAny(pathname, ADMIN_ROUTES)) {
    if (!hasValidToken)         return redirectToLogin(pathname, request);
    if (extractRole(rawToken) !== 'ADMIN') return redirectTo('/unauthorized', request);
    return NextResponse.next();
  }

  // Protected routes — require valid token
  if (matchesAny(pathname, PROTECTED_ROUTES) && !hasValidToken) {
    return redirectToLogin(pathname, request);
  }

  // Auth routes — redirect away if already logged in
  if (matchesAny(pathname, AUTH_ROUTES) && hasValidToken) {
    return redirectTo('/dashboard', request);
  }

  return NextResponse.next();
}

// ─── Matcher ─────────────────────────────────────────────

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/exam/:path*',
    '/practice/:path*',
    '/analytics/:path*',
    '/progress/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};
