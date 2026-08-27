/**
 * Authenticated BFF API proxy.
 * Client requests stay on localhost:3000 while credentials remain server-side.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  getAuthTokenFromCookie,
  getBackendUrl,
} from "@/lib/server/auth";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const NOTIFICATION_UNREAD_COUNT_PATH = "users/me/notifications/unread-count";

function validateCsrf(request: NextRequest): boolean {
  if (!MUTATION_METHODS.has(request.method)) return true;
  if (!request.cookies.get(AUTH_COOKIE_NAME)?.value) return true;

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  return Boolean(cookieToken && headerToken && cookieToken === headerToken);
}

function unreadCountFallback() {
  return NextResponse.json(
    { unreadCount: 0, degraded: true },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
        "x-rijvia-fallback": "notifications-unread-count",
      },
    },
  );
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!validateCsrf(request)) {
    return NextResponse.json({ message: "CSRF token mismatch" }, { status: 403 });
  }

  const { path } = await context.params;
  const targetPath = path.join("/");
  const query = request.nextUrl.searchParams.toString();
  const url = `${getBackendUrl()}/${targetPath}${query ? `?${query}` : ""}`;
  const token = await getAuthTokenFromCookie();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const options: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };
  if (MUTATION_METHODS.has(request.method)) {
    try {
      options.body = contentType?.includes("multipart/form-data")
        ? await request.arrayBuffer()
        : await request.text();
    } catch {
      // DELETE requests may not contain a body.
    }
  }

  try {
    const backendResponse = await fetch(url, options);
    if (
      targetPath === NOTIFICATION_UNREAD_COUNT_PATH
      && backendResponse.status >= 500
    ) {
      return unreadCountFallback();
    }

    const responseBody = [204, 205, 304].includes(backendResponse.status)
      ? null
      : await backendResponse.arrayBuffer();
    const responseHeaders = new Headers();
    const responseContentType = backendResponse.headers.get("content-type");
    if (responseContentType) responseHeaders.set("content-type", responseContentType);
    for (const name of ["x-total-count", "x-page-size", "x-current-page"]) {
      const value = backendResponse.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const connectionError = error instanceof TypeError
      && (error.message.includes("fetch failed") || error.message.includes("ECONNREFUSED"));
    if (connectionError) {
      if (targetPath === NOTIFICATION_UNREAD_COUNT_PATH) {
        return unreadCountFallback();
      }
      return NextResponse.json(
        { message: "Backend service unavailable" },
        { status: 503 },
      );
    }

    console.error(
      `[Proxy] Unexpected error forwarding ${request.method} /${targetPath}:`,
      error,
    );
    return NextResponse.json({ message: "Proxy error" }, { status: 502 });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
