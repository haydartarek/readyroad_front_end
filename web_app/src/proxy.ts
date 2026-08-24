import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getLocaleFromPathname,
  localizePathname,
  resolveRouteLocale,
} from "@/lib/i18n-routing";
import { isMissingPublishedArticle } from "@/lib/server/article-route-status";
import { STORAGE_KEYS } from "@/lib/constants";

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

function redirectTo(
  url: string,
  request: NextRequest,
  locale: "en" | "nl" | "fr" | "ar",
  status: 307 | 308 = 307,
  preserveSearch = false,
): NextResponse {
  const redirectUrl = new URL(localizePathname(url, locale), request.url);
  if (preserveSearch) {
    redirectUrl.search = request.nextUrl.search;
  }
  const response = NextResponse.redirect(
    redirectUrl,
    status,
  );
  response.cookies.set(STORAGE_KEYS.LANGUAGE, locale, {
    path: "/",
    maxAge: 31_536_000,
    sameSite: "lax",
  });
  return response;
}

function redirectToLogin(
  pathname: string,
  request: NextRequest,
  locale: "en" | "nl" | "fr" | "ar",
): NextResponse {
  const url = new URL(localizePathname("/login", locale), request.url);
  url.searchParams.set("returnUrl", `${pathname}${request.nextUrl.search}`);
  const response = NextResponse.redirect(url);
  response.cookies.set(STORAGE_KEYS.LANGUAGE, locale, {
    path: "/",
    maxAge: 31_536_000,
    sameSite: "lax",
  });
  return response;
}

function withRouteLocale(
  request: NextRequest,
  locale: "en" | "nl" | "fr" | "ar",
  pathname: string,
  rewrite: boolean,
  status?: number,
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  const cookieHeader = requestHeaders.get("cookie") ?? "";
  const localeCookie = `${STORAGE_KEYS.LANGUAGE}=${locale}`;
  const updatedCookieHeader = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .filter(
      (item) =>
        item.length > 0 &&
        !item.startsWith(`${STORAGE_KEYS.LANGUAGE}=`),
    );
  updatedCookieHeader.push(localeCookie);
  requestHeaders.set("cookie", updatedCookieHeader.join("; "));
  requestHeaders.set("x-readyroad-locale", locale);
  requestHeaders.set("x-readyroad-pathname", pathname);
  requestHeaders.set("x-readyroad-routed", "1");

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = pathname;
  const response = rewrite
    ? NextResponse.rewrite(rewriteUrl, {
        request: { headers: requestHeaders },
        status,
      })
    : NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set(STORAGE_KEYS.LANGUAGE, locale, {
    path: "/",
    maxAge: 31_536_000,
    sameSite: "lax",
  });
  return response;
}

export default async function proxy(request: NextRequest) {
  if (request.headers.get("x-readyroad-routed") === "1") {
    return NextResponse.next();
  }

  const rawToken = request.cookies.get("token")?.value;
  const hasValidToken = isValidTokenFormat(rawToken);
  const browserPathname = request.nextUrl.pathname;
  const route = getLocaleFromPathname(browserPathname);
  const { pathname } = route;
  const cookieLocale = request.cookies.get(STORAGE_KEYS.LANGUAGE)?.value;
  const hasExplicitLocale = route.hasLocalePrefix || route.hasEnglishPrefix;
  const locale = resolveRouteLocale(browserPathname, cookieLocale);

  if (route.hasEnglishPrefix) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const response = NextResponse.redirect(url, 308);
    response.cookies.set(STORAGE_KEYS.LANGUAGE, "en", {
      path: "/",
      maxAge: 31_536_000,
      sameSite: "lax",
    });
    return response;
  }

  if (!hasExplicitLocale && locale !== "en") {
    return redirectTo(pathname, request, locale, 307, true);
  }

  if (pathname === "/privacy") {
    return redirectTo("/privacy-policy", request, locale, 308);
  }

  const legacyLessonPageOne = pathname.match(/^\/lessons\/([^/]+)\/1\/?$/);
  if (legacyLessonPageOne) {
    return redirectTo(
      `/lessons/${legacyLessonPageOne[1]}`,
      request,
      locale,
      308,
      true,
    );
  }

  if (pathname === "/assessment" || pathname.startsWith("/assessment/")) {
    return redirectTo("/practice/random", request, locale);
  }

  if (
    (request.method === "GET" || request.method === "HEAD") &&
    await isMissingPublishedArticle(pathname, locale)
  ) {
    return withRouteLocale(request, locale, pathname, true, 404);
  }

  if (rawToken && !hasValidToken) {
    const response = withRouteLocale(
      request,
      locale,
      pathname,
      route.hasLocalePrefix,
    );
    response.cookies.delete("token");
    return response;
  }

  if (matchesAny(pathname, ADMIN_ROUTES)) {
    if (!hasValidToken) return redirectToLogin(browserPathname, request, locale);
    if (extractRole(rawToken) !== "ADMIN")
      return redirectTo("/unauthorized", request, locale);
    return withRouteLocale(
      request,
      locale,
      pathname,
      route.hasLocalePrefix,
    );
  }

  if (matchesAny(pathname, PROTECTED_ROUTES) && !hasValidToken) {
    return redirectToLogin(browserPathname, request, locale);
  }

  if (matchesAny(pathname, AUTH_ROUTES) && hasValidToken) {
    return redirectTo("/dashboard", request, locale);
  }

  return withRouteLocale(request, locale, pathname, route.hasLocalePrefix);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|images|icons|favicon.ico|favicon.svg|favicon-96x96.png|apple-touch-icon.png|manifest.json|opengraph-image|twitter-image).*)",
  ],
};
