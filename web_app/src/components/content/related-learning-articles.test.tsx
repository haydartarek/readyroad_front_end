import { render, screen } from "@testing-library/react";
import RelatedLearningArticles from "@/components/content/related-learning-articles";

describe("RelatedLearningArticles", () => {
  it("renders localized published article routes", () => {
    render(
      <RelatedLearningArticles
        locale="ar"
        articles={[{
          language: "AR",
          slug: "al-awlawiya",
          title: "الأولوية من اليمين",
          summary: "ملخص",
          publishedAt: "2026-08-22T10:00:00Z",
          image: null,
          alternateSlugs: { AR: "al-awlawiya" },
        }]}
      />,
    );

    expect(screen.getByRole("link", { name: /الأولوية من اليمين/ }))
      .toHaveAttribute("href", "/ar/blog/al-awlawiya");
  });

  it("renders nothing when no published relationship exists", () => {
    const { container } = render(
      <RelatedLearningArticles locale="en" articles={[]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
