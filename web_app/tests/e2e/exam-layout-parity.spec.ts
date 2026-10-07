import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const locales = ["en", "ar", "nl", "fr"] as const;
const cases = [
  { kind: "simulator", route: "/exam/42" },
  { kind: "category", route: "/exam?category=TH07" },
  { kind: "sign-1", route: "/traffic-signs/A1b/exam/1" },
  { kind: "sign-2", route: "/traffic-signs/A1b/exam/2" },
  { kind: "mixed", route: "/practice/random" },
] as const;
const image = "/icons/icon-maskable-192.png";
const text = { en: "Check every approaching road user before you continue.",
  ar: "تحقق من جميع مستخدمي الطريق الذين يقتربون قبل مواصلة السير.",
  nl: "Controleer alle naderende weggebruikers voordat je verder rijdt.",
  fr: "Vérifiez tous les usagers de la route qui approchent avant de continuer." };
const options = [
  { en: "Reduce speed and check whether it is safe to continue.",
    ar: "خفف السرعة وتحقق من إمكانية مواصلة السير بأمان.",
    nl: "Verminder je snelheid en controleer of je veilig verder kunt rijden.",
    fr: "Réduisez votre vitesse et vérifiez si vous pouvez continuer sans danger." },
  { en: "Continue only after checking every approaching road user and giving priority when required.",
    ar: "واصل السير بعد التحقق من جميع مستخدمي الطريق القادمين وإعطاء الأولوية عند الحاجة.",
    nl: "Rijd pas verder nadat je alle naderende weggebruikers hebt gecontroleerd en waar nodig voorrang hebt verleend.",
    fr: "Continuez seulement après avoir vérifié tous les usagers qui approchent et donné la priorité si nécessaire." },
  { en: "Wait until the road is clear.", ar: "انتظر حتى يصبح الطريق خاليًا.",
    nl: "Wacht tot de weg vrij is.", fr: "Attendez que la route soit libre." },
];
const category = { categoryCode: "TH07", nameEn: "Technical safety", nameAr: "السلامة التقنية",
  nameNl: "Technische veiligheid", nameFr: "Sécurité technique", questionCount: 3,
  primary: true, displayOrder: 1 };
const sign = { id: 1, signCode: "A1b", routeCode: "A1b", categoryCode: "A", imageUrl: image,
  nameEn: "Dangerous bend", nameAr: "منعطف خطير", nameNl: "Gevaarlijke bocht", nameFr: "Virage dangereux" };
const questionBank = [1, 2, 3].map((id) => ({ id, questionRef: `qa-${id}`, signCode: "A1b",
  difficulty: "MEDIUM", showSign: true, imagePath: image, signImagePath: image,
  questionEn: text.en, questionAr: text.ar, questionNl: text.nl, questionFr: text.fr,
  choices: options.map((option, index) => ({ id: id * 10 + index + 1,
    textEn: option.en, textAr: option.ar, textNl: option.nl, textFr: option.fr })),
}));

