import { expect, test } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";
import { translateMessage } from "../../src/lib/messages";

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
      const hero = page.getByRole("article").getByRole("img", { name: article.title, exact: true });
      await expect(hero).toBeVisible();
      await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
      await expect(page.getByRole("article").locator("figcaption")).toHaveCount(0);
      await expect(page.getByRole("article")).not.toContainText(/undefined|null/);
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

  for (const width of [1280, 390]) {
  test(`shows localized learning cards and blog navigation at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      await page.setViewportSize({ width, height: 900 });
      for (const article of localizedArticles) {
        await page.goto(article.indexPath);
        await expect.poll(() => page.getByTestId("blog-article-grid")
          .evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length))
          .toBe(width >= 1024 ? 4 : 1);
        await expect(page.getByTitle(translateMessage(article.locale, "nav.theme_dark"), { exact: true })).toHaveCount(1);

        const blogName = translateMessage(article.locale, "nav.blog");
        if (width >= 1280) {
          const navigation = page.getByTestId("desktop-primary-navigation");
          await expect(navigation.getByRole("link", { name: blogName, exact: true })).toHaveAttribute("href", article.indexPath);
          const navBox = await navigation.boundingBox();
          const actionsBox = await page.getByTestId("navbar-actions").boundingBox();
          expect(navBox).not.toBeNull();
          expect(actionsBox).not.toBeNull();
          for (const link of await navigation.getByRole("link").all()) {
            const box = await link.boundingBox();
            expect(box).not.toBeNull();
            expect(box!.x).toBeGreaterThanOrEqual(navBox!.x - 1);
            expect(box!.x + box!.width).toBeLessThanOrEqual(navBox!.x + navBox!.width + 1);
          }
        } else {
          await page.getByRole("button", { name: translateMessage(article.locale, "nav.open_menu"), exact: true }).click();
          const blogLink = page.getByTestId("mobile-navigation-dialog").getByRole("link", { name: blogName, exact: true });
          await expect(blogLink).toHaveAttribute("href", article.indexPath);
          await blogLink.click();
          await expect(page.getByTestId("mobile-navigation-dialog")).not.toBeVisible();
        }

        await page.goto(`${article.indexPath}/${encodeURIComponent(article.slug)}`);
        const cards = page.getByTestId("article-learning-cards");
        await expect(cards).toHaveCount(1);
        expect(await cards.evaluate((element) => element.previousElementSibling?.textContent)).toBe("Second reviewed paragraph.");
        const prefix = article.locale === "en" ? "" : `/${article.locale}`;
        const links = cards.getByRole("link");
        await expect(links).toHaveCount(3);
        for (const [index, route] of ["/traffic-signs", "/practice", "/exam"].entries()) {
          await expect(links.nth(index)).toHaveAttribute("href", `${prefix}${route}`);
          await expect.poll(() => links.nth(index).locator("img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
          const overlay = links.nth(index).getByTestId("article-learning-card-overlay");
          await expect(overlay).toHaveCSS("pointer-events", "none");
          await expect(overlay).toHaveCSS("position", "absolute");
          expect(await overlay.boundingBox()).toEqual(await links.nth(index).locator("img").boundingBox());
          await links.nth(index).click({ trial: true });
        }
        expect(await cards.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(width >= 640 ? 3 : 1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await cards.screenshot({ path: testInfo.outputPath(`learning-cards-${article.locale}-${width}.png`) });
      }
    expect(errors).toEqual([]);
  });
  }
});
