import { expect, test, type Page, type Route } from "@playwright/test";

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
  descriptionEn: "Warns about a dangerous bend to the right.",
  descriptionAr: "يحذر من منعطف خطير إلى اليمين.",
  descriptionNl: "Waarschuwt voor een gevaarlijke bocht naar rechts.",
  descriptionFr: "Avertit d'un virage dangereux a droite.",
  longDescriptionEn: "Reduce speed before entering the bend.",
  longDescriptionNl: "Verminder uw snelheid voor de bocht.",
  longDescriptionFr: "Ralentissez avant d'entrer dans le virage.",
  longDescriptionAr: "خفف السرعة قبل دخول المنعطف.",
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

  await page.addInitScript(() => {
    window.localStorage.setItem("readyroad_locale", "en");
  });

  await page.route("**/api/auth/logout", async (route) => {
    logoutCalls += 1;
    await fulfillJson(route, 200, { ok: true });
  });

  await page.route("**/api/proxy/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/proxy", "") || "/";

    if (path === "/traffic-signs/A1b") {
      await fulfillJson(route, 200, signPayload);
      return;
    }

    if (path === "/sign-quiz/signs/A1b/status") {
      await fulfillJson(route, 401, { error: "Unauthorized" });
      return;
    }

    await fulfillJson(route, 404, { error: `Unhandled mock for ${path}` });
  });

  return {
    getLogoutCalls: () => logoutCalls,
  };
}

test.describe("Public traffic sign detail page", () => {
  test("stays public when optional progress returns 401", async ({ page }) => {
    const mocks = await installPublicTrafficSignMocks(page);
    const progressResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/proxy/sign-quiz/signs/A1b/status") &&
        response.status() === 401,
    );

    await page.goto("/traffic-signs/A1b");

    await expect(
      page.getByRole("heading", { name: "Dangerous bend to the right" }),
    ).toBeVisible();
    await progressResponse;

    await expect(page).toHaveURL(/\/traffic-signs\/A1b$/);
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(
      page.getByRole("link", { name: /start practice/i }),
    ).toBeVisible();
    expect(mocks.getLogoutCalls()).toBe(0);
  });
});
