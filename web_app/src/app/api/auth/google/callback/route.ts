import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  generateCsrfToken,
  getAuthCookieOptions,
  getBackendUrl,
  getFrontendUrl,
  getCsrfCookieOptions,
  shouldUseSecureCookies,
} from "@/lib/server/auth";

const GOOGLE_STATE_COOKIE = "google_oauth_state";
const GOOGLE_CODE_VERIFIER_COOKIE = "google_oauth_code_verifier";
const GOOGLE_MODE_COOKIE = "google_oauth_mode";
const GOOGLE_RETURN_TO_COOKIE = "google_oauth_return_to";

function buildTemporaryCookieOptions(request: NextRequest, maxAge: number) {
  return {
    httpOnly: true,
    secure: shouldUseSecureCookies(request),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function clearGoogleFlowCookies(request: NextRequest, response: NextResponse) {
  const expired = buildTemporaryCookieOptions(request, 0);
  response.cookies.set(GOOGLE_STATE_COOKIE, "", expired);
  response.cookies.set(GOOGLE_CODE_VERIFIER_COOKIE, "", expired);
  response.cookies.set(GOOGLE_MODE_COOKIE, "", expired);
  response.cookies.set(GOOGLE_RETURN_TO_COOKIE, "", expired);
}

function isValidReturnTo(value: string | null | undefined): value is string {
  return !!value && value.startsWith("/") && !value.startsWith("//");
}

function normalizeBackendError(errorCode: string | undefined) {
  return errorCode?.toLowerCase() ?? "unknown_error";
}

function buildRedirectUrl(
  request: NextRequest,
  mode: string,
  type: "success" | "error",
  value: string,
  returnTo?: string | null,
) {
  const frontendUrl = getFrontendUrl(request);
  const fallback =
    mode === "register"
      ? "/register"
      : mode === "link"
        ? "/dashboard?section=profile"
        : "/login";

  const successTarget =
    mode === "link"
      ? (isValidReturnTo(returnTo) ? returnTo : "/dashboard?section=profile")
      : (isValidReturnTo(returnTo) ? returnTo : "/dashboard");

  const target = type === "success" ? successTarget : fallback;
  const redirectUrl = new URL(target, frontendUrl);
  redirectUrl.searchParams.set("authProvider", "google");

  if (type === "success") {
    redirectUrl.searchParams.set("authStatus", value);
  } else {
    redirectUrl.searchParams.set("authError", value);
  }

  return redirectUrl;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const providerError = url.searchParams.get("error");
  const storedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const codeVerifier = request.cookies.get(GOOGLE_CODE_VERIFIER_COOKIE)?.value;
  const mode = request.cookies.get(GOOGLE_MODE_COOKIE)?.value ?? "login";
  const returnTo = request.cookies.get(GOOGLE_RETURN_TO_COOKIE)?.value;

  if (providerError) {
    const redirectUrl = buildRedirectUrl(
      request,
      mode,
      "error",
      providerError === "access_denied" ? "provider_cancelled" : "provider_denied",
      returnTo,
    );
    const response = NextResponse.redirect(redirectUrl);
    clearGoogleFlowCookies(request, response);
    return response;
  }

  if (!code || !returnedState || !storedState || returnedState !== storedState || !codeVerifier) {
    const response = NextResponse.redirect(
      buildRedirectUrl(request, mode, "error", "state_mismatch", returnTo),
    );
    clearGoogleFlowCookies(request, response);
    return response;
  }

  const redirectUri = `${getFrontendUrl(request)}/api/auth/google/callback`;
  const backendUrl =
    mode === "link"
      ? `${getBackendUrl()}/users/me/auth-identities/google/link`
      : `${getBackendUrl()}/auth/google/exchange`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (mode === "link") {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      const response = NextResponse.redirect(
        buildRedirectUrl(request, mode, "error", "login_required", returnTo),
      );
      clearGoogleFlowCookies(request, response);
      return response;
    }
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        code,
        redirectUri,
        codeVerifier,
      }),
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      const errorData = (await backendResponse.json().catch(() => ({}))) as {
        error?: string;
      };
      const response = NextResponse.redirect(
        buildRedirectUrl(
          request,
          mode,
          "error",
          normalizeBackendError(errorData.error),
          returnTo,
        ),
      );
      clearGoogleFlowCookies(request, response);
      return response;
    }

    if (mode === "link") {
      const response = NextResponse.redirect(
        buildRedirectUrl(request, mode, "success", "linked", returnTo),
      );
      clearGoogleFlowCookies(request, response);
      return response;
    }

    const data = (await backendResponse.json()) as {
      token?: string;
      newUser?: boolean;
    };
    const token = data.token;

    if (!token) {
      const response = NextResponse.redirect(
        buildRedirectUrl(request, mode, "error", "missing_token", returnTo),
      );
      clearGoogleFlowCookies(request, response);
      return response;
    }

    const response = NextResponse.redirect(
      buildRedirectUrl(
        request,
        mode,
        "success",
        data.newUser ? "registered" : "logged_in",
        returnTo,
      ),
    );

    response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions(request));
    response.cookies.set(
      CSRF_COOKIE_NAME,
      generateCsrfToken(),
      getCsrfCookieOptions(request),
    );
    clearGoogleFlowCookies(request, response);
    return response;
  } catch (error) {
    console.error("[BFF /api/auth/google/callback] Unexpected error:", error);
    const response = NextResponse.redirect(
      buildRedirectUrl(request, mode, "error", "exchange_failed", returnTo),
    );
    clearGoogleFlowCookies(request, response);
    return response;
  }
}
