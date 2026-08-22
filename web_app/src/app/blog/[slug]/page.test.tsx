import { render, screen } from "@testing-library/react";
import { getPublicArticle } from "@/lib/server/articles";
import { getRequestLocale } from "@/lib/server/request-locale";
import { notFound, redirect } from "next/navigation";
import BlogArticlePage from "./page";

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

describe("localized public blog article", () => {
  beforeEach(() => {
    getArticle.mockReset();
    getLocale.mockReset();
    (notFound as unknown as jest.Mock).mockClear();
    (redirect as unknown as jest.Mock).mockClear();
  });

  it("renders the immutable published snapshot", async () => {
    getLocale.mockResolvedValue("en");
    getArticle.mockResolvedValue({
      language: "EN",
      slug: "safe-driving",
      title: "Safer driving in Belgium",
      summary: "Published summary",
      body: "First paragraph.\n\nSecond paragraph.",
      publishedAt: "2026-08-22T10:00:00Z",
      alternateSlugs: { EN: "safe-driving", AR: "safe-driving-ar" },
    });

    render(
      await BlogArticlePage({
        params: Promise.resolve({ slug: "safe-driving" }),
      }),
    );

    expect(screen.getByRole("heading", { name: "Safer driving in Belgium" })).toBeInTheDocument();
    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
  });

  it("redirects a source-locale slug to the canonical slug for the active locale", async () => {
    getLocale.mockResolvedValue("ar");
    getArticle.mockResolvedValue({
      language: "AR",
      slug: "safe-driving-ar",
      title: "القيادة الآمنة",
      summary: "ملخص منشور",
      body: "محتوى منشور",
      publishedAt: "2026-08-22T10:00:00Z",
      alternateSlugs: { EN: "safe-driving", AR: "safe-driving-ar" },
    });

    await expect(
      BlogArticlePage({ params: Promise.resolve({ slug: "safe-driving" }) }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/ar/blog/safe-driving-ar");
  });

  it("returns the application 404 for unknown or unpublished articles", async () => {
    getLocale.mockResolvedValue("nl");
    getArticle.mockResolvedValue(null);

    await expect(
      BlogArticlePage({ params: Promise.resolve({ slug: "unpublished" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
