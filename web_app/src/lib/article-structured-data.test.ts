import { createArticleStructuredData } from "@/lib/article-structured-data";
import type { SiteLocale } from "@/lib/site-copy";
import type { PublicArticle } from "@/lib/server/articles";

const article: PublicArticle = {
  language: "EN",
  slug: "safe-driving",
  title: "Safer driving in Belgium",
  summary: "Published summary",
  body: "Published body",
  metaTitle: "Safer driving in Belgium | RijVia",
  metaDescription: "Approved metadata description.",
  publishedAt: "2026-08-22T10:00:00Z",
  image: null,
  internalLinks: [],
  typography: {
    h1Size: "DEFAULT",
    h2Size: "DEFAULT",
    h3Size: "DEFAULT",
    h4Size: "DEFAULT",
    paragraphSize: "DEFAULT",
    textColor: "DEFAULT",
  },
  alternateSlugs: { EN: "safe-driving" },
};

function graphNodes(locale: SiteLocale) {
  const schema = createArticleStructuredData(article, locale, "RijVia articles");
  return schema["@graph"] as Array<Record<string, unknown>>;
}

describe("article structured data", () => {
  it.each([
    ["en", "en", "https://rijvia.be/blog/safe-driving"],
    ["nl", "nl-BE", "https://rijvia.be/nl/blog/safe-driving"],
    ["fr", "fr-BE", "https://rijvia.be/fr/blog/safe-driving"],
    ["ar", "ar", "https://rijvia.be/ar/blog/safe-driving"],
  ] as const)(
    "uses the published article and canonical %s route",
    (locale, language, canonical) => {
      const [posting] = graphNodes(locale);

      expect(posting).toMatchObject({
        "@type": "BlogPosting",
        "@id": `${canonical}#article`,
        url: canonical,
        headline: article.title,
        description: article.summary,
        datePublished: article.publishedAt,
        inLanguage: language,
        mainEntityOfPage: canonical,
        author: { "@id": "https://rijvia.be/#organization" },
        publisher: { "@id": "https://rijvia.be/#organization" },
        isPartOf: { "@id": "https://rijvia.be/#website" },
      });
    },
  );

  it("describes the localized breadcrumb path without inventing article data", () => {
    const [, breadcrumb] = graphNodes("nl");

    expect(breadcrumb).toEqual({
      "@type": "BreadcrumbList",
      "@id": "https://rijvia.be/nl/blog/safe-driving#breadcrumb",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "RijVia",
          item: "https://rijvia.be/nl",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "RijVia articles",
          item: "https://rijvia.be/nl/blog",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: article.title,
          item: "https://rijvia.be/nl/blog/safe-driving",
        },
      ],
    });
  });
});
