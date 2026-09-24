import {
  expect,
  test,
  type Page,
  type Route,
} from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  "http://127.0.0.1:3005";

const lessonCode = "TH01";

type LanguageMap = {
  ar: string | null;
  nl: string | null;
  fr: string | null;
  en: string | null;
};

type LessonDocument = {
  schemaVersion: 1;

  lesson: {
    lessonCode: string;
    title: LanguageMap;
    description: LanguageMap;
    icon: string | null;
    displayOrder: number;
    estimatedMinutes: number;
    isActive: boolean;
  };

  pages: Array<{
    pageNumber: number;
    title: LanguageMap;
    content: LanguageMap;
    bulletPointsRaw: LanguageMap;
  }>;

  structuredSections: unknown[];

  seo: {
    ar: Record<string, unknown>;
    nl: Record<string, unknown>;
    fr: Record<string, unknown>;
    en: Record<string, unknown>;
  };

  media: unknown[];
  categoryLinks: unknown[];
};

type DraftPayload = {
  expectedRevision: number;
  document: LessonDocument;
};

type DraftResponse = {
  lessonId: number;
  baseVersionNumber: number;
  revision: number;
  document: LessonDocument;
  createdByUserId: number | null;
  updatedByUserId: number | null;
  createdAt: string;
  updatedAt: string;
};

const adminUser = {
  id: 1,
  username: "admin",
  email: "admin@rijvia.test",
  role: "ADMIN",
};

const publishedDocument: LessonDocument = {
  schemaVersion: 1,

  lesson: {
    lessonCode,

    title: {
      ar: "الأولوية والتقاطعات",
      nl: "Voorrang en kruispunten",
      fr: "Priorité et carrefours",
      en: "Priority and intersections",
    },

    description: {
      ar: "وصف عربي للدرس",
      nl: "Nederlandse lesbeschrijving",
      fr: "Description française de la leçon",
      en: "English lesson description",
    },

    icon: null,
    displayOrder: 1,
    estimatedMinutes: 12,
    isActive: true,
  },

  pages: [
    {
      pageNumber: 1,

      title: {
        ar: "الصفحة الأولى",
        nl: "Eerste pagina",
        fr: "Première page",
        en: "First page",
      },

      content: {
        ar: "محتوى عربي أصلي",
        nl: "Originele Nederlandse inhoud",
        fr: "Contenu français original",
        en: "Original English content",
      },

      bulletPointsRaw: {
        ar: "نقطة عربية",
        nl: "Nederlands punt",
        fr: "Point français",
        en: "English point",
      },
    },
  ],

  structuredSections: [],
  seo: {
    ar: {},
    nl: {},
    fr: {},
    en: {},
  },
  media: [],
  categoryLinks: [],
};

function cloneDocument(
  document: LessonDocument,
): LessonDocument {
  return JSON.parse(
    JSON.stringify(document),
  ) as LessonDocument;
}

function makeDraft(
  revision: number,
  document: LessonDocument =
    publishedDocument,
): DraftResponse {
  return {
    lessonId: 1,
    baseVersionNumber: 2,
    revision,
    document:
      cloneDocument(document),
    createdByUserId: 1,
    updatedByUserId: 1,
    createdAt:
      "2026-09-24T08:00:00Z",
    updatedAt:
      "2026-09-24T08:30:00Z",
  };
}

function makeLessonDetail(
  draft: DraftResponse | null,
) {
  return {
    id: 1,
    lessonCode,

    titleAr:
      "الأولوية والتقاطعات",

    titleNl:
      "Voorrang en kruispunten",

    titleFr:
      "Priorité et carrefours",

    titleEn:
      "Priority and intersections",

    active: true,
    displayOrder: 1,
    estimatedMinutes: 12,
    pageCount: 1,
    currentVersion: 2,

    publishedDocument:
      cloneDocument(
        publishedDocument,
      ),

    draft,

    categoryLinks: [],
    mediaAssets: [],
    versions: [],
  };
}

