import { expect, test, type BrowserContext, type Page, type Route } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const locales = ["en", "nl", "fr", "ar"] as const;
const mobileWidths = [320, 375, 390, 414, 428] as const;

const publicRoutes = [
  "/",
  "/about",
  "/contact",
  "/faq",
  "/lessons",
  "/lessons/les-19",
  "/lessons/les-19/2",
  "/traffic-signs",
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

const protectedRoutes = [
  "/dashboard",
  "/practice",
  "/exam",
  "/dashboard?section=weak-areas",
  "/dashboard?section=exam-results",
  "/profile",
] as const;

const qaUser = {
  userId: 42,
  username: "readyroad_mobile_quality_assurance_account",
  fullName: "ReadyRoad Mobile Quality Assurance",
  email: "readyroad.mobile.quality.assurance.with.a.long.address@example.test",
  role: "USER",
  preferredLanguage: null,
  isActive: true,
  createdAt: "2026-01-01T00:00:00Z",
};

const emptyOverallProgress = {
  totalAttempted: 0,
  totalCorrect: 0,
  overallAccuracy: 0,
  weakCategories: [],
  strongCategories: [],
  mostStudiedCategories: [],
  studyStreak: 0,
  lastActivityDate: null,
  questionsRemaining: 0,
  recommendedDifficulty: "EASY",
  totalExamsTaken: 0,
  passedExams: 0,
  failedExams: 0,
  passRate: 0,
  signPracticeCount: 0,
  signExamCount: 0,
  signPassedCount: 0,
  signRandomExamCount: 0,
  signRandomExamPassedCount: 0,
  lessonsStartedCount: 0,
  lessonsCompletedCount: 0,
  incompleteActivitiesCount: 0,
  activeTheoryExamCount: 0,
  incompleteSignPracticeCount: 0,
  activeRandomSignExamCount: 0,
  weakSigns: [],
};

const emptyStudentIntelligence = {
  dataStatus: "NO_DATA",
  studentLevel: "BEGINNER",
  examReadinessScore: null,
  confidenceScore: null,
  learningConsistencyScore: null,
  knowledgeRetentionScore: null,
  estimatedPassProbability: null,
  weeklyProgress: null,
  monthlyProgress: null,
  overallLearningTrend: "INSUFFICIENT_DATA",
  totalLearningActivities: 0,
  activeDaysLast28: 0,
  evidenceQuestions: 0,
  examAnalytics: {
    totalExams: 0,
    completedExams: 0,
    passedExams: 0,
    failedExams: 0,
    passRate: null,
    averageScore: null,
    highestScore: null,
    lowestScore: null,
    averageCompletionTimeSeconds: null,
    fastestCompletionTimeSeconds: null,
    slowestCompletionTimeSeconds: null,
    scoreTrend: null,
    passTrend: null,
    recentScores: [],
  },
  timingAnalytics: {
    averageAnswerTimeSeconds: null,
    answerTimeTrendSeconds: null,
    examTimeTrendSeconds: null,
    answerTimingSamples: 0,
    answerTimingScope: "UNAVAILABLE",
    categoryTimings: [],
  },
  progressJourney: {
    lessonsStarted: 0,
    lessonsCompleted: 0,
    lessonRevisitCount: null,
    currentStudyStreak: 0,
    activeToday: false,
    activeDaysLast7: 0,
    activeDaysLast30: 0,
    completedPracticeSessions: 0,
    completedOfficialExams: 0,
    masteredCategories: 0,
    masteredSigns: 0,
  },
  learningPriorities: [],
  strongestCategories: [],
  recommendations: [],
};

function localizedPath(
  pathname: string,
  locale: (typeof locales)[number],
): string {
  if (locale === "en") return pathname;

  const queryIndex = pathname.indexOf("?");
  const route = queryIndex >= 0 ? pathname.slice(0, queryIndex) : pathname;
  const query = queryIndex >= 0 ? pathname.slice(queryIndex) : "";
  return `/${locale}${route === "/" ? "" : route}${query}`;
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function navigate(page: Page, pathname: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await page.goto(pathname, { waitUntil: "domcontentloaded" });
    } catch (error) {
      const isTransientAbort =
        error instanceof Error && error.message.includes("net::ERR_ABORTED");
      if (!isTransientAbort || attempt === 1) throw error;
    }
  }

  throw new Error(`Unable to navigate to ${pathname}`);
}

