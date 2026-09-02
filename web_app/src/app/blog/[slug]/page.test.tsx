import { render, screen, within } from "@testing-library/react";
import { getPublicArticle, type PublicArticleImage } from "@/lib/server/articles";
import { translateMessage } from "@/lib/messages";
import { getRequestLocale } from "@/lib/server/request-locale";
import { notFound, redirect } from "next/navigation";
import BlogArticlePage, { generateMetadata } from "./page";

jest.mock("@/lib/server/articles", () => ({ getPublicArticle: jest.fn() }));
jest.mock("@/lib/server/request-locale", () => ({ getRequestLocale: jest.fn() }));
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

const getArticle = getPublicArticle as jest.Mock;
const getLocale = getRequestLocale as jest.Mock;
const typography = {
  h1Size: "DEFAULT",
  h2Size: "LARGE",
  h3Size: "DEFAULT",
  h4Size: "DEFAULT",
  paragraphSize: "DEFAULT",
  textColor: "DEFAULT",
};

describe("localized public blog article", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each(["ar", "en", "nl", "fr"] as const)("image attribution in %s", (locale) => {
    const uploadedImage: PublicArticleImage = {
      assetId: 1,
      heroUrl: "/images/exam.png",
      cardUrl: "/images/exam.png",
      mobileUrl: "/images/exam.png",
      ogUrl: "/images/exam.png",
      altText: "Learning to drive",
    };
    const imageArticle = {
      language: locale.toUpperCase(), slug: "safe-driving", title: "Published article",
      summary: "Published summary", body: "Reviewed article content.",
      publishedAt: "2026-08-22T10:00:00Z", internalLinks: [], typography,
      alternateSlugs: { [locale.toUpperCase()]: "safe-driving" },
    };

    beforeEach(() => {
      getLocale.mockResolvedValue(locale);
    });

    it.each([
      ["omitted", {}],
      ["null", { photographerName: null, sourcePlatform: null, licenseName: null }],
      ["blank", { photographerName: "  ", sourcePlatform: " ", licenseName: " " }],
      ["missing source", { photographerName: "Alex", sourceUrl: "https://example.com/photo" }],
      ["missing photographer", { sourcePlatform: "Photo Library", sourceUrl: "https://example.com/photo" }],
    ])("omits incomplete credits (%s) without hiding the uploaded image or ALT", async (_, attribution) => {
      getArticle.mockResolvedValue({ ...imageArticle, image: { ...uploadedImage, ...attribution } });
      const { container } = render(await BlogArticlePage({ params: Promise.resolve({ slug: "safe-driving" }) }));

      expect(container.querySelector("figcaption")).not.toBeInTheDocument();
      expect(container.querySelector("article")).not.toHaveTextContent(/undefined|null/);
      const hero = screen.getByRole("img", { name: uploadedImage.altText });
      expect(new URL(hero.getAttribute("src")!, "http://localhost:3000").searchParams.get("url"))
        .toBe(uploadedImage.heroUrl);
    });

    it("preserves a caption without inventing photo credits", async () => {
      getArticle.mockResolvedValue({ ...imageArticle, image: { ...uploadedImage, caption: "  Driving lesson  " } });
      const { container } = render(await BlogArticlePage({ params: Promise.resolve({ slug: "safe-driving" }) }));

      expect(container.querySelector("figcaption")?.textContent).toBe("Driving lesson");
    });

    it("preserves complete localized credits and their source link", async () => {
      getArticle.mockResolvedValue({
        ...imageArticle,
        image: { ...uploadedImage, photographerName: "Alex", sourcePlatform: "Photo Library", sourceUrl: "https://example.com/photo" },
      });
      render(await BlogArticlePage({ params: Promise.resolve({ slug: "safe-driving" }) }));

      const credit = screen.getByRole("link", {
        name: translateMessage(locale, "blog.photo_credit", { photographer: "Alex", source: "Photo Library" }),
      });
      expect(credit).toHaveAttribute("href", "https://example.com/photo");
      expect(credit).toHaveAttribute("rel", "noreferrer");
    });

    it("preserves complete license credits without a source URL", async () => {
      getArticle.mockResolvedValue({
        ...imageArticle,
        image: { ...uploadedImage, photographerName: "Alex", licenseName: "CC BY 4.0" },
      });
      const { container } = render(await BlogArticlePage({ params: Promise.resolve({ slug: "safe-driving" }) }));

      expect(container.querySelector("figcaption")?.textContent).toBe(
        translateMessage(locale, "blog.photo_credit", { photographer: "Alex", source: "CC BY 4.0" }),
      );
    });
  });

  it.each([
    ["ar", "/ar", ["تدرب على العلامات المرورية", "امتحان العلامات المرورية", "محاكي الامتحان النظري"]],
    ["en", "", ["Practise traffic signs", "Traffic signs test", "Theory exam simulator"]],
    ["nl", "/nl", ["Verkeersborden oefenen", "Verkeersbordentest", "Theorie-examensimulator"]],
    ["fr", "/fr", ["S’entraîner aux panneaux routiers", "Test des panneaux routiers", "Simulateur d’examen théorique"]],
  ])("adds three localized learning cards after paragraph two in %s", async (locale, prefix, labels) => {
    getLocale.mockResolvedValue(locale);
    getArticle.mockResolvedValue({
      language: String(locale).toUpperCase(), slug: "safe-driving", title: "Published article",
      summary: "Summary is not a body paragraph.", body: "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.",
      publishedAt: "2026-08-22T10:00:00Z", image: null, internalLinks: [], typography,
      alternateSlugs: { [String(locale).toUpperCase()]: "safe-driving" },
    });
    render(await BlogArticlePage({ params: Promise.resolve({ slug: "safe-driving" }) }));
    const cards = screen.getByTestId("article-learning-cards");
    expect(cards.previousElementSibling).toHaveTextContent("Second paragraph.");
    expect(within(cards).getAllByRole("link")).toHaveLength(3);
    ["/traffic-signs", "/practice", "/exam"].forEach((path, index) => {
      const link = within(cards).getByRole("link", { name: labels[index] });
      expect(link).toHaveAttribute("href", `${prefix}${path}`);
      const imageUrl = new URL(link.querySelector("img")!.getAttribute("src")!, "http://localhost:3000");
      expect(imageUrl.searchParams.get("url")).toBe(`/images${path}.png`);
      const overlay = within(link).getByTestId("article-learning-card-overlay");
      expect(overlay).toHaveAttribute("aria-hidden", "true");
      expect(overlay).toHaveClass("pointer-events-none", "absolute", "inset-0", "bg-black/40");
      expect(overlay.parentElement).toHaveClass("relative");
      expect(overlay.previousElementSibling).toBe(link.querySelector("img"));
    });
  });

  it("renders the published Markdown snapshot with its approved typography", async () => {
    getLocale.mockResolvedValue("en");
    getArticle.mockResolvedValue({
      language: "EN",
      slug: "safe-driving",
      title: "Safer driving in Belgium",
      summary: "Published summary",
      metaTitle: "Safer driving in Belgium | RijVia",
      metaDescription: "Learn approved Belgian safe-driving principles.",
      body: "## Reviewed guidance\n\nFirst paragraph with **verified evidence**.",
      publishedAt: "2026-08-22T10:00:00Z",
      image: null,
      internalLinks: [{
        type: "LESSON",
        targetPath: "/lessons/les-19/2",
        anchorText: "Study the priority lesson",
      }],
      typography,
      alternateSlugs: { EN: "safe-driving" },
    });

    render(await BlogArticlePage({
      params: Promise.resolve({ slug: "safe-driving" }),
    }));

    expect(screen.getByRole("heading", { name: "Reviewed guidance", level: 2 }))
      .toHaveClass("text-3xl");
    expect(screen.getByText("verified evidence")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Study the priority lesson/ }))
      .toHaveAttribute("href", "/lessons/les-19/2");
  });

  it("uses immutable localized metadata and publication slugs", async () => {
    getLocale.mockResolvedValue("nl");
    getArticle.mockResolvedValue({
      language: "NL",
      slug: "veilig-rijden",
      title: "Veiliger rijden in België",
      summary: "Gepubliceerde samenvatting",
      metaTitle: "Veiliger rijden in België | RijVia",
      metaDescription: "Leer de goedgekeurde principes voor veiliger rijden in België.",
      body: "Gepubliceerde inhoud",
      publishedAt: "2026-08-22T10:00:00Z",
      image: null,
      internalLinks: [],
      typography,
      alternateSlugs: {
        EN: "safe-driving",
        NL: "veilig-rijden",
        FR: "conduite-sure",
        AR: "al-qiyada-al-amina",
      },
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "veilig-rijden" }),
    });

    expect(metadata.title).toEqual({ absolute: "Veiliger rijden in België | RijVia" });
    expect(metadata.alternates).toEqual({
      canonical: "https://rijvia.be/nl/blog/veilig-rijden",
      languages: {
        en: "https://rijvia.be/blog/safe-driving",
        "nl-BE": "https://rijvia.be/nl/blog/veilig-rijden",
        "fr-BE": "https://rijvia.be/fr/blog/conduite-sure",
        ar: "https://rijvia.be/ar/blog/al-qiyada-al-amina",
        "x-default": "https://rijvia.be/blog/safe-driving",
      },
    });
  });

  it("preserves the active locale when redirecting to the canonical slug", async () => {
    getLocale.mockResolvedValue("ar");
    getArticle.mockResolvedValue({
      language: "AR",
      slug: "safe-driving-ar",
      title: "القيادة الآمنة",
      summary: "ملخص منشور",
      metaTitle: "القيادة الآمنة | RijVia",
      metaDescription: "تعرف على مبادئ القيادة الآمنة المعتمدة في بلجيكا.",
      body: "محتوى منشور",
      publishedAt: "2026-08-22T10:00:00Z",
      image: null,
      internalLinks: [],
      typography,
      alternateSlugs: { EN: "safe-driving", AR: "safe-driving-ar" },
    });

    await expect(BlogArticlePage({
      params: Promise.resolve({ slug: "safe-driving" }),
    })).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/ar/blog/safe-driving-ar");
  });

  it("returns the application 404 for an unpublished article", async () => {
    getLocale.mockResolvedValue("fr");
    getArticle.mockResolvedValue(null);

    await expect(generateMetadata({
      params: Promise.resolve({ slug: "unpublished" }),
    })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it.each(["القيادة-الآمنة-في-بلجيكا", encodeURIComponent("القيادة-الآمنة-في-بلجيكا")])(
    "resolves an Arabic route slug once without redirecting to the same URL: %s",
    async (routeSlug) => {
      const slug = "القيادة-الآمنة-في-بلجيكا";
      getLocale.mockResolvedValue("ar");
      getArticle.mockResolvedValue({
        language: "AR",
        slug,
        title: "القيادة الآمنة في بلجيكا",
        summary: "ملخص منشور",
        metaTitle: "القيادة الآمنة في بلجيكا | RijVia",
        metaDescription: "مبادئ القيادة الآمنة في بلجيكا.",
        body: "محتوى منشور",
        publishedAt: "2026-08-22T10:00:00Z",
        image: null,
        internalLinks: [],
        typography,
        alternateSlugs: { AR: slug },
      });
      const props = { params: Promise.resolve({ slug: routeSlug }) };

      const metadata = await generateMetadata(props);
      render(await BlogArticlePage(props));

      expect(getArticle).toHaveBeenNthCalledWith(1, "ar", slug);
      expect(getArticle).toHaveBeenNthCalledWith(2, "ar", slug);
      expect(metadata.alternates?.canonical).toBe(
        `https://rijvia.be/ar/blog/${encodeURIComponent(slug)}`,
      );
      expect(screen.getByRole("heading", { name: "القيادة الآمنة في بلجيكا", level: 1 }))
        .toBeInTheDocument();
      expect(redirect).not.toHaveBeenCalled();
      expect(notFound).not.toHaveBeenCalled();
    },
  );

  it("returns 404 for malformed route encoding without requesting the API", async () => {
    getLocale.mockResolvedValue("ar");
    const props = { params: Promise.resolve({ slug: "%D8" }) };

    await expect(generateMetadata(props)).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(BlogArticlePage(props)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getArticle).not.toHaveBeenCalled();
  });
});
