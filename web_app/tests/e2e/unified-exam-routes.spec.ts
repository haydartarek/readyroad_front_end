import { expect, test, type Page, type Route } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const locales = {
  en: {
    prefix: "",
    difficulty: "Easy",
    start: "Start Exam",
  },
  ar: {
    prefix: "/ar",
    difficulty: "سهل",
    start: "بدء الامتحان",
  },
  nl: {
    prefix: "/nl",
    difficulty: "Makkelijk",
    start: "Examen starten",
  },
  fr: {
    prefix: "/fr",
    difficulty: "Facile",
    start: "Commencer l'examen",
  },
} as const;

const question = {
  id: 11,
  questionRef: "A1b-1",
  difficulty: "EASY",
  showSign: true,
  signCode: "A1b",
  signImagePath: "/images/signs/danger_signs/A1b.png",
  questionEn: "What should the driver expect?",
  questionAr: "ماذا يجب أن يتوقع السائق؟",
  questionNl: "Wat moet de bestuurder verwachten?",
  questionFr: "À quoi le conducteur doit-il s’attendre ?",
  choices: [
    {
      id: 101,
      textEn: "Danger ahead",
      textAr: "خطر أمامك",
      textNl: "Gevaar voor u",
      textFr: "Danger devant vous",
    },
    {
      id: 102,
      textEn: "No danger",
      textAr: "لا يوجد خطر",
      textNl: "Geen gevaar",
      textFr: "Aucun danger",
    },
  ],
};

const sign = {
  id: 1,
  signCode: "A1b",
  routeCode: "A1b",
  categoryCode: "A",
  imageUrl: "/images/signs/danger_signs/A1b.png",
  nameEn: "Dangerous bend to the left",
  nameAr: "منعطف خطير إلى اليسار",
  nameNl: "Gevaarlijke bocht naar links",
  nameFr: "Virage dangereux à gauche",
};

async function fulfillJson(route: Route, body: unknown) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function prepare(page: Page) {
  await seedCookieConsent(page);
  const authUrl =
    process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3005";
  const token = [
    "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0",
    Buffer.from(
      JSON.stringify({ sub: "learner", role: "USER", exp: 2_000_000_000 }),
    ).toString("base64url"),
    "test-signature",
  ].join(".");
  await page.context().addCookies([
    {
      name: "token",
      value: token,
      url: authUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "csrf_token",
      value: "unified-exam-routes",
      url: authUrl,
      sameSite: "Lax",
    },
  ]);
  await page.route("**/api/auth/me", (route) =>
    fulfillJson(route, {
      authenticated: true,
      user: { userId: 42, username: "learner", role: "USER" },
    }),
  );
  await page.route("**/api/proxy/**", (route) => {
    const path = new URL(route.request().url()).pathname.replace(
      "/api/proxy",
      "",
    );
    if (path === "/traffic-signs/A1b") return fulfillJson(route, sign);
    if (path === "/sign-quiz/exam/A1b/1") {
      return fulfillJson(route, {
        signCode: "A1b",
        examNumber: 1,
        questions: [question],
      });
    }
    if (path === "/sign-quiz/random-practice") {
      return fulfillJson(route, {
        sessionId: 88,
        status: "IN_PROGRESS",
        totalQuestions: 1,
        passingScore: 1,
        startedAt: "2026-08-12T00:00:00Z",
        questions: [question],
      });
    }
    if (path.startsWith("/users/me/notifications")) {
      return fulfillJson(route, []);
    }
    return fulfillJson(route, []);
  });
}

async function expectUnifiedLayout(page: Page, width: number) {
  await expect(page.getByTestId("exam-shell-header")).toHaveCount(0);
  await expect(page.getByTestId("exam-status-card")).toBeVisible();
  await expect(page.getByTestId("exam-information-bar")).toBeVisible();
  await expect(page.getByTestId("exam-actions")).toBeVisible();
  await expect(
    page.getByTestId("exam-actions").locator(":scope > a, :scope > button"),
  ).toHaveCount(3);

  const measurements = await page.evaluate(() => {
    const image = document.querySelector<HTMLElement>(
      '[data-testid="exam-question-image"]',
    );
    const content = document.querySelector<HTMLElement>(
      '[data-testid="exam-question-content"]',
    );
    const main = document.querySelector<HTMLElement>(
      '[data-testid="exam-main-card"]',
    );
    const status = document.querySelector<HTMLElement>(
      '[data-testid="exam-status-card"]',
    );
    if (!image || !content || !main || !status) return null;
    const imageRect = image.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const statusRect = status.getBoundingClientRect();
    return {
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      radius: Number.parseFloat(getComputedStyle(image).borderRadius),
      statusAfterCard: statusRect.top >= mainRect.bottom - 1,
      sideBySide:
        imageRect.right <= contentRect.left + 1 ||
        contentRect.right <= imageRect.left + 1,
      stacked: contentRect.top >= imageRect.bottom - 1,
    };
  });

  expect(measurements).not.toBeNull();
  expect(measurements?.documentWidth).toBeLessThanOrEqual(width);
  expect(measurements?.bodyWidth).toBeLessThanOrEqual(width);
  expect(measurements?.radius).toBeLessThanOrEqual(8);
  expect(measurements?.statusAfterCard).toBe(true);
  expect(width >= 1024 ? measurements?.sideBySide : measurements?.stacked).toBe(
    true,
  );
}

async function expectSingleVisibleText(page: Page, text: string) {
  const matches = page.getByText(text, { exact: true });
  await expect
    .poll(async () => {
      let visible = 0;
      for (let index = 0; index < (await matches.count()); index += 1) {
        if (await matches.nth(index).isVisible()) visible += 1;
      }
      return visible;
    })
    .toBe(1);
}

for (const [locale, labels] of Object.entries(locales)) {
  test(`${locale} traffic-sign and random exams share the responsive shell`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await prepare(page);

    for (const viewport of [
      { width: 320, height: 800 },
      { width: 360, height: 800 },
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 393, height: 852 },
      { width: 414, height: 896 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1280, height: 800 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
      { width: 1920, height: 1080 },
    ]) {
      await page.setViewportSize(viewport);

      await page.goto(`${labels.prefix}/traffic-signs/A1b/exam/1`);
      await expectSingleVisibleText(page, labels.difficulty);
      await expectUnifiedLayout(page, viewport.width);

      await page.goto(`${labels.prefix}/practice/random`);
      await page.getByRole("button", { name: labels.start }).click();
      await expectSingleVisibleText(page, labels.difficulty);
      await expectUnifiedLayout(page, viewport.width);
    }
  });
}
