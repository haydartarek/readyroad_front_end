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

test("every lesson locale publishes the same reciprocal hreflang cluster", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const variants = [
    ["/lessons/les-19/2", /\/lessons\/les-19\/2$/],
    ["/nl/lessons/les-19/2", /\/nl\/lessons\/les-19\/2$/],
    ["/fr/lessons/les-19/2", /\/fr\/lessons\/les-19\/2$/],
    ["/ar/lessons/les-19/2", /\/ar\/lessons\/les-19\/2$/],
  ] as const;
  const alternates = {
    en: /\/lessons\/les-19\/2$/,
    "nl-BE": /\/nl\/lessons\/les-19\/2$/,
    "fr-BE": /\/fr\/lessons\/les-19\/2$/,
    ar: /\/ar\/lessons\/les-19\/2$/,
    "x-default": /\/lessons\/les-19\/2$/,
  } as const;

  for (const [path, canonical] of variants) {
    await page.goto(path);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      canonical,
    );
    for (const [hreflang, href] of Object.entries(alternates)) {
      await expect(
        page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`),
      ).toHaveAttribute("href", href);
    }
  }
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

test("desktop navbar remains single-line and balanced in every language", async ({
  page,
}) => {
  test.setTimeout(60_000);

  for (const path of ["/", "/nl", "/fr", "/ar"]) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);

    for (const width of [1280, 1366, 1440, 1536, 1920]) {
      await page.setViewportSize({ width, height: 900 });

      const metrics = await page.getByTestId("site-navbar").evaluate((navbar) => {
        const primary = navbar.querySelector(
          '[data-testid="desktop-primary-navigation"]',
        );
        const navigationPill = primary?.firstElementChild;
        const actions = navbar.querySelector('[data-testid="navbar-actions"]');
        const links = primary ? [...primary.querySelectorAll("a")] : [];
        const search = navbar.querySelector<HTMLInputElement>("#navbar-search");
        const menuButton = [...navbar.querySelectorAll("button")].find((button) =>
          button.querySelector(".lucide-menu"),
        );

        return {
          navbarHeight: navbar.getBoundingClientRect().height,
          pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
          primaryVisible:
            primary instanceof HTMLElement &&
            getComputedStyle(primary).display !== "none",
          primaryOverflow:
            navigationPill instanceof HTMLElement &&
            navigationPill.scrollWidth > navigationPill.clientWidth,
          primaryHeadroom:
            primary instanceof HTMLElement &&
            navigationPill instanceof HTMLElement
              ? primary.clientWidth - navigationPill.scrollWidth
              : -1,
          primaryOverlap:
            navigationPill instanceof HTMLElement &&
            actions instanceof HTMLElement &&
            navigationPill.getBoundingClientRect().right >
              actions.getBoundingClientRect().left &&
            navigationPill.getBoundingClientRect().left <
              actions.getBoundingClientRect().right,
          wrappedLinks: links.filter(
            (link) => getComputedStyle(link).whiteSpace !== "nowrap",
          ).length,
          menuVisible:
            menuButton instanceof HTMLElement &&
            getComputedStyle(menuButton).display !== "none" &&
            menuButton.getBoundingClientRect().width > 0,
          searchWidth: search?.getBoundingClientRect().width ?? 0,
        };
      });

      const { primaryHeadroom, ...stableMetrics } = metrics;
      expect(primaryHeadroom, `${width}px ${path} navigation headroom`).toBeGreaterThanOrEqual(
        8,
      );
      expect(stableMetrics, `${width}px ${path}`).toEqual({
        navbarHeight: 75,
        pageOverflow: false,
        primaryVisible: true,
        primaryOverflow: false,
        primaryOverlap: false,
        wrappedLinks: 0,
        menuVisible: false,
        searchWidth: 128,
      });
    }
  }
});

test("navbar uses a stable compact menu without overflow below desktop", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/ar/lessons/les-19/2");

    await expect(page.getByTestId("site-navbar")).toHaveCSS("height", "75px");
    await expect(
      page.getByTestId("desktop-primary-navigation"),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: "فتح قائمة التنقل" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
    ).toBe(false);
  }
});

test("authenticated account menu exposes localized dashboard access on desktop and mobile", async ({
  page,
}) => {
  await page.context().addCookies([
    {
      name: "csrf_token",
      value: "playwright-session",
      domain: "127.0.0.1",
      path: "/",
      sameSite: "Lax",
    },
  ]);
  await page.unroute("**/api/auth/me");
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        userId: 42,
        username: "haydar",
        fullName: "Haydar Tarek",
        email: "haydar.with.a.very.long.address@example.com",
        role: "USER",
        preferredLanguage: null,
        isActive: true,
      }),
    }),
  );
  await page.route("**/api/proxy/users/me/notifications**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ unreadCount: 0, content: [] }),
    }),
  );
  await page.route("**/api/proxy/lessons/*/progress", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        lessonId: 20,
        pagesRead: 2,
        totalPages: 8,
        currentPage: 2,
        status: "IN_PROGRESS",
        completed: false,
      }),
    }),
  );

  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/ar/lessons/les-19/2");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "قائمة الحساب" }).click();

  const accountMenu = page.getByTestId("account-menu-content");
  const accountItems = accountMenu.getByRole("menuitem");
  await expect(accountItems.first()).toHaveText("لوحة التحكم");
  await expect(accountItems.first()).toHaveAttribute("href", "/ar/dashboard");
  await expect(accountItems.first()).toHaveCSS("white-space", "nowrap");
  await expect(
    accountMenu.getByText("haydar.with.a.very.long.address@example.com"),
  ).toHaveAttribute("title", "haydar.with.a.very.long.address@example.com");

  await page.keyboard.press("Escape");
  await expect(accountMenu).toBeHidden();

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/ar/lessons/les-19/2");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "فتح قائمة التنقل" }).click();

  const mobileMenu = page.getByTestId("mobile-navigation-dialog");
  const dashboardLink = mobileMenu.getByRole("link", {
    name: "لوحة التحكم",
    exact: true,
  });
  await expect(dashboardLink).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);

  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "قائمة الحساب" }).click();
  const mobileAccountDashboardLink = page
    .getByTestId("account-menu-content")
    .getByRole("menuitem", { name: "لوحة التحكم", exact: true });
  await expect(mobileAccountDashboardLink).toHaveAttribute(
    "href",
    "/ar/dashboard",
  );
  await expect(mobileAccountDashboardLink).toHaveCSS(
    "white-space",
    "nowrap",
  );
});

test("a persisted locale survives browser navigation into authentication", async ({
  context,
  page,
}) => {
  await context.addCookies([
    {
      name: "readyroad_locale",
      value: "ar",
      domain: "127.0.0.1",
      path: "/",
      sameSite: "Lax",
    },
  ]);

  await page.goto("/login");

  await expect(page).toHaveURL(/\/ar\/login$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  const googleHref = await page
    .locator('a[href^="/api/auth/google/start"]')
    .getAttribute("href");
  const googleUrl = new URL(googleHref!, "http://127.0.0.1");
  expect(googleUrl.searchParams.get("returnTo")).toBe("/ar/dashboard");
});

test("a protected localized deep link preserves its query through login", async ({
  page,
}) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|hydrated|server rendered html/i.test(message.text())
    ) {
      hydrationErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    if (/hydration|hydrated|server rendered html/i.test(error.message)) {
      hydrationErrors.push(error.message);
    }
  });

  await page.goto("/nl/practice/random?mode=retry");

  await expect(page).toHaveURL(
    /\/nl\/login\?returnUrl=%2Fnl%2Fpractice%2Frandom%3Fmode%3Dretry$/,
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
  await expect(
    page.locator('a[href^="/api/auth/google/start"]'),
  ).toHaveAttribute(
    "href",
    /returnTo=%2Fnl%2Fpractice%2Frandom%3Fmode%3Dretry$/,
  );
  expect(hydrationErrors).toEqual([]);
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

test("duplicate lesson page-one URLs redirect permanently to the lesson root", async ({
  request,
}) => {
  for (const [legacyPath, canonicalPath] of [
    [
      "/lessons/les-19/1?source=legacy",
      "/lessons/les-19?source=legacy",
    ],
    [
      "/nl/lessons/les-19/1?source=legacy",
      "/nl/lessons/les-19?source=legacy",
    ],
    [
      "/fr/lessons/les-19/1?source=legacy",
      "/fr/lessons/les-19?source=legacy",
    ],
    [
      "/ar/lessons/les-19/1?source=legacy",
      "/ar/lessons/les-19?source=legacy",
    ],
  ]) {
    const response = await request.get(legacyPath, { maxRedirects: 0 });

    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(canonicalPath);
  }
});

test("all multilingual sitemap URLs resolve without broken links", async ({
  request,
}) => {
  test.setTimeout(90_000);

  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.status()).toBe(200);
  const xml = await sitemapResponse.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );

  expect(urls.length).toBeGreaterThan(40);
  const failures: string[] = [];
  let cursor = 0;
  const crawl = async () => {
    while (cursor < urls.length) {
      const url = urls[cursor];
      cursor += 1;
      const response = await request.get(new URL(url).pathname);
      if (response.status() !== 200) {
        failures.push(`${response.status()} ${url}`);
      }
    }
  };

  await Promise.all(Array.from({ length: 4 }, () => crawl()));

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
