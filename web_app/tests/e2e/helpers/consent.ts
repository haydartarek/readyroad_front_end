import type { Page } from "@playwright/test";

type ConsentSeed = {
  preferences?: boolean;
  analytics?: boolean;
};

export async function seedCookieConsent(
  page: Page,
  seed: ConsentSeed = {},
) {
  await page.addInitScript((selection) => {
    window.localStorage.setItem(
      "readyroad_cookie_consent",
      JSON.stringify({
        version: 1,
        timestamp: "2026-07-21T12:00:00.000Z",
        necessary: true,
        preferences: selection.preferences ?? false,
        analytics: selection.analytics ?? false,
        marketing: false,
      }),
    );
  }, seed);
}
