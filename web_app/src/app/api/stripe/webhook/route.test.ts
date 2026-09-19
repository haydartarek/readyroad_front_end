/** @jest-environment node */
import { POST } from "./route";

jest.mock("@/lib/server/auth", () => ({ getBackendUrl: () => "http://backend.invalid/api" }));
const realFetch = global.fetch;
beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { global.fetch = realFetch; });

test("forwards signed bytes unchanged without cookie credentials", async () => {
  jest.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));
  const body = '{ "id": "evt_1", "text": "دفعة" }\n';
  const response = await POST(new Request("http://localhost/api/stripe/webhook", {
    method: "POST", body, headers: { "stripe-signature": "signed", Cookie: "token=untrusted" },
  }));
  expect(response.status).toBe(200);
  const [url, options] = jest.mocked(fetch).mock.calls[0];
  expect(url).toBe("http://backend.invalid/api/stripe/webhook");
  expect(new TextDecoder().decode(options?.body as ArrayBuffer)).toBe(body);
  expect(options?.headers).toEqual({ "Content-Type": "application/json", "Stripe-Signature": "signed" });
});
test("missing signature never calls backend", async () => {
  expect((await POST(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: "{}" }))).status).toBe(400);
  expect(fetch).not.toHaveBeenCalled();
});
test("signature rejection and backend failure remain non-2xx", async () => {
  const request = () => new Request("http://localhost/api/stripe/webhook", { method: "POST", body: "{}", headers: { "stripe-signature": "signed" } });
  jest.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 400 })).mockRejectedValueOnce(new Error("offline"));
  expect((await POST(request())).status).toBe(400);
  expect((await POST(request())).status).toBe(503);
});
