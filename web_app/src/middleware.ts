import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/exam',
  '/practice',
  '/analytics',
  '/progress',
  '/profile',
];

// Auth routes that should redirect to dashboard if already logged in
const authRoutes = ['/login', '/register'];

/**
 * Check if a token looks like a valid JWT (basic format check).
 * JWT = 3 base64url parts separated by dots, header starts with "eyJ".
 * This does NOT verify the signature — just prevents stale/empty cookies
 * from causing redirect loops between /login ↔ /dashboard.
 */
function isValidTokenFormat(token: string | undefined): boolean {
  if (!token || token.length < 10) return false;
  const parts = token.split('.');
  return parts.length === 3 && token.startsWith('eyJ');
}

export function middleware(request: NextRequest) {
  // IMPORTANT: Cookie name must match STORAGE_KEYS.AUTH_TOKEN in constants.ts ('token')
  const rawToken = request.cookies.get('token')?.value;
  const hasValidToken = isValidTokenFormat(rawToken);
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // If cookie exists but token format is invalid → clear cookie, let page load normally
  if (rawToken && !hasValidToken) {
    const response = NextResponse.next();
    response.cookies.delete('token');
    return response;
  }

  // Redirect to login if accessing protected route without valid token
  if (isProtectedRoute && !hasValidToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth routes with valid token
  if (isAuthRoute && hasValidToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/exam/:path*',
    '/practice/:path*',
    '/analytics/:path*',
    '/progress/:path*',
    '/profile/:path*',
    '/login',
    '/register',
  ],
};