async function installAdminSession(
  page: Page,
) {
  const header =
    Buffer.from(
      JSON.stringify({
        alg: "none",
        typ: "JWT",
      }),
    ).toString(
      "base64url",
    );

  const payload =
    Buffer.from(
      JSON.stringify({
        sub: "admin",
        role: "ADMIN",
        exp: 4_102_444_800,
      }),
    ).toString(
      "base64url",
    );

  await page.context().addCookies([
    {
      name: "token",
      value:
        `${header}.${payload}.test-signature`,
      url: baseURL,
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "csrf_token",
      value:
        "playwright-csrf-token",
      url: baseURL,
      sameSite: "Lax",
    },
  ]);
}

async function mockAdminShell(
  page: Page,
) {
  await page.route(
    "**/api/auth/me",
    (route) =>
      route.fulfill({
        json: {
          authenticated: true,
          user: adminUser,
        },
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

async function expectNoOverflow(
  page: Page,
) {
  const widths =
    await page.evaluate(
      () => ({
        viewport:
          window.innerWidth,

        document:
          document.documentElement
            .scrollWidth,

        body:
          document.body
            .scrollWidth,
      }),
    );

  expect(
    widths.document,
  ).toBeLessThanOrEqual(
    widths.viewport,
  );

  expect(
    widths.body,
  ).toBeLessThanOrEqual(
    widths.viewport,
  );
}

function watchBrowserErrors(
  page: Page,
) {
  const errors: string[] = [];

  page.on(
    "console",
    (message) => {
      if (
        message.type() !==
        "error"
      ) {
        return;
      }

      const text =
        message.text();

      // HTTP failures are checked separately with
      // response status + URL. Chromium's generic
      // resource message contains neither useful detail
      // nor enough context to distinguish expected 409s.
      if (
        text.startsWith(
          "Failed to load resource:",
        )
      ) {
        return;
      }

      errors.push(
        text,
      );
    },
  );

  page.on(
    "pageerror",
    (error) => {
      errors.push(
        error.message,
      );
    },
  );

  return errors;
}

function watchHttpFailures(
  page: Page,
  isExpected:
    (
      status: number,
      url: string,
    ) => boolean =
      () => false,
) {
  const failures: string[] = [];

  page.on(
    "response",
    (response) => {
      const status =
        response.status();

      if (status < 400) {
        return;
      }

      const url =
        response.url();

      if (
        isExpected(
          status,
          url,
        )
      ) {
        return;
      }

      failures.push(
        `${status} ${url}`,
      );
    },
  );

  return failures;
}

async function fulfillJson(
  route: Route,
  body: unknown,
  status = 200,
) {
  await route.fulfill({
    status,
    contentType:
      "application/json",
    body:
      JSON.stringify(body),
  });
}

async function runSuccessfulEditorFlow(
  page: Page,
  width: number,
) {
  const browserErrors =
    watchBrowserErrors(
      page,
    );

  const httpFailures =
    watchHttpFailures(
      page,
    );

  let postCount = 0;

  const putPayloads:
    DraftPayload[] = [];

  await page.setViewportSize({
    width,
    height:
      width < 600
        ? 844
        : 900,
  });

  await seedCookieConsent(
    page,
  );

  await installAdminSession(
    page,
  );

  await mockAdminShell(
    page,
  );

  await page.route(
    `**/api/proxy/admin/lessons/${lessonCode}`,
    (route) =>
      fulfillJson(
        route,
        makeLessonDetail(
          null,
        ),
      ),
  );

  await page.route(
    `**/api/proxy/admin/lessons/${lessonCode}/draft`,
    async (route) => {
      const method =
        route.request().method();

      if (
        method === "POST"
      ) {
        postCount += 1;

        await fulfillJson(
          route,
          makeDraft(
            0,
          ),
        );

        return;
      }

      if (
        method === "PUT"
      ) {
        const payload =
          route.request()
            .postDataJSON() as DraftPayload;

        putPayloads.push(
          payload,
        );

        await fulfillJson(
          route,
          makeDraft(
            payload.expectedRevision +
              1,
            payload.document,
          ),
        );

        return;
      }

      await route.fallback();
    },
  );

  await page.goto(
    `/admin/lessons/${lessonCode}/edit`,
    {
      waitUntil:
        "domcontentloaded",
    },
  );

  await expect(
    page.getByRole(
      "heading",
      {
        name:
          "Priority and intersections",
        level: 1,
      },
    ),
  ).toBeVisible();

  expect(
    postCount,
  ).toBe(0);

  await expectNoOverflow(
    page,
  );

  await page
    .getByRole(
      "button",
      {
        name:
          "Start editing",
      },
    )
    .click();

  await expect
    .poll(
      () => postCount,
    )
    .toBe(1);

  await expect(
    page.getByText(
      "R0",
    ).first(),
  ).toBeVisible();

  const description =
    page.getByLabel(
      "Lesson description",
    );

  await expect(
    description,
  ).toHaveAttribute(
    "dir",
    "ltr",
  );

  await description.fill(
    `Updated description ${width}`,
  );

  await page
    .getByLabel(
      "Page content 1",
    )
    .fill(
      `Updated page content ${width}`,
    );

  await page
    .getByLabel(
      "Icon",
    )
    .fill(
      "road-sign",
    );

  await page
    .getByLabel(
      "Display order",
    )
    .fill(
      "7",
    );

  await page
    .getByLabel(
      "Estimated minutes",
    )
    .fill(
      "18",
    );

  await expect(
    page.getByText(
      "Unsaved changes",
      {
        exact: true,
      },
    ),
  ).toBeVisible();

  await page
    .getByRole(
      "button",
      {
        name:
          "Save draft",
      },
    )
    .click();

  await expect
    .poll(
      () =>
        putPayloads.length,
    )
    .toBe(1);

  const request =
    putPayloads[0];

  expect(
    request.expectedRevision,
  ).toBe(0);

  expect(
    request.document.lesson
      .description.en,
  ).toBe(
    `Updated description ${width}`,
  );

  expect(
    request.document.pages[0]
      .content.en,
  ).toBe(
    `Updated page content ${width}`,
  );

  expect(
    request.document.lesson.icon,
  ).toBe(
    "road-sign",
  );

  expect(
    request.document.lesson
      .displayOrder,
  ).toBe(7);

  expect(
    request.document.lesson
      .estimatedMinutes,
  ).toBe(18);

  expect(
    request.document.lesson
      .lessonCode,
  ).toBe(
    lessonCode,
  );

  expect(
    request.document.lesson
      .title,
  ).toEqual(
    publishedDocument.lesson
      .title,
  );

  expect(
    request.document.lesson
      .isActive,
  ).toBe(true);

  expect(
    request.document
      .structuredSections,
  ).toEqual([]);

  expect(
    request.document.media,
  ).toEqual([]);

  expect(
    request.document
      .categoryLinks,
  ).toEqual([]);

  await expect(
    page.getByText(
      "R1",
    ).first(),
  ).toBeVisible();

  await expect(
    page.getByText(
      "Draft saved successfully.",
      {
        exact: true,
      },
    ),
  ).toBeVisible();

  await expect(
    page.getByText(
      "Saved",
      {
        exact: true,
      },
    ),
  ).toBeVisible();

  await expectNoOverflow(
    page,
  );

  await description.fill(
    `Unsaved navigation ${width}`,
  );

  page.once(
    "dialog",
    async (dialog) => {
      expect(
        dialog.type(),
      ).toBe(
        "confirm",
      );

      expect(
        dialog.message(),
      ).toContain(
        "unsaved draft changes",
      );

      await dialog.dismiss();
    },
  );

  await page
    .getByRole(
      "link",
      {
        name:
          "Back to lessons",
      },
    )
    .click();

  await expect(
    page,
  ).toHaveURL(
    new RegExp(
      `/admin/lessons/${lessonCode}/edit$`,
    ),
  );

  await expect(
    description,
  ).toHaveValue(
    `Unsaved navigation ${width}`,
  );

  expect(
    browserErrors,
  ).toEqual([]);

  expect(
    httpFailures,
  ).toEqual([]);
}

for (
  const width of [
    390,
    768,
    1440,
  ]
) {
  test(
    `lesson editor full save flow ${width}px`,
    async ({
      page,
    }) => {
      await runSuccessfulEditorFlow(
        page,
        width,
      );
    },
  );
}

test(
  "Arabic editor uses RTL content fields while other languages remain LTR",
  async ({
    page,
  }) => {
    const browserErrors =
      watchBrowserErrors(
        page,
      );

    const httpFailures =
      watchHttpFailures(
        page,
      );

    await page.setViewportSize({
      width: 390,
      height: 844,
    });

    await seedCookieConsent(
      page,
    );

    await installAdminSession(
      page,
    );

    await mockAdminShell(
      page,
    );

    await page.route(
      `**/api/proxy/admin/lessons/${lessonCode}`,
      (route) =>
        fulfillJson(
          route,
          makeLessonDetail(
            makeDraft(
              4,
            ),
          ),
        ),
    );

    await page.goto(
      `/ar/admin/lessons/${lessonCode}/edit`,
      {
        waitUntil:
          "domcontentloaded",
      },
    );

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "الأولوية والتقاطعات",
          level: 1,
        },
      ),
    ).toBeVisible();

    await expect(
      page.locator("html"),
    ).toHaveAttribute(
      "dir",
      "rtl",
    );

    const description =
      page.getByLabel(
        "وصف الدرس",
      );

    const pageContent =
      page.getByLabel(
        "محتوى الصفحة 1",
      );

    await expect(
      description,
    ).toHaveAttribute(
      "dir",
      "rtl",
    );

    await expect(
      pageContent,
    ).toHaveAttribute(
      "dir",
      "rtl",
    );

    await expect(
      description,
    ).toHaveValue(
      "وصف عربي للدرس",
    );

    await page
      .getByRole(
        "button",
        {
          name:
            "الإنجليزية",
        },
      )
      .click();

    await expect(
      description,
    ).toHaveAttribute(
      "dir",
      "ltr",
    );

    await expect(
      pageContent,
    ).toHaveAttribute(
      "dir",
      "ltr",
    );

    await expect(
      description,
    ).toHaveValue(
      "English lesson description",
    );

    await expectNoOverflow(
      page,
    );

    expect(
      httpFailures,
    ).toEqual([]);

    expect(
      browserErrors,
    ).toEqual([]);
  },
);

test(
  "409 conflict preserves local edits and blocks stale overwrite",
  async ({
    page,
  }) => {
    const browserErrors =
      watchBrowserErrors(
        page,
      );

    const httpFailures =
      watchHttpFailures(
        page,
        (
          status,
          url,
        ) =>
          status === 409 &&
          url.includes(
            `/admin/lessons/${lessonCode}/draft`,
          ),
      );

    let putCount = 0;

    await page.setViewportSize({
      width: 768,
      height: 900,
    });

    await seedCookieConsent(
      page,
    );

    await installAdminSession(
      page,
    );

    await mockAdminShell(
      page,
    );

    await page.route(
      `**/api/proxy/admin/lessons/${lessonCode}`,
      (route) =>
        fulfillJson(
          route,
          makeLessonDetail(
            makeDraft(
              4,
            ),
          ),
        ),
    );

    await page.route(
      `**/api/proxy/admin/lessons/${lessonCode}/draft`,
      async (route) => {
        if (
          route.request().method() ===
          "PUT"
        ) {
          putCount += 1;

          await fulfillJson(
            route,
            {
              message:
                "Draft revision conflict",
            },
            409,
          );

          return;
        }

        await route.fallback();
      },
    );


    await page.goto(
      `/admin/lessons/${lessonCode}/edit`,
      {
        waitUntil:
          "domcontentloaded",
      },
    );

    const content =
      page.getByLabel(
        "Page content 1",
      );

    await content.fill(
      "My local stale edit",
    );

    await page
      .getByRole(
        "button",
        {
          name:
            "Save draft",
        },
      )
      .click();

    await expect
      .poll(
        () => putCount,
      )
      .toBe(1);

    await expect(
      page.getByText(
        "A newer draft revision exists",
      ),
    ).toBeVisible();

    await expect(
      content,
    ).toHaveValue(
      "My local stale edit",
    );

    await expect(
      page.getByText(
        "R4",
      ).first(),
    ).toBeVisible();

    await expect(
      page.getByRole(
        "button",
        {
          name:
            "Save draft",
        },
      ),
    ).toBeDisabled();

    await expectNoOverflow(
      page,
    );

    expect(
      httpFailures,
    ).toEqual([]);

    expect(
      browserErrors,
    ).toEqual([]);
  },
);
