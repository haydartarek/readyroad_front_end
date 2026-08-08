/**
 * BFF Logout Route Handler
 *
 * Clears the HttpOnly auth cookie and the CSRF cookie.
 * Since the cookie is HttpOnly, client-side JS cannot clear it —
 * this server-side route is the ONLY way to log out.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  decodeJwtPayload,
  getBackendUrl,
  getExpiredAuthCookieOptions,
  getExpiredCsrfCookieOptions,
} from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (token) {
    try {
      const backendResponse = await fetch(`${getBackendUrl()}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const alreadyInvalid =
        backendResponse.status === 401 || backendResponse.status === 403;
      if (
        !backendResponse.ok &&
        !alreadyInvalid &&
        decodeJwtPayload(token)?.role === "ADMIN"
      ) {
        return NextResponse.json(
          { success: false, message: "Admin session could not be revoked" },
          { status: backendResponse.status },
        );
      }
    } catch (error) {
      if (decodeJwtPayload(token)?.role === "ADMIN") {
        console.warn("[BFF /api/auth/logout] Admin revocation failed", error);
        return NextResponse.json(
          { success: false, message: "Backend service unavailable" },
          { status: 503 },
        );
      }
    }
  }

  const response = NextResponse.json({ success: true });

  // Delete auth cookie
  response.cookies.set(
    AUTH_COOKIE_NAME,
    "",
    getExpiredAuthCookieOptions(request),
  );

  // Delete CSRF cookie
  response.cookies.set(
    CSRF_COOKIE_NAME,
    "",
    getExpiredCsrfCookieOptions(request),
  );

  return response;
}
