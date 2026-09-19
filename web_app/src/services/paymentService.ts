import { apiClient } from "@/lib/api";
import { isValidLanguage } from "@/lib/messages";

export const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED !== "false";

export const PAYMENT_PLANS = ["RIJVIA_3_DAYS", "RIJVIA_1_WEEK", "RIJVIA_4_WEEKS"] as const;
export type PaymentPlan = (typeof PAYMENT_PLANS)[number];
export interface PurchaseStatus {
  purchaseId: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  plan: PaymentPlan;
  expiresAt: string | null;
}
export interface CheckoutResult { purchaseId: string; checkoutUrl: string }

export async function createCheckout(plan: PaymentPlan, clientRequestId: string, locale: string) {
  if (!PAYMENTS_ENABLED) throw new Error("Payments are disabled");
  if (!isValidLanguage(locale)) throw new Error("Unsupported checkout locale");
  const response = await apiClient.post<CheckoutResult>("/checkout", { plan, clientRequestId }, {
    headers: { "Accept-Language": locale },
  });
  return response.data;
}

export async function getPurchaseStatus(id: string, signal?: AbortSignal) {
  const response = await apiClient.get<PurchaseStatus>(`/purchases/${encodeURIComponent(id)}/status`, undefined, {
    signal, skipAuthRedirect: true,
  });
  return response.data;
}

export async function resumeCheckout(id: string) {
  if (!PAYMENTS_ENABLED) throw new Error("Payments are disabled");
  if (!isPurchaseId(id)) {
    throw new Error("Invalid purchase ID");
  }

  const response = await apiClient.post<CheckoutResult>(
    `/purchases/${encodeURIComponent(id)}/resume`,
    {},
  );

  return response.data;
}

const key = (user: string, plan: PaymentPlan) => `rijvia.checkout.${user}.${plan}`;
const inMemoryAttempts = new Map<string, string>();

export function checkoutRequestId(user: string, plan: PaymentPlan): string {
  const storageKey = key(user, plan);
  let id = inMemoryAttempts.get(storageKey);
  try { id = sessionStorage.getItem(storageKey) || id; } catch { /* Private browsing fallback. */ }
  if (!id) id = crypto.randomUUID();
  inMemoryAttempts.set(storageKey, id);
  try { sessionStorage.setItem(storageKey, id); } catch { /* Retain the in-memory attempt. */ }
  return id;
}

export function forgetCheckoutRequest(user: string, plan: PaymentPlan) {
  const storageKey = key(user, plan);
  inMemoryAttempts.delete(storageKey);
  try { sessionStorage.removeItem(storageKey); } catch { /* Nothing persisted. */ }
}

export const isPurchaseId = (id: string | null): id is string =>
  !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
