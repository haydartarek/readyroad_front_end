/**
 * BFF Delete Account Route Handler
 *
 * Flow:
 *   1. Client sends DELETE /api/auth/delete-account
 *   2. This handler reads the HttpOnly JWT cookie
 *   3. Forwards DELETE /api/users/me to the Spring Boot backend
 *   4. On success: clears both auth cookies (same as logout)
 *   5. Client redirects to /login
 *
 * The JWT never reaches client-side JavaScript — always stays server-side.
 */

import { NextResponse } from 'next/server';
import {
    AUTH_COOKIE_NAME,
    CSRF_COOKIE_NAME,
    getBackendUrl,
    getAuthTokenFromCookie,
} from '@/lib/server/auth';

const IS_PROD = process.env.NODE_ENV === 'production';

/** Shared cookie-clear options */
function clearCookieOptions(httpOnly: boolean) {
    return {
        httpOnly,
        secure: IS_PROD,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 0,
    };
}

export async function DELETE() {
    const token = await getAuthTokenFromCookie();

    if (!token) {
        return NextResponse.json(
            { message: 'Not authenticated' },
            { status: 401 }
        );
    }

    try {
        const backendResponse = await fetch(`${getBackendUrl()}/users/me`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        });

        // Backend failed — do NOT clear cookies, account was not deleted
        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({
                message: 'Failed to delete account',
            }));
            return NextResponse.json(errorData, { status: backendResponse.status });
        }

        // Account deleted on backend — clear auth cookies so session ends
        const response = NextResponse.json({ success: true });
        response.cookies.set(AUTH_COOKIE_NAME, '', clearCookieOptions(true));
        response.cookies.set(CSRF_COOKIE_NAME, '', clearCookieOptions(false));

        return response;

    } catch (error) {
        const isConnectionError =
            error instanceof TypeError &&
            (error.message.includes('fetch failed') ||
                error.message.includes('ECONNREFUSED'));

        if (isConnectionError) {
            console.warn('[BFF /api/auth/delete-account] Backend unreachable:', (error as Error).message);
            return NextResponse.json(
                { message: 'Backend service unavailable' },
                { status: 503 }
            );
        }

        console.error('[BFF /api/auth/delete-account] Unexpected error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
