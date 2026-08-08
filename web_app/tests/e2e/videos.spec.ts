import { expect, test, type Page, type Route } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const channel = {
  id: "UC-readyroad",
  handle: "@RijBewijsBe",
  title: "ReadyRoad",
  description: "Belgian driving theory videos",
  thumbnail: null,
  uploadsPlaylistId: "UU-readyroad",
  url: "https://www.youtube.com/@RijBewijsBe/featured",
};

function video(videoId: string, title: string, publishedAt: string) {
  return {
    videoId,
    title,
    description: `${title} explains a Belgian traffic rule with a practical example.`,
    publishedAt,
    thumbnail: { url: "/images/logo.png", width: 512, height: 512 },
    channelTitle: "ReadyRoad",
    position: 0,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
  };
}

const firstPage = {
  channel,
  videos: [
    video("aaaaaaaaaaa", "Belgian priority rules", "2026-08-01T10:00:00Z"),
    video("bbbbbbbbbbb", "Traffic signs explained", "2026-07-25T10:00:00Z"),
    video("ccccccccccc", "Theory exam practice", "2026-07-18T10:00:00Z"),
    video("ddddddddddd", "Safe driving lesson", "2026-07-11T10:00:00Z"),
  ],
  nextPageToken: "NEXT_PAGE",
  stale: false,
};

const secondPage = {
  channel,
  videos: [
    firstPage.videos[3],
    video("eeeeeeeeeee", "Road marking lesson", "2026-07-04T10:00:00Z"),
    video("fffffffffff", "Speed limits in Belgium", "2026-06-27T10:00:00Z"),
  ],
  nextPageToken: null,
  stale: false,
};

async function fulfillJson(route: Route, body: unknown) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function prepareVideos(page: Page) {
  await seedCookieConsent(page);
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Unauthorized" }),
    }),
  );
  await page.route(/\/api\/youtube\/videos(?:\?.*)?$/, (route) => {
    const pageToken = new URL(route.request().url()).searchParams.get(
      "pageToken",
    );
    return fulfillJson(route, pageToken ? secondPage : firstPage);
  });
}

async function loadMockVideos(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  await page.getByTestId("videos-retry").click();
  await expect(
    page.getByRole("heading", {
      name: firstPage.videos[0].title,
      exact: true,
    }),
  ).toBeVisible();
}

test.describe("multilingual YouTube videos page", () => {
  test.beforeEach(async ({ page }) => {
    await prepareVideos(page);
  });

  test("loads cached-style pages, prevents duplicates, and embeds only on demand", async ({
    page,
  }) => {
    await loadMockVideos(page, "/videos");

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/videos$/,
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="x-default"]'),
    ).toHaveAttribute("href", /\/videos$/);
    await expect(page.getByTestId("youtube-player")).toHaveCount(0);
    await expect(page.getByTestId("video-card")).toHaveCount(3);

    await page.getByTestId("videos-load-more").click();
    await expect(
      page.getByRole("heading", {
        name: secondPage.videos[2].title,
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByTestId("video-card")).toHaveCount(5);

    await page
      .getByRole("button", {
        name: new RegExp(`Watch video: ${firstPage.videos[0].title}`),
      })
      .click();
    const player = page.getByTestId("youtube-player");
    await expect(player).toHaveAttribute(
      "src",
      `https://www.youtube-nocookie.com/embed/${firstPage.videos[0].videoId}?rel=0`,
    );
    await expect(player).toHaveAttribute("loading", "lazy");

    const html = await page.content();
    expect(html).not.toContain("YOUTUBE_API_KEY");
    expect(html).not.toContain("googleapis.com/youtube/v3");
  });

  test("uses videos as the single header destination and preserves the route when switching language", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await loadMockVideos(page, "/videos");

    const desktopNavigation = page.getByTestId("desktop-primary-navigation");
    const desktopVideosLink = desktopNavigation.getByRole("link", {
      name: "Driving Videos",
    });
    await expect(desktopVideosLink).toHaveCount(1);
    await expect(desktopVideosLink).toHaveAttribute("href", "/videos");
    await expect(desktopVideosLink).toHaveClass(/bg-primary/);
    await expect(
      desktopNavigation.getByRole("link", { name: "About" }),
    ).toHaveCount(0);
    await expect(
      page.locator('footer a[href="/videos"]'),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Choose language" }).click();
    await page.getByRole("menuitem").filter({ hasText: "العربية" }).click();
    await expect(page).toHaveURL(/\/ar\/videos$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.waitForLoadState("networkidle");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "فتح قائمة التنقل" }).click();
    const mobileNavigation = page.getByTestId("mobile-navigation-dialog");
    await expect(mobileNavigation).toBeVisible();
    const mobileVideosLink = mobileNavigation.getByRole("link", {
      name: "فيديوهات تعليم السياقة",
    });
    await expect(mobileVideosLink).toHaveCount(1);
    await expect(mobileVideosLink).toHaveAttribute("href", "/ar/videos");
    await expect(
      mobileNavigation.getByRole("link", { name: "عن المنصة" }),
    ).toHaveCount(0);
    await expect(
      page.locator('footer a[href="/ar/videos"]'),
    ).toHaveCount(0);
    await expect(page.locator("html")).toHaveJSProperty("scrollWidth", 390);
  });

  test("preserves RTL/LTR and contains every supported mobile and desktop viewport", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const locales = [
      { path: "/videos", title: "Belgian Driving Theory Videos", dir: "ltr" },
      {
        path: "/nl/videos",
        title: "Video’s voor het Belgisch theorie-examen",
        dir: "ltr",
      },
      {
        path: "/fr/videos",
        title: "Vidéos pour l’examen théorique belge",
        dir: "ltr",
      },
      {
        path: "/ar/videos",
        title: "فيديوهات تعليم السياقة في بلجيكا",
        dir: "rtl",
      },
    ] as const;

    for (const locale of locales) {
      await page.setViewportSize({ width: 390, height: 900 });
      await loadMockVideos(page, locale.path);
      await expect(
        page.getByRole("heading", { level: 1, name: locale.title }),
      ).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("dir", locale.dir);

      for (const width of [320, 375, 390, 428, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const measurements = await page.evaluate(() => {
          const overflowElements = [...document.querySelectorAll<HTMLElement>(
            '[data-testid="video-card"], [data-testid="videos-grid"], main button, main img',
          )]
            .filter((element) => getComputedStyle(element).position !== "fixed")
            .map((element) => ({
              tag: element.tagName,
              left: element.getBoundingClientRect().left,
              right: element.getBoundingClientRect().right,
            }))
            .filter(
              (element) =>
                element.left < -1 || element.right > window.innerWidth + 1,
            );

          return {
            innerWidth: window.innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            overflowElements,
          };
        });

        expect(measurements, `${locale.path} at ${width}px`).toEqual({
          innerWidth: width,
          documentWidth: width,
          bodyWidth: width,
          overflowElements: [],
        });
      }
    }
  });
});
