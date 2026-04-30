import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/exam",
  "/practice",
  "/analytics",
  "/profile",
  "/assessment",
];

const ADMIN_ROUTES = ["/admin"];
const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

function isValidTokenFormat(token: string | undefined): token is string {
  if (!token || token.length < 10) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || !token.startsWith("eyJ")) return false;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function extractRole(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  if (typeof payload.role === "string") return payload.role;

  if (Array.isArray(payload.roles) && payload.roles.length > 0) {
    return String(payload.roles[0]).replace(/^ROLE_/, "");
  }

  if (Array.isArray(payload.authorities) && payload.authorities.length > 0) {
    const firstAuthority = payload.authorities[0];
    const authority =
      typeof firstAuthority === "string"
        ? firstAuthority
        : (firstAuthority as Record<string, string>)?.authority;
    return authority ? authority.replace(/^ROLE_/, "") : null;
  }

  return null;
}

function matchesAny(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname.startsWith(route));
}

function redirectTo(url: string, request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL(url, request.url));
}

function redirectToLogin(pathname: string, request: NextRequest): NextResponse {
  const url = new URL("/login", request.url);
  url.searchParams.set("returnUrl", pathname);
  return NextResponse.redirect(url);
}

export default function middleware(request: NextRequest) {
  const rawToken = request.cookies.get("token")?.value;
  const hasValidToken = isValidTokenFormat(rawToken);
  const { pathname } = request.nextUrl;

  if (rawToken && !hasValidToken) {
    const response = NextResponse.next();
    response.cookies.delete("token");
    return response;
  }

  if (matchesAny(pathname, ADMIN_ROUTES)) {
    if (!hasValidToken) return redirectToLogin(pathname, request);
    if (extractRole(rawToken) !== "ADMIN")
      return redirectTo("/unauthorized", request);
    return NextResponse.next();
  }

  if (matchesAny(pathname, PROTECTED_ROUTES) && !hasValidToken) {
    return redirectToLogin(pathname, request);
  }

  if (matchesAny(pathname, AUTH_ROUTES) && hasValidToken) {
    return redirectTo("/dashboard", request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/exam/:path*",
    "/practice/:path*",
    "/analytics/:path*",
    "/profile/:path*",
    "/assessment/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
