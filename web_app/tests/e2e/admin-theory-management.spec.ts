import { expect, test, type Page } from "@playwright/test";

const adminUser = {
  id: 1,
  username: "admin",
  email: "admin@readyroad.test",
  role: "ADMIN",
};

const categories = [
  {
    code: "RULES",
    nameEn: "Traffic rules",
    nameAr: "قواعد المرور",
    nameNl: "Verkeersregels",
    nameFr: "Règles de circulation",
  },
];

const question = {
  id: 7,
  categoryCode: "RULES",
  difficultyLevel: "EASY",
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
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
    "base64url",
  );
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
  await page.route("**/api/proxy/users/me/notifications/unread-count", (route) =>
    route.fulfill({ json: { unreadCount: 0 } }),
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
  await expect(page.getByLabel("Category *").locator("option")).toHaveCount(2);
  for (const language of ["English", "Arabic", "Dutch", "French"]) {
    await expect(page.getByLabel(`Explanation (${language})`)).toBeVisible();
  }

  await expect(page.getByText("A", { exact: true })).toBeVisible();
  await expect(page.getByText("B", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add Option" }).click();
  await expect(page.getByText("C", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Difficulty Level")).toHaveValue("MEDIUM");
  await page.getByLabel("Difficulty Level").selectOption("HARD");
  await page.getByRole("button", { name: /^Remove C$/ }).click();
  await page.getByRole("button", { name: "Add Option" }).click();
  await expect(page.getByLabel("Difficulty Level")).toHaveValue("HARD");
  await expect(page.getByLabel("Question Type")).toHaveValue(
    "MULTIPLE_CHOICE",
  );

  await page.locator('input[type="file"]').setInputFiles({
    name: "question.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nQAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await expect(page.getByRole("button", { name: /remove image/i })).toBeVisible();
  await page.getByRole("button", { name: /remove image/i }).click();
  await expect(page.getByRole("button", { name: /remove image/i })).toHaveCount(0);
  await expectNoPageOverflow(page);

  await page.goto("/admin/quizzes/7/edit");
  await expect(page.getByLabel("Category *")).toBeEnabled();
  await expect(page.getByLabel("Difficulty Level")).toBeEnabled();
  await expect(page.getByLabel("Question Type")).toBeEnabled();
  await expect(page.getByLabel("Explanation (Arabic)")).toHaveValue(
    question.explanationAr,
  );
  await expect(page.getByRole("button", { name: /remove image/i })).toBeVisible();
  await expectNoPageOverflow(page);

  expect({ browserErrors, failedResponses }).toEqual({
    browserErrors: [],
    failedResponses: [],
  });
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

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(locale.path);
    const desktop = page.getByTestId("desktop-primary-navigation");
    await expect(desktop).toBeVisible();
    const labels = await desktop.locator("a").allTextContents();
    expect(labels.slice(0, 5).map((label) => label.trim())).toEqual(
      locale.labels,
    );
    await expectNoPageOverflow(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(desktop).toBeHidden();
    await page.getByRole("button", { name: locale.openMenu }).click();
    const mobile = page.getByTestId("mobile-navigation-dialog");
    await expect(mobile).toBeVisible();
    const mobileLabels = await mobile.locator("a").allTextContents();
    for (const label of locale.labels) {
      expect(mobileLabels.map((item) => item.trim())).toContain(label);
    }
    await expectNoPageOverflow(page);
    expect({ errors, failedResponses }).toEqual({
      errors: [],
      failedResponses: [],
    });
  });
}