async function installAnonymousMocks(page: Page) {
  await page.route("**/api/auth/me", (route) =>
    fulfillJson(route, { authenticated: false, user: null }),
  );
  await page.route("**/api/proxy/**", (route) => {
    const pathname = new URL(route.request().url()).pathname;

    if (pathname.endsWith("/api/proxy/home/stats")) {
      return fulfillJson(route, {
        examQuestionCount: 0,
        trafficSignsCount: 0,
        lessonsCount: 1,
        categoriesCount: 0,
        supportedLanguagesCount: 4,
      });
    }
    if (
      pathname.endsWith("/api/proxy/traffic-signs") ||
      pathname.endsWith("/api/proxy/lessons") ||
      pathname.endsWith("/api/proxy/categories")
    ) {
      return fulfillJson(route, []);
    }

    return fulfillJson(route, { message: "Unauthorized" }, 401);
  });
}

async function installAuthenticatedSession(
  context: BrowserContext,
  page: Page,
) {
  const futureExpiration = Math.floor(Date.now() / 1000) + 3_600;
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
    "base64url",
  );
  const payload = Buffer.from(
    JSON.stringify({ sub: qaUser.username, role: "USER", exp: futureExpiration }),
  ).toString("base64url");

  await context.addCookies([
    {
      name: "token",
      value: `${header}.${payload}.quality-assurance`,
      domain: "127.0.0.1",
      path: "/",
      sameSite: "Lax",
      httpOnly: true,
    },
    {
      name: "csrf_token",
      value: "mobile-quality-assurance",
      domain: "127.0.0.1",
      path: "/",
      sameSite: "Lax",
    },
  ]);

  await page.route("**/api/auth/me", (route) => fulfillJson(route, qaUser));
  await page.route("**/api/proxy/**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const method = route.request().method();

    if (pathname.endsWith("/users/me/notifications/unread-count")) {
      return fulfillJson(route, { unreadCount: 2 });
    }
    if (pathname.endsWith("/users/me/notifications/read-all")) {
      return fulfillJson(route, {});
    }
    if (
      pathname.endsWith("/users/me/notifications") &&
      method === "GET"
    ) {
      return fulfillJson(route, [
        {
          id: 7,
          type: "SYSTEM",
          title: "ReadyRoad",
          message: "Mobile notification quality check",
          isRead: false,
          createdAt: "2026-07-29T08:00:00Z",
        },
      ]);
    }
    if (pathname.endsWith("/users/me/progress/overall")) {
      return fulfillJson(route, emptyOverallProgress);
    }
    if (pathname.endsWith("/users/me/progress/intelligence")) {
      return fulfillJson(route, emptyStudentIntelligence);
    }
    if (pathname.endsWith("/users/me/progress/categories")) {
      return fulfillJson(route, { categories: [], overallAccuracy: 0 });
    }
    if (pathname.endsWith("/users/me/analytics/weak-areas")) {
      return fulfillJson(route, {
        weakAreas: [],
        totalPracticedCategories: 0,
        overallAccuracy: null,
      });
    }
    if (pathname.endsWith("/exams/simulations/active")) {
      return fulfillJson(route, { hasActiveExam: false, activeExam: null });
    }
    if (pathname.endsWith("/exams/simulations/history")) {
      return fulfillJson(route, { totalExams: 0, exams: [] });
    }
    if (pathname.endsWith("/sign-quiz/random-practice/history")) {
      return fulfillJson(route, { totalSessions: 0, sessions: [] });
    }
    if (pathname.endsWith("/sign-quiz/exam-history")) {
      return fulfillJson(route, { totalResults: 0, results: [] });
    }
    if (pathname.endsWith("/sign-quiz/practice/history")) {
      return fulfillJson(route, { totalSessions: 0, sessions: [] });
    }
    if (
      pathname.endsWith("/sign-quiz/user-progress") ||
      pathname.endsWith("/traffic-signs")
    ) {
      return fulfillJson(route, []);
    }
    if (pathname.endsWith("/users/me")) {
      return fulfillJson(route, { id: qaUser.userId, ...qaUser });
    }

    return fulfillJson(route, {});
  });
}

