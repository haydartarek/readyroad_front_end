/**
 * BFF Login Route Handler
 *
 * Implements: "JWT must be stored only in HttpOnly secure cookies"
 * Flow:
 *   1. Client POSTs credentials to /api/auth/login
 *   2. This handler forwards them to the Spring Boot backend
 *   3. Backend returns { token, username, role, ... }
 *   4. We set the JWT as an HttpOnly cookie (invisible to client JS)
 *   5. We return user data (WITHOUT the raw token) to the client
 *
 * The token NEVER reaches client-side JavaScript.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    AUTH_COOKIE_NAME,
    AUTH_COOKIE_OPTIONS,
    CSRF_COOKIE_NAME,
    CSRF_COOKIE_OPTIONS,
    getBackendUrl,
    generateCsrfToken,
} from '@/lib/server/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const backendResponse = await fetch(`${getBackendUrl()}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        // Forward error responses as-is
        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({
                message: 'Login failed',
            }));
            return NextResponse.json(errorData, { status: backendResponse.status });
        }

        const data = await backendResponse.json();
        const { token, ...userData } = data;

        if (!token) {
            return NextResponse.json(
                { message: 'No token received from server' },
                { status: 500 }
            );
        }

        // Build response with user data only (no raw token exposed)
        const response = NextResponse.json(userData);

        // Set HttpOnly JWT cookie — client JS cannot read this
        response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

        // Set CSRF double-submit cookie — client JS CAN read this
        // Client must echo it back as a header on mutation requests
        const csrfToken = generateCsrfToken();
        response.cookies.set(CSRF_COOKIE_NAME, csrfToken, CSRF_COOKIE_OPTIONS);

        return response;
    } catch (error) {
        const isConnectionError =
            error instanceof TypeError &&
            (error.message.includes('fetch failed') ||
             error.message.includes('ECONNREFUSED'));

        if (isConnectionError) {
            console.warn('[BFF /api/auth/login] Backend unreachable:', (error as Error).message);
            return NextResponse.json(
                { message: 'Backend service unavailable' },
                { status: 503 }
            );
        }

        console.error('[BFF /api/auth/login] Unexpected error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
