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

import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  getBackendUrl,
  getAuthTokenFromCookie,
  getExpiredAuthCookieOptions,
  getExpiredCsrfCookieOptions,
} from "@/lib/server/auth";

export async function DELETE(request: NextRequest) {
  const token = await getAuthTokenFromCookie();
  const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const csrfHeader = request.headers.get(CSRF_HEADER_NAME);

  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return NextResponse.json(
      { message: "CSRF token mismatch" },
      { status: 403 },
    );
  }

  try {
    const backendResponse = await fetch(`${getBackendUrl()}/users/me`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    // Backend failed — do NOT clear cookies, account was not deleted
    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({
        message: "Failed to delete account",
      }));
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    // Account deleted on backend — clear auth cookies so session ends
    const response = NextResponse.json({ success: true });
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
  } catch (error) {
    const isConnectionError =
      error instanceof TypeError &&
      (error.message.includes("fetch failed") ||
        error.message.includes("ECONNREFUSED"));

    if (isConnectionError) {
      console.warn(
        "[BFF /api/auth/delete-account] Backend unreachable:",
        (error as Error).message,
      );
      return NextResponse.json(
        { message: "Backend service unavailable" },
        { status: 503 },
      );
    }

    console.error("[BFF /api/auth/delete-account] Unexpected error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