async function installFixtures(page: Page) {
  const user = { userId: 42, username: "exam_layout_qa", fullName: "Exam layout QA",
    email: "exam.layout@example.test", role: "STUDENT", preferredLanguage: null,
    isActive: true, createdAt: "2026-01-01T00:00:00Z" };
  const token = [ { alg: "none", typ: "JWT" },
    { sub: user.username, role: user.role, exp: Math.floor(Date.now() / 1000) + 3600 } ]
    .map((part) => Buffer.from(JSON.stringify(part)).toString("base64url")).join(".");
  const domain = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000").hostname;
  await page.context().addCookies([
    { name: "token", value: `${token}.quality-assurance`, domain, path: "/", httpOnly: true, sameSite: "Lax" },
    { name: "csrf_token", value: "exam-layout-qa", domain, path: "/", sameSite: "Lax" },
  ]);
  await seedCookieConsent(page);
  await page.route("**/api/auth/me", (route) => route.fulfill({ json: user }));
  const startedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 3600000).toISOString();
  const simulator = { examId: 42, startedAt, expiresAt, status: "IN_PROGRESS", totalQuestions: 3,
    accessMode: "FULL", accessState: "FULL_ACTIVE", timeLimitSeconds: 3600,
    questions: questionBank.map((question) => ({ questionId: question.id, questionOrder: question.id,
      questionTextEn: question.questionEn, questionTextAr: question.questionAr,
      questionTextNl: question.questionNl, questionTextFr: question.questionFr,
      imageUrl: image, difficultyLevel: question.difficulty,
      options: question.choices.map((choice) => ({ optionId: choice.id,
        optionTextEn: choice.textEn, optionTextAr: choice.textAr, optionTextNl: choice.textNl, optionTextFr: choice.textFr })),
    })),
  };
  await page.route("**/api/proxy/**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/account/access")) return route.fulfill({ json: {
      active: true, unlimited: false, status: "ACTIVE", plan: "RIJVIA_1_WEEK", expiresAt,
    } });
    if (pathname.endsWith("/exams/simulations/active")) return route.fulfill({ json: { hasActiveExam: true, activeExam: simulator } });
    if (/\/exams\/simulations\/42\/questions\/\d+\/answer$/.test(pathname)) return route.fulfill({ json: { accessState: "FULL_ACTIVE" } });
    if (pathname.endsWith("/TH07/summary")) return route.fulfill({ json: category });
    if (pathname.endsWith("/TH07/exam")) return route.fulfill({ json: { category, serverTime: new Date().toISOString(),
      questions: questionBank.map((question) => ({ ...question, contentImageUrl: image,
        difficultyLevel: question.difficulty, options: question.choices.map((choice) => ({ id: choice.id,
          optionTextEn: choice.textEn, optionTextAr: choice.textAr, optionTextNl: choice.textNl, optionTextFr: choice.textFr })) })),
    } });
    if (/\/TH07\/questions\/\d+\/answer$/.test(pathname)) return route.fulfill({ json: {
      questionId: Number(pathname.split("/").at(-2)), isCorrect: true, correctOptionId: 11,
    } });
    if (pathname.endsWith("/traffic-signs/A1b")) return route.fulfill({ json: sign });
    if (/\/sign-quiz\/exam\/A1b\/[12]$/.test(pathname)) return route.fulfill({ json: {
      signCode: "A1b", examNumber: Number(pathname.split("/").at(-1)), questions: questionBank,
    } });
    if (pathname.endsWith("/sign-quiz/random-practice")) return route.fulfill({ json: {
      sessionId: 42, status: "IN_PROGRESS", startedAt, expiresAt, totalQuestions: 3, passingScore: 2, questions: questionBank,
    } });
    if (pathname.endsWith("/notifications/unread-count")) return route.fulfill({ json: { unreadCount: 0 } });
    return route.fulfill({ json: [] });
  });
}

async function layout(page: Page) {
  return page.evaluate(() => {
    const element = (id: string) => document.querySelector(`[data-testid="${id}"]`)! as HTMLElement;
    const style = (id: string, properties: string[]) => {
      const computed = getComputedStyle(element(id));
      return Object.fromEntries(properties.map((property) => [property, computed.getPropertyValue(property)]));
    };
    const card = element("exam-main-card");
    const status = element("exam-status-card");
    const actions = element("exam-actions");
    const image = element("exam-question-image");
    return {
      nextInside: card.contains(element("exam-next")),
      actionsOutside: !card.contains(actions),
      statusBeforeActions: Boolean(status.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING),
      actionCount: actions.children.length,
      overflow: document.documentElement.scrollWidth > innerWidth,
      imageHeight: image.getBoundingClientRect().height,
      mediaLoaded: Array.from(image.querySelectorAll("img")).every((img) => img.complete && img.naturalWidth > 0),
      title: style("exam-question-title", ["font-size", "font-weight", "line-height", "text-align"]),
      question: style("exam-question-layout", ["gap", "padding-top", "padding-left", "grid-template-columns"]),
      options: style("exam-option-card", ["min-height", "padding-top", "padding-left", "border-radius"]),
      status: style("exam-status-card", ["padding-top", "padding-bottom", "border-radius"]),
      actions: style("exam-actions", ["grid-template-columns", "gap", "padding-top", "border-top-width"]),
      next: style("exam-next", ["height", "font-size", "font-weight", "border-radius", "box-shadow"]),
      image: style("exam-question-image", ["max-height", "padding-top", "padding-left", "border-radius"]),
    };
  });
}

