import { expect, test, type Page } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3005";

const adminUser = {
  id: 1,
  username: "admin",
  email: "admin@rijvia.test",
  role: "ADMIN",
};

const lessons = [
  {
    id: 1,
    lessonCode: "LESSON-01",
    titleAr: "الأولوية والتقاطعات",
    titleNl: "Voorrang en kruispunten",
    titleFr: "Priorité et carrefours",
    titleEn: "Priority and intersections",
    active: true,
    editorState: "PUBLISHED_WITH_DRAFT",
    displayOrder: 1,
    estimatedMinutes: 12,
    pageCount: 8,
    currentVersion: 2,
    hasDraft: true,
    draftRevision: 4,
    categoryCount: 0,
    mediaCount: 0,
    updatedAt: "2026-09-24T06:00:00Z",
  },
  {
    id: 2,
    lessonCode: "LESSON-02",
    titleAr: "السرعة والطرق والمسافات",
    titleNl: "Snelheid, wegen en afstanden",
    titleFr: "Vitesse, routes et distances",
    titleEn: "Speed, roads and distances",
    active: true,
    editorState: "PUBLISHED",
    displayOrder: 2,
    estimatedMinutes: 10,
    pageCount: 6,
    currentVersion: 1,
    hasDraft: false,
    draftRevision: null,
    categoryCount: 0,
    mediaCount: 0,
    updatedAt: "2026-09-23T06:00:00Z",
  },
];

type LocaleCase = {
  locale: "en" | "ar" | "nl" | "fr";
  path: string;
  title: string;
  lessonTitle: string;
  sidebarLabel: string;
  searchLabel: string;
  filterLabel: string;
  openLesson: string;
  openNavigation: string;
  direction: "ltr" | "rtl";
  lessonHref: string;
};

const locales: Record<LocaleCase["locale"], LocaleCase> = {
  en: {
    locale: "en",
    path: "/admin/lessons",
    title: "Lesson Management",
    lessonTitle: "Priority and intersections",
    sidebarLabel: "Lessons",
    searchLabel: "Search lessons",
    filterLabel: "Filter lessons by status",
    openLesson: "Open lesson",
    openNavigation: "Open admin navigation",
    direction: "ltr",
    lessonHref: "/lessons/LESSON-01",
  },
  ar: {
    locale: "ar",
    path: "/ar/admin/lessons",
    title: "إدارة الدروس",
    lessonTitle: "الأولوية والتقاطعات",
    sidebarLabel: "الدروس",
    searchLabel: "البحث في الدروس",
    filterLabel: "تصفية الدروس حسب الحالة",
    openLesson: "فتح الدرس",
    openNavigation: "فتح قائمة الإدارة",
    direction: "rtl",
    lessonHref: "/ar/lessons/LESSON-01",
  },
  nl: {
    locale: "nl",
    path: "/nl/admin/lessons",
    title: "Lessenbeheer",
    lessonTitle: "Voorrang en kruispunten",
    sidebarLabel: "Lessen",
    searchLabel: "Lessen zoeken",
    filterLabel: "Lessen filteren op status",
    openLesson: "Les openen",
    openNavigation: "Adminnavigatie openen",
    direction: "ltr",
    lessonHref: "/nl/lessons/LESSON-01",
  },
  fr: {
    locale: "fr",
    path: "/fr/admin/lessons",
    title: "Gestion des leçons",
    lessonTitle: "Priorité et carrefours",
    sidebarLabel: "Leçons",
    searchLabel: "Rechercher des leçons",
    filterLabel: "Filtrer les leçons par statut",
    openLesson: "Ouvrir la leçon",
    openNavigation: "Ouvrir la navigation d'administration",
    direction: "ltr",
    lessonHref: "/fr/lessons/LESSON-01",
  },
};

async function installAdminSession(page: Page) {
  const header = Buffer.from(
    JSON.stringify({
      alg: "none",
      typ: "JWT",
    }),
  ).toString("base64url");

  const payload = Buffer.from(
    JSON.stringify({
      sub: "admin",
      role: "ADMIN",
      exp: 4_102_444_800,
    }),
  ).toString("base64url");

  await page.context().addCookies([
    {
      name: "token",
      value: `${header}.${payload}.test-signature`,
      url: baseURL,
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "csrf_token",
      value: "playwright-csrf-token",
      url: baseURL,
      sameSite: "Lax",
    },
  ]);
}

