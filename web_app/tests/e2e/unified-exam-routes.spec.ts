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
  ).toHaveCount(2);

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
  test(`${locale} completed random sign exam opens its saved results`, async ({ page }) => {
    await prepare(page);
    const historyRequests: string[] = [];
    const result = {
      sessionId: 88,
      status: "COMPLETED",
      totalQuestions: 1,
      answeredCount: 1,
      correctAnswers: 1,
      wrongAnswers: 0,
      unanswered: 0,
      scorePercentage: 100,
      passed: true,
      passingScore: 1,
      startedAt: "2026-08-12T00:00:00Z",
      completedAt: "2026-08-12T00:01:00Z",
      questions: [{
        ...question,
        questionId: question.id,
        selectedChoiceId: 101,
        correctChoiceId: 101,
        selectedChoiceEn: question.choices[0].textEn,
        selectedChoiceAr: question.choices[0].textAr,
        selectedChoiceNl: question.choices[0].textNl,
        selectedChoiceFr: question.choices[0].textFr,
        correctChoiceEn: question.choices[0].textEn,
        correctChoiceAr: question.choices[0].textAr,
        correctChoiceNl: question.choices[0].textNl,
        correctChoiceFr: question.choices[0].textFr,
        isCorrect: true,
        wasTimeout: false,
      }],
    };
    await page.route("**/api/proxy/**", async (route) => {
      const path = new URL(route.request().url()).pathname.replace("/api/proxy", "");
      if (["/exams/simulations/history", "/sign-quiz/random-practice/history", "/sign-quiz/exam-history"].includes(path)) {
        historyRequests.push(path);
      }
      if (path === "/sign-quiz/random-practice/check") {
        expect(route.request().method()).toBe("POST");
        expect(route.request().postDataJSON()).toEqual({
          sessionId: 88,
          answers: [{ questionId: question.id, selectedChoiceId: 101 }],
        });
        return fulfillJson(route, result);
      }
      if (path === "/exams/simulations/history") {
        return fulfillJson(route, { totalExams: 0, exams: [] });
      }
      if (path === "/sign-quiz/random-practice/history") {
        return fulfillJson(route, { totalSessions: 1, sessions: [result] });
      }
      if (path === "/sign-quiz/random-practice/88/results") return fulfillJson(route, result);
      if (path === "/sign-quiz/exam-history") {
        return fulfillJson(route, { totalResults: 0, results: [] });
      }
      return route.fallback();
    });
    await page.goto(`${labels.prefix}/practice/random`);
    await page.getByRole("button", { name: labels.start }).click();
    await page.getByRole("button", { name: question.choices[0][`text${locale === "en" ? "En" : locale === "ar" ? "Ar" : locale === "nl" ? "Nl" : "Fr"}`] }).click();
    await page.getByTestId("exam-next").click();
    await expect(page).toHaveURL(`${process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3005"}${labels.prefix}/exam/results?randomSignExamId=88`);
    await expect(page.getByTestId("mixed-sign-exam-result-card")).toBeVisible();
    await expect(page.getByTestId("mixed-sign-exam-result-card")).toHaveCount(1);
    expect(historyRequests).toEqual([]);
  });

  for (const kind of ["traffic-sign", "random"] as const) {
    test(`${locale} traffic-sign and random exams share the responsive shell: ${kind}`, async ({
      page,
    }) => {
      await prepare(page);
      await page.clock.install();
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(`${labels.prefix}${kind === "traffic-sign" ? "/traffic-signs/A1b/exam/1" : "/practice/random"}`, { waitUntil: "domcontentloaded" });
      if (kind === "random") await page.getByRole("button", { name: labels.start }).click();
      await expectSingleVisibleText(page, labels.difficulty);
      // Layout coverage must not race the separate question countdown tests.
      await page.clock.pauseAt(new Date(Date.now() + 1000));

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

        await page.clock.runFor(32);
        await expectSingleVisibleText(page, labels.difficulty);
        await expectUnifiedLayout(page, viewport.width);
      }
    });
  }
}
