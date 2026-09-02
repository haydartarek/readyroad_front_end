import { expect, test } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const localizedArticles = [
  {
    locale: "en",
    indexPath: "/blog",
    slug: "safe-driving-belgium",
    title: "Safer driving in Belgium",
    language: "en",
  },
  {
    locale: "nl",
    indexPath: "/nl/blog",
    slug: "veilig-rijden-belgie",
    title: "Veiliger rijden in België",
    language: "nl-BE",
  },
  {
    locale: "fr",
    indexPath: "/fr/blog",
    slug: "conduite-sure-belgique",
    title: "Conduire plus sûrement en Belgique",
    language: "fr-BE",
  },
  {
    locale: "ar",
    indexPath: "/ar/blog",
    slug: "القيادة-الآمنة-في-بلجيكا",
    title: "القيادة الآمنة في بلجيكا",
    language: "ar",
  },
] as const;

test.describe("localized public blog routes", () => {
  test.beforeEach(async ({ page }) => {
    await seedCookieConsent(page);
  });

  test("renders the published snapshot in all four locale routes without overflow", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    for (const article of localizedArticles) {
      const articlePath = `${article.indexPath}/${encodeURIComponent(article.slug)}`;
      const response = await page.goto(article.indexPath);
      expect(response?.status(), article.indexPath).toBe(200);
      const link = page.getByRole("link", { name: article.title }).first();
      await expect(link).toHaveAttribute(
        "href",
        articlePath,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://rijvia.be${article.indexPath}`,
      );
      await link.click();
      await expect(page.getByRole("heading", { name: article.title })).toBeVisible();
      const articleResponse = await page.goto(articlePath);
      expect(articleResponse?.status(), `${article.indexPath}/${article.slug}`).toBe(200);
      await expect(page).toHaveURL(
        new RegExp(`${articlePath}$`),
      );
      const canonicalUrl = `https://rijvia.be${articlePath}`;
      await expect(page).toHaveTitle(`${article.title} | RijVia`);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        canonicalUrl,
      );
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(5);
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
        "href",
        "https://rijvia.be/blog/safe-driving-belgium",
      );
      await expect(page.getByRole("heading", { name: article.title })).toBeVisible();
      await expect(
        page.getByRole("article").getByText(/immutable published body/i),
      ).toBeVisible();
      const structuredDataScript = page.locator("#article-structured-data");
      await expect(structuredDataScript).toHaveCount(1);
      const structuredData = JSON.parse(
        (await structuredDataScript.textContent()) ?? "{}",
      ) as { "@graph"?: Array<Record<string, unknown>> };
      expect(structuredData["@graph"]?.[0], article.indexPath).toMatchObject({
        "@type": "BlogPosting",
        headline: article.title,
        inLanguage: article.language,
        url: canonicalUrl,
      });
      expect(structuredData["@graph"]?.[1], article.indexPath).toMatchObject({
        "@type": "BreadcrumbList",
      });
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(dimensions.scrollWidth, article.indexPath).toBeLessThanOrEqual(
        dimensions.innerWidth,
      );
    }

    expect(consoleErrors).toEqual([]);
  });

  test("redirects a source-language slug to the active locale slug", async ({ page }) => {
    const response = await page.goto("/ar/blog/safe-driving-belgium");

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(`/ar/blog/${encodeURIComponent("القيادة-الآمنة-في-بلجيكا")}$`));
    await expect(
      page.getByRole("heading", { name: "القيادة الآمنة في بلجيكا" }),
    ).toBeVisible();
  });

  test("renders the application 404 for an unknown or unpublished slug", async ({ page }) => {
    await page.goto("/fr/blog/unpublished");

    await expect(page.getByTestId("not-found-page")).toBeVisible();
    await expect(page.getByTestId("not-found-code")).toHaveText("404");
  });
});
