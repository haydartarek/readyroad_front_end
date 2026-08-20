import { expect, test, type Page, type Route } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const publicPages = [
  { path: "/about", heading: "About RijVia" },
  { path: "/contact", heading: "Contact Us" },
  { path: "/privacy-policy", heading: "Privacy Policy" },
  { path: "/cookie-policy", heading: "Cookie Policy" },
  { path: "/terms", heading: "Terms of Service" },
  { path: "/disclaimer", heading: "Educational Disclaimer" },
  { path: "/faq", heading: "Frequently Asked Questions" },
] as const;

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function useAnonymousEnglish(page: Page) {
  await seedCookieConsent(page);
  await page.addInitScript(() => {
    window.localStorage.setItem("readyroad_locale", "en");
  });
  await page.route("**/api/auth/me", (route) =>
    fulfillJson(route, 401, { error: "Unauthorized" }),
  );
}

test.describe("Public information and legal pages", () => {
  test.beforeEach(async ({ page }) => {
    await useAnonymousEnglish(page);
  });

  for (const publicPage of publicPages) {
    test(`${publicPage.path} has complete public metadata and content`, async ({
      page,
    }) => {
      const response = await page.goto(publicPage.path);

      expect(response?.status()).toBe(200);
      await expect(
        page.getByRole("heading", { level: 1, name: publicPage.heading }),
      ).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`${publicPage.path.replaceAll("/", "\\/")}$`),
      );
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");
      expect(canonical).toBeTruthy();
      expect(new URL(canonical ?? "").hostname).not.toMatch(
        /^(?:localhost|127\.0\.0\.1)$/,
      );
      const description = await page
        .locator('meta[name="description"]')
        .getAttribute("content");
      expect(description?.trim().length).toBeGreaterThanOrEqual(70);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        "content",
        /\S+/,
      );
      await expect(
        page.locator('meta[property="og:description"]'),
      ).toHaveAttribute("content", /\S+/);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        /^https:\/\//,
      );
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        "content",
        "summary_large_image",
      );
      const robots = await page
        .locator('meta[name="robots"]')
        .getAttribute("content");
      expect(robots).not.toMatch(/noindex/i);
      await expect(page.locator('script[type="application/ld+json"]')).not.toHaveCount(
        0,
      );
      const schemas = await page
        .locator('script[type="application/ld+json"]')
        .allTextContents();
      const parsedSchemas = schemas.map((schema) => JSON.parse(schema));
      expect(parsedSchemas).toHaveLength(schemas.length);
      expect(JSON.stringify(parsedSchemas)).not.toMatch(
        /"(?:aggregateRating|review|reviewRating)"\s*:/i,
      );
    });
  }

  test("footer exposes every public and legal destination", async ({ page }) => {
    await page.goto("/about");

    for (const path of [
      "/about",
      "/faq",
      "/privacy-policy",
      "/cookie-policy",
      "/terms",
      "/disclaimer",
      "/contact",
    ]) {
      await expect(page.locator(`footer a[href="${path}"]`).first()).toBeVisible();
    }
  });

  test("public responses include the production security policy", async ({
    request,
  }) => {
    const response = await request.get("/");
    const headers = response.headers();

    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toContain("object-src 'none'");
    expect(headers["content-security-policy"]).toContain(
      "frame-ancestors 'self'",
    );
    expect(headers["content-security-policy"]).toContain(
      "frame-src 'self' https://www.youtube-nocookie.com",
    );
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(headers["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headers["permissions-policy"]).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
  });

  test("legacy privacy URL permanently redirects to the canonical policy", async ({
    request,
  }) => {
    const response = await request.get("/privacy", { maxRedirects: 0 });

    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("/privacy-policy");
  });

  test("auth and missing pages cannot be indexed", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
      "content",
      /noindex/i,
    );

    const missingResponse = await page.goto("/missing-public-page-seo-check");
    expect(missingResponse?.status()).toBe(404);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/i,
    );
  });

  test("robots keeps public assets crawlable and references the sitemap", async ({
    request,
  }) => {
    const response = await request.get("/robots.txt");
    const body = await response.text();

    expect(response.status()).toBe(200);
    expect(body).toContain("Allow: /traffic-signs/");
    expect(body).toContain("Allow: /lessons/");
    expect(body).toContain("Disallow: /api/");
    expect(body).not.toContain("Disallow: /_next/");
    expect(body).toMatch(/Sitemap: https:\/\/[^\s]+\/sitemap\.xml/);
  });

  test("Arabic public content uses RTL without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/ar/privacy-policy");

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(
      page.getByRole("heading", { level: 1, name: "سياسة الخصوصية" }),
    ).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  });

  test("FAQ answers are keyboard-operable and represented in JSON-LD", async ({
    page,
  }) => {
    await page.goto("/faq");
    const question = page
      .locator("details summary")
      .filter({ hasText: "Is RijVia free?" });

    await question.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByText(/without a subscription or payment-card requirement/i),
    ).toBeVisible();
    const hasFaqSchema = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((scripts) =>
        scripts.some((script) => script.textContent?.includes('"@type":"FAQPage"')),
      );
    expect(hasFaqSchema).toBe(true);
  });

  test("contact validation identifies and focuses the first invalid field", async ({
    page,
  }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send Message" }).click();

    await expect(page.locator("#contact-first-name")).toBeFocused();
    await expect(page.locator("#contact-first-name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.locator("#contact-first-name-error")).toBeVisible();
  });
});
