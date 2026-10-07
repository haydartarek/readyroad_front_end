import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const category = {
  categoryCode: "TH07", nameEn: "Technical safety", nameAr: "السلامة التقنية",
  nameNl: "Technische veiligheid", nameFr: "Sécurité technique",
  questionCount: 67, primary: true, displayOrder: 1,
};
const lesson = {
  id: 32, lessonCode: "les-31", displayOrder: 32,
  titleEn: "Car mechanics", titleAr: "تقنيات المركبة",
  titleNl: "Autotechniek", titleFr: "Technique automobile", categories: [category],
};

// Browser fixtures exercise the actual page; service/authorization and eligibility
// are independently covered by backend tests against isolated PostgreSQL.
async function session(context: BrowserContext, page: Page, baseURL: string,
  { role = "USER", active = true, unlimited = false, expiresIn = 3600 } = {}) {
  const user = { userId: 42, username: "category_exam_qa", fullName: "Category exam QA",
    email: "category.exam@example.test", role, preferredLanguage: null,
    isActive: true, createdAt: "2026-01-01T00:00:00Z" };
  const token = [
    { alg: "none", typ: "JWT" },
    { sub: user.username, role, exp: Math.floor(Date.now() / 1000) + 3600 },
  ].map((part) => Buffer.from(JSON.stringify(part)).toString("base64url")).join(".");
  await context.addCookies([
    { name: "token", value: `${token}.quality-assurance`, domain: new URL(baseURL).hostname,
      path: "/", httpOnly: true, sameSite: "Lax" },
    { name: "csrf_token", value: "category-exam-qa", domain: new URL(baseURL).hostname,
      path: "/", sameSite: "Lax" },
  ]);
  await seedCookieConsent(page);
  await page.route("**/api/auth/me", (route) => route.fulfill({ json: user }));
  let examRequests = 0;
  let answerRequests = 0;
  let expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  await page.route("**/api/proxy/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/account/access")) return route.fulfill({ json: {
      status: active ? "ACTIVE" : "EXPIRED", active, unlimited,
      plan: active && !unlimited ? "RIJVIA_3_DAYS" : null,
      expiresAt: unlimited ? null : expiresAt,
    } });
    if (path.endsWith("/lessons/home-overview")) return route.fulfill({ json: [lesson] });
    if (path.endsWith("/TH07/summary")) return route.fulfill({ json: category });
    if (path.endsWith("/TH07/exam")) {
      examRequests += 1;
      // Start a short expiry after delivery rather than depending on Next compilation time.
      if (expiresIn < 60) expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
      const questions = Array.from({ length: category.questionCount }, (_, i) => ({
        id: i + 1, questionEn: `Available question ${i + 1}`, questionAr: `السؤال المتاح ${i + 1}`,
        difficultyLevel: "EASY", options: [
          { id: 1000 + i * 2, optionTextEn: "Safe answer", optionTextAr: "الإجابة الآمنة" },
          { id: 1001 + i * 2, optionTextEn: "Other answer", optionTextAr: "إجابة أخرى" },
        ],
      }));
      return route.fulfill({ json: { category, questions, serverTime: new Date().toISOString() } });
    }
    if (path.match(/\/TH07\/questions\/\d+\/answer$/)) {
      answerRequests += 1;
      const questionId = Number(path.split("/").at(-2));
      return route.fulfill({ json: { questionId, isCorrect: true,
        correctOptionId: 1000 + (questionId - 1) * 2, explanationEn: "Safe driving." } });
    }
    if (path.endsWith("/notifications/unread-count")) return route.fulfill({ json: { unreadCount: 0 } });
    return route.fulfill({ json: [] });
  });
  return { examRequests: () => examRequests, answerRequests: () => answerRequests };
}

for (const access of ["FREE", "EXPIRED"] as const) {
  test(`${access} member sees existing purchase screen without receiving questions`, async ({ context, page, baseURL }) => {
    if (access === "EXPIRED") await page.setViewportSize({ width: 320, height: 780 });
    const requests = await session(context, page, baseURL!, { active: false, expiresIn: -1 });
    await page.goto(access === "EXPIRED" ? "/ar/exam?category=TH07" : "/en/exam?category=TH07");
    await expect(page.getByTestId("exam-paywall-RIJVIA_3_DAYS")).toBeVisible();
    await expect(page.getByTestId("exam-paywall-RIJVIA_1_WEEK")).toBeVisible();
    await expect(page.getByTestId("exam-paywall-RIJVIA_4_WEEKS")).toBeVisible();
    await expect(page.getByTestId("exam-question-title")).toHaveCount(0);
    expect(requests.examRequests()).toBe(0);
    if (access === "EXPIRED") await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
}

test("paid student answers the full category with no 50-question cap", async ({ context, page, baseURL }) => {
  const requests = await session(context, page, baseURL!, { role: "STUDENT" });
  await page.goto("/en/exam?category=TH07");
  await expect(page.getByTestId("exam-question-counter")).toHaveText("1 / 67");
  await page.getByRole("button", { name: /Safe answer/ }).click();
  await page.getByRole("button", { name: "Next question", exact: true }).click();
  await expect(page.getByTestId("exam-question-counter")).toHaveText("2 / 67");
  await expect(page.getByText("Safe driving.", { exact: true })).toHaveCount(0);
  expect(requests.examRequests()).toBe(1);
  expect(requests.answerRequests()).toBe(1);
});

for (const role of ["ADMIN", "MODERATOR"]) {
  test(`${role} has unlimited access without an expiry`, async ({ context, page, baseURL }) => {
    await page.setViewportSize({ width: 320, height: 780 });
    await session(context, page, baseURL!, { role, active: true, unlimited: true });
    await page.goto("/ar/exam?category=TH07");
    await expect(page.getByTestId("exam-question-counter")).toHaveText("1 / 67");
    await expect(page.getByTestId("exam-question-title")).toHaveText("السؤال المتاح 1");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test("homepage has adjacent reading and category exam links", async ({ context, page, baseURL }) => {
  await session(context, page, baseURL!);
  await page.goto("/en");
  // English links are canonical without a locale prefix. SSR initially renders
  // the real 32-lesson catalogue before the refreshed browser fixture arrives.
  const reading = page.getByRole("link", { name: "Read Lesson", exact: true })
    .and(page.locator('a[href="/lessons/les-31"]'));
  const exam = reading.locator("..").getByRole("link", { name: /^Start the .+ exam$/ });
  await expect(reading).toHaveAttribute("href", "/lessons/les-31");
  await expect(exam).toHaveAttribute("href", "/exam?category=TH07");
  expect(await page.locator("a a").count()).toBe(0);
  await exam.click();
  await expect(page.getByTestId("exam-question-counter")).toHaveText("1 / 67");
});
