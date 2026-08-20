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
  320, 360, 375, 390, 393, 412, 414, 428, 768, 1024, 1280, 1366, 1440, 1920,
] as const;
const dashboardProgressViewports = [
  320, 360, 375, 390, 414, 428, 768, 1024, 1280, 1920,
] as const;

const localizedInformationCategoryNames = {
  en: "Priority and intersections",
  nl: "Voorrang en kruispunten",
  fr: "Priorité et carrefours",
  ar: "الأولوية والتقاطعات",
} as const;

const approvedHomeHeadlines = {
  en: "RijVia | Prepare for the Belgian driving theory exam with confidence",
  nl: "RijVia | Bereid je voor op het Belgische theorie-examen met vertrouwen",
  fr: "RijVia | Préparez l’examen théorique belge en toute confiance",
  ar: "RijVia | استعد لامتحان السياقة النظري في بلجيكا بثقة",
} as const;

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
  driverGuidanceFr:
    "Reduisez votre vitesse avant le virage et gardez le controle.",
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
  categoryNameEn?: string;
  categoryNameNl?: string;
  categoryNameFr?: string;
  categoryNameAr?: string;
  questionsAttempted: number;
  correctAnswers: number;
  accuracyRate: number;
  accuracy: number;
  lastPracticed: null;
}

