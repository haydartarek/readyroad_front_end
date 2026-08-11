import { expect, test, type Page } from "@playwright/test";

const adminUser = {
  id: 1,
  username: "admin",
  email: "admin@readyroad.test",
  role: "ADMIN",
};

const categories = [
  {
    code: "TH01",
    nameEn: "Priority and intersections",
    nameAr: "الأولوية والتقاطعات",
    nameNl: "Voorrang en kruispunten",
    nameFr: "Priorité et carrefours",
    contentScope: "THEORETICAL_EXAM",
  },
  {
    code: "TH02",
    nameEn: "Speed, roads and distances",
    nameAr: "السرعة والطرق والمسافات",
    nameNl: "Snelheid, wegen en afstanden",
    nameFr: "Vitesse, routes et distances",
    contentScope: "THEORETICAL_EXAM",
  },
];

const question = {
  id: 7,
  categoryCode: "TH01",
  difficultyLevel: "HARD",
  questionType: "MULTIPLE_CHOICE",
  questionEn: "Who has priority?",
  questionAr: "من له الأولوية؟",
  questionNl: "Wie heeft voorrang?",
  questionFr: "Qui a la priorité ?",
  explanationEn: "The vehicle from the right has priority.",
  explanationAr: "للمركبة القادمة من اليمين الأولوية.",
  explanationNl: "Het voertuig van rechts heeft voorrang.",
  explanationFr: "Le véhicule venant de droite a la priorité.",
  contentImageUrl: "/images/logo.png",
  isActive: true,
  isReferenced: true,
  options: [
    {
      id: 11,
      textEn: "Vehicle A",
      textAr: "المركبة أ",
      textNl: "Voertuig A",
      textFr: "Véhicule A",
      isCorrect: true,
      displayOrder: 1,
    },
    {
      id: 12,
      textEn: "Vehicle B",
      textAr: "المركبة ب",
      textNl: "Voertuig B",
      textFr: "Véhicule B",
      isCorrect: false,
      displayOrder: 2,
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
  await page.route("**/api/proxy/admin/quiz/categories", (route) =>
    route.fulfill({ json: categories }),
  );
  await page.route("**/api/proxy/admin/quiz/questions/7", (route) =>
    route.fulfill({ json: question }),
  );
  await page.route("**/api/proxy/admin/upload/image", (route) =>
    route.fulfill({ json: { url: "/images/logo.png" } }),
  );
  await page.route(
    "**/api/proxy/users/me/notifications/unread-count",
    (route) => route.fulfill({ json: { unreadCount: 0 } }),
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

test("Admin theoretical create and edit remain complete and responsive", async ({
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

  await page.goto("/admin/quizzes/new");
  await expect(page.getByLabel("Category *")).toHaveValue("");
  await expect(page.getByLabel("Category *").locator("option")).toHaveCount(3);
  await expect(page.getByLabel("Category *").locator("option")).toContainText([
    "Select a category...",
    "Priority and intersections",
    "Speed, roads and distances",
  ]);
  for (const language of ["English", "Arabic", "Dutch", "French"]) {
    await expect(page.getByLabel(`Explanation (${language})`)).toBeVisible();
  }

  await expect(page.getByText("A", { exact: true })).toBeVisible();
  await expect(page.getByText("B", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add Option" }).click();
  await expect(page.getByText("C", { exact: true })).toBeVisible();
  const englishOptions = page.getByLabel("Option (English) *");
  await englishOptions.nth(0).fill("First answer");
  await englishOptions.nth(1).fill("Second answer");
  await englishOptions.nth(2).fill("Third answer");
  await page.getByRole("button", { name: "Move option up" }).nth(2).click();
  await expect(englishOptions.nth(1)).toHaveValue("Third answer");
  await expect(englishOptions.nth(2)).toHaveValue("Second answer");
  await expect(page.getByLabel("Difficulty Level")).toHaveValue("EASY");
  await page.getByLabel("Difficulty Level").selectOption("HARD");
  await page.getByRole("button", { name: /^Remove C$/ }).click();
  await page.getByRole("button", { name: "Add Option" }).click();
  await expect(page.getByLabel("Difficulty Level")).toHaveValue("HARD");
  await expect(page.getByLabel("Question Type")).toHaveCount(0);

  await page.locator('input[type="file"]').setInputFiles({
    name: "question.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nQAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await expect(
    page.getByRole("button", { name: /remove image/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /remove image/i }).click();
  await expect(page.getByRole("button", { name: /remove image/i })).toHaveCount(
    0,
  );
  await expectNoPageOverflow(page);

  await page.goto("/admin/quizzes/7/edit");
  await expect(page.getByLabel("Category *")).toBeEnabled();
  await expect(page.getByLabel("Difficulty Level")).toBeEnabled();
  await expect(page.getByLabel("Question Type")).toHaveCount(0);
  await expect(page.getByLabel("Explanation (Arabic)")).toHaveValue(
    question.explanationAr,
  );
  await expect(
    page.getByRole("button", { name: /remove image/i }),
  ).toBeVisible();
  await expectNoPageOverflow(page);

  expect({ browserErrors, failedResponses }).toEqual({
    browserErrors: [],
    failedResponses: [],
  });
});

test("Admin keeps answer distribution read-only and exposes no shuffle controls", async ({
  page,
}) => {
  await mockAdmin(page);

  await page.route("**/api/proxy/admin/quiz/questions?*", (route) =>
    route.fulfill({
      json: {
        items: [question],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
      },
    }),
  );
  await page.route(
    "**/api/proxy/admin/quiz/correct-answer-distribution*",
    (route) =>
      route.fulfill({
        json: {
          total: 1,
          positions: [
            { label: "A", count: 1, percentage: 100 },
            { label: "B", count: 0, percentage: 0 },
            { label: "C", count: 0, percentage: 0 },
          ],
        },
      }),
  );
  await page.goto("/admin/quizzes");
  await expect(page.getByText("Correct Answer Distribution")).toBeVisible();
  await expect(
    page.getByRole("table").getByText("Priority and intersections"),
  ).toBeVisible();
  await expect(page.getByText("TH01", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /shuffle/i })).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
});

const navigationByLocale = [
  {
    path: "/",
    labels: [
      "Home",
      "Driving Licence Lessons",
      "Study Traffic Signs",
      "Traffic Sign Practice",
      "Theory Exam Simulator",
    ],
    openMenu: "Open navigation menu",
  },
  {
    path: "/ar",
    labels: [
      "الرئيسية",
      "دروس رخصة السياقة",
      "دراسة العلامات المرورية",
      "تدريب العلامات المرورية",
      "محاكي الامتحان النظري",
    ],
    openMenu: "فتح قائمة التنقل",
  },
  {
    path: "/nl",
    labels: [
      "Home",
      "Rijbewijslessen",
      "Verkeersborden leren",
      "Verkeersborden oefenen",
      "Theorie-examensimulator",
    ],
    openMenu: "Navigatiemenu openen",
  },
  {
    path: "/fr",
    labels: [
      "Accueil",
      "Cours du permis de conduire",
      "Étudier les panneaux routiers",
      "Entraînement aux panneaux routiers",
      "Simulateur d’examen théorique",
    ],
    openMenu: "Ouvrir le menu de navigation",
  },
] as const;

for (const locale of navigationByLocale) {
  test(`Navigation order and responsive behavior: ${locale.path}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    const failedResponses: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400) {
        failedResponses.push(`${response.status()} ${response.url()}`);
      }
    });
    await page.route("**/api/proxy/categories", (route) =>
      route.fulfill({ json: [] }),
    );

    const desktop = page.getByTestId("desktop-primary-navigation");
    for (const width of [1280, 1366, 1440, 1536, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(locale.path);
      await page.evaluate(() => document.fonts.ready);
      await expect(desktop).toBeVisible();
      await expect(
        page.getByRole("button", { name: locale.openMenu }),
      ).toBeHidden();
      const labels = await desktop.locator("a").allTextContents();
      expect(labels.slice(0, 5).map((label) => label.trim())).toEqual(
        locale.labels,
      );
      const navigationFit = await desktop.evaluate((navigation) => {
        const navigationRect = navigation.getBoundingClientRect();
        const links = Array.from(navigation.querySelectorAll("a")).map((link) =>
          link.getBoundingClientRect(),
        );
        return {
          left: Math.min(...links.map((link) => link.left)),
          right: Math.max(...links.map((link) => link.right)),
          containerLeft: navigationRect.left,
          containerRight: navigationRect.right,
        };
      });
      expect(navigationFit.left).toBeGreaterThanOrEqual(
        navigationFit.containerLeft - 0.5,
      );
      expect(navigationFit.right).toBeLessThanOrEqual(
        navigationFit.containerRight + 0.5,
      );
      const actionOverlap = await page.evaluate(() => {
        const navigation = document.querySelector(
          '[data-testid="desktop-primary-navigation"]',
        );
        const actions = document.querySelector(
          '[data-testid="navbar-actions"]',
        );
        if (!navigation || !actions) return Number.POSITIVE_INFINITY;
        const navigationRect = navigation.getBoundingClientRect();
        const actionsRect = actions.getBoundingClientRect();
        return Math.max(
          0,
          Math.min(navigationRect.right, actionsRect.right) -
            Math.max(navigationRect.left, actionsRect.left),
        );
      });
      expect(actionOverlap).toBeLessThanOrEqual(0.5);
      await expect(
        desktop.getByRole("link", { name: /FAQ|الأسئلة الشائعة/ }),
      ).toHaveCount(0);
      const searchTrigger = page.getByRole("button", {
        name: /Search|بحث|Zoeken|Rechercher/,
      });
      await expect(searchTrigger).toBeVisible();
      await searchTrigger.click();
      await expect(
        page.getByRole("textbox", { name: /Search|بحث|Zoeken|Rechercher/ }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expectNoPageOverflow(page);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(desktop).toBeHidden();
    await page.getByRole("button", { name: locale.openMenu }).click();
    const mobile = page.getByTestId("mobile-navigation-dialog");
    await expect(mobile).toBeVisible();
    const mobileLabels = await mobile.locator("a").allTextContents();
    for (const label of locale.labels) {
      expect(mobileLabels.map((item) => item.trim())).toContain(label);
    }
    await expect(
      mobile.getByRole("link", { name: /FAQ|الأسئلة الشائعة/ }),
    ).toHaveCount(0);
    await expectNoPageOverflow(page);
    expect({ errors, failedResponses }).toEqual({
      errors: [],
      failedResponses: [],
    });
  });
}
