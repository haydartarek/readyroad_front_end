/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/proxy/[...path]/route";
import { getAuthTokenFromCookie } from "@/lib/server/auth";

jest.mock("@/lib/server/auth", () => ({
  AUTH_COOKIE_NAME: "access_token",
  CSRF_COOKIE_NAME: "csrf_token",
  CSRF_HEADER_NAME: "x-csrf-token",
  getAuthTokenFromCookie: jest.fn(),
  getBackendUrl: () => "http://backend:8890/api",
}));

const authToken = getAuthTokenFromCookie as jest.Mock;
const context = (path: string[]) => ({ params: Promise.resolve({ path }) });

describe("authenticated BFF proxy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authToken.mockResolvedValue("signed-jwt");
    global.fetch = jest.fn().mockResolvedValue(new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { "content-type": "application/json" } },
    ));
  });

  it("forwards authenticated GET requests to the local backend", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/api/proxy/admin/marketing/editorial/editor"),
      context(["admin", "marketing", "editorial", "editor"]),
    );

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://backend:8890/api/admin/marketing/editorial/editor",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer signed-jwt" }),
      }),
    );
  });

  it("rejects an authenticated mutation with a mismatched CSRF token", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/proxy/admin/marketing/editorial/editor", {
        method: "POST",
        headers: {
          cookie: "access_token=signed; csrf_token=expected",
          "x-csrf-token": "different",
        },
      }),
      context(["admin", "marketing", "editorial", "editor"]),
    );

    expect(response.status).toBe(403);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("forwards a local image multipart body with its original boundary", async () => {
    const boundary = "----rijvia-image-boundary";
    const rawBody = `--${boundary}\r\ncontent\r\n--${boundary}--`;
    await POST(
      new NextRequest("http://localhost:3000/api/proxy/admin/marketing/editorial/editor/articles/17/image", {
        method: "POST",
        headers: {
          cookie: "access_token=signed; csrf_token=csrf",
          "x-csrf-token": "csrf",
          "content-type": `multipart/form-data; boundary=${boundary}`,
        },
        body: rawBody,
      }),
      context(["admin", "marketing", "editorial", "editor", "articles", "17", "image"]),
    );

    const options = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit;
    expect(options.headers).toEqual(expect.objectContaining({
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    }));
    expect(new TextDecoder().decode(options.body as ArrayBuffer)).toBe(rawBody);
  });
});
