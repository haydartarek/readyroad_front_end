/** @jest-environment node */

import type { NextRequest } from "next/server";
import { POST } from "@/app/api/proxy/[...path]/route";

jest.mock("@/lib/server/auth", () => ({
  AUTH_COOKIE_NAME: "token",
  CSRF_COOKIE_NAME: "csrf_token",
  CSRF_HEADER_NAME: "x-csrf-token",
  getBackendUrl: () => "http://localhost:8890/api",
  getAuthTokenFromCookie: async () => "test-jwt",
}));

const mockFetch = jest.fn();

function mutationRequest(): NextRequest {
  return {
    method: "POST",
    cookies: {
      get: (name: string) =>
        name === "token" || name === "csrf_token"
          ? { name, value: name === "token" ? "test-jwt" : "csrf-value" }
          : undefined,
    },
    headers: new Headers({ "x-csrf-token": "csrf-value" }),
    nextUrl: new URL(
      "http://localhost:3000/api/proxy/sign-quiz/random-practice/16/abandon",
    ),
    text: async () => "",
  } as unknown as NextRequest;
}

describe("BFF API proxy no-content responses", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
  });

  test("forwards a Backend 204 without constructing a response body", async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 204 }));

    const response = await POST(mutationRequest(), {
      params: Promise.resolve({
        path: ["sign-quiz", "random-practice", "16", "abandon"],
      }),
    });

    expect(response.status).toBe(204);
    expect((await response.arrayBuffer()).byteLength).toBe(0);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8890/api/sign-quiz/random-practice/16/abandon",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
