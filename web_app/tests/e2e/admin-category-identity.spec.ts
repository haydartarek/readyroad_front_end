import { expect, test, type Page } from "@playwright/test";

const adminUser = {
  id: 1,
  username: "admin",
  email: "admin@rijvia.test",
  role: "ADMIN",
};

const categories = [
  {
    id: 1,
    code: "TH01",
    nameEn: "Priority and intersections",
    nameAr: "الأولوية والتقاطعات",
    nameNl: "Voorrang en kruispunten",
    nameFr: "Priorité et carrefours",
    descriptionEn: null,
    descriptionAr: null,
    descriptionNl: null,
    descriptionFr: null,
    displayOrder: 1,
    active: true,
    contentScope: "THEORETICAL_EXAM",
    examTargetWeight: 14,
    totalQuestions: 45,
    publishedQuestions: 45,
    eligibleAllLocales: 45,
    eligibleByDifficulty: { EASY: 20, MEDIUM: 15, HARD: 10 },
    minimumRequired: 6,
    questionsNeeded: 0,
    examEligible: true,
  },
  {
    id: 2,
    code: "TH02",
    nameEn: "Speed, roads and distances",
    nameAr: "السرعة والطرق والمسافات",
    nameNl: "Snelheid, wegen en afstanden",
    nameFr: "Vitesse, routes et distances",
    descriptionEn: null,
    descriptionAr: null,
    descriptionNl: null,
    descriptionFr: null,
    displayOrder: 2,
    active: true,
    contentScope: "THEORETICAL_EXAM",
    examTargetWeight: 14,
    totalQuestions: 48,
    publishedQuestions: 47,
    eligibleAllLocales: 44,
    eligibleByDifficulty: { EASY: 18, MEDIUM: 16, HARD: 10 },
    minimumRequired: 6,
    questionsNeeded: 0,
    examEligible: true,
  },
];

const bankHealth = {
  generatedAt: "2026-09-01T00:00:00Z",
  summary: {
    totalQuestions: 93,
    activeQuestions: 93,
    inactiveQuestions: 0,
    publishedQuestions: 92,
    eligibleAllLocales: 89,
    translationGapQuestions: 4,
    explanationGapQuestions: 2,
    invalidQuestions: 0,
    underrepresentedCategories: 0,
    overrepresentedCategories: 0,
  },
  locales: [
    { locale: "ar", eligibleQuestions: 89, translationGapQuestions: 4 },
    { locale: "nl", eligibleQuestions: 89, translationGapQuestions: 4 },
    { locale: "en", eligibleQuestions: 89, translationGapQuestions: 4 },
    { locale: "fr", eligibleQuestions: 89, translationGapQuestions: 4 },
  ],
  categories,
  questionsNeedingReview: [{
    questionId: 66,
    categoryCode: "TH02",
    difficulty: "MEDIUM",
    presentations: 1,
    answered: 1,
    correctRate: 0,
    incorrectRate: 100,
    averageAnswerTimeSeconds: 8,
    performanceByLocale: {
      ar: { answered: 1, correct: 0, correctRate: 0, averageAnswerTimeSeconds: 8 },
      nl: { answered: 0, correct: 0, correctRate: null, averageAnswerTimeSeconds: null },
      en: { answered: 0, correct: 0, correctRate: null, averageAnswerTimeSeconds: null },
      fr: { answered: 0, correct: 0, correctRate: null, averageAnswerTimeSeconds: null },
    },
    flags: ["LOCALE_DIVERGENCE"],
  }],
  rarelyExposedQuestions: [
    {
      questionId: 66,
      categoryCode: "TH02",
      difficulty: "MEDIUM",
      presentations: 1,
    },
  ],
  heavilyExposedQuestions: [
    {
      questionId: 17,
      categoryCode: "TH01",
      difficulty: "EASY",
      presentations: 9,
    },
  ],
};

async function mockAdmin(page: Page) {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ sub: "admin", role: "ADMIN", exp: 4_102_444_800 }),
  ).toString("base64url");

  await page.context().addCookies([
    {
      name: "token",
      value: `${header}.${payload}.test-signature`,
      url: "http://127.0.0.1:3005",
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "csrf_token",
      value: "playwright-csrf-token",
      url: "http://127.0.0.1:3005",
      sameSite: "Lax",
    },
  ]);

  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ json: { authenticated: true, user: adminUser } }),
  );
  await page.route("**/api/proxy/admin/quiz/categories/manage", (route) =>
    route.fulfill({ json: categories }),
  );
  await page.route("**/api/proxy/admin/quiz/bank-health", (route) =>
    route.fulfill({ json: bankHealth }),
  );
  await page.route(
    "**/api/proxy/users/me/notifications/unread-count",
    (route) => route.fulfill({ json: { unreadCount: 0 } }),
  );
}

test("Arabic category management uses names instead of internal TH codes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAdmin(page);

  const browserErrors: string[] = [];
  const failedResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto("/ar/admin/quizzes/categories");

  await expect(page.getByText("الأولوية والتقاطعات").first()).toBeVisible();
  await expect(page.getByText("السرعة والطرق والمسافات").first()).toBeVisible();
  await expect(page.getByText(/^TH\d+$/)).toHaveCount(0);

  await expect(page.getByTestId("question-exposure-panel")).toBeVisible();
  await expect(page.getByTestId("theory-bank-health")).toBeVisible();
  await expect(page.getByTestId("theory-category-management")).toBeVisible();
  await expect(page.getByText(/TH\d+/)).toHaveCount(0);

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));

  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);
  expect({ browserErrors, failedResponses }).toEqual({
    browserErrors: [],
    failedResponses: [],
  });
});