for (const locale of locales) {
  test(`${locale}: every exam matches the simulator on mobile and desktop`, async ({ page }, testInfo: TestInfo) => {
    test.setTimeout(180000);
    await installFixtures(page);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      let baseline: Awaited<ReturnType<typeof layout>> | undefined;
      for (const item of cases) {
        await page.goto(`/${locale}${item.route}`);
        if (item.kind === "mixed") await page.getByTestId("sign-exam-start-button").click();
        await expect(page.getByTestId("exam-question-counter")).toHaveText("1 / 3");
        await expect(page.getByTestId("exam-question-title")).toHaveText(text[locale]);
        await expect(page.getByTestId("exam-option-card")).toHaveCount(3);
        await expect.poll(async () => (await layout(page)).mediaLoaded).toBe(true);
        const actual = await layout(page);
        expect(actual.nextInside, `${item.kind}: Next inside card`).toBe(true);
        expect(actual.actionsOutside, `${item.kind}: secondary actions outside card`).toBe(true);
        expect(actual.statusBeforeActions).toBe(true);
        expect(actual.actionCount).toBe(2);
        expect(actual.overflow, `${item.kind} ${width}px overflow`).toBe(false);
        if (width < 1024) expect(actual.imageHeight).toBeLessThanOrEqual(900 * 0.28 + 1);
        if (baseline) for (const part of ["title", "question", "options", "status", "actions", "next", "image"] as const) {
          expect(actual[part], `${item.kind} ${part} differs from simulator`).toEqual(baseline[part]);
        }
        else baseline = actual;
        if ((locale === "en" && width === 1280) || (locale === "ar" && width === 390)) {
          const screenshot = testInfo.outputPath(`${item.kind}-${locale}-${width}.png`);
          await page.screenshot({ path: screenshot, fullPage: true });
          await testInfo.attach(`${item.kind}-${width}`, { path: screenshot, contentType: "image/png" });
        }
        await page.getByTestId("exam-option-card").first().click();
        await expect(page.getByTestId("exam-next")).toBeEnabled();
        await page.getByTestId("exam-next").click();
        await expect(page.getByTestId("exam-question-counter")).toHaveText("2 / 3");
        await expect(page.getByTestId("exam-timer-slot")).toHaveCount(item.kind === "category" ? 0 : 1);
        expect(errors).toEqual([]);
      }
    }
  });
}

test("mixed exam opens the first question at the top after a scrolled intro", async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await installFixtures(page);
  for (const locale of locales) {
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/practice/random`);
      const start = page.getByTestId("sign-exam-start-button");
      await expect(start).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await start.click();
      const title = page.getByTestId("exam-question-title");
      await expect(title).toHaveText(text[locale]);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      const titleBox = await title.boundingBox();
      const navigationBox = await page.locator("nav").first().boundingBox();
      expect(titleBox!.y).toBeGreaterThanOrEqual(navigationBox!.y + navigationBox!.height);
      if ((locale === "en" && width === 1280) || (locale === "ar" && width === 390)) {
        const screenshot = testInfo.outputPath(`mixed-${locale}-${width}.png`);
        await page.screenshot({ path: screenshot, fullPage: true });
        await testInfo.attach(`mixed-${locale}-${width}`, { path: screenshot, contentType: "image/png" });
      }
    }
  }
});
