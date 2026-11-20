import { fireEvent, render, screen } from "@testing-library/react";
import AdminSignsPage from "./page";
import { apiClient } from "@/lib/api";

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin/signs",
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/hooks/use-localized-router", () => ({
  useLocalizedRouter: () => ({ replace: jest.fn() }),
}));

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({ t: (key: string) => key, language: "en" }),
}));

jest.mock("@/components/localized-link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

jest.mock("@/lib/api", () => ({
  apiClient: { get: jest.fn() },
  isServiceUnavailable: () => false,
  logApiError: jest.fn(),
}));

const mockedGet = apiClient.get as jest.Mock;

describe("admin sign questions", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedGet.mockImplementation((url: string) => {
      if (url === "/categories") return Promise.resolve({ data: [] });
      if (url === "/admin/sign-quiz/signs/A01") {
        return Promise.resolve({ data: { questions: [{
          id: 9,
          questionRef: "A01_Q1",
          difficulty: "EASY",
          questionEn: "Test sign question",
          questionAr: "",
          questionNl: "",
          questionFr: "",
        }] } });
      }
      return Promise.resolve({ data: {
        items: [{
          id: 1,
          signCode: "A01",
          categoryCode: "A",
          nameEn: "Priority sign",
          nameAr: "",
          nameNl: "",
          nameFr: "",
          descriptionEn: "",
          descriptionAr: "",
          descriptionNl: "",
          descriptionFr: "",
          imageUrl: "",
          isActive: true,
          createdAt: "",
          updatedAt: "",
        }],
        page: 0,
        size: 20,
        totalItems: 1,
        totalPages: 1,
      } });
    });
  });

  it("shows a question table and keeps editing inside admin signs", async () => {
    render(<AdminSignsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "admin.signs.view" }));

    expect(await screen.findByText("Test sign question")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "admin.quizzes.col_question" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "admin.quizzes.col_difficulty" })).toBeInTheDocument();
    expect(screen.getByText("difficulty.easy")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "admin.signs.edit_question" })).toHaveAttribute(
      "href",
      "/admin/signs/A01/questions/A01_Q1/edit?returnTo=%2Fadmin%2Fsigns",
    );
  });
});
