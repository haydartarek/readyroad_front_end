import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type Route,
  type TestInfo,
} from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const locales = ["en", "nl", "fr", "ar"] as const;
const mobileWidths = [320, 360, 375, 390, 414, 428] as const;
const desktopWidths = [1280, 1366, 1440, 1536, 1920] as const;
const trafficSignsViewports = [
  320,
  360,
  375,
  390,
  393,
  412,
  414,
  428,
  768,
  1024,
  1280,
  1366,
  1440,
  1920,
] as const;
const dashboardProgressViewports = [
  320,
  360,
  375,
  390,
  414,
  428,
  768,
  1024,
  1280,
] as const;

const publicRoutes = [
  "/",
  "/about",
  "/contact",
  "/faq",
  "/lessons",
  "/lessons/les-19",
  "/lessons/les-19/2",
  "/traffic-signs",
  "/traffic-signs/A1b",
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
  "/practice/random",
  "/exam",
  "/exam/results",
  "/assessment",
  "/analytics",
  "/analytics/weak-areas",
  "/analytics/error-patterns",
  "/dashboard?section=weak-areas",
  "/dashboard?section=error-patterns",
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

const trafficSignCatalogFixture = {
  id: 1,
  signCode: "A1b",
  routeCode: "A1b",
  categoryCode: "A",
  exam1TotalQuestions: 10,
  exam1PassingScore: 7,
  imageUrl: "/images/logo.png",
  nameEn: "Dangerous bend to the right",
  nameNl: "Gevaarlijke bocht naar rechts",
  nameFr: "Virage dangereux a droite",
  nameAr: "منعطف خطير إلى اليمين",
  summaryEn: "A dangerous right-hand bend lies ahead.",
  summaryNl: "Er volgt een gevaarlijke bocht naar rechts.",
  summaryFr: "Un virage dangereux a droite se trouve devant vous.",
  summaryAr: "يوجد منعطف خطير إلى اليمين أمامك.",
  descriptionEn: "Warns about a dangerous bend to the right.",
  descriptionNl: "Waarschuwt voor een gevaarlijke bocht naar rechts.",
  descriptionFr: "Avertit d'un virage dangereux a droite.",
  descriptionAr: "تحذر من منعطف خطير إلى اليمين.",
  driverGuidanceEn: "Reduce speed before the bend and keep control.",
  driverGuidanceNl: "Verminder snelheid voor de bocht en behoud de controle.",
  driverGuidanceFr: "Reduisez votre vitesse avant le virage et gardez le controle.",
  driverGuidanceAr: "خفف السرعة قبل المنعطف وحافظ على التحكم بالمركبة.",
  exceptionsEn: ["A supplementary plate may specify the distance."],
  exceptionsNl: ["Een onderbord kan de afstand aangeven."],
  exceptionsFr: ["Un panneau additionnel peut indiquer la distance."],
  exceptionsAr: ["قد تحدد لوحة إضافية المسافة."],
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

interface CategoryProgressFixture {
  categoryCode: string;
  categoryName: string;
  questionsAttempted: number;
  correctAnswers: number;
  accuracyRate: number;
  accuracy: number;
  lastPracticed: null;
}

const longCategoryProgressFixtures: CategoryProgressFixture[] = [
  {
    categoryCode: "INFORMATION",
    categoryName: "Information and Temporary Traffic Signs",
    questionsAttempted: 3,
    correctAnswers: 1,
    accuracyRate: 33.3,
    accuracy: 33.3,
    lastPracticed: null,
  },
  {
    categoryCode: "SUPPLEMENTARY",
    categoryName: "Cyclist & Moped Advisory Signs",
    questionsAttempted: 8,
    correctAnswers: 3,
    accuracyRate: 37.5,
    accuracy: 37.5,
    lastPracticed: null,
  },
  {
    categoryCode: "PARKING",
    categoryName: "Parking and Standing Signs",
    questionsAttempted: 7,
    correctAnswers: 4,
    accuracyRate: 57.1,
    accuracy: 57.1,
    lastPracticed: null,
  },
  {
    categoryCode: "INFO-AR",
    categoryName: "العلامات المعلوماتية والإجراءات المرورية المؤقتة",
    questionsAttempted: 5,
    correctAnswers: 3,
    accuracyRate: 60,
    accuracy: 60,
    lastPracticed: null,
  },
  {
    categoryCode: "INFO-FR",
    categoryName:
      "Signaux d'information et mesures temporaires de circulation",
    questionsAttempted: 6,
    correctAnswers: 4,
    accuracyRate: 66.7,
    accuracy: 66.7,
    lastPracticed: null,
  },
  {
    categoryCode: "INFO-NL",
    categoryName: "Informatieborden en tijdelijke verkeersmaatregelen",
    questionsAttempted: 9,
    correctAnswers: 7,
    accuracyRate: 77.8,
    accuracy: 77.8,
    lastPracticed: null,
  },
];

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
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await page.goto(pathname, { waitUntil: "domcontentloaded" });
    } catch (error) {
      const isTransientAbort =
        error instanceof Error &&
        /net::ERR_ABORTED|net::ERR_NETWORK_IO_SUSPENDED/.test(error.message);
      if (!isTransientAbort || attempt === 2) throw error;
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
    if (pathname.endsWith("/api/proxy/traffic-signs")) {
      return fulfillJson(route, [trafficSignCatalogFixture]);
    }
    if (
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
  categoryProgress: CategoryProgressFixture[] = [],
) {
  const futureExpiration = Math.floor(Date.now() / 1000) + 3_600;
  const authDomain = new URL(
    process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3005",
  ).hostname;
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
      domain: authDomain,
      path: "/",
      sameSite: "Lax",
      httpOnly: true,
    },
    {
      name: "csrf_token",
      value: "mobile-quality-assurance",
      domain: authDomain,
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
      const overallAccuracy =
        categoryProgress.length === 0
          ? 0
          : categoryProgress.reduce(
              (total, category) => total + category.accuracyRate,
              0,
            ) / categoryProgress.length;
      return fulfillJson(route, {
        categories: categoryProgress,
        overallAccuracy,
      });
    }
    if (pathname.endsWith("/users/me/analytics/weak-areas")) {
      return fulfillJson(route, {
        weakAreas: [],
        totalPracticedCategories: 0,
        overallAccuracy: null,
      });
    }
    if (pathname.endsWith("/users/me/analytics/error-patterns")) {
      return fulfillJson(route, []);
    }
    if (pathname.endsWith("/assessment/categories")) {
      return fulfillJson(route, []);
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

async function expectViewportLayout(
  page: Page,
  label: string,
  width: number,
  testInfo: TestInfo,
) {
  type OverflowFinding = {
    component: string;
    selector: string;
    parent: string;
    clientWidth: number;
    scrollWidth: number;
    left: number;
    right: number;
    parentLeft: number | null;
    parentRight: number | null;
    viewport: number;
    reason: string;
    rootCause: string;
  };

  let metrics:
    | {
        viewport: number;
        documentWidth: number;
        bodyWidth: number;
        checkedElements: number;
        horizontalScrollContainers: number;
        findings: OverflowFinding[];
      }
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
        const body = document.body;
        const tolerance = 1;
        const viewport = window.innerWidth;
        const ignoredTags = new Set([
          "SCRIPT",
          "STYLE",
          "META",
          "LINK",
          "NOSCRIPT",
          "PATH",
          "DEFS",
          "CLIPPATH",
          "TITLE",
        ]);

        const describe = (element: Element | null): string => {
          if (!element) return "<none>";
          const testId = element.getAttribute("data-testid");
          if (testId) return `[data-testid="${testId}"]`;
          const id = element.getAttribute("id");
          if (id) return `${element.tagName.toLowerCase()}#${id}`;
          const role = element.getAttribute("role");
          const classes =
            typeof element.className === "string"
              ? element.className
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 3)
                  .map((className) => `.${CSS.escape(className)}`)
                  .join("")
              : "";
          return `${element.tagName.toLowerCase()}${role ? `[role="${role}"]` : ""}${classes}`;
        };

        const selectorFor = (element: Element): string => {
          const testId = element.getAttribute("data-testid");
          if (testId) return `[data-testid="${testId}"]`;
          const id = element.getAttribute("id");
          if (id) return `#${CSS.escape(id)}`;

          const parts: string[] = [];
          let current: Element | null = element;
          while (current && current !== body && parts.length < 5) {
            let part = current.tagName.toLowerCase();
            const currentTestId = current.getAttribute("data-testid");
            if (currentTestId) {
              parts.unshift(`[data-testid="${currentTestId}"]`);
              break;
            }
            const currentId = current.getAttribute("id");
            if (currentId) {
              parts.unshift(`#${CSS.escape(currentId)}`);
              break;
            }
            const parentElement: Element | null = current.parentElement;
            if (parentElement) {
              const siblings = [...parentElement.children].filter(
                (child) => child.tagName === current!.tagName,
              );
              if (siblings.length > 1) {
                part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
              }
            }
            parts.unshift(part);
            current = parentElement;
          }
          return parts.join(" > ");
        };

        const isRendered = (element: Element): boolean => {
          if (
            ignoredTags.has(element.tagName) ||
            element.hasAttribute("hidden") ||
            element.closest("[hidden], [inert], [aria-hidden='true']")
          ) {
            return false;
          }
          const style = getComputedStyle(element);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.visibility === "collapse"
          ) {
            return false;
          }
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        };

        const isHorizontalScroller = (element: Element): boolean => {
          if (element === root || element === body) return false;
          const overflowX = getComputedStyle(element).overflowX;
          return overflowX === "auto" || overflowX === "scroll";
        };

        const nearestHorizontalScroller = (element: Element): Element | null => {
          let current = element.parentElement;
          while (current && current !== body && current !== root) {
            if (isHorizontalScroller(current)) return current;
            current = current.parentElement;
          }
          return null;
        };

        const boundedClippingContainer = (element: Element): Element | null => {
          let current = element.parentElement;
          while (current && current !== body && current !== root) {
            const overflowX = getComputedStyle(current).overflowX;
            if (overflowX === "hidden" || overflowX === "clip") {
              const rect = current.getBoundingClientRect();
              if (
                rect.left >= -tolerance &&
                rect.right <= viewport + tolerance
              ) {
                return current;
              }
            }
            current = current.parentElement;
          }
          return null;
        };

        const rootStyle = getComputedStyle(root);
        const bodyStyle = getComputedStyle(body);
        const modalOpen = Boolean(
          body.querySelector('[role="dialog"][data-state="open"]'),
        );
        const findings: OverflowFinding[] = [];
        let checkedElements = 0;
        let horizontalScrollContainers = 0;

        if (["hidden", "clip"].includes(rootStyle.overflowX) && !modalOpen) {
          findings.push({
            component: "documentElement",
            selector: "html",
            parent: "<none>",
            clientWidth: root.clientWidth,
            scrollWidth: root.scrollWidth,
            left: 0,
            right: root.clientWidth,
            parentLeft: null,
            parentRight: null,
            viewport,
            reason: "global horizontal overflow masking",
            rootCause: `html overflow-x: ${rootStyle.overflowX}`,
          });
        }
        if (["hidden", "clip"].includes(bodyStyle.overflowX) && !modalOpen) {
          findings.push({
            component: "body",
            selector: "body",
            parent: "html",
            clientWidth: body.clientWidth,
            scrollWidth: body.scrollWidth,
            left: 0,
            right: body.getBoundingClientRect().right,
            parentLeft: 0,
            parentRight: root.getBoundingClientRect().right,
            viewport,
            reason: "global horizontal overflow masking",
            rootCause: `body overflow-x: ${bodyStyle.overflowX}`,
          });
        }

        const elements = [...body.querySelectorAll("*")];
        for (const element of elements) {
          if (!isRendered(element)) continue;
          checkedElements += 1;

          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          const parent = element.parentElement;
          const parentRect = parent?.getBoundingClientRect() ?? null;

          if (isHorizontalScroller(element)) {
            horizontalScrollContainers += 1;
            if (rect.left < -tolerance || rect.right > viewport + tolerance) {
              findings.push({
                component: describe(element),
                selector: selectorFor(element),
                parent: describe(parent),
                clientWidth: element.clientWidth,
                scrollWidth: element.scrollWidth,
                left: rect.left,
                right: rect.right,
                parentLeft: parentRect?.left ?? null,
                parentRight: parentRect?.right ?? null,
                viewport,
                reason: "horizontal scroll container exceeds viewport",
                rootCause: `overflow-x:${style.overflowX}; width:${style.width}; min-width:${style.minWidth}`,
              });
            }
            continue;
          }

          const scroller = nearestHorizontalScroller(element);
          if (scroller) {
            const scrollerRect = scroller.getBoundingClientRect();
            if (
              scrollerRect.left >= -tolerance &&
              scrollerRect.right <= viewport + tolerance
            ) {
              continue;
            }
          }

          const clipper = boundedClippingContainer(element);
          if (clipper) {
            continue;
          }

          const outsideViewport =
            rect.left < -tolerance || rect.right > viewport + tolerance;
          const rawInternalOverflow =
            element.clientWidth > 0 &&
            element.scrollWidth > element.clientWidth + tolerance &&
            style.overflowX === "visible";
          const positionedOverflowIsIntentional =
            rawInternalOverflow &&
            [...element.querySelectorAll("*")].some((descendant) => {
              const descendantPosition = getComputedStyle(descendant).position;
              return (
                descendantPosition === "absolute" ||
                descendantPosition === "fixed"
              );
            });
          const internalOverflow =
            rawInternalOverflow && !positionedOverflowIsIntentional;

          if (!outsideViewport && !internalOverflow) continue;

          const rootCause = [
            `display:${style.display}`,
            `width:${style.width}`,
            `min-width:${style.minWidth}`,
            `max-width:${style.maxWidth}`,
            `white-space:${style.whiteSpace}`,
            `overflow-x:${style.overflowX}`,
            `flex-wrap:${style.flexWrap}`,
            `grid-template-columns:${style.gridTemplateColumns}`,
            `position:${style.position}`,
            style.transform !== "none" ? `transform:${style.transform}` : "",
          ]
            .filter(Boolean)
            .join("; ");

          findings.push({
            component: describe(
              element.closest("[data-testid], [role], article, section, form") ??
                element,
            ),
            selector: selectorFor(element),
            parent: describe(parent),
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
            left: rect.left,
            right: rect.right,
            parentLeft: parentRect?.left ?? null,
            parentRight: parentRect?.right ?? null,
            viewport,
            reason: [
              outsideViewport && "element bounds exceed viewport",
              internalOverflow && "element content exceeds its client width",
            ]
              .filter(Boolean)
              .join(" and "),
            rootCause,
          });
        }

        return {
          viewport,
          documentWidth: root.scrollWidth,
          bodyWidth: body.scrollWidth,
          checkedElements,
          horizontalScrollContainers,
          findings,
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

  if (
    metrics!.documentWidth > metrics!.viewport + 1 ||
    metrics!.bodyWidth > metrics!.viewport + 1 ||
    metrics!.findings.length > 0
  ) {
    const safeLabel = label.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 120);
    await page.screenshot({
      path: testInfo.outputPath(`${safeLabel}-${width}px-overflow.png`),
      fullPage: true,
    });
  }

  expect(
    metrics!.documentWidth,
    `${label} at ${width}px document overflow\n${JSON.stringify(metrics, null, 2)}`,
  ).toBeLessThanOrEqual(metrics!.viewport + 1);
  expect(
    metrics!.bodyWidth,
    `${label} at ${width}px body overflow\n${JSON.stringify(metrics, null, 2)}`,
  ).toBeLessThanOrEqual(metrics!.viewport + 1);
  expect(
    metrics!.findings,
    `${label} at ${width}px contains out-of-bounds components\n${JSON.stringify(metrics, null, 2)}`,
  ).toEqual([]);

  return metrics!;
}

test.describe("ReadyRoad mobile visual identity", () => {
  test("dashboard category progress cards stay readable in every language and viewport", async ({
    context,
    page,
  }) => {
    test.setTimeout(180_000);
    await seedCookieConsent(page);
    await installAuthenticatedSession(
      context,
      page,
      longCategoryProgressFixtures,
    );

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    for (const locale of locales) {
      await page.setViewportSize({ width: 320, height: 900 });
      await navigate(page, localizedPath("/dashboard", locale));
      await page.evaluate(() => document.fonts.ready);

      const widget = page.getByTestId("category-progress-widget");
      const cards = widget.getByTestId("category-progress-card");
      await expect(widget).toBeVisible();
      await expect(cards).toHaveCount(longCategoryProgressFixtures.length);

      for (const width of dashboardProgressViewports) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );

        const metrics = await widget.evaluate((element) => {
          const viewport = window.innerWidth;
          const grid = element.querySelector(
            '[data-testid="category-progress-grid"]',
          );
          const cardElements = [
            ...element.querySelectorAll(
              '[data-testid="category-progress-card"]',
            ),
          ];
          const rect = (target: Element) => target.getBoundingClientRect();

          const invalidCards = cardElements.flatMap((card, index) => {
            const cardRect = rect(card);
            const header = card.querySelector(
              '[data-testid="category-progress-header"]',
            );
            const name = card.querySelector(
              '[data-testid="category-progress-name"]',
            );
            const percentage = card.querySelector(
              '[data-testid="category-progress-percentage"]',
            );
            const progress = card.querySelector('[role="progressbar"]');
            const buttons = [...card.querySelectorAll("a")];

            if (!header || !name || !percentage || !progress) {
              return [{ index, reason: "missing required card content" }];
            }

            const headerRect = rect(header);
            const nameRect = rect(name);
            const percentageRect = rect(percentage);
            const progressRect = rect(progress);
            const nameStyle = getComputedStyle(name);
            const buttonOverflow = buttons.some((button) => {
              const buttonRect = rect(button);
              return (
                buttonRect.left < cardRect.left - 1 ||
                buttonRect.right > cardRect.right + 1 ||
                button.scrollWidth > button.clientWidth + 1
              );
            });

            const reasons = [
              cardRect.left < -1 && "card starts outside viewport",
              cardRect.right > viewport + 1 && "card ends outside viewport",
              card.scrollWidth > card.clientWidth + 1 && "card scrolls",
              headerRect.left < cardRect.left - 1 && "header starts outside card",
              headerRect.right > cardRect.right + 1 && "header ends outside card",
              header.scrollWidth > header.clientWidth + 1 && "header scrolls",
              nameRect.left < cardRect.left - 1 && "name starts outside card",
              nameRect.right > cardRect.right + 1 && "name ends outside card",
              nameStyle.whiteSpace === "nowrap" && "name cannot wrap",
              nameStyle.webkitLineClamp !== "2" && "name is not clamped to two lines",
              percentageRect.left < cardRect.left - 1 &&
                "percentage starts outside card",
              percentageRect.right > cardRect.right + 1 &&
                "percentage ends outside card",
              progressRect.left < cardRect.left - 1 &&
                "progress starts outside card",
              progressRect.right > cardRect.right + 1 &&
                "progress ends outside card",
              Math.abs(progressRect.width - headerRect.width) > 1 &&
                "progress does not fill card content width",
              buttonOverflow && "button overflows card",
            ].filter(Boolean);

            return reasons.map((reason) => ({ index, reason }));
          });

          const widgetStyle = getComputedStyle(element);
          const htmlStyle = getComputedStyle(document.documentElement);
          const bodyStyle = getComputedStyle(document.body);

          return {
            viewport,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            widgetWidth: element.getBoundingClientRect().width,
            widgetScrollWidth: element.scrollWidth,
            gridWidth: grid?.getBoundingClientRect().width ?? 0,
            gridScrollWidth: grid?.scrollWidth ?? 0,
            widgetOverflowX: widgetStyle.overflowX,
            htmlOverflowX: htmlStyle.overflowX,
            bodyOverflowX: bodyStyle.overflowX,
            invalidCards,
          };
        });

        expect(metrics, `${locale} dashboard progress at ${width}px`).toEqual({
          viewport: width,
          documentWidth: width,
          bodyWidth: width,
          widgetWidth: expect.any(Number),
          widgetScrollWidth: expect.any(Number),
          gridWidth: expect.any(Number),
          gridScrollWidth: expect.any(Number),
          widgetOverflowX: "visible",
          htmlOverflowX: "visible",
          bodyOverflowX: "visible",
          invalidCards: [],
        });
        expect(metrics.widgetScrollWidth).toBeLessThanOrEqual(
          metrics.widgetWidth + 1,
        );
        expect(metrics.gridScrollWidth).toBeLessThanOrEqual(
          metrics.gridWidth + 1,
        );
      }
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("traffic sign cards remain width-constrained after viewport changes", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await seedCookieConsent(page);
    await installAnonymousMocks(page);

    for (const locale of locales) {
      await page.setViewportSize({ width: 428, height: 900 });
      await navigate(page, localizedPath("/traffic-signs", locale));
      await expect(page.locator(".traffic-sign-card")).toHaveCount(1);

      for (const width of trafficSignsViewports) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => resolve()),
            ),
        );

        const metrics = await page.evaluate(() => {
          const viewport = window.innerWidth;
          const cards = [...document.querySelectorAll(".traffic-sign-card")];
          const grid = cards[0]?.parentElement;
          const measuredElements = [
            document.querySelector("main"),
            document.querySelector("main .container"),
            grid,
            ...cards,
            ...cards.flatMap((card) => [
              card.firstElementChild,
              card.querySelector("img"),
              ...card.querySelectorAll("button"),
            ]),
          ].filter((element): element is Element => element instanceof Element);

          return {
            viewport,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            gridWidth: grid?.getBoundingClientRect().width ?? 0,
            gridScrollWidth: grid?.scrollWidth ?? 0,
            oversizedElements: measuredElements
              .map((element) => {
                const rect = element.getBoundingClientRect();
                return {
                  tag: element.tagName,
                  className: element.className,
                  width: rect.width,
                };
              })
              .filter(({ width: elementWidth }) => elementWidth > viewport + 1),
          };
        });

        expect(metrics, `${locale} at ${width}px`).toEqual({
          viewport: width,
          documentWidth: width,
          bodyWidth: width,
          gridWidth: expect.any(Number),
          gridScrollWidth: expect.any(Number),
          oversizedElements: [],
        });
        expect(
          metrics.gridScrollWidth,
          `${locale} grid overflow at ${width}px`,
        ).toBeLessThanOrEqual(metrics.gridWidth + 1);
      }
    }
  });

  test("all public pages remain inside every supported mobile viewport", async ({
    page,
  }, testInfo) => {
    test.setTimeout(540_000);
    await seedCookieConsent(page);
    await installAnonymousMocks(page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    let checkedElements = 0;
    let checkedCombinations = 0;

    for (const locale of locales) {
      for (const route of publicRoutes) {
        const pathname = localizedPath(route, locale);
        const response = await navigate(page, pathname);
        expect(response?.status(), pathname).toBeLessThan(400);
        await expect(page.locator("body"), pathname).not.toBeEmpty();

        for (const width of mobileWidths) {
          const metrics = await expectViewportLayout(
            page,
            `${locale} ${route}`,
            width,
            testInfo,
          );
          checkedElements += metrics.checkedElements;
          checkedCombinations += 1;
        }
      }
    }

    console.log(
      `Public mobile overflow audit: ${checkedCombinations} combinations, ${checkedElements} rendered elements`,
    );
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("protected product pages share a stable mobile layout in every locale", async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(540_000);
    await seedCookieConsent(page);
    await installAuthenticatedSession(context, page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    let checkedElements = 0;
    let checkedCombinations = 0;

    for (const locale of locales) {
      for (const route of protectedRoutes) {
        const pathname = localizedPath(route, locale);
        const response = await navigate(page, pathname);
        expect(response?.status(), pathname).toBeLessThan(400);
        await expect(page.locator("main"), pathname).toBeVisible();

        for (const width of mobileWidths) {
          const metrics = await expectViewportLayout(
            page,
            `${locale} ${route}`,
            width,
            testInfo,
          );
          checkedElements += metrics.checkedElements;
          checkedCombinations += 1;
        }
      }
    }

    console.log(
      `Protected mobile overflow audit: ${checkedCombinations} combinations, ${checkedElements} rendered elements`,
    );
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("authenticated notifications are visible and functional on every mobile width", async ({
    context,
    page,
  }, testInfo) => {
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
        await expectViewportLayout(
          page,
          `${locale} notifications`,
          width,
          testInfo,
        );

        await page.keyboard.press("Escape");
        if (await popover.isVisible()) {
          await mobileNotifications.getByRole("button").last().click();
        }
        await expect(popover).toBeHidden();
      }
    }
  });

  test("mobile navigation drawer remains contained in every locale and width", async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    await seedCookieConsent(page);
    await installAuthenticatedSession(context, page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    for (const locale of locales) {
      await navigate(page, localizedPath("/", locale));
      await page.waitForLoadState("networkidle");
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );

      for (const width of mobileWidths) {
        await page.setViewportSize({ width, height: 900 });
        const navbar = page.getByTestId("site-navbar");
        const trigger = navbar.locator("button:has(svg.lucide-menu)").first();
        await expect(trigger).toBeVisible();
        await trigger.click();

        const drawer = page.getByTestId("mobile-navigation-dialog");
        await expect(drawer).toBeVisible();
        const drawerRect = await drawer.boundingBox();
        expect(drawerRect, `${locale} drawer at ${width}px`).not.toBeNull();
        expect(drawerRect!.x).toBeGreaterThanOrEqual(-1);
        expect(drawerRect!.x + drawerRect!.width).toBeLessThanOrEqual(width + 1);

        await expectViewportLayout(
          page,
          `${locale} mobile navigation drawer`,
          width,
          testInfo,
        );

        await page.keyboard.press("Escape");
        await expect(drawer).toBeHidden();
        await expect(page.locator('[data-aria-hidden="true"]')).toHaveCount(0);
      }
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("all public pages remain contained across supported desktop widths", async ({
    page,
  }, testInfo) => {
    test.setTimeout(540_000);
    await seedCookieConsent(page);
    await installAnonymousMocks(page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    let checkedElements = 0;
    let checkedCombinations = 0;

    for (const locale of locales) {
      for (const route of publicRoutes) {
        const pathname = localizedPath(route, locale);
        const response = await navigate(page, pathname);
        expect(response?.status(), pathname).toBeLessThan(400);
        await expect(page.locator("body"), pathname).not.toBeEmpty();

        for (const width of desktopWidths) {
          const metrics = await expectViewportLayout(
            page,
            `${locale} ${route} desktop`,
            width,
            testInfo,
          );
          checkedElements += metrics.checkedElements;
          checkedCombinations += 1;
        }
      }
    }

    console.log(
      `Public desktop overflow audit: ${checkedCombinations} combinations, ${checkedElements} rendered elements`,
    );
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("protected product pages remain contained across supported desktop widths", async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(540_000);
    await seedCookieConsent(page);
    await installAuthenticatedSession(context, page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    let checkedElements = 0;
    let checkedCombinations = 0;

    for (const locale of locales) {
      for (const route of protectedRoutes) {
        const pathname = localizedPath(route, locale);
        const response = await navigate(page, pathname);
        expect(response?.status(), pathname).toBeLessThan(400);
        await expect(page.locator("main"), pathname).toBeVisible();

        for (const width of desktopWidths) {
          const metrics = await expectViewportLayout(
            page,
            `${locale} ${route} desktop`,
            width,
            testInfo,
          );
          checkedElements += metrics.checkedElements;
          checkedCombinations += 1;
        }
      }
    }

    console.log(
      `Protected desktop overflow audit: ${checkedCombinations} combinations, ${checkedElements} rendered elements`,
    );
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("desktop navigation stays complete and collision-free in every locale", async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(240_000);
    await seedCookieConsent(page);
    await installAuthenticatedSession(context, page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    for (const locale of locales) {
      await navigate(page, localizedPath("/", locale));

      for (const width of desktopWidths) {
        await page.setViewportSize({ width, height: 1000 });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );

        const navbar = page.getByTestId("site-navbar");
        const desktopNavigation = page.getByTestId("desktop-primary-navigation");
        const actions = page.getByTestId("navbar-actions");
        const hamburger = navbar.locator("button:has(svg.lucide-menu)");
        await expect(navbar).toBeVisible();
        await expect(desktopNavigation).toBeVisible();
        await expect(hamburger).toBeHidden();

        const metrics = await navbar.evaluate((element) => {
          const navigation = element.querySelector(
            '[data-testid="desktop-primary-navigation"]',
          );
          const actionsElement = element.querySelector(
            '[data-testid="navbar-actions"]',
          );
          const links = navigation ? [...navigation.querySelectorAll("a")] : [];
          const navigationRect = navigation?.getBoundingClientRect();
          const actionsRect = actionsElement?.getBoundingClientRect();
          const linkRects = links.map((link) => link.getBoundingClientRect());
          const rows = new Set(linkRects.map((rect) => Math.round(rect.top)));

          return {
            viewport: window.innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            navigationClientWidth: navigation?.clientWidth ?? 0,
            navigationScrollWidth: navigation?.scrollWidth ?? 0,
            navigationRight: navigationRect?.right ?? 0,
            actionsLeft: actionsRect?.left ?? 0,
            linkCount: links.length,
            linkRows: rows.size,
            linksOutsideNavigation: linkRects.some(
              (rect) =>
                !navigationRect ||
                rect.left < navigationRect.left - 1 ||
                rect.right > navigationRect.right + 1,
            ),
            overlapsActions:
              Boolean(navigationRect && actionsRect) &&
              navigationRect!.left < actionsRect!.right - 1 &&
              navigationRect!.right > actionsRect!.left + 1,
          };
        });

        expect(metrics, `${locale} desktop navbar at ${width}px`).toMatchObject({
          viewport: width,
          documentWidth: width,
          bodyWidth: width,
          linkRows: 1,
          linksOutsideNavigation: false,
          overlapsActions: false,
        });
        expect(metrics.linkCount).toBeGreaterThan(0);
        expect(metrics.navigationScrollWidth).toBeLessThanOrEqual(
          metrics.navigationClientWidth + 1,
        );
        await expect(actions).toBeVisible();

        await expectViewportLayout(
          page,
          `${locale} desktop navbar`,
          width,
          testInfo,
        );
      }
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});