const longCategoryProgressFixtures: CategoryProgressFixture[] = [
  {
    categoryCode: "TH01",
    categoryName: "Priority and intersections",
    categoryNameEn: localizedInformationCategoryNames.en,
    categoryNameNl: localizedInformationCategoryNames.nl,
    categoryNameFr: localizedInformationCategoryNames.fr,
    categoryNameAr: localizedInformationCategoryNames.ar,
    questionsAttempted: 3,
    correctAnswers: 1,
    accuracyRate: 33.3,
    accuracy: 33.3,
    lastPracticed: null,
  },
  {
    categoryCode: "TH02",
    categoryName: "Speed, roads and distances",
    categoryNameEn: "Speed, roads and distances",
    categoryNameNl: "Snelheid, wegen en afstanden",
    categoryNameFr: "Vitesse, routes et distances",
    categoryNameAr: "السرعة والطرق والمسافات",
    questionsAttempted: 8,
    correctAnswers: 3,
    accuracyRate: 37.5,
    accuracy: 37.5,
    lastPracticed: null,
  },
  {
    categoryCode: "TH03",
    categoryName: "Manoeuvres, overtaking and lanes",
    categoryNameEn: "Manoeuvres, overtaking and lanes",
    categoryNameNl: "Manoeuvres, inhalen en rijstroken",
    categoryNameFr: "Manœuvres, dépassement et voies",
    categoryNameAr: "المناورات والتجاوز والمسارات",
    questionsAttempted: 42,
    correctAnswers: 21,
    accuracyRate: 50,
    accuracy: 50,
    lastPracticed: null,
  },
  {
    categoryCode: "TH04",
    categoryName: "Parking, stopping and standing",
    categoryNameEn: "Parking, stopping and standing",
    categoryNameNl: "Parkeren, stoppen en stilstaan",
    categoryNameFr: "Stationnement, arrêt et immobilisation",
    categoryNameAr: "الوقوف والتوقف والاصطفاف",
    questionsAttempted: 7,
    correctAnswers: 4,
    accuracyRate: 57.1,
    accuracy: 57.1,
    lastPracticed: null,
  },
  {
    categoryCode: "TH05",
    categoryName: "Signs, signals and traffic control",
    categoryNameEn: "Signs, signals and traffic control",
    categoryNameNl: "Verkeersborden, signalen en verkeersregeling",
    categoryNameFr: "Panneaux, signaux et gestion de la circulation",
    categoryNameAr: "العلامات والإشارات وتنظيم المرور",
    questionsAttempted: 5,
    correctAnswers: 3,
    accuracyRate: 60,
    accuracy: 60,
    lastPracticed: null,
  },
  {
    categoryCode: "TH06",
    categoryName: "Road users and public transport",
    categoryNameEn: "Road users and public transport",
    categoryNameNl: "Weggebruikers en openbaar vervoer",
    categoryNameFr: "Usagers de la route et transports publics",
    categoryNameAr: "مستخدمو الطريق والنقل العام",
    questionsAttempted: 6,
    correctAnswers: 4,
    accuracyRate: 66.7,
    accuracy: 66.7,
    lastPracticed: null,
  },
  {
    categoryCode: "TH07",
    categoryName: "Vehicle and technical safety",
    categoryNameEn: "Vehicle and technical safety",
    categoryNameNl: "Voertuig en technische veiligheid",
    categoryNameFr: "Véhicule et sécurité technique",
    categoryNameAr: "المركبة والسلامة التقنية",
    questionsAttempted: 9,
    correctAnswers: 7,
    accuracyRate: 77.8,
    accuracy: 77.8,
    lastPracticed: null,
  },
  {
    categoryCode: "TH08",
    categoryName: "Driver, law and safety",
    categoryNameEn: "Driver, law and safety",
    categoryNameNl: "Bestuurder, wetgeving en veiligheid",
    categoryNameFr: "Conducteur, législation et sécurité",
    categoryNameAr: "السائق والقانون والسلامة",
    questionsAttempted: 32,
    correctAnswers: 18,
    accuracyRate: 56.3,
    accuracy: 56.3,
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

async function waitForDocumentContainment(
  page: Page,
  width: number,
  label: string,
) {
  await expect
    .poll(
      () =>
        page.evaluate(() => ({
          viewport: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
        })),
      {
        message: `${label} did not settle inside ${width}px`,
        timeout: 5_000,
      },
    )
    .toEqual({
      viewport: width,
      documentWidth: width,
      bodyWidth: width,
    });
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
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: qaUser.username,
      role: "USER",
      exp: futureExpiration,
    }),
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
    if (pathname.endsWith("/users/me/notifications") && method === "GET") {
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
    if (pathname.endsWith("/users/me/progress/theory-timeouts")) {
      return fulfillJson(route, { totalTimeouts: 0, items: [] });
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

        const nearestHorizontalScroller = (
          element: Element,
        ): Element | null => {
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
              element.closest(
                "[data-testid], [role], article, section, form",
              ) ?? element,
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

  expect(
    metrics,
    `${label} at ${width}px produced no layout metrics`,
  ).toBeDefined();

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
  }, testInfo) => {
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
      await expect(
        cards.first().getByTestId("category-progress-name"),
      ).toHaveText(localizedInformationCategoryNames[locale]);

      for (const width of dashboardProgressViewports) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );
        await waitForDocumentContainment(
          page,
          width,
          `${locale} dashboard progress`,
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
            const icon = card.querySelector(
              '[data-testid="category-progress-icon"]',
            );
            const trend = card.querySelector(
              '[data-testid="category-progress-trend"]',
            );
            const counts = card.querySelector(
              '[data-testid="category-progress-counts"]',
            );
            const actions = card.querySelector(
              '[data-testid="category-progress-actions"]',
            );
            const buttons = [...card.querySelectorAll("a")];

            if (
              !header ||
              !name ||
              !percentage ||
              !progress ||
              !icon ||
              !trend ||
              !counts ||
              !actions
            ) {
              return [
                {
                  index,
                  category: name?.textContent?.trim() ?? "unknown",
                  reason: "missing required card content",
                  cardWidth: cardRect.width,
                  cardLeft: cardRect.left,
                  cardRight: cardRect.right,
                  headerWidth: 0,
                  percentageLeft: 0,
                  percentageRight: 0,
                  buttonWidths: buttons.map((button) => rect(button).width),
                },
              ];
            }

            const headerRect = rect(header);
            const nameRect = rect(name);
            const percentageRect = rect(percentage);
            const progressRect = rect(progress);
            const nameStyle = getComputedStyle(name);
            const boundedElements = [
              ["icon", icon],
              ["trend", trend],
              ["counts", counts],
              ["actions", actions],
            ] as const;
            const buttonOverflow = buttons.some((button) => {
              const buttonRect = rect(button);
              return (
                buttonRect.left < cardRect.left - 1 ||
                buttonRect.right > cardRect.right + 1 ||
                button.scrollWidth > button.clientWidth + 1
              );
            });
            const boundedOverflow = boundedElements.flatMap(
              ([elementName, target]) => {
                const targetRect = rect(target);
                return targetRect.left < cardRect.left - 1 ||
                  targetRect.right > cardRect.right + 1 ||
                  target.scrollWidth > target.clientWidth + 1
                  ? [`${elementName} overflows card`]
                  : [];
              },
            );

            const reasons = [
              cardRect.left < -1 && "card starts outside viewport",
              cardRect.right > viewport + 1 && "card ends outside viewport",
              card.scrollWidth > card.clientWidth + 1 && "card scrolls",
              headerRect.left < cardRect.left - 1 &&
                "header starts outside card",
              headerRect.right > cardRect.right + 1 &&
                "header ends outside card",
              header.scrollWidth > header.clientWidth + 1 && "header scrolls",
              nameRect.left < cardRect.left - 1 && "name starts outside card",
              nameRect.right > cardRect.right + 1 && "name ends outside card",
              nameStyle.whiteSpace === "nowrap" && "name cannot wrap",
              nameStyle.webkitLineClamp !== "2" &&
                "name is not clamped to two lines",
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
              ...boundedOverflow,
            ].filter((reason): reason is string => Boolean(reason));

            return reasons.map((reason) => ({
              index,
              category: name.textContent?.trim() ?? "unknown",
              reason,
              cardWidth: cardRect.width,
              cardLeft: cardRect.left,
              cardRight: cardRect.right,
              headerWidth: headerRect.width,
              percentageLeft: percentageRect.left,
              percentageRight: percentageRect.right,
              buttonWidths: buttons.map((button) => rect(button).width),
            }));
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
            gridColumnCount: grid
              ? getComputedStyle(grid).gridTemplateColumns.split(" ").length
              : 0,
            headerColumnCounts: cardElements.map((card) => {
              const header = card.querySelector(
                '[data-testid="category-progress-header"]',
              );
              return header
                ? getComputedStyle(header).gridTemplateColumns.split(" ").length
                : 0;
            }),
            widgetOverflowX: widgetStyle.overflowX,
            htmlOverflowX: htmlStyle.overflowX,
            bodyOverflowX: bodyStyle.overflowX,
            invalidCards,
          };
        });

        if (metrics.invalidCards.length > 0) {
          await page.screenshot({
            path: testInfo.outputPath(
              `dashboard-progress-${locale}-${width}px-overflow.png`,
            ),
            fullPage: true,
          });
        }

        expect(metrics, `${locale} dashboard progress at ${width}px`).toEqual({
          viewport: width,
          documentWidth: width,
          bodyWidth: width,
          widgetWidth: expect.any(Number),
          widgetScrollWidth: expect.any(Number),
          gridWidth: expect.any(Number),
          gridScrollWidth: expect.any(Number),
          gridColumnCount: expect.any(Number),
          headerColumnCounts: expect.any(Array),
          widgetOverflowX: "visible",
          htmlOverflowX: "visible",
          bodyOverflowX: "visible",
          invalidCards: [],
        });
        const expectedGridColumns =
          width >= 1280 || (width >= 768 && width < 1024) ? 2 : 1;
        expect(metrics.gridColumnCount).toBe(expectedGridColumns);
        expect(metrics.headerColumnCounts).toEqual(
          Array(longCategoryProgressFixtures.length).fill(width >= 768 ? 2 : 1),
        );
        expect(metrics.widgetScrollWidth).toBeLessThanOrEqual(
          metrics.widgetWidth + 1,
        );
        expect(metrics.gridScrollWidth).toBeLessThanOrEqual(
          metrics.gridWidth + 1,
        );
      }

      await expect(widget.getByText("TH01", { exact: true })).toHaveCount(0);
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("dashboard separates theory from sign performance and avoids repeated category scores", async ({
    context,
    page,
  }) => {
    await seedCookieConsent(page);
    await installAuthenticatedSession(context, page);
    const theoryCategories = longCategoryProgressFixtures.slice(0, 3);

    await page.route("**/api/proxy/users/me/progress/overall", (route) =>
      fulfillJson(route, {
        ...emptyOverallProgress,
        strongCategories: [
          {
            categoryCode: "TH02",
            categoryName: "Speed, roads and distances",
            categoryNameEn: "Speed, roads and distances",
            categoryNameNl: "Snelheid, wegen en afstanden",
            categoryNameFr: "Vitesse, routes et distances",
            categoryNameAr: "السرعة والطرق والمسافات",
            attempted: 20,
            accuracy: 90,
          },
        ],
      }),
    );
    await page.route("**/api/proxy/users/me/progress/categories", (route) =>
      fulfillJson(route, {
        categories: theoryCategories,
        overallAccuracy: 40,
      }),
    );
    await page.route("**/api/proxy/users/me/analytics/weak-areas", (route) =>
      fulfillJson(route, {
        weakAreas: [
          {
            categoryId: 1,
            categoryCode: "TH01",
            categoryName: "Priority and intersections",
            categoryNameEn: "Priority and intersections",
            categoryNameNl: "Voorrang en kruispunten",
            categoryNameFr: "Priorite et intersections",
            categoryNameAr: "الاولوية والتقاطعات",
            currentAccuracy: 33.3,
            targetAccuracy: 80,
            accuracyGap: 46.7,
            recommendedQuestions: 10,
            recommendedDifficulty: "MEDIUM",
            estimatedTimeMinutes: 15,
            priority: 1,
            questionsAttempted: 3,
          },
        ],
        totalPracticedCategories: 3,
        overallAccuracy: 40,
      }),
    );

    await page.setViewportSize({ width: 1280, height: 1200 });
    await navigate(page, "/dashboard");
    const main = page.getByRole("main");
    const widget = page.getByTestId("category-progress-widget");

    await expect(widget.getByTestId("category-progress-card")).toHaveCount(1);
    await expect(widget).toContainText("Manoeuvres, overtaking and lanes");
    await expect(main.getByText(/^TH0[1-8]$/)).toHaveCount(0);
    await expect(widget.locator('a[href="/exam"]')).toBeVisible();
    await expect(widget.locator('a[href="/lessons"]')).toBeVisible();
    await expect(widget.locator('a[href^="/practice/TH"]')).toHaveCount(0);

    const headings = [
      "Recent Activity",
      "Theoretical Exam Performance",
      "Traffic Sign Practice Performance",
      "Weak Areas",
      "Strong Areas",
      "Learning overview",
    ];
    const tops: number[] = [];
    for (const heading of headings) {
      const candidates = main.getByText(heading, { exact: true });
      let visibleTop: number | null = null;
      for (let index = 0; index < (await candidates.count()); index += 1) {
        const candidate = candidates.nth(index);
        if (await candidate.isVisible()) {
          visibleTop = (await candidate.boundingBox())?.y ?? null;
          break;
        }
      }
      expect(visibleTop, `${heading} has a visible dashboard heading`).not.toBeNull();
      tops.push(visibleTop ?? -1);
    }
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
  });

  test("affected dashboard sections preserve responsive RTL and LTR containment", async ({
    context,
    page,
  }) => {
    test.setTimeout(180_000);
    await seedCookieConsent(page);
    await installAuthenticatedSession(context, page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const serverErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 500) {
        serverErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    const routes = [
      "/dashboard",
      "/dashboard?section=weak-areas",
      "/dashboard?section=error-patterns",
      "/dashboard?section=exam-results",
      "/dashboard?section=profile",
    ];

    for (const locale of locales) {
      for (const route of routes) {
        await page.setViewportSize({ width: 390, height: 1000 });
        await navigate(page, localizedPath(route, locale));
        await expect(page.getByRole("main")).toBeVisible();

        for (const width of [390, 768, 1280, 1920]) {
          await page.setViewportSize({ width, height: 1000 });
          await page.evaluate(
            () =>
              new Promise<void>((resolve) =>
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => resolve()),
                ),
              ),
          );

          const dimensions = await page.evaluate(() => ({
            viewport: window.innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            dir: document.documentElement.dir,
          }));
          expect(dimensions.documentWidth).toBeLessThanOrEqual(width);
          expect(dimensions.bodyWidth).toBeLessThanOrEqual(width);
          expect(dimensions.dir).toBe(locale === "ar" ? "rtl" : "ltr");

          const sidebar = page.locator("aside");
          if (width >= 1280) {
            await expect(sidebar).toBeVisible();
          } else {
            await expect(sidebar).toBeHidden();
          }
        }
      }
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(serverErrors).toEqual([]);
  });

  test("approved homepage introduction is rendered once in every locale", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await seedCookieConsent(page);
    await installAnonymousMocks(page);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    for (const locale of locales) {
      await navigate(page, localizedPath("/", locale));
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toHaveText(approvedHomeHeadlines[locale]);

      for (const width of [390, 1280, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        const widths = await page.evaluate(() => ({
          viewport: window.innerWidth,
          document: document.documentElement.scrollWidth,
          body: document.body.scrollWidth,
        }));
        expect(widths.document).toBeLessThanOrEqual(widths.viewport);
        expect(widths.body).toBeLessThanOrEqual(widths.viewport);
        await expect(heading).toBeVisible();
      }
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("leaving an incomplete theory exam abandons it without stale result UI", async ({
    context,
    page,
  }) => {
    await seedCookieConsent(page);
    await installAuthenticatedSession(context, page);

    const exam = {
      examId: 42,
      startedAt: "2026-08-09T00:00:00Z",
      expiresAt: "2026-08-09T01:00:00Z",
      questions: [1, 2, 3, 4].map((questionId) => ({
        questionId,
        questionOrder: questionId,
        questionTextEn: `Question ${questionId}`,
        questionTextNl: `Vraag ${questionId}`,
        questionTextFr: `Question ${questionId}`,
        questionTextAr: `السؤال ${questionId}`,
        difficultyLevel: "MEDIUM",
        options: [
          {
            optionId: questionId * 10 + 1,
            optionTextEn: "Answer A",
            optionTextNl: "Antwoord A",
            optionTextFr: "Réponse A",
            optionTextAr: "الإجابة أ",
          },
          {
            optionId: questionId * 10 + 2,
            optionTextEn: "Answer B",
            optionTextNl: "Antwoord B",
            optionTextFr: "Réponse B",
            optionTextAr: "الإجابة ب",
          },
        ],
      })),
    };
    let abandoned = false;
    await page.route("**/api/proxy/exams/simulations/active", (route) =>
      fulfillJson(route, { hasActiveExam: true, activeExam: exam }),
    );
    await page.route("**/api/proxy/exams/simulations/42/abandon", (route) => {
      abandoned = true;
      return fulfillJson(route, {});
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await navigate(page, "/ar/exam/42");
    await expect(page.getByTestId("exam-question-title")).toHaveText(
      "السؤال 1",
    );
    await expect(page.getByTestId("exam-shell-header")).toHaveCount(0);
    await expect(page.getByTestId("exam-mobile-difficulty")).toHaveText(
      "متوسط",
    );

    await page.getByRole("button", { name: /إنهاء الامتحان/ }).click();
    await expect(page.getByRole("dialog")).toContainText(
      "لن تُحتسب ضمن نتائجك أو إحصاءاتك",
    );
    await page.getByRole("button", { name: /مغادرة الامتحان/ }).click();
    await expect.poll(() => abandoned).toBe(true);
    await expect(page).toHaveURL(/\/ar\/exam$/);
  });

  test("theory exam keeps timer, progress and constrained media in one responsive flow", async ({
    context,
    page,
  }) => {
    test.setTimeout(180_000);
    await seedCookieConsent(page);
    await installAuthenticatedSession(context, page);

    const exam = {
      examId: 42,
      startedAt: "2026-08-09T00:00:00Z",
      expiresAt: "2026-08-09T01:00:00Z",
      questions: [
        {
          questionId: 1,
          questionOrder: 1,
          questionTextEn: "Who has priority at this intersection?",
          questionTextNl: "Wie heeft voorrang op dit kruispunt?",
          questionTextFr: "Qui a la priorité à ce carrefour ?",
          questionTextAr: "من له الأولوية عند هذا التقاطع؟",
          difficultyLevel: "MEDIUM",
          imageUrl: "/images/logo.png",
          options: [
            {
              optionId: 11,
              optionTextEn: "Vehicle A",
              optionTextNl: "Voertuig A",
              optionTextFr: "Véhicule A",
              optionTextAr: "المركبة أ",
            },
            {
              optionId: 12,
              optionTextEn: "Vehicle B",
              optionTextNl: "Voertuig B",
              optionTextFr: "Véhicule B",
              optionTextAr: "المركبة ب",
            },
          ],
        },
      ],
    };
    await page.route("**/api/proxy/exams/simulations/active", (route) =>
      fulfillJson(route, { hasActiveExam: true, activeExam: exam }),
    );

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

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

    for (const locale of locales) {
      for (const viewport of viewports) {
        const { width } = viewport;
        await page.setViewportSize(viewport);
        await navigate(page, localizedPath("/exam/42", locale));
        await expect(page.getByTestId("exam-question-title")).toBeVisible();
        await expect(page.getByTestId("exam-shell-header")).toHaveCount(0);
        await expect(page.getByTestId("exam-actions")).toBeVisible();

        const measurements = await page.evaluate(() => {
          const status = document.querySelector<HTMLElement>(
            '[data-testid="exam-status-card"]',
          );
          const mainCard = document.querySelector<HTMLElement>(
            '[data-testid="exam-main-card"]',
          );
          const image = document.querySelector<HTMLElement>(
            '[data-testid="exam-question-image"]',
          );
          const content = document.querySelector<HTMLElement>(
            '[data-testid="exam-question-content"]',
          );
          if (!status || !mainCard || !image || !content) return null;
          const statusRect = status.getBoundingClientRect();
          const mainCardRect = mainCard.getBoundingClientRect();
          const imageRect = image.getBoundingClientRect();
          const contentRect = content.getBoundingClientRect();
          const radius = Number.parseFloat(getComputedStyle(image).borderRadius);
          return {
            viewport: window.innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            statusAfterCard: statusRect.top >= mainCardRect.bottom - 1,
            imageWidth: imageRect.width,
            imageRadius: radius,
            imageInsideViewport:
              imageRect.left >= -1 && imageRect.right <= window.innerWidth + 1,
            sideBySide:
              imageRect.right <= contentRect.left + 1 ||
              contentRect.right <= imageRect.left + 1,
            stacked: contentRect.top >= imageRect.bottom - 1,
          };
        });

        expect(measurements, `${locale} exam at ${width}px`).not.toBeNull();
        expect(measurements?.documentWidth).toBeLessThanOrEqual(width);
        expect(measurements?.bodyWidth).toBeLessThanOrEqual(width);
        expect(measurements?.statusAfterCard).toBe(true);
        expect(measurements?.imageInsideViewport).toBe(true);
        expect(measurements?.imageWidth).toBeLessThanOrEqual(760);
        expect(measurements?.imageRadius).toBeLessThanOrEqual(8);
        if (width >= 1024) {
          expect(measurements?.sideBySide).toBe(true);
        } else {
          expect(measurements?.stacked).toBe(true);
        }
      }
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("dashboard statistic cards use a consistent mobile content order", async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
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

      const statCards = page.getByTestId("dashboard-stat-card");
      await expect(statCards).toHaveCount(8);

      for (const width of mobileWidths) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );
        await waitForDocumentContainment(
          page,
          width,
          `${locale} dashboard statistics`,
        );

        const metrics = await statCards.evaluateAll((cards) => {
          const viewport = window.innerWidth;
          const rect = (target: Element) => target.getBoundingClientRect();
          const centerX = (target: DOMRect) => target.left + target.width / 2;
          const invalidCards = cards.flatMap((card, index) => {
            const cardRect = rect(card);
            const icon = card.querySelector(
              '[data-testid="dashboard-stat-icon"]',
            );
            const label = card.querySelector(
              '[data-testid="dashboard-stat-label"]',
            );
            const value = card.querySelector(
              '[data-testid="dashboard-stat-value"]',
            );

            if (!icon || !label || !value) {
              return [
                {
                  index,
                  kind: card.getAttribute("data-stat-kind"),
                  reason: "missing icon, label, or value",
                },
              ];
            }

            const iconRect = rect(icon);
            const labelRect = rect(label);
            const valueRect = rect(value);
            const parts = [
              ["icon", iconRect],
              ["label", labelRect],
              ["value", valueRect],
            ] as const;
            const reasons = [
              cardRect.left < -1 && "card starts outside viewport",
              cardRect.right > viewport + 1 && "card ends outside viewport",
              card.scrollWidth > card.clientWidth + 1 && "card scrolls",
              Math.abs(centerX(iconRect) - centerX(cardRect)) > 1 &&
                "icon is not centered",
              Math.abs(centerX(labelRect) - centerX(cardRect)) > 1 &&
                "label is not centered",
              Math.abs(centerX(valueRect) - centerX(cardRect)) > 1 &&
                "value is not centered",
              iconRect.bottom > labelRect.top + 1 && "icon is not before label",
              labelRect.bottom > valueRect.top + 1 &&
                "label is not before value",
              ...parts.flatMap(([part, partRect]) =>
                partRect.left < cardRect.left - 1 ||
                partRect.right > cardRect.right + 1
                  ? [`${part} leaves card bounds`]
                  : [],
              ),
            ].filter((reason): reason is string => Boolean(reason));

            return reasons.map((reason) => ({
              index,
              kind: card.getAttribute("data-stat-kind"),
              reason,
              cardLeft: cardRect.left,
              cardRight: cardRect.right,
              iconCenter: centerX(iconRect),
              labelCenter: centerX(labelRect),
              valueCenter: centerX(valueRect),
            }));
          });

          return {
            viewport,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            invalidCards,
          };
        });

        if (
          metrics.documentWidth > width ||
          metrics.bodyWidth > width ||
          metrics.invalidCards.length > 0
        ) {
          await page.screenshot({
            path: testInfo.outputPath(
              `dashboard-stat-cards-${locale}-${width}px.png`,
            ),
            fullPage: true,
          });
        }

        expect(metrics, `${locale} dashboard statistics at ${width}px`).toEqual(
          {
            viewport: width,
            documentWidth: width,
            bodyWidth: width,
            invalidCards: [],
          },
        );
      }

      await page.setViewportSize({ width: 1280, height: 900 });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );

      const desktopOrder = await statCards.evaluateAll((cards) =>
        cards.flatMap((card, index) => {
          const icon = card.querySelector(
            '[data-testid="dashboard-stat-icon"]',
          );
          const label = card.querySelector(
            '[data-testid="dashboard-stat-label"]',
          );
          const value = card.querySelector(
            '[data-testid="dashboard-stat-value"]',
          );
          if (!icon || !label || !value) return [`card ${index} is incomplete`];

          const iconRect = icon.getBoundingClientRect();
          const labelRect = label.getBoundingClientRect();
          const valueRect = value.getBoundingClientRect();
          const isSummary = card.getAttribute("data-stat-kind") === "summary";

          if (isSummary) {
            return Math.abs(iconRect.top - valueRect.top) <= 1 &&
              labelRect.top >= Math.max(iconRect.bottom, valueRect.bottom) - 1
              ? []
              : [`summary card ${index} changed desktop order`];
          }

          return iconRect.bottom <= valueRect.top + 1 &&
            valueRect.bottom <= labelRect.top + 1
            ? []
            : [`activity card ${index} changed desktop order`];
        }),
      );

      expect(desktopOrder, `${locale} dashboard statistics at 1280px`).toEqual(
        [],
      );
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("recent activity cards use a clear vertical mobile hierarchy", async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    await seedCookieConsent(page);
    await installAuthenticatedSession(context, page);

    await page.route("**/api/proxy/exams/simulations/history", (route) =>
      fulfillJson(route, {
        totalExams: 2,
        exams: [
          {
            examId: 101,
            startedAt: "2026-07-30T08:00:00Z",
            completedAt: "2026-07-30T08:30:00Z",
            status: "COMPLETED",
            totalQuestions: 50,
            correctAnswers: 43,
            scorePercentage: 86,
            passed: true,
          },
          {
            examId: 102,
            startedAt: "2026-07-29T08:00:00Z",
            completedAt: "2026-07-29T08:30:00Z",
            status: "COMPLETED",
            totalQuestions: 50,
            correctAnswers: 19,
            scorePercentage: 38,
            passed: false,
          },
        ],
      }),
    );
    await page.route("**/api/proxy/exams/simulations/active", (route) =>
      fulfillJson(route, {
        hasActiveExam: true,
        activeExam: {
          examId: 103,
          startedAt: "2026-07-31T08:00:00Z",
          totalQuestions: 50,
        },
      }),
    );
    await page.route(
      "**/api/proxy/sign-quiz/random-practice/history",
      (route) =>
        fulfillJson(route, {
          totalSessions: 1,
          sessions: [
            {
              sessionId: 201,
              status: "COMPLETED",
              totalQuestions: 50,
              answeredCount: 50,
              correctAnswers: 0,
              wrongAnswers: 50,
              unanswered: 0,
              scorePercentage: 0,
              passed: false,
              passingScore: 41,
              startedAt: "2026-07-28T08:00:00Z",
              completedAt: "2026-07-28T08:30:00Z",
            },
          ],
        }),
    );
    await page.route("**/api/proxy/sign-quiz/exam-history", (route) =>
      fulfillJson(route, { totalResults: 0, results: [] }),
    );
    await page.route("**/api/proxy/sign-quiz/practice/history", (route) =>
      fulfillJson(route, {
        totalSessions: 1,
        sessions: [
          {
            sessionId: 301,
            signCode: "A1a",
            nameNl: "Gevaarlijke bocht naar links",
            nameEn: "Dangerous bend to the left",
            nameFr: "Virage dangereux vers la gauche",
            nameAr: "منعطف خطر نحو اليسار",
            status: "IN_PROGRESS",
            totalQuestions: 8,
            answeredCount: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            scorePercentage: 0,
            passed: false,
            startedAt: "2026-07-30T10:00:00Z",
          },
        ],
      }),
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

      const cards = page.getByTestId("recent-activity-card");
      await expect(cards).toHaveCount(3);

      for (const width of [320, 360, 375, 390, 428] as const) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );
        await waitForDocumentContainment(
          page,
          width,
          `${locale} recent activity`,
        );

        const metrics = await cards.evaluateAll((activityCards) => {
          const viewport = window.innerWidth;
          const centerX = (target: DOMRect) => target.left + target.width / 2;
          const invalidCards = activityCards.flatMap((card, index) => {
            const cardRect = card.getBoundingClientRect();
            const parts = [
              card.querySelector('[data-testid="recent-activity-icon"]'),
              card.querySelector('[data-testid="recent-activity-name"]'),
              card.querySelector('[data-testid="recent-activity-meta"]'),
              card.querySelector('[data-testid="recent-activity-score"]'),
              card.querySelector('[data-testid="recent-activity-status"]'),
              card.querySelector('[data-testid="recent-activity-action"]'),
            ].filter((part): part is Element => Boolean(part));
            const name = card.querySelector(
              '[data-testid="recent-activity-name"]',
            );
            const action = card.querySelector(
              '[data-testid="recent-activity-action"]',
            );

            if (!name || !action || parts.length < 5) {
              return [{ index, reason: "activity content is incomplete" }];
            }

            const partRects = parts.map((part) => part.getBoundingClientRect());
            const nameStyle = getComputedStyle(name);
            const actionRect = action.getBoundingClientRect();
            const reasons = [
              cardRect.left < -1 && "card starts outside viewport",
              cardRect.right > viewport + 1 && "card ends outside viewport",
              card.scrollWidth > card.clientWidth + 1 && "card scrolls",
              nameStyle.whiteSpace === "nowrap" && "name cannot wrap",
              nameStyle.webkitLineClamp !== "2" &&
                "name is not limited to two readable lines",
              actionRect.width < cardRect.width - 34 &&
                "action is not near full width",
              ...partRects.flatMap((partRect, partIndex) => {
                const findings: string[] = [];
                if (
                  partRect.left < cardRect.left - 1 ||
                  partRect.right > cardRect.right + 1
                ) {
                  findings.push(`part ${partIndex} leaves card bounds`);
                }
                if (Math.abs(centerX(partRect) - centerX(cardRect)) > 1) {
                  findings.push(`part ${partIndex} is not centered`);
                }
                if (
                  partIndex > 0 &&
                  partRects[partIndex - 1].bottom > partRect.top + 1
                ) {
                  findings.push(`part ${partIndex} is out of vertical order`);
                }
                return findings;
              }),
            ].filter((reason): reason is string => Boolean(reason));

            return reasons.map((reason) => ({
              index,
              reason,
              cardLeft: cardRect.left,
              cardRight: cardRect.right,
              cardWidth: cardRect.width,
              actionWidth: actionRect.width,
            }));
          });

          return {
            viewport,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            invalidCards,
          };
        });

        if (
          metrics.documentWidth > width ||
          metrics.bodyWidth > width ||
          metrics.invalidCards.length > 0
        ) {
          await page.screenshot({
            path: testInfo.outputPath(
              `recent-activity-${locale}-${width}px.png`,
            ),
            fullPage: true,
          });
        }

        expect(metrics, `${locale} recent activity at ${width}px`).toEqual({
          viewport: width,
          documentWidth: width,
          bodyWidth: width,
          invalidCards: [],
        });
      }

      await page.setViewportSize({ width: 1280, height: 900 });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      await expect(cards.first()).toHaveCSS("flex-direction", "row");
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("dashboard error summary cards use a centered mobile hierarchy", async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    await seedCookieConsent(page);
    await installAuthenticatedSession(context, page);
    await page.route(
      "**/api/proxy/users/me/analytics/error-patterns*",
      (route) =>
        fulfillJson(route, [
          {
            patternType: "SIGN_CONFUSION",
            count: 12,
            previousCount: 16,
            currentCount: 12,
            delta: -4,
            trend: "IMPROVED",
            recentAttemptsCount: 2,
            lastCalculatedAt: "2026-08-05T12:00:00Z",
            percentage: 60,
            description: "Confusion between similar traffic signs.",
            severity: "CRITICAL",
            uniqueQuestions: 8,
            recommendationKey: "error_patterns.rec_sign_confusion",
            sourceScope: "LAST_TWO_COMPLETED_EXAMS",
            groups: [
              {
                groupType: "CATEGORY",
                code: "DANGER",
                nameEn: "Danger signs",
                nameNl: "Gevaarsborden",
                nameFr: "Panneaux de danger",
                nameAr: "علامات الخطر",
                count: 7,
              },
            ],
            exampleQuestions: [],
          },
          {
            patternType: "PRIORITY_MISUNDERSTANDING",
            count: 8,
            previousCount: 5,
            currentCount: 8,
            delta: 3,
            trend: "WORSENED",
            recentAttemptsCount: 2,
            lastCalculatedAt: "2026-08-05T12:00:00Z",
            percentage: 40,
            description: "Priority rules are misunderstood.",
            severity: "MODERATE",
            uniqueQuestions: 5,
            recommendationKey: "error_patterns.rec_priority_misunderstanding",
            sourceScope: "LAST_TWO_COMPLETED_EXAMS",
            groups: [
              {
                groupType: "CATEGORY",
                code: "PRIORITY",
                nameEn: "Priority signs",
                nameNl: "Voorrangsborden",
                nameFr: "Panneaux de priorité",
                nameAr: "علامات الأولوية",
                count: 5,
              },
            ],
            exampleQuestions: [],
          },
        ]),
    );

    for (const locale of locales) {
      await page.setViewportSize({ width: 320, height: 900 });
      await navigate(
        page,
        localizedPath("/dashboard?section=error-patterns", locale),
      );
      await page.evaluate(() => document.fonts.ready);

      const cards = page.getByTestId("error-summary-card");
      await expect(cards).toHaveCount(4);
      const patternCards = page.getByTestId("error-pattern-card");
      await expect(patternCards).toHaveCount(2);

      for (const width of [320, 360, 375, 390, 428] as const) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );

        const metrics = await cards.evaluateAll((summaryCards) => {
          const viewport = window.innerWidth;
          const centerX = (target: DOMRect) => target.left + target.width / 2;
          const invalidCards = summaryCards.flatMap((card, index) => {
            const cardRect = card.getBoundingClientRect();
            const icon = card.querySelector(
              '[data-testid="error-summary-icon"]',
            );
            const label = card.querySelector(
              '[data-testid="error-summary-label"]',
            );
            const value = card.querySelector(
              '[data-testid="error-summary-value"]',
            );
            const description = card.querySelector(
              '[data-testid="error-summary-description"]',
            );

            if (!icon || !label || !value || !description) {
              return [{ index, reason: "summary card content is incomplete" }];
            }

            const parts = [icon, label, value, description];
            const partRects = parts.map((part) => part.getBoundingClientRect());
            const descriptionStyle = getComputedStyle(description);
            const reasons = [
              cardRect.left < -1 && "card starts outside viewport",
              cardRect.right > viewport + 1 && "card ends outside viewport",
              card.scrollWidth > card.clientWidth + 1 && "card scrolls",
              descriptionStyle.webkitLineClamp !== "2" &&
                "description is not allowed two lines",
              ...partRects.flatMap((partRect, partIndex) => {
                const findings: string[] = [];
                if (
                  partRect.left < cardRect.left - 1 ||
                  partRect.right > cardRect.right + 1
                ) {
                  findings.push(`part ${partIndex} leaves card bounds`);
                }
                if (Math.abs(centerX(partRect) - centerX(cardRect)) > 1) {
                  findings.push(`part ${partIndex} is not centered`);
                }
                if (
                  partIndex > 0 &&
                  partRects[partIndex - 1].bottom > partRect.top + 1
                ) {
                  findings.push(`part ${partIndex} is out of vertical order`);
                }
                return findings;
              }),
            ].filter((reason): reason is string => Boolean(reason));

            return reasons.map((reason) => ({
              index,
              reason,
              cardLeft: cardRect.left,
              cardRight: cardRect.right,
              cardWidth: cardRect.width,
            }));
          });

          return {
            viewport,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            invalidCards,
          };
        });

        if (
          metrics.documentWidth > width ||
          metrics.bodyWidth > width ||
          metrics.invalidCards.length > 0
        ) {
          await page.screenshot({
            path: testInfo.outputPath(`error-summary-${locale}-${width}px.png`),
            fullPage: true,
          });
        }

        expect(metrics, `${locale} error summary at ${width}px`).toEqual({
          viewport: width,
          documentWidth: width,
          bodyWidth: width,
          invalidCards: [],
        });

        const patternMetrics = await patternCards.evaluateAll((items) => ({
          viewport: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          invalidCards: items.flatMap((item, index) => {
            const rect = item.getBoundingClientRect();
            return rect.left < -1 || rect.right > window.innerWidth + 1
              ? [{ index, left: rect.left, right: rect.right }]
              : [];
          }),
        }));
        expect(
          patternMetrics,
          `${locale} error pattern comparison at ${width}px`,
        ).toEqual({
          viewport: width,
          documentWidth: width,
          invalidCards: [],
        });
      }

      await page.setViewportSize({ width: 1280, height: 900 });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      await expect(
        cards.first().getByTestId("error-summary-content"),
      ).toHaveCSS("flex-direction", "row");
      expect(
        await page.evaluate(() => ({
          viewport: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
        })),
      ).toEqual({ viewport: 1280, documentWidth: 1280, bodyWidth: 1280 });
    }
  });

  test("official exam result cards use a balanced mobile hierarchy", async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    await seedCookieConsent(page);
    await installAuthenticatedSession(context, page);
    await page.route("**/api/proxy/exams/simulations/history", (route) =>
      fulfillJson(route, {
        totalExams: 3,
        exams: [
          {
            examId: 401,
            startedAt: "2026-07-30T14:20:00Z",
            completedAt: "2026-07-30T14:52:00Z",
            status: "COMPLETED",
            scorePercentage: 84,
            totalQuestions: 50,
            correctAnswers: 42,
            passed: true,
          },
          {
            examId: 402,
            startedAt: "2026-07-29T14:20:00Z",
            completedAt: "2026-07-29T14:52:00Z",
            status: "COMPLETED",
            scorePercentage: 24,
            totalQuestions: 50,
            correctAnswers: 12,
            passed: false,
          },
          {
            examId: 403,
            startedAt: "2026-07-28T14:20:00Z",
            completedAt: null,
            status: "IN_PROGRESS",
            scorePercentage: 0,
            totalQuestions: 50,
            correctAnswers: 0,
            passed: false,
          },
        ],
      }),
    );

    for (const locale of locales) {
      await page.setViewportSize({ width: 320, height: 900 });
      await navigate(
        page,
        localizedPath("/dashboard?section=exam-results", locale),
      );
      await page.evaluate(() => document.fonts.ready);

      const cards = page.getByTestId("official-exam-result-card");
      await expect(cards).toHaveCount(3);

      for (const width of [320, 360, 375, 390, 428] as const) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );

        const metrics = await cards.evaluateAll((resultCards) => {
          const viewport = window.innerWidth;
          const centerX = (target: DOMRect) => target.left + target.width / 2;
          const invalidCards = resultCards.flatMap((card, index) => {
            const cardRect = card.getBoundingClientRect();
            const icon = card.querySelector(
              '[data-testid="official-exam-result-icon"]',
            );
            const name = card.querySelector(
              '[data-testid="official-exam-result-name"]',
            );
            const status = card.querySelector(
              '[data-testid="official-exam-result-status"]',
            );
            const date = card.querySelector(
              '[data-testid="official-exam-result-date"]',
            );
            const score = card.querySelector(
              '[data-testid="official-exam-result-score"]',
            );
            const progress = card.querySelector(
              '[data-testid="official-exam-result-progress"]',
            );
            const chevron = card.querySelector(
              '[data-testid="official-exam-result-chevron"]',
            );

            if (!icon || !name || !status || !date) {
              return [{ index, reason: "exam result content is incomplete" }];
            }

            const parts = [
              icon,
              name,
              status,
              date,
              score,
              progress,
              chevron,
            ].filter((part): part is Element => Boolean(part));
            const partRects = parts.map((part) => part.getBoundingClientRect());
            const iconRect = icon.getBoundingClientRect();
            const scoreRect = score?.getBoundingClientRect();
            const iconSvgRect =
              icon.querySelector("svg")?.getBoundingClientRect() ?? null;
            const dateText = date.textContent?.trim() ?? "";
            const reasons = [
              cardRect.left < -1 && "card starts outside viewport",
              cardRect.right > viewport + 1 && "card ends outside viewport",
              card.scrollWidth > card.clientWidth + 1 && "card scrolls",
              Math.abs(iconRect.width - 40) > 1 && "icon container is not 40px",
              Math.abs(iconRect.height - 40) > 1 &&
                "icon container is not 40px",
              iconSvgRect &&
                Math.abs(iconSvgRect.width - 20) > 1 &&
                "status icon is not 20px",
              scoreRect &&
                Math.abs(scoreRect.width - 52) > 1 &&
                "score container is not 52px",
              scoreRect &&
                Math.abs(scoreRect.height - 52) > 1 &&
                "score container is not 52px",
              date.getAttribute("data-calendar") !== "gregory" &&
                "date is not Gregorian",
              !dateText.includes("2026") && "Gregorian year is missing",
              /[\u0660-\u0669\u06f0-\u06f9]/u.test(dateText) &&
                "date uses Arabic-Indic digits",
              ...partRects.flatMap((partRect, partIndex) => {
                const findings: string[] = [];
                if (
                  partRect.left < cardRect.left - 1 ||
                  partRect.right > cardRect.right + 1
                ) {
                  findings.push(`part ${partIndex} leaves card bounds`);
                }
                if (Math.abs(centerX(partRect) - centerX(cardRect)) > 1) {
                  findings.push(`part ${partIndex} is not centered`);
                }
                if (
                  partIndex > 0 &&
                  partRects[partIndex - 1].bottom > partRect.top + 1
                ) {
                  findings.push(`part ${partIndex} is out of vertical order`);
                }
                return findings;
              }),
            ].filter((reason): reason is string => Boolean(reason));

            return reasons.map((reason) => ({
              index,
              reason,
              cardWidth: cardRect.width,
              iconWidth: iconRect.width,
              scoreWidth: scoreRect?.width ?? null,
              dateText,
            }));
          });

          return {
            viewport,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            invalidCards,
          };
        });

        if (
          metrics.documentWidth > width ||
          metrics.bodyWidth > width ||
          metrics.invalidCards.length > 0
        ) {
          await page.screenshot({
            path: testInfo.outputPath(
              `official-exam-result-${locale}-${width}px.png`,
            ),
            fullPage: true,
          });
        }

        expect(metrics, `${locale} official exam result at ${width}px`).toEqual(
          {
            viewport: width,
            documentWidth: width,
            bodyWidth: width,
            invalidCards: [],
          },
        );
      }

      await page.setViewportSize({ width: 1280, height: 900 });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      await expect(
        cards.first().getByTestId("official-exam-result-header"),
      ).toHaveCSS("flex-direction", "row");
      await expect(
        cards.first().getByTestId("official-exam-result-icon"),
      ).toHaveCSS("width", "48px");
      await expect(
        cards.first().getByTestId("official-exam-result-score"),
      ).toHaveCSS("width", "64px");
    }
  });

  test("exam results page uses one mobile card hierarchy for every exam type", async ({
    context,
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    await seedCookieConsent(page);
    await installAuthenticatedSession(context, page);

    await page.route("**/api/proxy/exams/simulations/history", (route) =>
      fulfillJson(route, {
        totalExams: 2,
        exams: [
          {
            examId: 501,
            startedAt: "2026-07-30T14:20:00Z",
            completedAt: "2026-07-30T14:52:00Z",
            status: "COMPLETED",
            scorePercentage: 84,
            totalQuestions: 50,
            correctAnswers: 42,
            passed: true,
          },
          {
            examId: 502,
            startedAt: "2026-07-29T14:20:00Z",
            completedAt: "2026-07-29T14:52:00Z",
            status: "COMPLETED",
            scorePercentage: 24,
            totalQuestions: 50,
            correctAnswers: 12,
            passed: false,
          },
        ],
      }),
    );
    await page.route(
      "**/api/proxy/sign-quiz/random-practice/history",
      (route) =>
        fulfillJson(route, {
          totalSessions: 2,
          sessions: [
            {
              sessionId: 601,
              status: "COMPLETED",
              totalQuestions: 50,
              answeredCount: 50,
              correctAnswers: 44,
              wrongAnswers: 6,
              unanswered: 0,
              scorePercentage: 88,
              passed: true,
              passingScore: 41,
              startedAt: "2026-07-28T14:20:00Z",
              completedAt: "2026-07-28T14:52:00Z",
            },
            {
              sessionId: 602,
              status: "COMPLETED",
              totalQuestions: 50,
              answeredCount: 50,
              correctAnswers: 15,
              wrongAnswers: 35,
              unanswered: 0,
              scorePercentage: 30,
              passed: false,
              passingScore: 41,
              startedAt: "2026-07-27T14:20:00Z",
              completedAt: "2026-07-27T14:52:00Z",
            },
          ],
        }),
    );
    await page.route("**/api/proxy/sign-quiz/exam-history", (route) =>
      fulfillJson(route, {
        totalResults: 2,
        results: [
          {
            resultId: 701,
            signCode: "A1a",
            routeCode: "A1a",
            nameEn: "Dangerous bend to the left",
            nameNl: "Gevaarlijke bocht naar links",
            nameFr: "Virage dangereux vers la gauche",
            nameAr: "منعطف خطر نحو اليسار",
            examNumber: 1,
            totalQuestions: 8,
            answeredCount: 8,
            correctAnswers: 7,
            wrongAnswers: 1,
            unansweredCount: 0,
            scorePercentage: 87.5,
            passingThreshold: 75,
            passed: true,
            completedAt: "2026-07-26T14:52:00Z",
          },
          {
            resultId: 702,
            signCode: "F",
            routeCode: "F",
            nameEn: "Information and temporary traffic signs",
            nameNl: "Informatieborden en tijdelijke verkeersmaatregelen",
            nameFr:
              "Panneaux d'information et mesures temporaires de circulation",
            nameAr: "علامات المعلومات والإجراءات المرورية المؤقتة",
            examNumber: 1,
            totalQuestions: 8,
            answeredCount: 8,
            correctAnswers: 2,
            wrongAnswers: 6,
            unansweredCount: 0,
            scorePercentage: 25,
            passingThreshold: 75,
            passed: false,
            completedAt: "2026-07-25T14:52:00Z",
          },
        ],
      }),
    );

    for (const locale of locales) {
      await page.setViewportSize({ width: 320, height: 900 });
      await navigate(
        page,
        localizedPath("/dashboard?section=exam-results", locale),
      );
      await page.evaluate(() => document.fonts.ready);

      const cards = page.locator(
        '[data-testid="official-exam-result-card"], [data-testid="mixed-sign-exam-result-card"], [data-testid="sign-exam-result-card"]',
      );
      await expect(cards).toHaveCount(6);

      for (const width of [320, 360, 375, 390, 428] as const) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );

        const metrics = await cards.evaluateAll((resultCards) => {
          const viewport = window.innerWidth;
          const centerX = (target: DOMRect) => target.left + target.width / 2;
          const invalidCards = resultCards.flatMap((card, index) => {
            const cardRect = card.getBoundingClientRect();
            const parts = [
              "icon",
              "name",
              "status",
              "date",
              "score",
              "progress",
              "chevron",
            ].map((part) => card.querySelector(`[data-result-part="${part}"]`));

            if (parts.some((part) => !part)) {
              return [
                {
                  index,
                  kind: card.getAttribute("data-exam-result-kind"),
                  reason: "unified card content is incomplete",
                },
              ];
            }

            const elements = parts as Element[];
            const partRects = elements.map((part) =>
              part.getBoundingClientRect(),
            );
            const [icon, name, , date, score] = elements;
            const iconRect = icon.getBoundingClientRect();
            const scoreRect = score.getBoundingClientRect();
            const iconSvgRect =
              icon.querySelector("svg")?.getBoundingClientRect() ?? null;
            const nameStyle = getComputedStyle(name);
            const dateText = date.textContent?.trim() ?? "";
            const reasons = [
              cardRect.left < -1 && "card starts outside viewport",
              cardRect.right > viewport + 1 && "card ends outside viewport",
              card.scrollWidth > card.clientWidth + 1 && "card scrolls",
              Math.abs(iconRect.width - 40) > 1 && "icon is not 40px",
              iconSvgRect &&
                Math.abs(iconSvgRect.width - 20) > 1 &&
                "icon glyph is not 20px",
              Math.abs(scoreRect.width - 52) > 1 && "score is not 52px",
              nameStyle.whiteSpace === "nowrap" && "name cannot wrap",
              nameStyle.webkitLineClamp !== "2" &&
                "name is not limited to two readable lines",
              date.getAttribute("data-calendar") !== "gregory" &&
                "date is not Gregorian",
              !dateText.includes("2026") && "Gregorian year is missing",
              /[\u0660-\u0669\u06f0-\u06f9]/u.test(dateText) &&
                "date uses Arabic-Indic digits",
              ...partRects.flatMap((partRect, partIndex) => {
                const findings: string[] = [];
                if (
                  partRect.left < cardRect.left - 1 ||
                  partRect.right > cardRect.right + 1
                ) {
                  findings.push(`part ${partIndex} leaves card bounds`);
                }
                if (Math.abs(centerX(partRect) - centerX(cardRect)) > 1) {
                  findings.push(`part ${partIndex} is not centered`);
                }
                if (
                  partIndex > 0 &&
                  partRects[partIndex - 1].bottom > partRect.top + 1
                ) {
                  findings.push(`part ${partIndex} is out of vertical order`);
                }
                return findings;
              }),
            ].filter((reason): reason is string => Boolean(reason));

            return reasons.map((reason) => ({
              index,
              kind: card.getAttribute("data-exam-result-kind"),
              reason,
              cardWidth: cardRect.width,
              iconWidth: iconRect.width,
              scoreWidth: scoreRect.width,
              dateText,
            }));
          });

          return {
            viewport,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            invalidCards,
          };
        });

        if (
          metrics.documentWidth > width ||
          metrics.bodyWidth > width ||
          metrics.invalidCards.length > 0
        ) {
          await page.screenshot({
            path: testInfo.outputPath(
              `unified-exam-results-${locale}-${width}px.png`,
            ),
            fullPage: true,
          });
        }

        expect(metrics, `${locale} unified exam results at ${width}px`).toEqual(
          {
            viewport: width,
            documentWidth: width,
            bodyWidth: width,
            invalidCards: [],
          },
        );
      }

      await page.setViewportSize({ width: 1280, height: 900 });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const desktopMetrics = await cards.evaluateAll((resultCards) =>
        resultCards.map((card) => {
          const header = card.children.item(1);
          const icon = card.querySelector('[data-result-part="icon"]');
          const score = card.querySelector('[data-result-part="score"]');
          return {
            direction: header ? getComputedStyle(header).flexDirection : null,
            iconWidth: icon?.getBoundingClientRect().width ?? 0,
            scoreWidth: score?.getBoundingClientRect().width ?? 0,
          };
        }),
      );
      expect(desktopMetrics).toEqual(
        Array(6).fill({
          direction: "row",
          iconWidth: 48,
          scoreWidth: 64,
        }),
      );
    }
  });

  test("exam start button matches the large secondary action height at every target viewport", async ({
    context,
    page,
  }) => {
    test.setTimeout(60_000);
    await seedCookieConsent(page);
    await installAuthenticatedSession(context, page);
    await page.setViewportSize({ width: 320, height: 900 });
    await navigate(page, localizedPath("/exam", "ar"));

    const startButton = page.getByTestId("exam-start-button");
    const backButton = page.getByTestId("exam-back-button");
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();
    await expect(backButton).toBeVisible();

    const targetWidths = [320, 375, 768, 1024, 1440] as const;
    let primaryBackground = "";

    for (const width of targetWidths) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );

      const metrics = await startButton.evaluate((element) => {
        const back = document.querySelector<HTMLElement>(
          '[data-testid="exam-back-button"]',
        );
        const icon = element.querySelector<SVGElement>("svg");
        const label = element.querySelector<HTMLElement>(
          '[data-testid="exam-start-button-label"]',
        );
        const parent = element.parentElement;
        if (!back || !icon || !label || !parent) {
          throw new Error("Exam action button structure is incomplete");
        }

        const buttonRect = element.getBoundingClientRect();
        const backRect = back.getBoundingClientRect();
        const iconRect = icon.getBoundingClientRect();
        const labelRect = label.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        const style = getComputedStyle(element);
        const parentStyle = getComputedStyle(parent);
        const buttonCenter = buttonRect.top + buttonRect.height / 2;

        return {
          viewport: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          height: buttonRect.height,
          backHeight: backRect.height,
          width: buttonRect.width,
          left: buttonRect.left,
          right: buttonRect.right,
          parentLeft: parentRect.left,
          parentRight: parentRect.right,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          alignItems: style.alignItems,
          justifyContent: style.justifyContent,
          columnGap: style.columnGap,
          parentDirection: parentStyle.flexDirection,
          iconCenterDelta: Math.abs(
            iconRect.top + iconRect.height / 2 - buttonCenter,
          ),
          labelCenterDelta: Math.abs(
            labelRect.top + labelRect.height / 2 - buttonCenter,
          ),
          backgroundColor: style.backgroundColor,
          color: style.color,
          variant: element.getAttribute("data-variant"),
          size: element.getAttribute("data-size"),
        };
      });

      if (!primaryBackground) primaryBackground = metrics.backgroundColor;

      expect(metrics, `exam actions at ${width}px`).toMatchObject({
        viewport: width,
        documentWidth: width,
        bodyWidth: width,
        height: 44,
        backHeight: 44,
        alignItems: "center",
        justifyContent: "center",
        columnGap: "8px",
        backgroundColor: primaryBackground,
        variant: "default",
        size: "lg",
      });
      expect(metrics.width).toBeGreaterThan(0);
      expect(metrics.left).toBeGreaterThanOrEqual(metrics.parentLeft - 1);
      expect(metrics.right).toBeLessThanOrEqual(metrics.parentRight + 1);
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
      expect(metrics.iconCenterDelta).toBeLessThanOrEqual(1);
      expect(metrics.labelCenterDelta).toBeLessThanOrEqual(1);
      expect(metrics.color).not.toBe("rgba(0, 0, 0, 0)");

      if (width < 640) {
        expect(metrics.parentDirection).toBe("column");
      } else {
        expect(metrics.parentDirection).toBe("row");
      }
    }
  });

  test("exam summary cards share the icon label value mobile hierarchy", async ({
    context,
    page,
  }) => {
    test.setTimeout(60_000);
    await seedCookieConsent(page);
    await installAuthenticatedSession(context, page);

    const mobileViewports = [320, 360, 375, 390, 428] as const;
    const testedLocales = ["en", "ar"] as const;

    for (const locale of testedLocales) {
      await page.setViewportSize({ width: 320, height: 900 });
      await navigate(page, localizedPath("/exam", locale));

      const summaryGrid = page.getByTestId("exam-summary-grid");
      const cards = summaryGrid.getByTestId("dashboard-stat-card");
      await expect(summaryGrid).toBeVisible();
      await expect(cards).toHaveCount(3);

      for (const width of mobileViewports) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );

        const metrics = await summaryGrid.evaluate((grid) => {
          const gridRect = grid.getBoundingClientRect();
          const cardElements = [
            ...grid.querySelectorAll<HTMLElement>(
              ':scope > [data-testid="dashboard-stat-card"]',
            ),
          ];

          return {
            viewport: window.innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            gridClientWidth: grid.clientWidth,
            gridScrollWidth: grid.scrollWidth,
            cardMetrics: cardElements.map((card) => {
              const icon = card.querySelector<HTMLElement>(
                '[data-testid="dashboard-stat-icon"]',
              );
              const label = card.querySelector<HTMLElement>(
                '[data-testid="dashboard-stat-label"]',
              );
              const value = card.querySelector<HTMLElement>(
                '[data-testid="dashboard-stat-value"]',
              );
              if (!icon || !label || !value) {
                throw new Error("Exam summary card structure is incomplete");
              }

              const cardRect = card.getBoundingClientRect();
              const iconRect = icon.getBoundingClientRect();
              const labelRect = label.getBoundingClientRect();
              const valueRect = value.getBoundingClientRect();
              const cardCenter = cardRect.left + cardRect.width / 2;

              return {
                cardLeft: cardRect.left,
                cardRight: cardRect.right,
                cardWidth: cardRect.width,
                cardClientWidth: card.clientWidth,
                cardScrollWidth: card.scrollWidth,
                iconTop: iconRect.top,
                iconBottom: iconRect.bottom,
                iconCenterDelta: Math.abs(
                  iconRect.left + iconRect.width / 2 - cardCenter,
                ),
                labelTop: labelRect.top,
                labelBottom: labelRect.bottom,
                labelCenterDelta: Math.abs(
                  labelRect.left + labelRect.width / 2 - cardCenter,
                ),
                labelTextAlign: getComputedStyle(label).textAlign,
                valueTop: valueRect.top,
                valueCenterDelta: Math.abs(
                  valueRect.left + valueRect.width / 2 - cardCenter,
                ),
                valueTextAlign: getComputedStyle(value).textAlign,
                valueScrollWidth: value.scrollWidth,
                valueClientWidth: value.clientWidth,
              };
            }),
            gridLeft: gridRect.left,
            gridRight: gridRect.right,
          };
        });

        expect(metrics.viewport).toBe(width);
        expect(metrics.documentWidth).toBe(width);
        expect(metrics.bodyWidth).toBe(width);
        expect(metrics.gridScrollWidth).toBeLessThanOrEqual(
          metrics.gridClientWidth + 1,
        );
        expect(metrics.cardMetrics).toHaveLength(3);

        for (const card of metrics.cardMetrics) {
          expect(card.cardLeft).toBeGreaterThanOrEqual(metrics.gridLeft - 1);
          expect(card.cardRight).toBeLessThanOrEqual(metrics.gridRight + 1);
          expect(card.cardScrollWidth).toBeLessThanOrEqual(
            card.cardClientWidth + 1,
          );
          expect(card.iconBottom).toBeLessThanOrEqual(card.labelTop + 1);
          expect(card.labelBottom).toBeLessThanOrEqual(card.valueTop + 1);
          expect(card.iconCenterDelta).toBeLessThanOrEqual(1);
          expect(card.labelCenterDelta).toBeLessThanOrEqual(1);
          expect(card.valueCenterDelta).toBeLessThanOrEqual(1);
          expect(card.labelTextAlign).toBe("center");
          expect(card.valueTextAlign).toBe("center");
          expect(card.valueScrollWidth).toBeLessThanOrEqual(
            card.valueClientWidth + 1,
          );
        }

        expect(
          new Set(metrics.cardMetrics.map((card) => card.cardWidth)).size,
        ).toBe(1);
      }

      await page.setViewportSize({ width: 1280, height: 900 });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const desktopMetrics = await cards.evaluateAll((cardElements) =>
        cardElements.map((card) => {
          const icon = card.querySelector<HTMLElement>(
            '[data-testid="dashboard-stat-icon"]',
          );
          const label = card.querySelector<HTMLElement>(
            '[data-testid="dashboard-stat-label"]',
          );
          const value = card.querySelector<HTMLElement>(
            '[data-testid="dashboard-stat-value"]',
          );
          if (!icon || !label || !value) {
            throw new Error("Exam summary card structure is incomplete");
          }
          const iconRect = icon.getBoundingClientRect();
          const labelRect = label.getBoundingClientRect();
          const valueRect = value.getBoundingClientRect();
          return {
            iconTop: Math.round(iconRect.top),
            valueTop: Math.round(valueRect.top),
            labelTop: Math.round(labelRect.top),
            firstRowBottom: Math.round(
              Math.max(iconRect.bottom, valueRect.bottom),
            ),
          };
        }),
      );

      for (const card of desktopMetrics) {
        expect(Math.abs(card.iconTop - card.valueTop)).toBeLessThanOrEqual(1);
        expect(card.labelTop).toBeGreaterThanOrEqual(card.firstRowBottom);
      }
    }
  });

  test("practice category cards use a clear mobile learning hierarchy in every locale", async ({
    context,
    page,
  }) => {
    test.setTimeout(120_000);
    await seedCookieConsent(page);
    await installAuthenticatedSession(context, page);

    const practiceSigns = [
      trafficSignCatalogFixture,
      {
        ...trafficSignCatalogFixture,
        id: 2,
        signCode: "F1",
        routeCode: "F1",
        categoryCode: "F",
      },
      {
        ...trafficSignCatalogFixture,
        id: 3,
        signCode: "G1",
        routeCode: "G1",
        categoryCode: "G",
      },
    ];
    const practiceProgress = practiceSigns.map((sign, index) => ({
      signCode: sign.signCode,
      routeCode: sign.routeCode,
      practiceCompleted: index < 2,
      exam1Passed: index === 0,
    }));

    await page.route("**/api/proxy/traffic-signs", (route) =>
      fulfillJson(route, practiceSigns),
    );
    await page.route("**/api/proxy/sign-quiz/user-progress*", (route) =>
      fulfillJson(route, practiceProgress),
    );

    const targetWidths = [320, 360, 375, 390, 428] as const;

    for (const locale of locales) {
      await page.setViewportSize({ width: 320, height: 1000 });
      await navigate(page, localizedPath("/practice", locale));

      const cards = page.getByTestId("practice-category-card");
      await expect(cards).toHaveCount(3);

      for (const width of targetWidths) {
        await page.setViewportSize({ width, height: 1000 });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );

        const metrics = await cards.evaluateAll((cardElements) => ({
          viewport: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          cards: cardElements.map((card) => {
            const icon = card.querySelector<HTMLElement>(
              '[data-testid="practice-category-icon"]',
            );
            const code = card.querySelector<HTMLElement>(
              '[data-testid="practice-category-code"]',
            );
            const title = card.querySelector<HTMLElement>(
              '[data-testid="practice-category-title"]',
            );
            const count = card.querySelector<HTMLElement>(
              '[data-testid="practice-category-count"]',
            );
            const progress = card.querySelector<HTMLElement>(
              '[data-testid="practice-category-progress"]',
            );
            const progressBar = card.querySelector<HTMLElement>(
              '[data-testid="practice-category-progress-bar"]',
            );
            const action = card.querySelector<HTMLElement>(
              '[data-testid="practice-category-action"]',
            );
            const stats = [
              ...card.querySelectorAll<HTMLElement>(
                '[data-testid="practice-category-stat"]',
              ),
            ];
            if (
              !icon ||
              !code ||
              !title ||
              !count ||
              !progress ||
              !progressBar ||
              !action ||
              stats.length !== 2
            ) {
              throw new Error("Practice category card structure is incomplete");
            }

            const cardRect = card.getBoundingClientRect();
            const iconRect = icon.getBoundingClientRect();
            const codeRect = code.getBoundingClientRect();
            const titleRect = title.getBoundingClientRect();
            const countRect = count.getBoundingClientRect();
            const progressHeaderRect = progress.children
              .item(0)
              ?.getBoundingClientRect();
            const progressBarRect = progressBar.getBoundingClientRect();
            const actionRect = action.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const statMetrics = stats.map((stat) => {
              const statIcon = stat.querySelector<HTMLElement>(
                '[data-testid="practice-category-stat-icon"]',
              );
              const statLabel = stat.querySelector<HTMLElement>(
                '[data-testid="practice-category-stat-label"]',
              );
              const statValue = stat.querySelector<HTMLElement>(
                '[data-testid="practice-category-stat-value"]',
              );
              if (!statIcon || !statLabel || !statValue) {
                throw new Error("Practice statistic structure is incomplete");
              }
              const statRect = stat.getBoundingClientRect();
              const statIconRect = statIcon.getBoundingClientRect();
              const statLabelRect = statLabel.getBoundingClientRect();
              const statValueRect = statValue.getBoundingClientRect();
              const statCenter = statRect.left + statRect.width / 2;
              return {
                height: statRect.height,
                direction: getComputedStyle(statIcon.parentElement!)
                  .flexDirection,
                iconBottom: statIconRect.bottom,
                labelTop: statLabelRect.top,
                labelBottom: statLabelRect.bottom,
                valueTop: statValueRect.top,
                iconCenterDelta: Math.abs(
                  statIconRect.left + statIconRect.width / 2 - statCenter,
                ),
                labelCenterDelta: Math.abs(
                  statLabelRect.left + statLabelRect.width / 2 - statCenter,
                ),
                valueCenterDelta: Math.abs(
                  statValueRect.left + statValueRect.width / 2 - statCenter,
                ),
              };
            });

            return {
              cardLeft: cardRect.left,
              cardRight: cardRect.right,
              cardClientWidth: card.clientWidth,
              cardScrollWidth: card.scrollWidth,
              headerDirection: getComputedStyle(
                card.querySelector<HTMLElement>(
                  '[data-testid="practice-category-header"]',
                )!,
              ).flexDirection,
              descriptionCount: card.querySelectorAll(
                '[data-slot="card-description"]',
              ).length,
              iconBottom: iconRect.bottom,
              codeTop: codeRect.top,
              codeBottom: codeRect.bottom,
              titleTop: titleRect.top,
              titleBottom: titleRect.bottom,
              countTop: countRect.top,
              headerCenterDeltas: [
                iconRect,
                codeRect,
                titleRect,
                countRect,
              ].map((rect) =>
                Math.abs(rect.left + rect.width / 2 - cardCenter),
              ),
              statMetrics,
              progressHeaderBottom: progressHeaderRect?.bottom ?? 0,
              progressBarTop: progressBarRect.top,
              progressBarBottom: progressBarRect.bottom,
              progressBarWidth: progressBarRect.width,
              actionTop: actionRect.top,
              actionHeight: actionRect.height,
              actionWidth: actionRect.width,
              progressWidth: progress.getBoundingClientRect().width,
            };
          }),
        }));

        expect(metrics.viewport).toBe(width);
        expect(metrics.documentWidth).toBe(width);
        expect(metrics.bodyWidth).toBe(width);

        for (const card of metrics.cards) {
          expect(card.cardLeft).toBeGreaterThanOrEqual(-1);
          expect(card.cardRight).toBeLessThanOrEqual(width + 1);
          expect(card.cardScrollWidth).toBeLessThanOrEqual(
            card.cardClientWidth + 1,
          );
          expect(card.headerDirection).toBe("column");
          expect(card.descriptionCount).toBe(0);
          expect(card.iconBottom).toBeLessThanOrEqual(card.codeTop + 1);
          expect(card.codeBottom).toBeLessThanOrEqual(card.titleTop + 1);
          expect(card.titleBottom).toBeLessThanOrEqual(card.countTop + 1);
          expect(Math.max(...card.headerCenterDeltas)).toBeLessThanOrEqual(1);
          expect(
            new Set(card.statMetrics.map((stat) => stat.height)).size,
          ).toBe(1);
          for (const stat of card.statMetrics) {
            expect(stat.direction).toBe("column");
            expect(stat.iconBottom).toBeLessThanOrEqual(stat.labelTop + 1);
            expect(stat.labelBottom).toBeLessThanOrEqual(stat.valueTop + 1);
            expect(stat.iconCenterDelta).toBeLessThanOrEqual(1);
            expect(stat.labelCenterDelta).toBeLessThanOrEqual(1);
            expect(stat.valueCenterDelta).toBeLessThanOrEqual(1);
          }
          expect(card.progressHeaderBottom).toBeLessThanOrEqual(
            card.progressBarTop,
          );
          expect(card.progressBarBottom).toBeLessThanOrEqual(card.actionTop);
          expect(card.actionHeight).toBe(44);
          expect(
            Math.abs(card.actionWidth - card.progressWidth),
          ).toBeLessThanOrEqual(1);
          expect(card.progressBarWidth).toBeGreaterThan(0);
        }
      }

      await page.setViewportSize({ width: 1280, height: 1000 });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const desktopMetrics = await cards.evaluateAll((cardElements) =>
        cardElements.map((card) => ({
          headerDirection: getComputedStyle(
            card.querySelector<HTMLElement>(
              '[data-testid="practice-category-header"]',
            )!,
          ).flexDirection,
          statDirections: [
            ...card.querySelectorAll<HTMLElement>(
              '[data-testid="practice-category-stat"] > div',
            ),
          ].map((statHeader) => getComputedStyle(statHeader).flexDirection),
          right: card.getBoundingClientRect().right,
          viewport: window.innerWidth,
        })),
      );
      for (const card of desktopMetrics) {
        expect(card.headerDirection).toBe("row");
        expect(card.statDirections).toEqual(["row", "row"]);
        expect(card.right).toBeLessThanOrEqual(card.viewport + 1);
      }

      const firstCard = cards.first();
      const code = await firstCard
        .getByTestId("practice-category-code")
        .textContent();
      await firstCard.getByTestId("practice-category-action").click();
      await expect(page).toHaveURL(
        new RegExp(`${localizedPath(`/practice/${code}`, locale)}$`),
        { timeout: 20_000 },
      );
    }
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

        const popover = mobileNotifications.getByTestId("notification-popover");
        await expect(popover).toBeVisible();
        const box = await popover.boundingBox();
        expect(
          box,
          `${locale} notification panel at ${width}px`,
        ).not.toBeNull();
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
        expect(drawerRect!.x + drawerRect!.width).toBeLessThanOrEqual(
          width + 1,
        );

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

  test("navigation stays complete and collision-free in every locale", async ({
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
      await page.evaluate(() => document.fonts.ready);

      for (const width of desktopWidths) {
        await page.setViewportSize({ width, height: 1000 });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );

        const navbar = page.getByTestId("site-navbar");
        const desktopNavigation = page.getByTestId(
          "desktop-primary-navigation",
        );
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

        expect(metrics, `${locale} desktop navbar at ${width}px`).toMatchObject(
          {
            viewport: width,
            documentWidth: width,
            bodyWidth: width,
            linkRows: 1,
            linksOutsideNavigation: false,
            overlapsActions: false,
          },
        );
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
