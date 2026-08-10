import { expect, test, type Page, type Route } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const localized = {
  en: {
    path: "/exam/results/77",
    selected: "Selected English answer",
    correct: "Correct English answer",
    explanation: "Saved English explanation",
  },
  ar: {
    path: "/ar/exam/results/77",
    selected: "الإجابة الإنجليزية غير معروضة",
    correct: "الإجابة العربية الصحيحة",
    explanation: "الشرح العربي المحفوظ",
  },
  nl: {
    path: "/nl/exam/results/77",
    selected: "Gekozen Nederlands antwoord",
    correct: "Correct Nederlands antwoord",
    explanation: "Opgeslagen Nederlandse uitleg",
  },
  fr: {
    path: "/fr/exam/results/77",
    selected: "Réponse française choisie",
    correct: "Bonne réponse française",
    explanation: "Explication française enregistrée",
  },
} as const;

const reviewAnswer = {
  questionId: 12,
  selectedOptionId: 102,
  correctOptionId: 101,
  questionTextEn: "What is the correct speed?",
  questionTextAr: "ما السرعة الصحيحة؟",
  questionTextNl: "Wat is de juiste snelheid?",
  questionTextFr: "Quelle est la vitesse correcte ?",
  selectedOptionText: localized.en.selected,
  selectedOptionTextEn: localized.en.selected,
  selectedOptionTextAr: localized.ar.selected,
  selectedOptionTextNl: localized.nl.selected,
  selectedOptionTextFr: localized.fr.selected,
  correctOptionText: localized.en.correct,
  correctOptionTextEn: localized.en.correct,
  correctOptionTextAr: localized.ar.correct,
  correctOptionTextNl: localized.nl.correct,
  correctOptionTextFr: localized.fr.correct,
  explanationEn: localized.en.explanation,
  explanationAr: localized.ar.explanation,
  explanationNl: localized.nl.explanation,
  explanationFr: localized.fr.explanation,
  categoryName: "Speed, roads and distances",
  categoryNameEn: "Speed, roads and distances",
  categoryNameAr: "السرعة والطرق والمسافات",
  categoryNameNl: "Snelheid, wegen en afstanden",
  categoryNameFr: "Vitesse, routes et distances",
  categoryCode: "TH04",
  isCorrect: false,
};

const result = {
  examId: 77,
  userId: 42,
  completedAt: "2026-08-09T10:00:00Z",
  totalQuestions: 1,
  correctAnswers: 0,
  wrongAnswers: 1,
  scorePercentage: 0,
  passed: false,
  passingScore: 41,
  passingThreshold: 41,
  pointsToPass: 41,
  timeTakenSeconds: 45,
  averageTimePerQuestion: 45,
  answeredCount: 1,
  unansweredCount: 0,
  weakCategories: ["TH04"],
  categoryBreakdown: [],
  incorrectQuestions: [reviewAnswer],
  allAnswers: [reviewAnswer],
};

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function prepareResult(page: Page) {
  await seedCookieConsent(page);
  await page.context().addCookies([
    {
      name: "token",
      value: "result-review-test-token",
      url: "http://127.0.0.1:3005",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.route("**/api/auth/me", (route) =>
    fulfillJson(route, {
      authenticated: true,
      user: {
        userId: 42,
        username: "learner",
        email: "learner@example.test",
        role: "USER",
      },
    }),
  );
  await page.route("**/api/proxy/**", (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/proxy", "");

    if (path === "/exams/simulations/77/results") {
      return fulfillJson(route, result);
    }
    if (path.startsWith("/users/me/notifications")) {
      return fulfillJson(route, []);
    }
    return fulfillJson(route, []);
  });
}

for (const [language, content] of Object.entries(localized)) {
  for (const width of [390, 1280, 1920]) {
    test(`${language} review navigation and layout at ${width}px`, async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      const serverErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("response", (response) => {
        if (response.status() >= 500) serverErrors.push(response.url());
      });

      await page.setViewportSize({ width, height: 900 });
      await prepareResult(page);
      await page.goto(content.path);

      const urlBefore = page.url();
      await page.getByTestId("show-exam-answer-review").click();

      const firstQuestion = page.getByTestId("result-review-first-question");
      await expect(firstQuestion).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute("data-testid"))).toBe(
        "result-review-first-question",
      );
      await expect.poll(() => firstQuestion.evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(180);
      expect(page.url()).toBe(urlBefore);

      const header = firstQuestion.getByTestId("result-review-header");
      const questionCategory = header.getByTestId(
        "result-review-question-category",
      );
      const status = header.getByTestId("result-review-status");
      const [questionRect, statusRect] = await Promise.all([
        questionCategory.boundingBox(),
        status.boundingBox(),
      ]);
      expect(questionRect).not.toBeNull();
      expect(statusRect).not.toBeNull();

      if (width === 390) {
        expect(statusRect!.y).toBeGreaterThanOrEqual(
          questionRect!.y + questionRect!.height,
        );
      } else {
        expect(Math.abs(statusRect!.y - questionRect!.y)).toBeLessThan(8);
      }

      await expect(firstQuestion.getByText(content.selected, { exact: true })).toBeVisible();
      await firstQuestion.locator('button[aria-expanded="false"]').click();
      await expect(firstQuestion.getByText(content.correct, { exact: true })).toBeVisible();
      await expect(firstQuestion.getByText(content.explanation, { exact: true })).toBeVisible();

      const widths = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      expect(widths.document).toBeLessThanOrEqual(widths.viewport);
      expect(widths.body).toBeLessThanOrEqual(widths.viewport);
      expect(consoleErrors).toEqual([]);
      expect(serverErrors).toEqual([]);
    });
  }
}
