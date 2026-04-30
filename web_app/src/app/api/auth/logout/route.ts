/**
 * BFF Logout Route Handler
 *
 * Clears the HttpOnly auth cookie and the CSRF cookie.
 * Since the cookie is HttpOnly, client-side JS cannot clear it —
 * this server-side route is the ONLY way to log out.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    AUTH_COOKIE_NAME,
    CSRF_COOKIE_NAME,
    getExpiredAuthCookieOptions,
    getExpiredCsrfCookieOptions,
} from '@/lib/server/auth';

export async function POST(request: NextRequest) {
    const response = NextResponse.json({ success: true });

    // Delete auth cookie
    response.cookies.set(AUTH_COOKIE_NAME, '', getExpiredAuthCookieOptions(request));

    // Delete CSRF cookie
    response.cookies.set(CSRF_COOKIE_NAME, '', getExpiredCsrfCookieOptions(request));

    return response;
}
