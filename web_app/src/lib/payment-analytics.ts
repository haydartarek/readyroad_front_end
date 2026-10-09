import type { PaymentPlan } from "@/services/paymentService";
import {
  GOOGLE_ANALYTICS_ID,
  isGoogleAnalyticsExcludedPathname,
} from "@/lib/google-analytics";

// Mirror the locally displayed, one-time prices; verify against Backend before release.
const PRICE_EUR: Record<PaymentPlan, number> = {
  RIJVIA_3_DAYS: 2.99,
  RIJVIA_1_WEEK: 6.99,
  RIJVIA_4_WEEKS: 14.99,
};

type PaymentAnalyticsWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  [key: `ga-disable-${string}`]: boolean | undefined;
};

function analyticsIsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (isGoogleAnalyticsExcludedPathname(window.location.pathname)) return false;
  const analyticsWindow = window as unknown as PaymentAnalyticsWindow;
  // The existing consent provider sets this flag ONLY after analytics opt-in.
  return analyticsWindow[`ga-disable-${GOOGLE_ANALYTICS_ID}`] === false &&
    typeof analyticsWindow.gtag === "function";
}

function sendEvent(eventName: string, params: Record<string, unknown>): boolean {
  if (!analyticsIsEnabled()) return false;
  const analyticsWindow = window as unknown as PaymentAnalyticsWindow;
  try {
    const gtag = analyticsWindow.gtag;
    if (typeof gtag !== "function") return false;
    gtag("event", eventName, params);
    return true;
  } catch {
    // Analytics must never interrupt checkout or navigation.
    return false;
  }
}

function item(plan: PaymentPlan) {
  return {
    item_id: plan,
    item_name: plan,
    price: PRICE_EUR[plan],
    quantity: 1,
  };
}

export function trackPricingViewed(plans: readonly PaymentPlan[]): boolean {
  return sendEvent("view_item_list", {
    currency: "EUR",
    item_list_id: "rijvia_plans",
    item_list_name: "Rijvia access plans",
    items: plans.map(item),
  });
}

export function trackPlanSelected(plan: PaymentPlan): void {
  sendEvent("select_item", {
    currency: "EUR",
    item_list_id: "rijvia_plans",
    items: [item(plan)],
  });
}

export function trackCheckoutAuthRequired(plan: PaymentPlan): void {
  sendEvent("checkout_auth_required", { plan });
}

export function trackCheckoutStarted(plan: PaymentPlan): void {
  sendEvent("begin_checkout", {
    currency: "EUR",
    value: PRICE_EUR[plan],
    items: [item(plan)],
  });
}

export function trackCheckoutError(
  stage: "create_checkout" | "resume_checkout",
  status?: number,
  plan?: PaymentPlan,
): void {
  sendEvent("checkout_error", {
    stage,
    ...(typeof status === "number" ? { http_status: status } : {}),
    ...(plan ? { plan } : {}),
  });
}

export function trackCheckoutCanceled(): boolean {
  return sendEvent("checkout_cancel", { stage: "returned_from_stripe" });
}

const purchaseEmittedThisPage = new Set<string>();

export function trackConfirmedPurchase(purchaseId: string, plan: PaymentPlan): boolean {
  // Purchase ID is returned by the authenticated Backend; never use session_id.
  if (!analyticsIsEnabled() || purchaseEmittedThisPage.has(purchaseId)) return false;
  const storageKey = `rijvia.ga4.purchase.${purchaseId}`;
  try {
    if (window.localStorage.getItem(storageKey) === "1") return false;
  } catch {
    // Private browsing may disable localStorage; GA4 also deduplicates by transaction_id.
  }

  const tracked = sendEvent("purchase", {
    transaction_id: purchaseId,
    currency: "EUR",
    value: PRICE_EUR[plan],
    items: [item(plan)],
  });
  if (!tracked) return false;
  purchaseEmittedThisPage.add(purchaseId);

  try {
    window.localStorage.setItem(storageKey, "1");
  } catch {
    // Keep payment flows working without optional browser storage.
  }
  return true;
}
