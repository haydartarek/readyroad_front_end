import { expect, test, type APIResponse } from "@playwright/test";

const localePrefixes = ["", "/ar", "/nl", "/fr"] as const;

function unlocalizedLessonPath(href: string): string {
  const pathname = new URL(href, "http://localhost").pathname;
  return pathname.replace(/^\/(?:ar|nl|fr)(?=\/)/, "");
}

async function expectLessonDocument(response: APIResponse) {
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('"@type":"LearningResource"');
  expect(html).not.toContain('"@type":"FAQPage"');
}

test("a lesson card opens its matching lesson instead of FAQ content", async ({
  page,
}) => {
  const response = await page.goto("/lessons");
  expect(response?.status()).toBe(200);

  const firstLessonLink = page.locator('a[href*="/lessons/"]').first();
  await expect(firstLessonLink).toBeVisible();
  const href = await firstLessonLink.getAttribute("href");
  expect(href).toBeTruthy();

  await firstLessonLink.click();
  await expect(page).toHaveURL(new RegExp(`${unlocalizedLessonPath(href!)}$`));

  const schemas = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(schemas.join("\n")).toContain('"@type":"LearningResource"');
  expect(schemas.join("\n")).not.toContain('"@type":"FAQPage"');
});

test("all live lesson routes resolve to lessons in every locale", async ({
  page,
  request,
}) => {
  test.skip(
    process.env.PLAYWRIGHT_LIVE_LESSONS !== "true",
    "Requires the explicitly configured local RijVia stack.",
  );

  const response = await page.goto("/lessons");
  expect(response?.status()).toBe(200);
  const hrefs = await page.locator('a[href*="/lessons/"]').evaluateAll((links) =>
    Array.from(
      new Set(
        links
          .map((link) => link.getAttribute("href"))
          .filter((href): href is string => Boolean(href)),
      ),
    ),
  );
  expect(hrefs.length).toBeGreaterThan(0);

  for (const href of hrefs) {
    const lessonPath = unlocalizedLessonPath(href);
    for (const prefix of localePrefixes) {
      const lessonResponse = await request.get(`${prefix}${lessonPath}`);
      await expectLessonDocument(lessonResponse);
    }
  }
});
