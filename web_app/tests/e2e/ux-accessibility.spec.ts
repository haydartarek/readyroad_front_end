import { expect, test, type Page, type Route } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const publicRoutes = [
  "/",
  "/about",
  "/contact",
  "/traffic-signs",
  "/lessons",
  "/faq",
  "/privacy-policy",
  "/cookie-policy",
  "/terms",
  "/disclaimer",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/unauthorized",
] as const;

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function useAnonymousLanguage(page: Page, language: "en" | "ar") {
  await seedCookieConsent(page);
  await page.addInitScript((locale) => {
    window.localStorage.setItem("rijvia_locale", locale);
    document.cookie = `rijvia_locale=${locale}; path=/; samesite=lax`;
  }, language);
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

    if (
      pathname.endsWith("/api/proxy/traffic-signs") ||
      pathname.endsWith("/api/proxy/lessons")
    ) {
      return fulfillJson(route, 200, []);
    }

    return fulfillJson(route, 401, { error: "Unauthorized" });
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function navigateToPublicRoute(page: Page, pathname: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await page.goto(pathname, { waitUntil: "domcontentloaded" });
    } catch (error) {
      const isTransientAbort =
        error instanceof Error && error.message.includes("net::ERR_ABORTED");
      if (!isTransientAbort || attempt === 1) {
        throw error;
      }
    }
  }

  throw new Error(`Unable to navigate to ${pathname}`);
}

