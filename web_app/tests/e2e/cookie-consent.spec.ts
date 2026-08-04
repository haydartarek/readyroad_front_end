import { expect, test, type Page, type Route } from "@playwright/test";

const CONSENT_KEY = "readyroad_cookie_consent";

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function useAnonymousSession(page: Page, language: "en" | "ar" = "en") {
  await page.context().addCookies([
    {
      name: "readyroad_locale",
      value: language,
      domain: "127.0.0.1",
      path: "/",
      sameSite: "Lax",
    },
  ]);
  await page.addInitScript((locale) => {
    window.localStorage.setItem("readyroad_locale", locale);
    document.cookie = `readyroad_locale=${locale}; path=/; samesite=lax`;
  }, language);
  await page.route("**/api/auth/me", (route) =>
    fulfillJson(route, 401, { error: "Unauthorized" }),
  );
}

async function readConsent(page: Page) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, CONSENT_KEY);
}

test.describe("Milestone 5 cookie consent management", () => {
  test("first visit shows the banner and blocks optional resources", async ({
    page,
  }) => {
    await useAnonymousSession(page);
    const optionalRequests: string[] = [];
    page.on("request", (request) => {
      if (
        /google-analytics|googletagmanager|doubleclick|vercel-insights|\/insights\//i.test(
          request.url(),
        )
      ) {
        optionalRequests.push(request.url());
      }
    });

    await page.goto("/");

    await expect(
      page.getByRole("region", { name: "Cookie consent" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /^https:\/\//,
    );
    await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute(
      "content",
      /noindex/i,
    );
    expect(await readConsent(page)).toBeNull();
    expect(optionalRequests).toEqual([]);
    expect(await page.evaluate(() => document.cookie)).not.toMatch(
      /(?:^|;\s*)(?:_ga|_gid|_gat|_gcl|IDE)=/i,
    );
    const consentCommands = await page.evaluate(() => {
      const entries = (window as Window & { dataLayer?: unknown[] }).dataLayer ?? [];
      return entries.map((entry) => Array.from(entry as ArrayLike<unknown>));
    });
    expect(consentCommands).toContainEqual([
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

  test("rejecting optional storage persists a denied decision without blocking navigation", async ({
    page,
  }) => {
    await useAnonymousSession(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Reject optional" }).click();

    await expect(
      page.getByRole("region", { name: "Cookie consent" }),
    ).toBeHidden();
    await expect.poll(() => readConsent(page)).toMatchObject({
      version: 2,
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
    });
    expect(await page.evaluate(() => document.cookie)).not.toMatch(
      /(?:^|;\s*)(?:_ga|_gid|_gat|_gcl|IDE)=/i,
    );
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1, name: "Login" })).toBeVisible();
  });

  test("accept all grants available categories but keeps unused marketing disabled", async ({
    page,
  }) => {
    await useAnonymousSession(page);
    await page.goto("/");
    const analyticsRequest = page.waitForRequest((request) =>
      request.url().startsWith(
        "https://www.googletagmanager.com/gtag/js?id=G-1P4EJH6D2T",
      ),
    );
    await page.getByRole("button", { name: "Accept all" }).click();

    await expect.poll(() => readConsent(page)).toMatchObject({
      preferences: true,
      analytics: true,
      marketing: false,
    });
    const consentCommands = await page.evaluate(() => {
      const entries = (window as Window & { dataLayer?: unknown[] }).dataLayer ?? [];
      return entries.map((entry) => Array.from(entry as ArrayLike<unknown>));
    });
    expect(consentCommands).toContainEqual([
      "consent",
      "update",
      {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      },
    ]);
    await expect(
      page.locator("#readyroad-google-analytics"),
    ).toHaveCount(1);
    expect((await analyticsRequest).url()).toContain("G-1P4EJH6D2T");
  });

  test("a saved analytics decision loads one GA4 tag on every locale route", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "readyroad_cookie_consent",
        JSON.stringify({
          version: 2,
          timestamp: "2026-08-03T12:00:00.000Z",
          necessary: true,
          preferences: false,
          analytics: true,
          marketing: false,
        }),
      );
    });
    await useAnonymousSession(page);

    for (const pathname of ["/", "/ar", "/nl", "/fr"]) {
      await page.goto(pathname);
      await expect(page.locator("#readyroad-google-analytics")).toHaveCount(1);
      await expect(
        page.getByRole("region", { name: /cookie|الموافقة/i }),
      ).toHaveCount(0);
    }
  });

  test("customization enables preferences while analytics remains blocked", async ({
    page,
  }) => {
    await useAnonymousSession(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Customize" }).click();

    const dialog = page.getByRole("dialog", { name: "Cookie settings" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Necessary")).toBeChecked();
    await expect(dialog.getByLabel("Necessary")).toBeDisabled();
    await dialog.getByLabel("Preferences").check();
    await expect(dialog.getByLabel("Analytics")).not.toBeChecked();
    await dialog.getByRole("button", { name: "Save preferences" }).click();

    await expect.poll(() => readConsent(page)).toMatchObject({
      preferences: true,
      analytics: false,
      marketing: false,
    });
  });

  test("saved consent survives reload and can be withdrawn from the footer", async ({
    page,
  }) => {
    await useAnonymousSession(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Accept all" }).click();
    await page.reload();

    await expect(
      page.getByRole("region", { name: "Cookie consent" }),
    ).toBeHidden();
    await page.getByRole("button", { name: "Cookie settings" }).click();
    const dialog = page.getByRole("dialog", { name: "Cookie settings" });
    await dialog.getByLabel("Preferences").uncheck();
    await dialog.getByLabel("Analytics").uncheck();
    await dialog.getByRole("button", { name: "Save preferences" }).click();

    await expect.poll(() => readConsent(page)).toMatchObject({
      preferences: false,
      analytics: false,
    });
    expect(await page.evaluate(() => localStorage.getItem("readyroad_theme"))).toBeNull();
  });

  test("an obsolete consent version requests a new decision", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "readyroad_cookie_consent",
        JSON.stringify({
          version: 1,
          timestamp: "2026-07-21T12:00:00.000Z",
          necessary: true,
          preferences: true,
          analytics: true,
          marketing: false,
        }),
      );
    });
    await useAnonymousSession(page);
    await page.goto("/");

    await expect(
      page.getByRole("region", { name: "Cookie consent" }),
    ).toBeVisible();
    expect(await readConsent(page)).toBeNull();
  });

  test("Arabic consent controls are RTL, responsive, and keyboard accessible", async ({
    page,
  }) => {
    await useAnonymousSession(page, "ar");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/ar/register");

    const banner = page.getByRole("region", {
      name: "الموافقة على ملفات الارتباط",
    });
    await expect(banner).toHaveAttribute("dir", "rtl");
    await page.getByRole("button", { name: "تخصيص" }).click();
    const dialog = page.getByRole("dialog", {
      name: "إعدادات ملفات الارتباط",
    });
    await expect(dialog).toHaveAttribute("dir", "rtl");
    await page.keyboard.press("Tab");
    await expect(dialog.locator(":focus")).toHaveCount(1);
    const width = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("the customization dialog fits a tablet viewport without clipping actions", async ({
    page,
  }) => {
    await useAnonymousSession(page);
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: "Customize" }).click();

    const saveButton = page.getByRole("button", { name: "Save preferences" });
    await expect(saveButton).toBeVisible();
    const box = await saveButton.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(900);
  });
});
