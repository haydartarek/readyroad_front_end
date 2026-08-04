import { COOKIE_CONSENT_BOOTSTRAP_SCRIPT } from "@/lib/cookie-consent-bootstrap";

describe("COOKIE_CONSENT_BOOTSTRAP_SCRIPT", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete (window as Window & { dataLayer?: unknown[] }).dataLayer;
    delete (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  });

  it("queues the default consent command as an Arguments object", () => {
    window.eval(COOKIE_CONSENT_BOOTSTRAP_SCRIPT);

    const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
    expect(dataLayer).toHaveLength(1);
    expect(Array.isArray(dataLayer?.[0])).toBe(false);
    expect(Array.from(dataLayer?.[0] as ArrayLike<unknown>)).toEqual([
      "consent",
      "default",
      {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      },
    ]);
  });
});
