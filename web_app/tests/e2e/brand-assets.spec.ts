import { expect, test } from "@playwright/test";

function pngDimensions(buffer: Buffer) {
  expect(buffer.subarray(1, 4).toString("ascii")).toBe("PNG");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test.describe("ReadyRoad brand assets", () => {
  test("manifest, favicon, touch icon and install icons are valid", async ({
    request,
  }) => {
    const manifestResponse = await request.get("/manifest.json");
    expect(manifestResponse.status()).toBe(200);
    expect(manifestResponse.headers()["content-type"]).toContain(
      "application/json",
    );
    const manifest = await manifestResponse.json();

    expect(manifest.name).toBe("ReadyRoad - Belgian Driving Theory");
    expect(manifest.short_name).toBe("ReadyRoad");
    expect(manifest.icons).toHaveLength(4);

    for (const icon of manifest.icons) {
      const response = await request.get(icon.src);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("image/png");
      const [width, height] = icon.sizes.split("x").map(Number);
      expect(pngDimensions(await response.body())).toEqual({ width, height });
    }

    const favicon = await request.get("/favicon.ico");
    expect(favicon.status()).toBe(200);
    expect(favicon.headers()["content-type"]).toContain("image/x-icon");

    const appleIcon = await request.get("/apple-touch-icon.png");
    expect(appleIcon.status()).toBe(200);
    expect(pngDimensions(await appleIcon.body())).toEqual({
      width: 180,
      height: 180,
    });
  });

  test("home metadata exposes one coherent social preview", async ({
    page,
    request,
  }) => {
    await page.goto("/");

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "href",
      "/manifest.json",
    );
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      "href",
      "/apple-touch-icon.png",
    );

    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    const twitterImage = await page
      .locator('meta[name="twitter:image"]')
      .getAttribute("content");
    expect(ogImage).toBeTruthy();
    expect(twitterImage).toBe(ogImage);

    const socialPath = new URL(ogImage!).pathname;
    const socialResponse = await request.get(socialPath);
    expect(socialResponse.status()).toBe(200);
    expect(socialResponse.headers()["content-type"]).toContain("image/png");
    expect(pngDimensions(await socialResponse.body())).toEqual({
      width: 1200,
      height: 630,
    });
  });

  test("404 keeps ReadyRoad identity and noindex behavior", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");

    expect(response?.status()).toBe(404);
    await expect(page.locator('img[src*="logo.png"]').first()).toBeVisible();
    await expect(page.getByText("ReadyRoad", { exact: true }).first()).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/i,
    );
  });
});
