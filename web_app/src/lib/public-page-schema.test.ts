import {
  createBreadcrumbSchema,
  createFaqSchema,
  createPublicPageSchema,
} from "@/lib/public-page-schema";

describe("public page structured data", () => {
  const appUrl = "https://readyroad.example";

  it("creates absolute WebPage and breadcrumb entities", () => {
    const page = createPublicPageSchema({
      appUrl,
      path: "/about",
      title: "About ReadyRoad",
      description: "ReadyRoad public information.",
      language: "en",
      pageType: "AboutPage",
    });
    const breadcrumb = createBreadcrumbSchema({
      appUrl,
      path: "/about",
      homeLabel: "Home",
      currentLabel: "About ReadyRoad",
      language: "en",
    });

    expect(page).toEqual(
      expect.objectContaining({
        "@type": "AboutPage",
        url: `${appUrl}/about`,
        inLanguage: "en",
      }),
    );
    expect(breadcrumb.itemListElement).toHaveLength(2);
    expect(breadcrumb.itemListElement[1].item).toBe(`${appUrl}/about`);
    expect(() => JSON.parse(JSON.stringify([page, breadcrumb]))).not.toThrow();
  });

  it("uses the visible FAQ copy without adding rating or commercial claims", () => {
    const items = [
      { question: "Is ReadyRoad free?", answer: "ReadyRoad is free to use." },
    ];
    const schema = createFaqSchema(items, "en");
    const serialized = JSON.stringify(schema);

    expect(schema.mainEntity[0].name).toBe(items[0].question);
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe(items[0].answer);
    expect(serialized).not.toMatch(/aggregateRating|review|offers|price/i);
    expect(() => JSON.parse(serialized)).not.toThrow();
  });
});
