/**
 * BFF API Proxy — Catch-all Route Handler
 *
 * Proxies all authenticated API requests through Next.js:
 *   Client → /api/proxy/{path} → Backend http://localhost:8890/api/{path}
 *
 * Security model:
 * - Reads the HttpOnly JWT cookie (invisible to client JS)
 * - Attaches it as Authorization: Bearer header to the backend request
 * - Validates CSRF double-submit token on mutation requests (POST/PUT/PATCH/DELETE)
 * - The raw JWT token NEVER reaches client-side JavaScript
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getBackendUrl,
  getAuthTokenFromCookie,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from '@/lib/server/auth';

// HTTP methods that mutate state — require CSRF validation
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Validate CSRF double-submit token for mutation requests.
 * The client must send the csrf_token cookie value as the x-csrf-token header.
 */
function validateCsrf(request: NextRequest): boolean {
  if (!MUTATION_METHODS.has(request.method)) return true;

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  // If no CSRF cookie exists (e.g., public POST like search), skip validation
  if (!cookieToken) return true;

  return !!headerToken && cookieToken === headerToken;
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  // Validate CSRF on mutation requests
  if (!validateCsrf(request)) {
    return NextResponse.json(
      { message: 'CSRF token mismatch' },
      { status: 403 }
    );
  }

  const { path }    = await context.params;
  const backendUrl  = getBackendUrl();
  const targetPath  = path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${backendUrl}/${targetPath}${searchParams ? `?${searchParams}` : ''}`;

  // Read HttpOnly auth cookie
  const token = await getAuthTokenFromCookie();

  // Build headers for backend request
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Forward content-type for requests with bodies
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store',
  };

  // Forward request body for mutation methods
  if (MUTATION_METHODS.has(request.method)) {
    if (contentType?.includes('multipart/form-data')) {
      // For file uploads: let fetch auto-set boundary
      delete headers['Content-Type'];
      fetchOptions.body = await request.arrayBuffer();
    } else {
      try {
        fetchOptions.body = await request.text();
      } catch {
        // No body — fine for DELETE requests
      }
    }
  }

  try {
    const backendResponse = await fetch(url, fetchOptions);
    const responseBody    = await backendResponse.arrayBuffer();

    // Build forwarded response headers
    const responseHeaders = new Headers();

    const responseContentType = backendResponse.headers.get('content-type');
    if (responseContentType) {
      responseHeaders.set('content-type', responseContentType);
    }

    // Forward common backend headers
    const headersToForward = ['x-total-count', 'x-page-size', 'x-current-page'];
    for (const header of headersToForward) {
      const value = backendResponse.headers.get(header);
      if (value) responseHeaders.set(header, value);
    }

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const isConnectionError =
      error instanceof TypeError &&
      (error.message.includes('fetch failed') ||
       error.message.includes('ECONNREFUSED'));

    if (isConnectionError) {
      console.warn(`[Proxy] Backend unreachable for ${request.method} /${targetPath}`);
      return NextResponse.json(
        { message: 'Backend service unavailable' },
        { status: 503 }
      );
    }

    console.error(`[Proxy] Unexpected error forwarding ${request.method} /${targetPath}:`, error);
    return NextResponse.json(
      { message: 'Proxy error' },
      { status: 502 }
    );
  }
}

// Export all HTTP method handlers
export const GET    = proxyRequest;
export const POST   = proxyRequest;
export const PUT    = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH  = proxyRequest;
