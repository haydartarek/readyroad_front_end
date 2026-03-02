/**
 * BFF Register Route Handler
 *
 * Same pattern as login: forwards to backend, sets HttpOnly cookie,
 * returns user data without the raw token.
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

    const backendResponse = await fetch(`${getBackendUrl()}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({
        message: 'Registration failed',
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

    const response = NextResponse.json(userData);
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    const csrfToken = generateCsrfToken();
    response.cookies.set(CSRF_COOKIE_NAME, csrfToken, CSRF_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    const isConnectionError =
      error instanceof TypeError &&
      (error.message.includes('fetch failed') ||
       error.message.includes('ECONNREFUSED'));

    if (isConnectionError) {
      console.warn('[BFF /api/auth/register] Backend unreachable:', (error as Error).message);
      return NextResponse.json(
        { message: 'Backend service unavailable' },
        { status: 503 }
      );
    }

    console.error('[BFF /api/auth/register] Unexpected error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
