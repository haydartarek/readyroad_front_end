import { AxiosHeaders, type AxiosResponse } from "axios";
import { apiClient } from "@/lib/api";
import { ALL_MESSAGES } from "@/lib/messages";
import { createCheckout, getPurchaseStatus } from "./paymentService";

jest.mock("@/lib/api", () => ({ apiClient: { post: jest.fn(), get: jest.fn() } }));
beforeEach(() => jest.clearAllMocks());

function response<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
}

test("checkout body includes only plan and idempotency key; locale uses existing proxy header", async () => {
  jest.mocked(apiClient.post).mockResolvedValue(response({ purchaseId: "owned", checkoutUrl: "https://checkout.stripe.com/example" }));
  await createCheckout("RIJVIA_1_WEEK", "request-uuid", "ar");
  expect(apiClient.post).toHaveBeenCalledWith("/checkout", { plan: "RIJVIA_1_WEEK", clientRequestId: "request-uuid" }, { headers: { "Accept-Language": "ar" } });
});
test("invalid locales never reach checkout", async () => {
  await expect(createCheckout("RIJVIA_1_WEEK", "request-uuid", "../evil")).rejects.toThrow();
  expect(apiClient.post).not.toHaveBeenCalled();
});
test("status request accepts a cancellation signal and never uses a session id", async () => {
  jest.mocked(apiClient.get).mockResolvedValue(response({ status: "PENDING" }));
  const signal = new AbortController().signal;
  await getPurchaseStatus("purchase-uuid", signal);
  expect(apiClient.get).toHaveBeenCalledWith("/purchases/purchase-uuid/status", undefined, { signal, skipAuthRedirect: true });
});
test("all payment strings exist in the four existing locale files", () => {
  const keys = Object.keys(ALL_MESSAGES.en).filter(key => key.startsWith("payment."));
  expect(keys.length).toBeGreaterThan(20);
  for (const language of ["ar", "nl", "fr", "en"] as const) {
    expect(Object.keys(ALL_MESSAGES[language]).filter(key => key.startsWith("payment.")).sort()).toEqual(keys.sort());
    for (const key of keys) expect(ALL_MESSAGES[language][key].trim()).not.toBe("");
    expect(ALL_MESSAGES[language]["payment.expires"]).toContain("{date}");
  }
});
