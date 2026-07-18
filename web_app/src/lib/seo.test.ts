import {
  buildAbsoluteUrl,
  serializeJsonLd,
  toMetadataDescription,
} from "@/lib/seo";

describe("SEO helpers", () => {
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
