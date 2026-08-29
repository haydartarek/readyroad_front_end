import { getSeoIntentCopy, type SeoIntentPage } from "@/lib/seo-intent-copy";
import type { SiteLocale } from "@/lib/site-copy";

const locales: SiteLocale[] = ["en", "nl", "fr", "ar"];
const pages: SeoIntentPage[] = [
  "home",
  "practice",
  "signExam",
  "theoryExam",
  "trafficSigns",
  "lessons",
];

describe("SEO intent copy", () => {
  test.each(locales)("covers all six public intents for %s", (locale) => {
    for (const page of pages) {
      const copy = getSeoIntentCopy(locale, page);
      expect(copy.heading.trim()).not.toBe("");
      expect(copy.body.trim()).not.toBe("");
      expect(copy.links.length).toBeGreaterThanOrEqual(3);
    }
  });

  test("keeps Arabic colloquial theory terms supportive instead of primary", () => {
    const home = getSeoIntentCopy("ar", "home");
    const exam = getSeoIntentCopy("ar", "theoryExam");

    expect(home.heading).not.toContain("تيوري");
    expect(home.body).toContain("امتحان التيوري");
    expect(exam.body).toContain("امتحان تيوري بلجيكا");
  });

  test("keeps traffic-sign reference intent separate from the test intent", () => {
    const nlReference = getSeoIntentCopy("nl", "trafficSigns");
    const nlTest = getSeoIntentCopy("nl", "signExam");

    expect(nlReference.heading).toContain("betekenis");
    expect(nlTest.heading).toContain("oefenen");
  });
});
