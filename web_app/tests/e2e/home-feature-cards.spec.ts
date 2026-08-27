import { expect, test, type Page, type Route } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const localeCases = [
  {
    locale: "en",
    path: "/",
    ctas: [
      "Start exam",
      "Start practicing",
      "View progress",
      "Browse signs",
      "Start learning",
      "Change language",
    ],
  },
  {
    locale: "nl",
    path: "/nl",
    ctas: [
      "Start het examen",
      "Start met oefenen",
      "Bekijk je voortgang",
      "Bekijk verkeersborden",
      "Start met leren",
      "Wijzig taal",
    ],
  },
  {
    locale: "fr",
    path: "/fr",
    ctas: [
      "Commencer l'examen",
      "Commencer l'entraînement",
      "Voir ma progression",
      "Parcourir les panneaux",
      "Commencer à étudier",
      "Changer de langue",
    ],
  },
  {
    locale: "ar",
    path: "/ar",
    ctas: [
      "ابدأ الامتحان",
      "ابدأ التدريب",
      "اعرض تقدمك",
      "استعرض العلامات",
      "ابدأ الدراسة",
      "غيّر اللغة",
    ],
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
  await page.route("**/api/proxy/**", (route) => {
    const pathname = new URL(route.request().url()).pathname;

    if (pathname.endsWith("/api/proxy/home/stats")) {
      return fulfillJson(route, 200, {
        examQuestionCount: 0,
        trafficSignsCount: 0,
        lessonsCount: 0,
        categoriesCount: 0,
        supportedLanguagesCount: 4,
      });
    }

    if (pathname.endsWith("/api/proxy/traffic-signs")) {
      return fulfillJson(route, 200, []);
    }

    return fulfillJson(route, 404, { error: "Not found" });
  });
}

test.describe("Homepage learning feature cards", () => {
  for (const localeCase of localeCases) {
    test(`${localeCase.locale.toUpperCase()} uses the educational card layout`, async ({
      page,
    }) => {
      test.setTimeout(60_000);
      await useAnonymousLocale(page, localeCase.locale);
      await page.setViewportSize({ width: 375, height: 900 });
      const response = await page.goto(localeCase.path, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBe(200);

      for (const width of [375, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) => {
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              );
            }),
        );

        const grid = page.getByTestId("home-features-grid");
        const cards = page.getByTestId("home-feature-card");
        const links = page.getByTestId("home-feature-link");
        const ctas = page.getByTestId("home-feature-cta");

        await expect(grid).toBeVisible();
        await expect(cards).toHaveCount(6);
        await expect(links).toHaveCount(6);
        await expect(ctas).toHaveCount(6);

        for (const [index, cta] of localeCase.ctas.entries()) {
          await expect(ctas.nth(index)).toContainText(cta);
          await expect(links.nth(index).locator("a")).toHaveCount(0);
          await expect(
            cards.nth(index).locator('[data-slot="card-title"]'),
          ).toBeVisible();
          await expect(cards.nth(index).locator("p")).toBeVisible();
        }

        const measurements = await page.evaluate(() => {
          const cardElements = Array.from(
            document.querySelectorAll<HTMLElement>(
              '[data-testid="home-feature-card"]',
            ),
          );
          const ctaElements = Array.from(
            document.querySelectorAll<HTMLElement>(
              '[data-testid="home-feature-cta"]',
            ),
          );
          const linkElements = Array.from(
            document.querySelectorAll<HTMLElement>(
              '[data-testid="home-feature-link"]',
            ),
          );
          const cardRects = cardElements.map((card) =>
            card.getBoundingClientRect(),
          );
          const ctaRects = ctaElements.map((cta) =>
            cta.getBoundingClientRect(),
          );
          const linkRects = linkElements.map((link) =>
            link.getBoundingClientRect(),
          );

          return {
            innerWidth: window.innerWidth,
            documentScrollWidth: document.documentElement.scrollWidth,
            bodyScrollWidth: document.body.scrollWidth,
            heights: cardRects.map((rect) => rect.height),
            cardsInsideViewport: cardRects.every(
              (rect) => rect.left >= 0 && rect.right <= window.innerWidth,
            ),
            ctasInsideCards: ctaRects.every((ctaRect, index) => {
              const cardRect = cardRects[index];
              return (
                ctaRect.left >= cardRect.left &&
                ctaRect.right <= cardRect.right &&
                ctaRect.bottom <= cardRect.bottom
              );
            }),
            ctaBottomGaps: ctaRects.map(
              (ctaRect, index) => cardRects[index].bottom - ctaRect.bottom,
            ),
            cardLinkCoverage: linkRects.every((linkRect, index) => {
              const cardRect = cardRects[index];
              return (
                Math.abs(linkRect.left - cardRect.left) <= 1 &&
                Math.abs(linkRect.right - cardRect.right) <= 1 &&
                Math.abs(linkRect.top - cardRect.top) <= 1 &&
                Math.abs(linkRect.bottom - cardRect.bottom) <= 1
              );
            }),
          };
        });

        expect(measurements.documentScrollWidth).toBeLessThanOrEqual(width);
        expect(measurements.bodyScrollWidth).toBeLessThanOrEqual(width);
        expect(measurements.cardsInsideViewport).toBeTruthy();
        expect(measurements.ctasInsideCards).toBeTruthy();
        expect(measurements.cardLinkCoverage).toBeTruthy();
        expect(
          Math.max(...measurements.heights) - Math.min(...measurements.heights),
        ).toBeLessThanOrEqual(1);
        expect(
          Math.max(...measurements.ctaBottomGaps) -
            Math.min(...measurements.ctaBottomGaps),
        ).toBeLessThanOrEqual(1);
      }
    });
  }

  test("clicking the traffic-sign card body opens its learning destination", async ({
    page,
  }) => {
    await useAnonymousLocale(page, "en");
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const signsCard = page.getByTestId("home-feature-link").nth(3);
    await expect(signsCard).toHaveAttribute("href", "/traffic-signs");
    await signsCard.click({ position: { x: 24, y: 88 } });
    await expect(page).toHaveURL("/traffic-signs");
  });
});
