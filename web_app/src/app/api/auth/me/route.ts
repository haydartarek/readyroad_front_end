/**
 * BFF "Get Current User" Route Handler
 *
 * Reads the HttpOnly JWT cookie and forwards it to the backend's
 * GET /auth/me endpoint as a Bearer token. Returns user data.
 *
 * This allows the client to check authentication status without
 * ever having access to the raw JWT.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  getBackendUrl,
  getAuthTokenFromCookie,
  getExpiredAuthCookieOptions,
  getExpiredCsrfCookieOptions,
} from "@/lib/server/auth";

function unauthenticatedResponse(request: NextRequest) {
  const response = NextResponse.json({
    authenticated: false,
    user: null,
  });

  response.cookies.set(
    AUTH_COOKIE_NAME,
    "",
    getExpiredAuthCookieOptions(request),
  );
  response.cookies.set(
    CSRF_COOKIE_NAME,
    "",
    getExpiredCsrfCookieOptions(request),
  );

  return response;
}

export async function GET(request: NextRequest) {
  const token = await getAuthTokenFromCookie();

  if (!token) {
    return unauthenticatedResponse(request);
  }

  try {
    const backendResponse = await fetch(`${getBackendUrl()}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      // Don't cache — always check fresh auth state
      cache: "no-store",
    });

    if (backendResponse.status === 401 || backendResponse.status === 403) {
      return unauthenticatedResponse(request);
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: "Authentication check failed" },
        { status: backendResponse.status },
      );
    }

    const userData = await backendResponse.json();
    return NextResponse.json({
      authenticated: true,
      user: userData,
    });
  } catch (error) {
    const isConnectionError =
      error instanceof TypeError &&
      (error.message.includes("fetch failed") ||
        error.message.includes("ECONNREFUSED"));

    if (isConnectionError) {
      console.warn(
        "[BFF /api/auth/me] Backend unreachable:",
        (error as Error).message,
      );
      return NextResponse.json(
        { message: "Backend service unavailable" },
        { status: 503 },
      );
    }

    console.error("[BFF /api/auth/me] Unexpected error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
