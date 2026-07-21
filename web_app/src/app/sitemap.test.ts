import {
  getPublicLessons,
  getPublicTrafficSigns,
} from "@/lib/server/public-catalog";
import sitemap from "@/app/sitemap";

jest.mock("@/lib/server/public-catalog", () => ({
  getPublicLessons: jest.fn(),
  getPublicTrafficSigns: jest.fn(),
}));

const mockedGetPublicLessons = jest.mocked(getPublicLessons);
const mockedGetPublicTrafficSigns = jest.mocked(getPublicTrafficSigns);
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://readyroad.be";

describe("public sitemap", () => {
  it("includes canonical catalog pages and excludes noindex auth pages", async () => {
    mockedGetPublicTrafficSigns.mockResolvedValue([
      { signCode: "A1a", routeCode: "A1a" },
      { signCode: "A1a", routeCode: "A1a" },
      { signCode: "B1", routeCode: "B1" },
    ] as Awaited<ReturnType<typeof getPublicTrafficSigns>>);
    mockedGetPublicLessons.mockResolvedValue([
      { lessonCode: "les-0" },
    ] as Awaited<ReturnType<typeof getPublicLessons>>);

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toHaveLength(13);
    expect(urls).toContain(`${appUrl}/about`);
    expect(urls).toContain(`${appUrl}/faq`);
    expect(urls).toContain(`${appUrl}/cookie-policy`);
    expect(urls).toContain(`${appUrl}/disclaimer`);
    expect(urls).toContain(`${appUrl}/traffic-signs/A1a`);
    expect(urls).toContain(`${appUrl}/traffic-signs/B1`);
    expect(urls).toContain(`${appUrl}/lessons/les-0`);
    expect(urls.some((url) => url.endsWith("/login"))).toBe(false);
    expect(urls.some((url) => url.endsWith("/register"))).toBe(false);
    expect(entries.some((entry) => "lastModified" in entry)).toBe(false);
  });
});
