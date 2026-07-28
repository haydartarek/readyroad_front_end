/** @jest-environment node */

import type { NextRequest } from "next/server";
import { GET } from "@/app/api/auth/google/callback/route";

const mockFetch = jest.fn();

function createCallbackRequest(language: string): NextRequest {
  const cookieValues: Record<string, string> = {
    google_oauth_state: "expected-state",
    google_oauth_code_verifier: "test-verifier",
    google_oauth_mode: "login",
    google_oauth_return_to: "/dashboard",
    readyroad_locale: language,
  };

  return {
    url: "http://localhost:3000/api/auth/google/callback?code=test-code&state=expected-state",
    headers: new Headers({ host: "localhost:3000" }),
    cookies: {
      get: (name: string) => {
        const value = cookieValues[name];
        return value ? { name, value } : undefined;
      },
    },
  } as unknown as NextRequest;
}

describe("Google OAuth language preference", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "test-jwt", newUser: true }),
    });
    global.fetch = mockFetch;
  });

  test("passes the current locale cookie to the backend exchange", async () => {
    const response = await GET(createCallbackRequest("ar"));

    expect(response.status).toBe(307);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8890/api/auth/google/exchange",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          code: "test-code",
          redirectUri:
            "http://localhost:3000/api/auth/google/callback",
          codeVerifier: "test-verifier",
          preferredLanguage: "ar",
        }),
      }),
    );
  });
});
