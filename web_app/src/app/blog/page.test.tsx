import { render, screen } from "@testing-library/react";
import { getPublicArticles } from "@/lib/server/articles";
import { getRequestLocale } from "@/lib/server/request-locale";
import BlogPage, { generateMetadata } from "./page";

jest.mock("@/lib/server/articles", () => ({ getPublicArticles: jest.fn() }));
jest.mock("@/lib/server/request-locale", () => ({ getRequestLocale: jest.fn() }));

const getArticles = getPublicArticles as jest.Mock;
const getLocale = getRequestLocale as jest.Mock;

describe("localized public blog index", () => {
  beforeEach(() => {
    getArticles.mockReset();
    getLocale.mockReset();
    getArticles.mockResolvedValue([
      {
        language: "EN",
        slug: "safe-driving",
        title: "Safer driving in Belgium",
        summary: "A concise published summary.",
        publishedAt: "2026-08-22T10:00:00Z",
        alternateSlugs: {
          EN: "safe-driving",
          NL: "veilig-rijden",
          FR: "conduite-sure",
          AR: "al-qiyada-al-amina",
        },
      },
    ]);
  });

  it.each([
    ["en", "/blog/safe-driving"],
    ["nl", "/nl/blog/safe-driving"],
    ["fr", "/fr/blog/safe-driving"],
    ["ar", "/ar/blog/safe-driving"],
  ])("renders published summaries at the %s route", async (locale, href) => {
    getLocale.mockResolvedValue(locale);

    render(await BlogPage());

    expect(getArticles).toHaveBeenCalledWith(locale);
    expect(screen.getByTestId("blog-article-grid")).toHaveClass("grid-cols-1", "md:grid-cols-2", "lg:grid-cols-4");
    expect(screen.getByRole("link", { name: /Safer driving in Belgium/i })).toHaveAttribute(
      "href",
      href,
    );
    expect(screen.queryByText("Draft body")).not.toBeInTheDocument();
  });

  it("emits localized index metadata with reciprocal alternates", async () => {
    getLocale.mockResolvedValue("fr");

    const metadata = await generateMetadata();

    expect(metadata.title).toBe("Comprenez plus clairement la théorie de la conduite belge");
    expect(metadata.alternates).toEqual({
      canonical: "https://rijvia.be/fr/blog",
      languages: {
        en: "https://rijvia.be/blog",
        "nl-BE": "https://rijvia.be/nl/blog",
        "fr-BE": "https://rijvia.be/fr/blog",
        ar: "https://rijvia.be/ar/blog",
        "x-default": "https://rijvia.be/blog",
      },
    });
  });
});
