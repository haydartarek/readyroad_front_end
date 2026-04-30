import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getFrontendUrl, shouldUseSecureCookies } from "@/lib/server/auth";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TEMP_COOKIE_MAX_AGE = 10 * 60;
const GOOGLE_STATE_COOKIE = "google_oauth_state";
const GOOGLE_CODE_VERIFIER_COOKIE = "google_oauth_code_verifier";
const GOOGLE_MODE_COOKIE = "google_oauth_mode";
const GOOGLE_RETURN_TO_COOKIE = "google_oauth_return_to";

function toBase64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildTemporaryCookieOptions(request: NextRequest, maxAge: number) {
  return {
    httpOnly: true,
    secure: shouldUseSecureCookies(request),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function isValidReturnTo(value: string | null): value is string {
  return !!value && value.startsWith("/") && !value.startsWith("//");
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID ?? "";
  const url = new URL(request.url);
  const frontendUrl = getFrontendUrl(request);
  const mode = url.searchParams.get("mode") ?? "login";
  const returnTo = url.searchParams.get("returnTo");

  if (!clientId) {
    const fallback = mode === "register" ? "/register" : "/login";
    return NextResponse.redirect(
      new URL(`${fallback}?authProvider=google&authError=unavailable`, frontendUrl),
    );
  }

  const state = toBase64Url(randomBytes(24));
  const codeVerifier = toBase64Url(randomBytes(48));
  const codeChallenge = toBase64Url(
    createHash("sha256").update(codeVerifier).digest(),
  );
  const redirectUri = `${frontendUrl}/api/auth/google/callback`;

  const googleUrl = new URL(GOOGLE_AUTH_URL);
  googleUrl.searchParams.set("client_id", clientId);
  googleUrl.searchParams.set("redirect_uri", redirectUri);
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope", "openid email profile");
  googleUrl.searchParams.set("state", state);
  googleUrl.searchParams.set("code_challenge", codeChallenge);
  googleUrl.searchParams.set("code_challenge_method", "S256");
  googleUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(googleUrl);
  response.cookies.set(
    GOOGLE_STATE_COOKIE,
    state,
    buildTemporaryCookieOptions(request, TEMP_COOKIE_MAX_AGE),
  );
  response.cookies.set(
    GOOGLE_CODE_VERIFIER_COOKIE,
    codeVerifier,
    buildTemporaryCookieOptions(request, TEMP_COOKIE_MAX_AGE),
  );
  response.cookies.set(
    GOOGLE_MODE_COOKIE,
    mode,
    buildTemporaryCookieOptions(request, TEMP_COOKIE_MAX_AGE),
  );
  response.cookies.set(
    GOOGLE_RETURN_TO_COOKIE,
    isValidReturnTo(returnTo) ? returnTo : "",
    buildTemporaryCookieOptions(request, TEMP_COOKIE_MAX_AGE),
  );

  return response;
}
