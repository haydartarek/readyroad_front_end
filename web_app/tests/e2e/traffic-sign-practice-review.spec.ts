import { expect, test, type Page, type Route } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const question = {
  id: 11,
  questionRef: "A1b-1",
  difficulty: "EASY",
  questionEn: "What should the driver do?",
  questionNl: "Wat moet de bestuurder doen?",
  questionFr: "Que doit faire le conducteur ?",
  questionAr: "ماذا يجب على السائق أن يفعل؟",
  choices: [
    {
      id: 101,
      textEn: "Reduce speed",
      textNl: "Snelheid verminderen",
      textFr: "Réduire la vitesse",
      textAr: "تخفيف السرعة",
    },
    {
      id: 102,
      textEn: "Accelerate",
      textNl: "Versnellen",
      textFr: "Accélérer",
      textAr: "زيادة السرعة",
    },
  ],
};

const sign = {
  id: 1,
  signCode: "A1b",
  routeCode: "A1b",
  categoryCode: "A",
  imageUrl: "/images/signs/danger_signs/A1b.png",
  nameEn: "Dangerous bend to the right",
  nameNl: "Gevaarlijke bocht naar rechts",
  nameFr: "Virage dangereux à droite",
  nameAr: "منعطف خطير إلى اليمين",
};

