import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unauthorized" }),
    }),
  );
});

test("serves indexable locale routes with reciprocal metadata", async ({
  page,
}) => {
  const response = await page.goto("/fr/lessons/les-19/2");

  expect(response?.status()).toBe(200);
  const initialHtml = await response?.text();
  expect(initialHtml).toContain('<html lang="fr" dir="ltr"');
  expect(initialHtml).toContain("Appliquer la regle");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(
    page.getByRole("heading", { name: "Appliquer la regle" }),
  ).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/fr\/lessons\/les-19\/2$/,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    "href",
    /\/lessons\/les-19\/2$/,
  );
  await expect(
    page.locator('link[rel="alternate"][hreflang="x-default"]'),
  ).toHaveAttribute("href", /\/lessons\/les-19\/2$/);
  const schemas = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(
    schemas.some((schema) => schema.includes('"@type":"LearningResource"')),
  ).toBe(true);
});

test("Arabic is RTL and internal links retain the locale prefix", async ({
  page,
}) => {
  await page.goto("/ar/lessons/les-19/2");

  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator('a[href="/ar/lessons/les-19"]')).toHaveCount(
    await page.locator('a[href="/ar/lessons/les-19"]').count(),
  );
  expect(await page.locator('a[href="/ar/lessons/les-19"]').count()).toBeGreaterThan(
    0,
  );
});

test("language switch keeps the current lesson page", async ({ page }) => {
  await page.goto("/lessons/les-19/2");

  await page.getByRole("button", { name: /language/i }).click();
  await page.getByRole("menuitem", { name: /Nederlands/i }).click();

  await expect(page).toHaveURL(/\/nl\/lessons\/les-19\/2$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
});

test("legacy English prefix redirects permanently to the unprefixed URL", async ({
  request,
}) => {
  const response = await request.get("/en/lessons/les-19/2", {
    maxRedirects: 0,
  });

  expect(response.status()).toBe(308);
  expect(response.headers().location).toMatch(/\/lessons\/les-19\/2$/);
});

test("all multilingual sitemap URLs resolve without broken links", async ({
  request,
}) => {
  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.status()).toBe(200);
  const xml = await sitemapResponse.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );

  expect(urls.length).toBeGreaterThan(40);
  const failures: string[] = [];
  for (const url of urls) {
    const response = await request.get(new URL(url).pathname);
    if (response.status() !== 200) {
      failures.push(`${response.status()} ${url}`);
    }
  }

  expect(failures).toEqual([]);
});

test("localized lesson route is stable on a mobile RTL viewport", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ar/lessons/les-19/2");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  expect(errors.filter((error) => /hydration|uncaught|error/i.test(error))).toEqual(
    [],
  );
});
