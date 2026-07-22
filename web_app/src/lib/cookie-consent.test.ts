import {
  applyGoogleConsentMode,
  clearDisallowedOptionalStorage,
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_VERSION,
  createConsentRecord,
  getGoogleConsentState,
  parseConsentRecord,
  persistConsent,
  readStoredConsent,
} from "@/lib/cookie-consent";

describe("cookie consent model", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete (window as Window & { dataLayer?: unknown[] }).dataLayer;
    delete (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  });

  test("creates a privacy-safe versioned record", () => {
    const record = createConsentRecord(
      { preferences: true, analytics: false, marketing: true },
      "2026-07-21T12:00:00.000Z",
    );

    expect(record).toEqual({
      version: COOKIE_CONSENT_VERSION,
      timestamp: "2026-07-21T12:00:00.000Z",
      necessary: true,
      preferences: true,
      analytics: false,
      marketing: false,
    });
    expect(JSON.stringify(record)).not.toMatch(/email|name|user|token/i);
  });

  test("rejects malformed and obsolete consent records", () => {
    expect(parseConsentRecord("not-json")).toBeNull();
    expect(
      parseConsentRecord(
        JSON.stringify({
          ...createConsentRecord(),
          version: COOKIE_CONSENT_VERSION - 1,
        }),
      ),
    ).toBeNull();
    expect(
      parseConsentRecord(
        JSON.stringify({ ...createConsentRecord(), necessary: false }),
      ),
    ).toBeNull();
  });

  test("persists and reads the complete decision", () => {
    const record = createConsentRecord({
      preferences: true,
      analytics: true,
    });

    persistConsent(record, window.localStorage);

    expect(readStoredConsent(window.localStorage)).toEqual(record);
    expect(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)).toBeTruthy();
  });

  test("maps optional categories to Google Consent Mode without loading a resource", () => {
    const denied = getGoogleConsentState(null);
    const accepted = getGoogleConsentState(
      createConsentRecord({ analytics: true, marketing: true }),
    );

    expect(denied).toEqual({
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    expect(accepted.analytics_storage).toBe("granted");
    expect(accepted.ad_storage).toBe("denied");

    applyGoogleConsentMode(createConsentRecord({ analytics: true }));
    const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
    expect(dataLayer).toContainEqual([
      "consent",
      "update",
      expect.objectContaining({ analytics_storage: "granted" }),
    ]);
  });

  test("removes preference storage after rejection or withdrawal", () => {
    window.localStorage.setItem("readyroad_theme", "dark");
    clearDisallowedOptionalStorage(
      createConsentRecord({ preferences: false }),
      window.localStorage,
    );
    expect(window.localStorage.getItem("readyroad_theme")).toBeNull();

    window.localStorage.setItem("readyroad_theme", "dark");
    clearDisallowedOptionalStorage(
      createConsentRecord({ preferences: true }),
      window.localStorage,
    );
    expect(window.localStorage.getItem("readyroad_theme")).toBe("dark");
  });
});