test.describe("Milestone 4 UX and accessibility", () => {
  test("public and authentication routes remain usable on a mobile viewport", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await useAnonymousLanguage(page, "en");
    await page.setViewportSize({ width: 375, height: 812 });
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    for (const route of publicRoutes) {
      const response = await navigateToPublicRoute(page, route);
      expect(response?.status(), route).toBeLessThan(400);
      await expect(page.locator("body"), route).not.toBeEmpty();
      await expectNoHorizontalOverflow(page);
    }

    expect(consoleErrors).toEqual([]);
  });

  test("protected destinations redirect to a visible login experience", async ({
    page,
  }) => {
    await useAnonymousLanguage(page, "en");
    await page.setViewportSize({ width: 768, height: 1024 });

    for (const route of ["/dashboard", "/profile", "/admin"]) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test("public learning entry pages require login only when starting", async ({
    page,
  }) => {
    await useAnonymousLanguage(page, "en");
    await page.setViewportSize({ width: 768, height: 1024 });

    for (const entry of [
      { route: "/practice/random", action: "Start Exam" },
      { route: "/exam", action: "Start Exam" },
    ]) {
      await page.goto(entry.route);
      await expect(page).toHaveURL(new RegExp(`${entry.route}$`));
      await page.getByRole("button", { name: entry.action }).click();
      await expect(page).toHaveURL(/\/login\?returnUrl=/);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test("legacy assessment routes resolve to the RijVia random practice flow", async ({
    page,
  }) => {
    await useAnonymousLanguage(page, "en");

    await page.goto("/assessment/software-engineering/advanced");

    await expect(page).toHaveURL(/\/practice\/random$/);
    await expect(page.getByText("software engineering knowledge")).toHaveCount(
      0,
    );
    await page.getByRole("button", { name: "Start Exam" }).click();
    await expect(page).toHaveURL(
      /\/login\?returnUrl=%2Fpractice%2Frandom(?:&|$)/,
    );
    await expect(
      page.getByRole("heading", { level: 1, name: "Login" }),
    ).toBeVisible();
  });

  test("navigation search and authentication landmarks have accessible structure", async ({
    page,
  }) => {
    await useAnonymousLanguage(page, "en");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const navbar = page.getByTestId("site-navbar");
    const searchButton = navbar.getByRole("button", { name: "Search" });
    await expect(searchButton).toBeVisible();
    await searchButton.click();
    await expect(
      navbar.getByRole("textbox", { name: "Search" }),
    ).toBeFocused();

    for (const route of [
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
    ]) {
      await navigateToPublicRoute(page, route);
      await expect(page.locator("main"), route).toHaveCount(1);
      await expect(page.locator("h1"), route).toHaveCount(1);
    }
  });

  test("login validation focuses the first error and exposes the password control", async ({
    page,
  }) => {
    await useAnonymousLanguage(page, "en");
    await page.goto("/login");

    await page.locator('form button[type="submit"]').click();
    await expect(page.locator("#username")).toBeFocused();
    await expect(page.locator("#username")).toHaveAttribute(
      "aria-describedby",
      "login-form-error",
    );

    await page.locator("#password").focus();
    await page.keyboard.press("Tab");
    const toggle = page.locator("#password + button");
    await expect(toggle).toBeFocused();
    const target = await toggle.boundingBox();
    expect(target?.width).toBeGreaterThanOrEqual(44);
    expect(target?.height).toBeGreaterThanOrEqual(44);
    await toggle.click();
    await expect(page.locator("#password")).toHaveAttribute("type", "text");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  test("register, recovery, and reset forms identify their first invalid field", async ({
    page,
  }) => {
    await useAnonymousLanguage(page, "en");

    await page.goto("/register");
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator("#firstName")).toBeFocused();
    await expect(page.locator("#firstName")).toHaveAttribute(
      "aria-describedby",
      "firstName-error",
    );

    await page.goto("/forgot-password");
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator("#email")).toBeFocused();
    await expect(page.locator("#email")).toHaveAttribute(
      "aria-describedby",
      "forgot-password-error",
    );

    await page.goto("/reset-password?token=qa-token");
    await page.locator("#newPassword").fill("StrongPassword1!");
    await page.locator("#confirmPassword").fill("DifferentPassword1!");
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator("#confirmPassword")).toBeFocused();
    await expect(page.locator("#confirmPassword")).toHaveAttribute(
      "aria-describedby",
      "reset-password-error",
    );
  });

  test("Arabic authentication UI keeps natural RTL order without overflow", async ({
    page,
  }) => {
    await useAnonymousLanguage(page, "ar");
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/ar/register");

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expectNoHorizontalOverflow(page);

    const inputBox = await page.locator("#password").boundingBox();
    const toggleBox = await page
      .locator("#password")
      .locator("xpath=following-sibling::button")
      .boundingBox();
    expect(toggleBox).not.toBeNull();
    expect(inputBox).not.toBeNull();
    expect(toggleBox!.x).toBeLessThan(inputBox!.x + inputBox!.width / 2);
  });

  test("Arabic desktop public navigation does not overflow near its wide breakpoint", async ({
    page,
  }) => {
    await seedCookieConsent(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/ar/privacy-policy");

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expectNoHorizontalOverflow(page);
  });

  test("successful login uses a focus-managed timed redirect dialog", async ({
    page,
  }) => {
    await useAnonymousLanguage(page, "en");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/auth/login", (route) =>
      fulfillJson(route, 200, {
        userId: 42,
        username: "qa_user",
        email: "qa@example.test",
        fullName: "Quality User",
        role: "USER",
      }),
    );
    await page.goto("/login");
    await page.locator("#username").fill("qa_user");
    await page.locator("#password").fill("StrongPassword1!");
    const dialogStatePromise = page.waitForFunction(() => {
      const element = document.querySelector('[role="dialog"]');
      const progressbar = element?.querySelector('[role="progressbar"]');
      const animation = element?.querySelector(".auth-redirect-animation");
      if (!element || !progressbar || !animation) {
        return null;
      }

      const animationName = window.getComputedStyle(animation).animationName;
      if (element !== document.activeElement || animationName !== "none") {
        return null;
      }

      return {
        focused: true,
        hasProgressbar: true,
        animationName,
      };
    });
    await page.locator('form button[type="submit"]').click();
    const dialogState = await (await dialogStatePromise).jsonValue();
    expect(dialogState).toEqual({
      focused: true,
      hasProgressbar: true,
      animationName: "none",
    });
  });

  test("traffic sign loading errors stay distinct from empty results", async ({
    page,
  }) => {
    await useAnonymousLanguage(page, "en");
    let attempts = 0;
    await page.route("**/api/proxy/traffic-signs", (route) => {
      attempts += 1;
      return fulfillJson(route, attempts === 1 ? 500 : 200, []);
    });

    await page.goto("/traffic-signs");
    const errorState = page
      .getByRole("alert")
      .filter({ hasText: "Something went wrong" });
    await expect(errorState).toContainText("Something went wrong");
    await errorState.getByRole("button", { name: "Retry" }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: "Belgian Traffic Signs" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "No signs found" }),
    ).toBeVisible();
    expect(attempts).toBe(2);
  });
});
