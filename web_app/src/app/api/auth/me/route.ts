/**
 * BFF "Get Current User" Route Handler
 *
 * Reads the HttpOnly JWT cookie and forwards it to the backend's
 * GET /auth/me endpoint as a Bearer token. Returns user data.
 *
 * This allows the client to check authentication status without
 * ever having access to the raw JWT.
 */

import { NextResponse } from 'next/server';
import { getBackendUrl, getAuthTokenFromCookie } from '@/lib/server/auth';

export async function GET() {
    const token = await getAuthTokenFromCookie();

    if (!token) {
        return NextResponse.json(
            { message: 'Not authenticated' },
            { status: 401 }
        );
    }

    try {
        const backendResponse = await fetch(`${getBackendUrl()}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
            // Don't cache — always check fresh auth state
            cache: 'no-store',
        });

        if (!backendResponse.ok) {
            return NextResponse.json(
                { message: 'Authentication failed' },
                { status: backendResponse.status }
            );
        }

        const userData = await backendResponse.json();
        return NextResponse.json(userData);
    } catch (error) {
        // Distinguish connection errors (backend down) from real bugs
        const isConnectionError =
            error instanceof TypeError &&
            (error.message.includes('fetch failed') ||
             error.message.includes('ECONNREFUSED'));

        if (isConnectionError) {
            console.warn('[BFF /api/auth/me] Backend unreachable:', (error as Error).message);
            return NextResponse.json(
                { message: 'Backend service unavailable' },
                { status: 503 }
            );
        }

        console.error('[BFF /api/auth/me] Unexpected error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
