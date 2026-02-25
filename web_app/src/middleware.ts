import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ═══════════════════════════════════════════════════════════
// Route Configuration
// ═══════════════════════════════════════════════════════════

/** Routes that require any authenticated user */
const protectedRoutes = [
  '/dashboard',
  '/exam',
  '/practice',
  '/analytics',
  '/progress',
  '/profile',
];

/** Routes that require ADMIN role */
const adminRoutes = ['/admin'];

/** Auth routes that redirect to dashboard if already logged in */
const authRoutes = ['/login', '/register'];

// ═══════════════════════════════════════════════════════════
// JWT Utilities (edge-runtime compatible)
// ═══════════════════════════════════════════════════════════

/**
 * Check if a token looks like a valid JWT (basic format check).
 * JWT = 3 base64url parts separated by dots, header starts with "eyJ".
 * This does NOT verify the signature — just prevents stale/empty cookies
 * from causing redirect loops.
 */
function isValidTokenFormat(token: string | undefined): boolean {
  if (!token || token.length < 10) return false;
  const parts = token.split('.');
  return parts.length === 3 && token.startsWith('eyJ');
}

/**
 * Decode a JWT payload without signature verification.
 * Used to extract the role claim for admin route protection.
 * The backend has already validated the token — we just need the claims.
 *
 * Uses atob() which is available in Edge Runtime.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Base64url → base64 → decode
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Extract the user role from a JWT token.
 * Handles common JWT claim patterns:
 * - "role": "ADMIN" (simple string)
 * - "roles": ["ROLE_ADMIN"] (Spring Security style)
 * - "authorities": [{ "authority": "ROLE_ADMIN" }]
 */
function extractRole(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  // Direct "role" claim (most common in this backend)
  if (typeof payload.role === 'string') {
    return payload.role;
  }

  // Spring Security "roles" array: ["ROLE_ADMIN", ...]
  if (Array.isArray(payload.roles) && payload.roles.length > 0) {
    const role = String(payload.roles[0]);
    return role.replace(/^ROLE_/, '');
  }

  // Spring Security "authorities" array: [{ authority: "ROLE_ADMIN" }]
  if (Array.isArray(payload.authorities) && payload.authorities.length > 0) {
    const auth = payload.authorities[0];
    const authority =
      typeof auth === 'string' ? auth : (auth as Record<string, string>)?.authority;
    return authority ? authority.replace(/^ROLE_/, '') : null;
  }

  return null;
}

// ═══════════════════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════════════════

export function middleware(request: NextRequest) {
  // IMPORTANT: Cookie name must match AUTH_COOKIE_NAME in server/auth.ts ('token')
  const rawToken = request.cookies.get('token')?.value;
  const hasValidToken = isValidTokenFormat(rawToken);
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If cookie exists but token format is invalid → clear cookie, let page load
  if (rawToken && !hasValidToken) {
    const response = NextResponse.next();
    response.cookies.delete('token');
    return response;
  }

  // ─── Admin Route Protection (RBAC) ───────────────────────
  // Requires valid token AND ADMIN role
  if (isAdminRoute) {
    if (!hasValidToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = extractRole(rawToken!);
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return NextResponse.next();
  }

  // ─── Protected Route (any authenticated user) ────────────
  if (isProtectedRoute && !hasValidToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ─── Auth Routes (redirect away if already logged in) ────
  if (isAuthRoute && hasValidToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // User-protected routes
    '/dashboard/:path*',
    '/exam/:path*',
    '/practice/:path*',
    '/analytics/:path*',
    '/progress/:path*',
    '/profile/:path*',
    // Admin-protected routes (NEW — was missing!)
    '/admin/:path*',
    // Auth routes
    '/login',
    '/register',
  ],
};