async function expectMobileLayout(
  page: Page,
  label: string,
  width: (typeof mobileWidths)[number],
) {
  let metrics:
    | { viewport: number; documentWidth: number; bodyWidth: number }
    | undefined;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.waitForLoadState("domcontentloaded");
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          ),
      );
      metrics = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          viewport: window.innerWidth,
          documentWidth: root.scrollWidth,
          bodyWidth: document.body.scrollWidth,
        };
      });
      break;
    } catch (error) {
      const contextChanged =
        error instanceof Error &&
        /Execution context was destroyed|navigation/i.test(error.message);
      if (!contextChanged || attempt === 1) throw error;
    }
  }

  expect(metrics, `${label} at ${width}px produced no layout metrics`).toBeDefined();

  expect(
    metrics!.documentWidth,
    `${label} at ${width}px document overflow`,
  ).toBeLessThanOrEqual(metrics!.viewport + 1);
  expect(
    metrics!.bodyWidth,
    `${label} at ${width}px body overflow`,
  ).toBeLessThanOrEqual(metrics!.viewport + 1);
}

test.describe("ReadyRoad mobile visual identity", () => {
  test("all public pages remain inside every supported mobile viewport", async ({
    page,
  }) => {
    test.setTimeout(360_000);
    await seedCookieConsent(page);
    await installAnonymousMocks(page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    for (const locale of locales) {
      for (const route of publicRoutes) {
        const pathname = localizedPath(route, locale);
        const response = await navigate(page, pathname);
        expect(response?.status(), pathname).toBeLessThan(400);
        await expect(page.locator("body"), pathname).not.toBeEmpty();

        for (const width of mobileWidths) {
          await expectMobileLayout(page, `${locale} ${route}`, width);
        }
      }
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("protected product pages share a stable mobile layout in every locale", async ({
    context,
    page,
  }) => {
    test.setTimeout(180_000);
    await seedCookieConsent(page);
    await installAuthenticatedSession(context, page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    for (const locale of locales) {
      for (const route of protectedRoutes) {
        const pathname = localizedPath(route, locale);
        const response = await navigate(page, pathname);
        expect(response?.status(), pathname).toBeLessThan(400);
        await expect(page.locator("main"), pathname).toBeVisible();

        for (const width of mobileWidths) {
          await expectMobileLayout(page, `${locale} ${route}`, width);
        }
      }
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("authenticated notifications are visible and functional on every mobile width", async ({
    context,
    page,
  }) => {
    test.setTimeout(90_000);
    await seedCookieConsent(page);
    await installAuthenticatedSession(context, page);

    for (const locale of locales) {
      await navigate(page, localizedPath("/", locale));

      const mobileNotifications = page.getByTestId("mobile-notifications");
      for (const width of mobileWidths) {
        await page.setViewportSize({ width, height: 900 });
        await expect(mobileNotifications).toBeVisible();

        const trigger = mobileNotifications.getByRole("button").first();
        await expect(trigger).toBeVisible();
        await trigger.click();

        const popover = mobileNotifications.getByTestId(
          "notification-popover",
        );
        await expect(popover).toBeVisible();
        const box = await popover.boundingBox();
        expect(box, `${locale} notification panel at ${width}px`).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
        await expectMobileLayout(page, `${locale} notifications`, width);

        await page.keyboard.press("Escape");
        if (await popover.isVisible()) {
          await mobileNotifications.getByRole("button").last().click();
        }
        await expect(popover).toBeHidden();
      }
    }
  });
});
