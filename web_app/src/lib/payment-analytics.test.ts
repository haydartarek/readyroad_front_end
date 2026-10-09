import { GOOGLE_ANALYTICS_ID } from "@/lib/google-analytics";
import { clearDisallowedOptionalStorage, createConsentRecord } from "@/lib/cookie-consent";
import {
  trackCheckoutError,
  trackCheckoutStarted,
  trackConfirmedPurchase,
  trackPlanSelected,
  trackPricingViewed,
} from "@/lib/payment-analytics";

type TestWindow = Window & {
  gtag?: jest.Mock;
  [key: `ga-disable-${string}`]: boolean | undefined;
};

const analyticsWindow = window as unknown as TestWindow;
const disableKey = `ga-disable-${GOOGLE_ANALYTICS_ID}` as const;

beforeEach(() => {
  window.localStorage.clear();
  analyticsWindow.gtag = jest.fn();
  analyticsWindow[disableKey] = true;
});

afterEach(() => {
  delete analyticsWindow.gtag;
  delete analyticsWindow[disableKey];
});

test("never sends ecommerce events without explicit analytics consent", () => {
  trackPlanSelected("RIJVIA_3_DAYS");
  trackCheckoutStarted("RIJVIA_1_WEEK");
  trackCheckoutError("create_checkout", 500, "RIJVIA_1_WEEK");
  expect(trackConfirmedPurchase("a3e40ff2-5a0b-4b44-bb67-ff918f26f120", "RIJVIA_1_WEEK")).toBe(false);
  expect(analyticsWindow.gtag).not.toHaveBeenCalled();
});

test("emits funnel events only with GA4 enabled", () => {
  analyticsWindow[disableKey] = false;
  const plans = ["RIJVIA_3_DAYS", "RIJVIA_1_WEEK"] as const;
  expect(trackPricingViewed(plans)).toBe(true);
  trackPlanSelected("RIJVIA_3_DAYS");
  trackCheckoutStarted("RIJVIA_3_DAYS");
  expect(analyticsWindow.gtag).toHaveBeenCalledWith("event", "view_item_list", expect.objectContaining({ currency: "EUR", items: expect.any(Array) }));
  expect(analyticsWindow.gtag).toHaveBeenCalledWith("event", "select_item", expect.objectContaining({ currency: "EUR" }));
  expect(analyticsWindow.gtag).toHaveBeenCalledWith("event", "begin_checkout", expect.objectContaining({ value: 2.99, currency: "EUR" }));
  analyticsWindow[disableKey] = true;
  trackPlanSelected("RIJVIA_1_WEEK");
  expect(analyticsWindow.gtag).toHaveBeenCalledTimes(3);
});

test("tracks each confirmed purchase only once after consent", () => {
  analyticsWindow[disableKey] = false;
  const purchaseId = "a3e40ff2-5a0b-4b44-bb67-ff918f26f120";
  expect(trackConfirmedPurchase(purchaseId, "RIJVIA_1_WEEK")).toBe(true);
  expect(trackConfirmedPurchase(purchaseId, "RIJVIA_1_WEEK")).toBe(false);
  expect(analyticsWindow.gtag).toHaveBeenCalledTimes(1);
  expect(analyticsWindow.gtag).toHaveBeenCalledWith("event", "purchase", expect.objectContaining({
    transaction_id: purchaseId,
    value: 6.99,
    currency: "EUR",
  }));
});

test("analytics errors never interrupt checkout", () => {
  analyticsWindow[disableKey] = false;
  analyticsWindow.gtag = jest.fn(() => { throw new Error("offline"); });
  expect(() => trackCheckoutStarted("RIJVIA_3_DAYS")).not.toThrow();
  expect(trackConfirmedPurchase("a3e40ff2-5a0b-4b44-bb67-ff918f26f120", "RIJVIA_1_WEEK")).toBe(false);
});

test("analytics withdrawal clears purchase markers without resending in the same page", () => {
  analyticsWindow[disableKey] = false;
  const purchaseId = "b226a1e8-598b-40db-b834-b8ca013424c1";
  const marker = `rijvia.ga4.purchase.${purchaseId}`;
  window.localStorage.setItem("rijvia_theme", "dark");

  expect(trackConfirmedPurchase(purchaseId, "RIJVIA_1_WEEK")).toBe(true);
  expect(window.localStorage.getItem(marker)).toBe("1");

  analyticsWindow[disableKey] = true;
  clearDisallowedOptionalStorage(
    createConsentRecord({ preferences: true, analytics: false }),
    window.localStorage,
  );
  expect(window.localStorage.getItem(marker)).toBeNull();
  expect(window.localStorage.getItem("rijvia_theme")).toBe("dark");

  analyticsWindow[disableKey] = false;
  expect(trackConfirmedPurchase(purchaseId, "RIJVIA_1_WEEK")).toBe(false);
  expect(analyticsWindow.gtag).toHaveBeenCalledTimes(1);
});
