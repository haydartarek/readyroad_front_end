import {
  buildAbsoluteUrl,
  normalizeSeoBrand,
  serializeJsonLd,
  toMetadataDescription,
  toBrandedMetadataTitle,
} from "@/lib/seo";

describe("SEO helpers", () => {
  it.each([
    ["Article", "Article | Rijvia"],
    ["Article | RijVia", "Article | Rijvia"],
    ["Article - Rijvia", "Article | Rijvia"],
    ["Article \u2013 Rijvia", "Article | Rijvia"],
    ["Article \u2014 Rijvia", "Article | Rijvia"],
    ["Article | Rijvia", "Article | Rijvia"],
    ["Article | Rijvia | Rijvia", "Article | Rijvia"],
    ["A long-term plan", "A long-term plan | Rijvia"],
    ["Section ‹ Topic > Rijvia", "Section | Topic | Rijvia"],
  ])("normalizes the brand separator without changing content: %s", (input, expected) => {
    expect(toBrandedMetadataTitle(input)).toBe(expected);
  });

  it("normalizes legacy brand casing in SEO text", () => {
    expect(normalizeSeoBrand("RijVia helps learners")).toBe(
      "Rijvia helps learners",
    );
  });

  it("builds absolute URLs and encodes spaces", () => {
    expect(
      buildAbsoluteUrl(
        "/images/signs/danger signs/A1a sign.png",
        "https://example.test",
      ),
    ).toBe(
      "https://example.test/images/signs/danger%20signs/A1a%20sign.png",
    );
  });

  it("normalizes and truncates metadata descriptions", () => {
    expect(toMetadataDescription("  One   two  ", "Fallback", 20)).toBe(
      "One two",
    );
    expect(toMetadataDescription("A".repeat(30), "Fallback", 20)).toBe(
      `${"A".repeat(17)}...`,
    );
  });

  it("escapes HTML opening characters in JSON-LD", () => {
    expect(serializeJsonLd({ name: "</script>" })).toContain("\\u003c/script>");
  });
});
