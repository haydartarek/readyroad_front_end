/** @jest-environment node */

import type { NextRequest } from "next/server";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";

const mockFetch = jest.fn();

function adminToken(expiresAtSeconds: number) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url",
  );
  const payload = Buffer.from(
    JSON.stringify({ role: "ADMIN", exp: expiresAtSeconds }),
  ).toString("base64url");
  return `${header}.${payload}.signature`;
}

function request(
  url: string,
  token?: string,
  body?: Record<string, string>,
): NextRequest {
  return {
    url,
    headers: new Headers({ host: "localhost:3000" }),
    cookies: {
      get: (name: string) =>
        name === "token" && token ? { name, value: token } : undefined,
    },
    json: async () => body ?? {},
  } as unknown as NextRequest;
}

describe("Admin BFF session handling", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
  });

  test("login limits the HttpOnly cookie to the ADMIN token expiry", async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 86_400;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        token: adminToken(expiresAt),
        username: "admin",
        role: "ADMIN",
      }),
    });

    const response = await login(
      request("http://localhost:3000/api/auth/login", undefined, {
        username: "admin",
        password: "secret",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.cookies.get("token")?.httpOnly).toBe(true);
    expect(response.cookies.get("token")?.maxAge).toBeGreaterThanOrEqual(86_398);
    expect(response.cookies.get("token")?.maxAge).toBeLessThanOrEqual(86_400);
  });

  test("logout revokes the Backend session before clearing cookies", async () => {
    const token = adminToken(Math.floor(Date.now() / 1000) + 86_400);
    mockFetch.mockResolvedValue({ ok: true, status: 204 });

    const response = await logout(
      request("http://localhost:3000/api/auth/logout", token),
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8890/api/auth/logout",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(response.cookies.get("token")?.maxAge).toBe(0);
  });

  test("keeps the ADMIN cookie when revocation cannot be confirmed", async () => {
    const token = adminToken(Math.floor(Date.now() / 1000) + 86_400);
    mockFetch.mockResolvedValue({ ok: false, status: 503 });

    const response = await logout(
      request("http://localhost:3000/api/auth/logout", token),
    );

    expect(response.status).toBe(503);
    expect(response.cookies.get("token")).toBeUndefined();
  });
});