async function fulfillJson(route: Route, body: unknown) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function prepareCompletedPractice(page: Page) {
  await seedCookieConsent(page);
  await page.context().addCookies([
    {
      name: "token",
      value: "test-token",
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
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/proxy", "");

    if (path === "/traffic-signs/A1b") return fulfillJson(route, sign);
    if (path === "/sign-quiz/practice/A1b") {
      return fulfillJson(route, {
        sessionId: 77,
        signCode: "A1b",
        status: "COMPLETED",
        totalQuestions: 1,
        correctCount: 1,
        startedAt: "2026-08-09T10:00:00Z",
        completedAt: "2026-08-09T10:01:00Z",
        questions: [question],
      });
    }
    if (path === "/sign-quiz/practice/77/results") {
      return fulfillJson(route, {
        sessionId: 77,
        signCode: "A1b",
        status: "COMPLETED",
        totalQuestions: 1,
        correctAnswers: 1,
        scorePercentage: 100,
        passed: true,
        questionResults: [
          {
            ...question,
            questionId: question.id,
            isCorrect: true,
            selectedChoiceId: 101,
            selectedTextEn: "Reduce speed",
            selectedTextNl: "Snelheid verminderen",
            selectedTextFr: "Réduire la vitesse",
            selectedTextAr: "تخفيف السرعة",
            correctChoiceId: 101,
            correctTextEn: "Reduce speed",
            correctTextNl: "Snelheid verminderen",
            correctTextFr: "Réduire la vitesse",
            correctTextAr: "تخفيف السرعة",
            explanationEn: "Reduce speed before the bend.",
            explanationNl: "Verminder snelheid voor de bocht.",
            explanationFr: "Réduisez la vitesse avant le virage.",
            explanationAr: "خفف السرعة قبل المنعطف.",
          },
        ],
      });
    }

    return route.fulfill({ status: 404, json: { error: path } });
  });
}

async function prepareActivePractice(page: Page) {
  await seedCookieConsent(page);
  await page.context().addCookies([
    {
      name: "token",
      value: "test-token",
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
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/proxy", "");

    if (path === "/traffic-signs/A1b") return fulfillJson(route, sign);
    if (path === "/sign-quiz/practice/A1b") {
      return fulfillJson(route, {
        sessionId: 77,
        signCode: "A1b",
        status: "IN_PROGRESS",
        totalQuestions: 2,
        correctCount: 0,
        startedAt: "2026-08-09T10:00:00Z",
        questions: [question],
      });
    }
    if (path === "/sign-quiz/practice/77/results") {
      return fulfillJson(route, {
        sessionId: 77,
        signCode: "A1b",
        status: "IN_PROGRESS",
        totalQuestions: 2,
        correctAnswers: 0,
        wrongAnswers: 0,
        scorePercentage: 0,
        passed: false,
        startedAt: "2026-08-09T10:00:00Z",
        questionResults: [],
      });
    }
    if (path === "/sign-quiz/practice/77/questions/11/answer") {
      return fulfillJson(route, {
        questionId: 11,
        isCorrect: false,
        selectedChoiceId: 102,
        selectedTextEn: "Accelerate",
        selectedTextNl: "Versnellen",
        selectedTextFr: "Accélérer",
        selectedTextAr: "زيادة السرعة",
        correctChoiceId: 101,
        correctTextEn: "Reduce speed",
        correctTextNl: "Snelheid verminderen",
        correctTextFr: "Réduire la vitesse",
        correctTextAr: "تخفيف السرعة",
        explanationEn: "Reduce speed before the bend.",
        explanationNl: "Verminder snelheid voor de bocht.",
        explanationFr: "Réduisez la vitesse avant le virage.",
        explanationAr: "خفف السرعة قبل المنعطف.",
        questionsAnswered: 1,
        totalQuestions: 2,
        sessionCompleted: false,
        signAccuracyPercentage: 0,
        signTotalAttempts: 1,
      });
    }

    return route.fulfill({ status: 404, json: { error: path } });
  });
}

test("review answers reveals and focuses the existing section without navigation", async ({
  page,
}) => {
  await prepareCompletedPractice(page);

  for (const { path, answer } of [
    { path: "/traffic-signs/A1b/practice", answer: "Reduce speed" },
    { path: "/nl/traffic-signs/A1b/practice", answer: "Snelheid verminderen" },
    { path: "/fr/traffic-signs/A1b/practice", answer: "Réduire la vitesse" },
    { path: "/ar/traffic-signs/A1b/practice", answer: "تخفيف السرعة" },
  ]) {
    await page.goto(path);
    const review = page.locator("#answer-review");
    await expect(review).toHaveCount(0);

    const urlBefore = page.url();
    await page.getByTestId("show-answer-review").click();

    await expect(review).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe(
      "answer-review",
    );
    expect(page.url()).toBe(urlBefore);
    await expect(review.getByText(answer, { exact: true }).first()).toBeVisible();
  }
});

test("practice keeps immediate localized feedback without an exam timer", async ({
  page,
}) => {
  await prepareActivePractice(page);

  for (const { path, explanation } of [
    {
      path: "/traffic-signs/A1b/practice",
      explanation: "Reduce speed before the bend.",
    },
    {
      path: "/nl/traffic-signs/A1b/practice",
      explanation: "Verminder snelheid voor de bocht.",
    },
    {
      path: "/fr/traffic-signs/A1b/practice",
      explanation: "Réduisez la vitesse avant le virage.",
    },
    {
      path: "/ar/traffic-signs/A1b/practice",
      explanation: "خفف السرعة قبل المنعطف.",
    },
  ]) {
    await page.goto(path);
    await expect(page.getByTestId("exam-timer-slot")).toHaveCount(0);
    await page.getByTestId("exam-option-card").nth(1).click();
    await page.getByTestId("submit-practice-answer").click();

    const feedback = page.locator(
      '[data-testid="result-answer-block"][data-answer-tone="incorrect"]',
    );
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText(explanation);
  }
});

test("practice uses the shared responsive question flow without reserving timer space", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await prepareActivePractice(page);

  const paths = [
    "/traffic-signs/A1b/practice",
    "/nl/traffic-signs/A1b/practice",
    "/fr/traffic-signs/A1b/practice",
    "/ar/traffic-signs/A1b/practice",
  ];
  const viewports = [
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
  ];

  for (const path of paths) {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(path);

      await expect(page.getByTestId("exam-shell-header")).toHaveCount(0);
      await expect(page.getByTestId("exam-timer-slot")).toHaveCount(0);
      await expect(page.getByTestId("exam-question-title")).toBeVisible();
      await expect(page.getByTestId("exam-status-card")).toBeVisible();
      await expect(page.getByTestId("exam-actions")).toBeVisible();

      const measurements = await page.evaluate(() => {
        const image = document.querySelector<HTMLElement>(
          '[data-testid="exam-question-image"]',
        );
        const content = document.querySelector<HTMLElement>(
          '[data-testid="exam-question-content"]',
        );
        const options = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[data-testid="exam-option-card"]',
          ),
        );
        if (!image || !content) return null;
        const imageRect = image.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        return {
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          imageInside:
            imageRect.left >= -1 && imageRect.right <= window.innerWidth + 1,
          optionsInside: options.every((option) => {
            const rect = option.getBoundingClientRect();
            return rect.left >= -1 && rect.right <= window.innerWidth + 1;
          }),
          sideBySide:
            imageRect.right <= contentRect.left + 1 ||
            contentRect.right <= imageRect.left + 1,
          stacked: contentRect.top >= imageRect.bottom - 1,
        };
      });

      expect(measurements, `${path} at ${viewport.width}px`).not.toBeNull();
      expect(measurements?.documentWidth).toBeLessThanOrEqual(viewport.width);
      expect(measurements?.bodyWidth).toBeLessThanOrEqual(viewport.width);
      expect(measurements?.imageInside).toBe(true);
      expect(measurements?.optionsInside).toBe(true);
      expect(
        viewport.width >= 1024
          ? measurements?.sideBySide
          : measurements?.stacked,
      ).toBe(true);
    }
  }
});
