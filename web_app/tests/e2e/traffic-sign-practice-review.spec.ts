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
