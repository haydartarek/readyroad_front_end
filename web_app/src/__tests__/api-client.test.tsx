/**
 * API Client tests using the real Axios interceptors.
 *
 * These tests drive requests through the singleton apiClient instance with a
 * custom Axios adapter, so request/response interceptors run exactly as they do
 * in the app.
 */

import { AxiosError, type AxiosAdapter, type AxiosResponse } from "axios";
import { ROUTES } from "@/lib/constants";
import { apiClient, shouldRedirectOnAuthError } from "@/lib/api";

// Mock fetch for BFF logout
const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

const client = apiClient.getInstance();
const originalAdapter = client.defaults.adapter;

function resetRedirectGuard(): void {
  (apiClient as unknown as { isRedirecting: boolean }).isRedirecting = false;
}

function readHeader(headers: unknown, name: string): string | undefined {
  if (!headers || typeof headers !== "object") {
    return undefined;
  }

  const axiosHeaders = headers as {
    get?: (headerName: string) => string | undefined;
    [key: string]: unknown;
  };

  if (typeof axiosHeaders.get === "function") {
    return axiosHeaders.get(name) ?? axiosHeaders.get(name.toLowerCase());
  }

  const lowerName = name.toLowerCase();
  const matchedKey = Object.keys(axiosHeaders).find(
    (key) => key.toLowerCase() === lowerName,
  );

  return matchedKey ? String(axiosHeaders[matchedKey]) : undefined;
}

function makeAuthFailureAdapter(status: 401 | 403, url: string): AxiosAdapter {
  return async (config) => {
    const response: AxiosResponse = {
      data: { message: "auth error" },
      status,
      statusText: status === 401 ? "Unauthorized" : "Forbidden",
      headers: {},
      config: { ...config, url },
      request: {},
    };

    throw new AxiosError(
      response.statusText,
      "ERR_BAD_REQUEST",
      { ...config, url },
      {},
      response,
    );
  };
}

const echoHeadersAdapter: AxiosAdapter = async (config) => ({
  data: {
    csrfHeader: readHeader(config.headers, "x-csrf-token") ?? null,
    authorizationHeader: readHeader(config.headers, "authorization") ?? null,
  },
  status: 200,
  statusText: "OK",
  headers: {},
  config,
  request: {},
});

describe("API Client (HttpOnly Cookie Proxy)", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    client.defaults.adapter = originalAdapter;
    document.cookie =
      "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    resetRedirectGuard();
  });

  afterAll(() => {
    client.defaults.adapter = originalAdapter;
    resetRedirectGuard();
  });

  test("login route constant is correct", () => {
    expect(ROUTES.LOGIN).toBe("/login");
  });

  test("protected 401 responses trigger logout through the real response interceptor", async () => {
    client.defaults.adapter = makeAuthFailureAdapter(
      401,
      "/sign-quiz/signs/A1b/status",
    );
    mockFetch.mockImplementation(() => new Promise(() => {}));

    await expect(
      apiClient.get("/sign-quiz/signs/A1b/status"),
    ).rejects.toBeInstanceOf(AxiosError);

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
    });
  });

  test("optional public-page 401 responses skip logout when skipAuthRedirect is set", async () => {
    client.defaults.adapter = makeAuthFailureAdapter(
      401,
      "/sign-quiz/signs/A1b/status",
    );
    mockFetch.mockImplementation(() => new Promise(() => {}));

    await expect(
      apiClient.get("/sign-quiz/signs/A1b/status", undefined, {
        skipAuthRedirect: true,
      }),
    ).rejects.toBeInstanceOf(AxiosError);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("optional public-page requests can suppress auth redirect", () => {
    expect(
      shouldRedirectOnAuthError(401, "/sign-quiz/signs/A1b/status", {
        skipAuthRedirect: true,
      }),
    ).toBe(false);
  });

  test("mutation requests can suppress auth redirect when skipAuthRedirect is set", async () => {
    client.defaults.adapter = makeAuthFailureAdapter(
      401,
      "/users/me/notifications/1/read",
    );
    mockFetch.mockImplementation(() => new Promise(() => {}));

    await expect(
      apiClient.patch("/users/me/notifications/1/read", undefined, {
        skipAuthRedirect: true,
      }),
    ).rejects.toBeInstanceOf(AxiosError);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("normal protected requests still redirect on auth errors", () => {
    expect(shouldRedirectOnAuthError(401, "/sign-quiz/signs/A1b/status")).toBe(
      true,
    );
  });

  test("request interceptor does not inject Authorization headers client-side", async () => {
    client.defaults.adapter = echoHeadersAdapter;

    const response = await apiClient.get<{
      csrfHeader: string | null;
      authorizationHeader: string | null;
    }>("/traffic-signs/A1b");

    expect(response.data.authorizationHeader).toBeNull();
  });

  test("CSRF token is attached on mutation requests through the real request interceptor", async () => {
    client.defaults.adapter = echoHeadersAdapter;
    document.cookie = "csrf_token=test-csrf-abc123; path=/";

    const response = await apiClient.post<{
      csrfHeader: string | null;
      authorizationHeader: string | null;
    }>("/progress/submit", { answer: 1 });

    expect(response.data.csrfHeader).toBe("test-csrf-abc123");
  });

  test("proxy base URL is /api/proxy (not direct backend)", () => {
    expect(client.defaults.baseURL).toBe("/api/proxy");
  });
});
