import { expect, test, type Page, type Route } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const entryPages = [
  {
    path: "/practice",
    title: "Belgian Driving Theory Practice by Category | RijVia",
    heading: "Belgian Driving Theory Practice by Category",
  },
  {
    path: "/nl/practice",
    title: "Theorie Rijbewijs B Oefenen per Onderwerp | RijVia",
    heading: "Theorie Rijbewijs B Oefenen per Onderwerp",
  },
  {
    path: "/fr/practice",
    title: "Exercices Théorie Permis B Belgique | RijVia",
    heading: "Exercices Théorie Permis B Belgique",
  },
  {
    path: "/ar/practice",
    title: "أسئلة تدريبية لامتحان السياقة النظري في بلجيكا | RijVia",
    heading: "أسئلة تدريبية لامتحان السياقة النظري في بلجيكا",
  },
  {
    path: "/practice/random",
    title: "Belgian Traffic Signs Test | RijVia",
    heading: "Belgian Traffic Signs Test",
  },
  {
    path: "/nl/practice/random",
    title: "Verkeersborden Oefenen België | RijVia",
    heading: "Verkeersborden Oefenen België",
  },
  {
    path: "/fr/practice/random",
    title: "Test Panneaux de Signalisation Belgique | RijVia",
    heading: "Test Panneaux de Signalisation Belgique",
  },
  {
    path: "/ar/practice/random",
    title: "اختبار العلامات المرورية في بلجيكا | RijVia",
    heading: "اختبار العلامات المرورية في بلجيكا",
  },
  {
    path: "/exam",
    title: "Belgian Driving Theory Practice Test | RijVia",
    heading: "Belgian Driving Theory Practice Test",
  },
  {
    path: "/nl/exam",
    title: "Proefexamen Rijbewijs B België | RijVia",
    heading: "Proefexamen Rijbewijs B België",
  },
  {
    path: "/fr/exam",
    title: "Examen Blanc Permis B Belgique | RijVia",
    heading: "Examen Blanc Permis B Belgique",
  },
  {
    path: "/ar/exam",
    title: "أسئلة امتحان السياقة النظري في بلجيكا | RijVia",
    heading: "أسئلة امتحان السياقة النظري في بلجيكا",
  },
] as const;

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function useAnonymousVisitor(page: Page) {
  await seedCookieConsent(page);
  await page.route("**/api/auth/me", (route) =>
    fulfillJson(route, 401, { error: "Unauthorized" }),
  );
  await page.route("**/api/proxy/traffic-signs", (route) =>
    fulfillJson(route, 200, []),
  );
}

test.describe("Public learning entry pages", () => {
  test.beforeEach(async ({ page }) => {
    await useAnonymousVisitor(page);
  });

  for (const entryPage of entryPages) {
    test(`${entryPage.path} is public, localized and indexable`, async ({
      page,
    }) => {
      const response = await page.goto(entryPage.path);

      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(entryPage.title);
      await expect(
        page.getByRole("heading", { level: 1, name: entryPage.heading }),
      ).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute(
        "content",
        /noindex/i,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`${entryPage.path.replaceAll("/", "\\/")}$`),
      );
    });
  }

  test("theory exam defers protected API access until authentication", async ({
    page,
  }) => {
    let activeExamRequests = 0;
    await page.route("**/api/proxy/exams/simulations/active", async (route) => {
      activeExamRequests += 1;
      await fulfillJson(route, 401, { error: "Unauthorized" });
    });

    await page.goto("/exam");
    expect(activeExamRequests).toBe(0);

    await page.getByTestId("exam-start-button").click();
    await expect(page).toHaveURL((url) => {
      return (
        url.pathname === "/login" &&
        url.searchParams.get("returnUrl") === "/exam"
      );
    });
    expect(activeExamRequests).toBe(0);
  });

  test("localized sign-exam CTA preserves the requested route", async ({
    page,
  }) => {
    await page.goto("/fr/practice/random");
    await page.getByTestId("sign-exam-start-button").click();

    await expect(page).toHaveURL((url) => {
      return (
        url.pathname === "/fr/login" &&
        url.searchParams.get("returnUrl") === "/fr/practice/random"
      );
    });
  });

  test("private execution routes remain protected", async ({ request }) => {
    for (const path of ["/exam/42", "/practice/danger-signs"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status()).toBe(307);
      expect(response.headers().location).toContain("/login?returnUrl=");
    }
  });

  test("core SEO copy is present in the initial HTML", async ({ request }) => {
    for (const entryPage of entryPages) {
      const locale = entryPage.path.startsWith("/nl/")
        ? "nl"
        : entryPage.path.startsWith("/fr/")
          ? "fr"
          : entryPage.path.startsWith("/ar/")
            ? "ar"
            : "en";
      const response = await request.get(entryPage.path, {
        headers: { Cookie: `rijvia_locale=${locale}` },
      });
      const html = await response.text();

      expect(response.status()).toBe(200);
      expect(html).toContain("<h1");
      expect(html).toContain(entryPage.heading);
    }
  });

  test("the public entry layouts have no overflow or console errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      for (const path of ["/ar/practice", "/ar/practice/random", "/ar/exam"]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
      }
    }

    expect(consoleErrors).toEqual([]);
  });
});
