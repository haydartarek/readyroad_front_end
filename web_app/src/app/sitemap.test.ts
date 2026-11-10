import {
  getPublicLessons,
  getPublicTrafficSigns,
} from "@/lib/server/public-catalog";
import { getPublicArticles } from "@/lib/server/articles";
import sitemap, { dynamic } from "@/app/sitemap";
import { DEFAULT_APP_URL } from "@/lib/site-copy";

jest.mock("@/lib/server/public-catalog", () => ({
  getPublicLessons: jest.fn(),
  getPublicTrafficSigns: jest.fn(),
}));
jest.mock("@/lib/server/articles", () => ({
  getPublicArticles: jest.fn(),
}));

const mockedGetPublicLessons = jest.mocked(getPublicLessons);
const mockedGetPublicTrafficSigns = jest.mocked(getPublicTrafficSigns);
const mockedGetPublicArticles = jest.mocked(getPublicArticles);
const appUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;
const url = (pathname: string) => appUrl + pathname;
const STATIC_PUBLIC_PAGE_COUNT = 15;
const LOCALE_COUNT = 4;

describe("public sitemap", () => {
  it("is generated at runtime so production catalog routes are never omitted", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("includes canonical catalog and active sign-exam pages while excluding noindex auth pages", async () => {
    mockedGetPublicTrafficSigns.mockResolvedValue([
      { signCode: "A1a", routeCode: "A1a", exam1TotalQuestions: 8 },
      { signCode: "A1a", routeCode: "A1a", exam1TotalQuestions: 8 },
      { signCode: "B1", routeCode: "B1", exam1TotalQuestions: null },
    ] as Awaited<ReturnType<typeof getPublicTrafficSigns>>);
    mockedGetPublicLessons.mockResolvedValue([
      { lessonCode: "les-0", totalPages: 3 },
    ] as Awaited<ReturnType<typeof getPublicLessons>>);
    const articleSlugs = {
      EN: "safe-driving",
      NL: "veilig-rijden",
      FR: "conduite-sure",
      AR: "al-qiyada-al-amina",
    };
    mockedGetPublicArticles.mockImplementation(async (locale) => [{
      language: locale.toUpperCase(),
      slug: articleSlugs[locale.toUpperCase() as keyof typeof articleSlugs],
      title: "Localized article",
      summary: "Published summary",
      publishedAt: "2026-08-22T10:00:00Z",
      image: null,
      alternateSlugs: articleSlugs,
    }]);

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toHaveLength(
      (STATIC_PUBLIC_PAGE_COUNT + 2 + 1 + 1) * LOCALE_COUNT + LOCALE_COUNT,
    );
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((entryUrl) => new URL(entryUrl).origin === appUrl)).toBe(true);
    expect(urls).toContain(url("/about"));
    expect(urls).toContain(url("/faq"));
    expect(urls).toContain(url("/cookie-policy"));
    expect(urls).toContain(url("/disclaimer"));
    expect(urls).toContain(url("/videos"));
    expect(urls).toContain(url("/blog"));
    expect(urls).toContain(url("/practice"));
    expect(urls).toContain(url("/practice/random"));
    expect(urls).toContain(url("/exam"));
    expect(urls).toContain(url("/nl/practice"));
    expect(urls).toContain(url("/fr/practice/random"));
    expect(urls).toContain(url("/ar/exam"));
    expect(urls).toContain(url("/nl/videos"));
    expect(urls).toContain(url("/fr/videos"));
    expect(urls).toContain(url("/ar/videos"));
    expect(urls).toContain(url("/traffic-signs/A1a"));
    expect(urls).toContain(url("/traffic-signs/B1"));
    expect(urls).toContain(url("/traffic-signs/A1a/exam/1"));
    expect(urls).toContain(url("/nl/traffic-signs/A1a/exam/1"));
    expect(urls).toContain(url("/fr/traffic-signs/A1a/exam/1"));
    expect(urls).toContain(url("/ar/traffic-signs/A1a/exam/1"));
    expect(urls).not.toContain(url("/traffic-signs/B1/exam/1"));
    expect(urls).toContain(url("/lessons/les-0"));
    expect(urls).not.toContain(url("/nl/lessons/les-0/2"));
    expect(urls).toContain(url("/nl/lessons/les-0"));
    expect(urls).not.toContain(url("/fr/lessons/les-0/3"));
    expect(urls).toContain(url("/fr/lessons/les-0"));
    expect(urls).toContain(url("/ar/traffic-signs/B1"));
    expect(urls).toContain(url("/blog/safe-driving"));
    expect(urls).toContain(url("/nl/blog/veilig-rijden"));
    expect(urls).toContain(url("/fr/blog/conduite-sure"));
    expect(urls).toContain(url("/ar/blog/al-qiyada-al-amina"));
    const dutchArticle = entries.find(
      (entry) => entry.url === url("/nl/blog/veilig-rijden"),
    );
    expect(dutchArticle?.lastModified).toEqual(new Date("2026-08-22T10:00:00Z"));
    expect(dutchArticle?.alternates?.languages).toEqual({
      en: url("/blog/safe-driving"),
      "nl-BE": url("/nl/blog/veilig-rijden"),
      "fr-BE": url("/fr/blog/conduite-sure"),
      ar: url("/ar/blog/al-qiyada-al-amina"),
      "x-default": url("/blog/safe-driving"),
    });
    const dutchSignExam = entries.find(
      (entry) => entry.url === url("/nl/traffic-signs/A1a/exam/1"),
    );
    expect(dutchSignExam?.alternates?.languages).toEqual({
      en: url("/traffic-signs/A1a/exam/1"),
      "nl-BE": url("/nl/traffic-signs/A1a/exam/1"),
      "fr-BE": url("/fr/traffic-signs/A1a/exam/1"),
      ar: url("/ar/traffic-signs/A1a/exam/1"),
      "x-default": url("/traffic-signs/A1a/exam/1"),
    });
    expect(
      entries.every(
        (entry) =>
          entry.alternates?.languages?.["x-default"] &&
          entry.alternates.languages.en &&
          entry.alternates.languages["nl-BE"] &&
          entry.alternates.languages["fr-BE"] &&
          entry.alternates.languages.ar,
      ),
    ).toBe(true);
    expect(urls.some((entryUrl) => entryUrl.endsWith("/login"))).toBe(false);
    expect(urls.some((entryUrl) => entryUrl.endsWith("/register"))).toBe(false);
    expect(
      urls.some((entryUrl) => /\/(?:admin|api|dashboard|profile)(?:\/|$)/.test(entryUrl)),
    ).toBe(false);
    expect(
      entries
        .filter((entry) => !entry.url.includes("/blog/"))
        .some((entry) => "lastModified" in entry),
    ).toBe(false);
  });
});
