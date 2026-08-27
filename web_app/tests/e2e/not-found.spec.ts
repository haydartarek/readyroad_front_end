import { expect, test, type Page, type Route } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const viewports = [320, 375, 768, 1024, 1440] as const;

const localeCases = [
  {
    locale: "en",
    path: "/missing-readyroad-page",
    title: "We couldn't find that page",
    homePath: "/",
    contactPath: "/contact",
    direction: "ltr",
  },
  {
    locale: "ar",
    path: "/ar/missing-readyroad-page",
    title: "تعذر العثور على هذه الصفحة",
    homePath: "/ar",
    contactPath: "/ar/contact",
    direction: "rtl",
  },
] as const;

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function useAnonymousLocale(
  page: Page,
  locale: (typeof localeCases)[number]["locale"],
) {
  await seedCookieConsent(page);
  await page.addInitScript((activeLocale) => {
    window.localStorage.setItem("rijvia_locale", activeLocale);
    document.cookie = `rijvia_locale=${activeLocale}; path=/; samesite=lax`;
  }, locale);
  await page.route("**/api/auth/me", (route) =>
    fulfillJson(route, 200, { authenticated: false, user: null }),
  );
}

test.describe("404 page", () => {
  for (const localeCase of localeCases) {
    test(`${localeCase.locale.toUpperCase()} uses one responsive error card`, async ({
      page,
    }) => {
      test.setTimeout(60_000);
      await useAnonymousLocale(page, localeCase.locale);

      for (const width of viewports) {
        await page.setViewportSize({ width, height: 900 });
        const response = await page.goto(localeCase.path, {
          waitUntil: "domcontentloaded",
        });

        expect(response?.status(), `${localeCase.locale} at ${width}px`).toBe(
          404,
        );
        await expect(page.locator("html")).toHaveAttribute(
          "dir",
          localeCase.direction,
        );
        await expect(page.getByTestId("not-found-card")).toHaveCount(1);
        await expect(page.getByTestId("not-found-code")).toHaveText("404");
        await expect(page.getByTestId("not-found-title")).toHaveText(
          localeCase.title,
        );
        await expect(
          page.getByTestId("not-found-icon").locator("svg"),
        ).toHaveCount(1);

        const measurements = await page.evaluate(() => {
          const card = document.querySelector<HTMLElement>(
            '[data-testid="not-found-card"]',
          );
          const code = document.querySelector<HTMLElement>(
            '[data-testid="not-found-code"]',
          );
          const title = document.querySelector<HTMLElement>(
            '[data-testid="not-found-title"]',
          );
          const actions = Array.from(
            document.querySelectorAll<HTMLElement>(
              '[data-testid="not-found-actions"] a',
            ),
          );

          if (!card || !code || !title || actions.length !== 2) {
            throw new Error("Required 404 elements are missing");
          }

          const cardRect = card.getBoundingClientRect();
          const actionRects = actions.map((action) =>
            action.getBoundingClientRect(),
          );

          return {
            innerWidth: window.innerWidth,
            documentScrollWidth: document.documentElement.scrollWidth,
            bodyScrollWidth: document.body.scrollWidth,
            cardLeft: cardRect.left,
            cardRight: cardRect.right,
            nestedCards: card.querySelectorAll(
              '[data-testid="not-found-card"]',
            ).length,
            contentLogos: card.querySelectorAll("img").length,
            headings: card.querySelectorAll("h1").length,
            codeFontSize: Number.parseFloat(getComputedStyle(code).fontSize),
            titleFontSize: Number.parseFloat(getComputedStyle(title).fontSize),
            actionsDirection: getComputedStyle(
              document.querySelector<HTMLElement>(
                '[data-testid="not-found-actions"]',
              )!,
            ).flexDirection,
            actionHeights: actionRects.map((rect) => rect.height),
            actionLefts: actionRects.map((rect) => rect.left),
            actionRights: actionRects.map((rect) => rect.right),
          };
        });

        expect(measurements.documentScrollWidth).toBeLessThanOrEqual(
          measurements.innerWidth,
        );
        expect(measurements.bodyScrollWidth).toBeLessThanOrEqual(
          measurements.innerWidth,
        );
        expect(measurements.cardLeft).toBeGreaterThanOrEqual(0);
        expect(measurements.cardRight).toBeLessThanOrEqual(
          measurements.innerWidth,
        );
        expect(measurements.nestedCards).toBe(0);
        expect(measurements.contentLogos).toBe(0);
        expect(measurements.headings).toBe(1);
        expect(measurements.codeFontSize).toBeGreaterThan(
          measurements.titleFontSize,
        );
        expect(measurements.actionHeights[0]).toBe(
          measurements.actionHeights[1],
        );
        expect(
          measurements.actionLefts.every((left) => left >= 0),
        ).toBeTruthy();
        expect(
          measurements.actionRights.every(
            (right) => right <= measurements.innerWidth,
          ),
        ).toBeTruthy();
        expect(measurements.actionsDirection).toBe(
          width < 640 ? "column" : "row",
        );
      }
    });
  }

  test("404 actions navigate to working destinations", async ({ page }) => {
    await useAnonymousLocale(page, "en");
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto("/missing-readyroad-page");
    await page.getByRole("link", { name: "Go Home" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/missing-readyroad-page");
    await page.getByRole("link", { name: "Contact support" }).click();
    await expect(page).toHaveURL("/contact");
  });
});
