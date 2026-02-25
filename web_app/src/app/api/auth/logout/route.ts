/**
 * BFF Logout Route Handler
 *
 * Clears the HttpOnly auth cookie and the CSRF cookie.
 * Since the cookie is HttpOnly, client-side JS cannot clear it —
 * this server-side route is the ONLY way to log out.
 */

import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, CSRF_COOKIE_NAME } from '@/lib/server/auth';

export async function POST() {
    const response = NextResponse.json({ success: true });

    // Delete auth cookie
    response.cookies.set(AUTH_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0, // Expire immediately
    });

    // Delete CSRF cookie
    response.cookies.set(CSRF_COOKIE_NAME, '', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });

    return response;
}
