import { expect, test, type Page, type Route } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const locales = {
  en: {
    prefix: "",
    title: "Theory Exam Simulator",
    difficulty: "Easy",
    start: "Start Exam",
  },
  ar: {
    prefix: "/ar",
    title: "محاكي الامتحان النظري",
    difficulty: "سهل",
    start: "بدء الامتحان",
  },
  nl: {
    prefix: "/nl",
    title: "Theorie-examensimulator",
    difficulty: "Makkelijk",
    start: "Examen starten",
  },
  fr: {
    prefix: "/fr",
    title: "Simulateur d’examen théorique",
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
      url: "http://127.0.0.1:3005",
      httpOnly: true,
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
  await expect(page.getByTestId("exam-shell-header")).toBeVisible();
  await expect(page.getByTestId("exam-status-card")).toBeVisible();
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

for (const [locale, labels] of Object.entries(locales)) {
  test(`${locale} traffic-sign and random exams share the responsive shell`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await prepare(page);

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1366, height: 768 },
    ]) {
      await page.setViewportSize(viewport);

      await page.goto(`${labels.prefix}/traffic-signs/A1b/exam/1`);
      await expect(page.getByTestId("exam-shell-header")).toContainText(
        labels.title,
      );
      await expect(page.getByText(labels.difficulty, { exact: true })).toBeVisible();
      await expectUnifiedLayout(page, viewport.width);

      await page.goto(`${labels.prefix}/practice/random`);
      await page.getByRole("button", { name: labels.start }).click();
      await expect(page.getByTestId("exam-shell-header")).toContainText(
        labels.title,
      );
      await expect(page.getByText(labels.difficulty, { exact: true })).toBeVisible();
      await expectUnifiedLayout(page, viewport.width);
    }
  });
}
