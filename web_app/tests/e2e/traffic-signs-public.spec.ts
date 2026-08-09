import { expect, test, type Page, type Route } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const signPayload = {
  signCode: "A1b",
  routeCode: "A1b",
  categoryCode: "A",
  exam1TotalQuestions: 10,
  exam1PassingScore: 7,
  nameEn: "Dangerous bend to the right",
  nameAr: "منعطف خطير إلى اليمين",
  nameNl: "Gevaarlijke bocht naar rechts",
  nameFr: "Virage dangereux a droite",
  summaryEn: "A dangerous right-hand bend lies ahead.",
  summaryAr: "يوجد منعطف خطير إلى اليمين أمامك.",
  summaryNl: "Verderop ligt een gevaarlijke bocht naar rechts.",
  summaryFr: "Un virage dangereux a droite se trouve plus loin.",
  descriptionEn: "Warns about a dangerous bend to the right.",
  descriptionAr: "يحذر من منعطف خطير إلى اليمين.",
  descriptionNl: "Waarschuwt voor een gevaarlijke bocht naar rechts.",
  descriptionFr: "Avertit d'un virage dangereux a droite.",
  driverGuidanceEn: "Reduce speed before the bend and keep control.",
  driverGuidanceAr: "خفف السرعة قبل المنعطف وحافظ على السيطرة.",
  driverGuidanceNl: "Verminder snelheid voor de bocht en behoud de controle.",
  driverGuidanceFr: "Reduisez la vitesse avant le virage et gardez le controle.",
  exceptionsEn: ["A supplementary plate may specify the distance."],
  exceptionsAr: ["قد تحدد لوحة تكميلية المسافة."],
  exceptionsNl: ["Een onderbord kan de afstand vermelden."],
  exceptionsFr: ["Un panneau additionnel peut preciser la distance."],
  imageUrl: "/images/signs/danger_signs/A1b.png",
};

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installPublicTrafficSignMocks(page: Page) {
  let logoutCalls = 0;
  let progressCalls = 0;

  await seedCookieConsent(page);
  await page.addInitScript(() => {
    window.localStorage.setItem("readyroad_locale", "en");
  });

  await page.route("**/api/auth/logout", async (route) => {
    logoutCalls += 1;
    await fulfillJson(route, 200, { ok: true });
  });

  await page.route("**/images/signs/danger_signs/A1b.png", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nS8AAAAASUVORK5CYII=",
        "base64",
      ),
    });
  });

  await page.route("**/api/proxy/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/proxy", "") || "/";

    if (path === "/traffic-signs/A1b") {
      await fulfillJson(route, 200, signPayload);
      return;
    }

    if (path === "/sign-quiz/signs/A1b/status") {
      progressCalls += 1;
      await fulfillJson(route, 401, { error: "Unauthorized" });
      return;
    }

    await fulfillJson(route, 404, { error: `Unhandled mock for ${path}` });
  });

  return {
    getLogoutCalls: () => logoutCalls,
    getProgressCalls: () => progressCalls,
  };
}

test.describe("Public traffic sign detail page", () => {
  test("renders the complete catalog once without a Load More control", async ({
    page,
  }) => {
    await seedCookieConsent(page);
    await page.addInitScript(() => {
      window.localStorage.setItem("readyroad_locale", "en");
    });
    await page.route("**/api/auth/me", (route) =>
      fulfillJson(route, 401, { error: "Unauthorized" }),
    );
    await page.route("**/api/proxy/traffic-signs", (route) =>
      fulfillJson(
        route,
        200,
        Array.from({ length: 40 }, (_, index) => ({
          signCode: `A${index + 1}`,
          routeCode: `A${index + 1}`,
          categoryCode: "A",
          nameEn: `Traffic sign ${index + 1}`,
          imageUrl: `/images/signs/test/A${index + 1}.png`,
        })),
      ),
    );

    await page.goto("/traffic-signs");
    await expect(
      page.getByRole("heading", { level: 1, name: "Belgian Traffic Signs" }),
    ).toBeVisible();

    const cards = page.locator("a.traffic-sign-card");
    const catalogLinks = page.locator(
      'details nav a[href^="/traffic-signs/"]',
    );
    await expect(catalogLinks.first()).toBeAttached();

    const discoverableLinkCount = await catalogLinks.count();
    await expect(cards).toHaveCount(40);
    expect(discoverableLinkCount).toBe(40);
    await expect(catalogLinks).toHaveCount(discoverableLinkCount);
    await expect(
      page.getByRole("button", { name: "Load more signs" }),
    ).toHaveCount(0);

    const hrefs = await cards.evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")),
    );
    expect(hrefs).toEqual(
      Array.from({ length: 40 }, (_, index) => `/traffic-signs/A${index + 1}`),
    );
  });

  test("stays public without requesting optional progress anonymously", async ({
    page,
  }) => {
    const mocks = await installPublicTrafficSignMocks(page);

    await page.goto("/traffic-signs/A1b");

    await expect(
      page.getByRole("heading", { name: "Dangerous bend to the right" }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Dangerous bend to the right" }),
    ).toBeVisible();

    await expect(page).toHaveURL(/\/traffic-signs\/A1b$/);
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(
      page.getByRole("link", { name: /start practice/i }),
    ).toBeVisible();
    expect(mocks.getProgressCalls()).toBe(0);
    expect(mocks.getLogoutCalls()).toBe(0);
  });
});
