import { expect, test, type Page, type Route } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const localeCases = [
  {
    locale: "en",
    path: "/about",
    direction: "ltr",
    languageLabel: "English",
    disclaimerPath: "/disclaimer",
    contactPath: "/contact",
  },
  {
    locale: "ar",
    path: "/ar/about",
    direction: "rtl",
    languageLabel: "العربية",
    disclaimerPath: "/ar/disclaimer",
    contactPath: "/ar/contact",
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
    window.localStorage.setItem("readyroad_locale", activeLocale);
    document.cookie = `readyroad_locale=${activeLocale}; path=/; samesite=lax`;
  }, locale);
  await page.route("**/api/auth/me", (route) =>
    fulfillJson(route, 200, { authenticated: false, user: null }),
  );
}

test.describe("Footer bottom row", () => {
  for (const localeCase of localeCases) {
    test(`${localeCase.locale.toUpperCase()} keeps the mobile and desktop footer order`, async ({
      page,
    }) => {
      await useAnonymousLocale(page, localeCase.locale);

      for (const width of [375, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const response = await page.goto(localeCase.path, {
          waitUntil: "domcontentloaded",
        });
        expect(response?.status()).toBe(200);
        await page.waitForLoadState("networkidle");
        await expect(page.locator("html")).toHaveAttribute(
          "dir",
          localeCase.direction,
        );

        const legal = page.getByTestId("footer-legal-links");
        const language = page.getByTestId("footer-language");
        const copyright = page.getByTestId("footer-copyright");
        const languageTrigger = page.locator("#footer-lang");

        await expect(legal).toBeVisible();
        await expect(language).toBeVisible();
        await expect(copyright).toBeVisible();
        await expect(languageTrigger).toHaveAttribute("role", "combobox");
        await expect(languageTrigger).toContainText(localeCase.languageLabel);

        const legalHrefs = await legal.locator("a").evaluateAll((links) =>
          links.map((link) => link.getAttribute("href")),
        );
        const disclaimerIndex = legalHrefs.indexOf(localeCase.disclaimerPath);
        const contactIndex = legalHrefs.indexOf(localeCase.contactPath);
        expect(disclaimerIndex).toBeGreaterThanOrEqual(0);
        expect(contactIndex).toBe(disclaimerIndex + 1);

        const measurements = await page.evaluate(() => {
          const row = document.querySelector<HTMLElement>(
            '[data-testid="footer-bottom-row"]',
          );
          const utilityRow = document.querySelector<HTMLElement>(
            '[data-testid="footer-utility-row"]',
          );
          const legalLinks = document.querySelector<HTMLElement>(
            '[data-testid="footer-legal-links"]',
          );
          const languageControl = document.querySelector<HTMLElement>(
            '[data-testid="footer-language"]',
          );
          const copyrightText = document.querySelector<HTMLElement>(
            '[data-testid="footer-copyright"]',
          );

          if (
            !row ||
            !utilityRow ||
            !legalLinks ||
            !languageControl ||
            !copyrightText
          ) {
            throw new Error("Footer bottom-row elements are missing");
          }

          const rowRect = row.getBoundingClientRect();
          const utilityRect = utilityRow.getBoundingClientRect();
          const legalRect = legalLinks.getBoundingClientRect();
          const languageRect = languageControl.getBoundingClientRect();
          const copyrightRect = copyrightText.getBoundingClientRect();
          const legalItemTops = Array.from(
            legalLinks.children,
            (item) => item.getBoundingClientRect().top,
          );

          return {
            innerWidth: window.innerWidth,
            documentScrollWidth: document.documentElement.scrollWidth,
            bodyScrollWidth: document.body.scrollWidth,
            rowDisplay: getComputedStyle(row).display,
            utilityDisplay: getComputedStyle(utilityRow).display,
            rowCenter: rowRect.left + rowRect.width / 2,
            utilityBottom: utilityRect.bottom,
            legalTop: legalRect.top,
            legalBottom: legalRect.bottom,
            legalCenter: legalRect.left + legalRect.width / 2,
            legalItemTops,
            languageTop: languageRect.top,
            languageBottom: languageRect.bottom,
            languageCenter: languageRect.left + languageRect.width / 2,
            copyrightTop: copyrightRect.top,
            copyrightCenter:
              copyrightRect.left + copyrightRect.width / 2,
          };
        });

        expect(measurements.documentScrollWidth).toBeLessThanOrEqual(width);
        expect(measurements.bodyScrollWidth).toBeLessThanOrEqual(width);
        expect(measurements.rowDisplay).toBe("flex");
        expect(measurements.copyrightTop).toBeGreaterThanOrEqual(
          measurements.utilityBottom,
        );
        expect(
          Math.abs(measurements.copyrightCenter - measurements.rowCenter),
        ).toBeLessThanOrEqual(2);

        if (width < 1280) {
          expect(measurements.utilityDisplay).toBe("flex");
          expect(measurements.languageTop).toBeGreaterThanOrEqual(
            measurements.legalBottom,
          );
          expect(
            Math.abs(measurements.languageCenter - measurements.rowCenter),
          ).toBeLessThanOrEqual(2);
        } else {
          expect(measurements.utilityDisplay).toBe("grid");
          expect(new Set(measurements.legalItemTops).size).toBe(1);
          if (localeCase.direction === "rtl") {
            expect(measurements.languageCenter).toBeLessThan(
              measurements.rowCenter,
            );
            expect(measurements.legalCenter).toBeGreaterThan(
              measurements.rowCenter,
            );
          } else {
            expect(measurements.legalCenter).toBeLessThan(
              measurements.rowCenter,
            );
            expect(measurements.languageCenter).toBeGreaterThan(
              measurements.rowCenter,
            );
          }
        }

        if (width === 375) {
          await languageTrigger.press("Enter");
          const listbox = page.getByRole("listbox");
          await expect(listbox).toBeVisible();
          await expect(page.getByRole("option")).toHaveCount(4);
          const dropdownStyle = await listbox.evaluate((element) => {
            const style = getComputedStyle(element);
            return {
              backgroundColor: style.backgroundColor,
              borderRadius: Number.parseFloat(style.borderRadius),
            };
          });
          expect(dropdownStyle.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
          expect(dropdownStyle.borderRadius).toBeGreaterThan(0);
          await page.keyboard.press("Escape");
          await expect(listbox).toBeHidden();
        }
      }
    });
  }

  test("footer language dropdown supports keyboard selection", async ({
    page,
  }) => {
    await useAnonymousLocale(page, "en");
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/about");
    await page.waitForLoadState("networkidle");

    const languageTrigger = page.locator("#footer-lang");
    await languageTrigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.getByRole("option", { name: "العربية" }).focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL("/ar/about");
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("readyroad_locale")),
      )
      .toBe("ar");
  });
});