async function mockAdminRequests(page: Page) {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      json: {
        authenticated: true,
        user: adminUser,
      },
    }),
  );

  await page.route("**/api/proxy/admin/lessons", (route) =>
    route.fulfill({
      json: lessons,
    }),
  );

  await page.route(
    "**/api/proxy/users/me/notifications/unread-count",
    (route) =>
      route.fulfill({
        json: {
          unreadCount: 0,
        },
      }),
  );
}

async function expectNoPageOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));

  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);
}

async function verifyAdminLessonsPage(
  page: Page,
  locale: LocaleCase,
  width: number,
) {
  const browserErrors: string[] = [];
  const failedResponses: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    browserErrors.push(error.message);
  });

  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(
        `${response.status()} ${response.url()}`,
      );
    }
  });

  await page.setViewportSize({
    width,
    height: width < 600 ? 844 : 900,
  });

  await seedCookieConsent(page);
  await installAdminSession(page);
  await mockAdminRequests(page);

  await page.goto(locale.path, {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByRole("heading", {
      name: locale.title,
      level: 1,
    }),
  ).toBeVisible();

  await expect(
    page.getByText(locale.lessonTitle, {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByText("LESSON-01", {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByLabel(locale.searchLabel),
  ).toBeVisible();

  await expect(
    page.getByLabel(locale.filterLabel),
  ).toBeVisible();

  await expect(
    page.locator("article"),
  ).toHaveCount(2);

  await expect(
    page.getByRole("link", {
      name: locale.openLesson,
    }).first(),
  ).toHaveAttribute(
    "href",
    locale.lessonHref,
  );

  const htmlDirection =
    await page.locator("html").getAttribute("dir");

  expect(htmlDirection).toBe(locale.direction);

  const pageDirection =
    await page
      .getByRole("heading", {
        name: locale.title,
        level: 1,
      })
      .evaluate((element) => {
        let current: HTMLElement | null =
          element as HTMLElement;

        while (current) {
          const direction =
            current.getAttribute("dir");

          if (direction) {
            return direction;
          }

          current =
            current.parentElement;
        }

        return null;
      });

  expect(pageDirection).toBe(locale.direction);

  const search =
    page.getByLabel(locale.searchLabel);

  await search.fill("LESSON-02");

  await expect(
    page.getByText("LESSON-01", {
      exact: true,
    }),
  ).toHaveCount(0);

  await expect(
    page.getByText("LESSON-02", {
      exact: true,
    }),
  ).toBeVisible();

  await search.fill("");

  await expect(
    page.locator("article"),
  ).toHaveCount(2);

  if (width < 1024) {
    const navigationButton =
      page.getByRole("button", {
        name: locale.openNavigation,
      });

    await expect(
      navigationButton,
    ).toBeVisible();

    await navigationButton.click();

    const dialog =
      page.getByRole("dialog");

    await expect(dialog).toBeVisible();

    await expect(
      dialog.getByText(
        locale.sidebarLabel,
        {
          exact: true,
        },
      ).first(),
    ).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(dialog).toBeHidden();
  } else {
    await expect(
      page.getByRole("button", {
        name: locale.openNavigation,
      }),
    ).toBeHidden();

    await expect(
      page.getByText(
        locale.sidebarLabel,
        {
          exact: true,
        },
      ).first(),
    ).toBeVisible();
  }

  await expectNoPageOverflow(page);

  expect({
    browserErrors,
    failedResponses,
  }).toEqual({
    browserErrors: [],
    failedResponses: [],
  });
}

for (const width of [390, 768, 1440]) {
  test(`Admin lessons EN responsive ${width}px`, async ({
    page,
  }) => {
    await verifyAdminLessonsPage(
      page,
      locales.en,
      width,
    );
  });

  test(`Admin lessons AR RTL responsive ${width}px`, async ({
    page,
  }) => {
    await verifyAdminLessonsPage(
      page,
      locales.ar,
      width,
    );
  });
}

test("Admin lessons NL locale remains localized and responsive", async ({
  page,
}) => {
  await verifyAdminLessonsPage(
    page,
    locales.nl,
    768,
  );
});

test("Admin lessons FR locale remains localized and responsive", async ({
  page,
}) => {
  await verifyAdminLessonsPage(
    page,
    locales.fr,
    768,
  );
});
