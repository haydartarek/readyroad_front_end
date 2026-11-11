import { createArticleMetadata } from "@/lib/article-metadata";
import type { PublicArticle } from "@/lib/server/articles";

const slug = "hoeveel-vragen-theorie-examen-rijbewijs-b-belgie";
const title = "Hoeveel vragen heeft het theoretisch rijexamen in België?";
const summary = "Original article summary";
const seoTitle = "Theorie-examen B België: 50 vragen, 41/50 nodig | Rijvia";
const seoDescription = "Hoeveel vragen en punten heb je nodig voor het theorie-examen rijbewijs B in België? Ontdek de 50 vragen, de slaaggrens van 41/50 en hoe fouten meetellen.";
const article: PublicArticle = { language: "NL", slug, title, summary, publishedAt: "2026-09-02T12:00:00Z", image: null, body: "Test article body", metaTitle: title, metaDescription: summary, internalLinks: [], typography: { h1Size: "DEFAULT", h2Size: "DEFAULT", h3Size: "DEFAULT", h4Size: "DEFAULT", paragraphSize: "DEFAULT", textColor: "DEFAULT" }, alternateSlugs: { NL: slug, EN: "theory-exam-guide" } };

describe("Dutch theory exam CTR pilot", () => {
  it("uses the approved title and description for the selected Dutch article", () => {
    const metadata = createArticleMetadata(article, "nl");
    expect(metadata.title).toEqual({ absolute: seoTitle });
    expect(metadata.description).toBe(seoDescription);
    expect(metadata.openGraph?.title).toBe(seoTitle);
    expect(metadata.openGraph?.description).toBe(seoDescription);
    expect(metadata.twitter?.title).toBe(seoTitle);
    expect(metadata.twitter?.description).toBe(seoDescription);
  });
  it("preserves canonical and language alternates", () => {
    const metadata = createArticleMetadata(article, "nl");
    expect(metadata.alternates?.canonical).toBe("https://rijvia.be/nl/blog/" + slug);
    expect(metadata.alternates?.languages).toMatchObject({ "nl-BE": "https://rijvia.be/nl/blog/" + slug, en: "https://rijvia.be/blog/theory-exam-guide" });
  });
  it.each(["ar", "fr", "en"] as const)("preserves original metadata for %s", (locale) => {
    const metadata = createArticleMetadata(article, locale);
    expect(metadata.title).toEqual({ absolute: title + " | Rijvia" });
    expect(metadata.description).toBe(summary);
  });
  it("preserves other Dutch articles", () => {
    const metadata = createArticleMetadata({ ...article, slug: "another-article" }, "nl");
    expect(metadata.title).toEqual({ absolute: title + " | Rijvia" });
    expect(metadata.description).toBe(summary);
  });
});
