import { expect, test, type Page } from "@playwright/test";
import { localizeHref } from "../../src/lib/i18n-routing";
import { seedCookieConsent } from "./helpers/consent";

const purchaseId = "a43bfbd3-c959-4a6f-b23f-cf23064891b1";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3005";
const pending = { purchaseId, status: "PENDING", plan: "RIJVIA_3_DAYS", expiresAt: null };

async function prepare(page: Page) {
  await seedCookieConsent(page);
  const token = ["eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0",
    Buffer.from(JSON.stringify({ sub: "payment-fixture", role: "USER", exp: 2_000_000_000 })).toString("base64url"), "test-signature"].join(".");
  await page.context().addCookies([
    { name: "token", value: token, url: baseURL, httpOnly: true, sameSite: "Lax" },
    { name: "csrf_token", value: "payment-e2e", url: baseURL, sameSite: "Lax" },
  ]);
  await page.route("**/api/auth/me", route => route.fulfill({ json: {
    authenticated: true, user: { userId: 42, username: "payment-fixture", role: "USER" },
  } }));
  await page.route("**/api/proxy/users/me/**", route => route.fulfill({ json: { unreadCount: 0 } }));
}

test.beforeEach(async ({ page }) => prepare(page));

for (const width of [390, 1366]) {
  for (const [locale, title] of [["ar", "اختر الباقة المناسبة لك"], ["nl", "Kies het pakket dat bij je past"],
    ["fr", "Choisissez la formule qui vous convient"], ["en", "Choose the package that suits you"]] as const) {
    test(`homepage pricing ${locale} at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(localizeHref("/plans", locale));
      await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
      await expect.poll(() => new URL(page.url()).hash).toBe("#pricing");
      await expect(page.locator("#pricing").getByRole("button")).toHaveCount(3);
      await expect(page.locator("#pricing").getByRole("button").first()).toBeEnabled();
      await expect(page.locator("#pricing").getByText("€2.99", { exact: true })).toBeInViewport();
      await expect(page.locator("#pricing").getByText("€14.99", { exact: true })).toBeInViewport();
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (locale === "ar") await page.screenshot({ path: testInfo.outputPath(`pricing-ar-${width}.png`), fullPage: true });
    });
  }
}

test("plan -> hosted checkout -> pending -> paid, retaining Arabic route and owned purchase", async ({ page }) => {
  let polls = 0;
  await page.route("**/api/proxy/checkout", async route => {
    expect(route.request().postDataJSON()).toEqual({ plan: "RIJVIA_3_DAYS", clientRequestId: expect.stringMatching(/^[0-9a-f-]{36}$/) });
    expect(route.request().headers()["accept-language"]).toBe("ar");
    await route.fulfill({ json: { purchaseId, checkoutUrl: "https://checkout.stripe.com/c/pay/rijvia-offline-fixture" } });
  });
  await page.route("https://checkout.stripe.com/c/pay/rijvia-offline-fixture", route => route.fulfill({
    contentType: "text/html", body: `<a href="${baseURL}/ar/checkout/success?purchaseId=${purchaseId}&session_id=untrusted">Return to Rijvia</a>`,
  }));
  await page.route(`**/api/proxy/purchases/${purchaseId}/status`, route => route.fulfill({ json: ++polls === 1 ? pending : {
    ...pending, status: "PAID", expiresAt: "2026-10-01T14:00:00+02:00",
  } }));
  await page.goto("/ar#pricing");
  await page.getByRole("button", { name: "اختر هذه الباقة: 3 أيام" }).click();
  await expect(page).toHaveURL("https://checkout.stripe.com/c/pay/rijvia-offline-fixture");
  const firstStatus = page.waitForResponse(response => response.url().endsWith(`/purchases/${purchaseId}/status`));
  const paidStatus = page.waitForResponse(async response =>
    response.url().endsWith(`/purchases/${purchaseId}/status`) && (await response.json()).status === "PAID",
  );
  await page.getByRole("link", { name: "Return to Rijvia" }).click();
  expect(await (await firstStatus).json()).toEqual(pending);
  await expect(page.getByText("جارٍ تأكيد دفعتك…", { exact: true })).toBeVisible();
  await paidStatus;
  await expect(page.getByText("تم تأكيد الدفع.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "ابدأ التدريب", exact: true })).toHaveAttribute("href", "/ar/practice");
  await expect(page.getByRole("link", { name: "ابدأ محاكي الامتحان", exact: true })).toHaveAttribute("href", "/ar/exam");
  expect(polls).toBe(2);
});

test("cancelled checkout returns to homepage pricing and invalid links remain safe", async ({ page }) => {
  await page.goto(`/fr/checkout/cancel?purchaseId=${purchaseId}`);
  await expect(page.getByRole("heading", { name: /Ne vous arrêtez pas au paiement/ })).toBeVisible();
  await page.getByRole("link", { name: "Choisir ma formule et continuer", exact: true }).click();
  await expect(page).toHaveURL(/\/fr#pricing$/);
  await page.goto("/fr/checkout/success?session_id=cs_fake&purchaseId=invalid");
  await expect(page.getByText(/Ce lien de paiement a expiré/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Retour aux formules", exact: true })).toHaveAttribute("href", "/fr#pricing");
});

test("pending after fifteen seconds remains a confirmation message", async ({ page }) => {
  await page.clock.install();
  await page.route(`**/api/proxy/purchases/${purchaseId}/status`, route => route.fulfill({ json: pending }));
  const firstPoll = page.waitForResponse(response => response.url().endsWith(`/purchases/${purchaseId}/status`));
  await page.goto(localizeHref(`/checkout/success?purchaseId=${purchaseId}&session_id=ignored`, "en"));
  await firstPoll;
  await expect(page.getByText("Confirming your payment…", { exact: true })).toBeVisible();
  await page.clock.fastForward(16_000);
  await expect(page.getByText(/We are still confirming your payment/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Start Training", exact: true })).toHaveCount(0);
});
