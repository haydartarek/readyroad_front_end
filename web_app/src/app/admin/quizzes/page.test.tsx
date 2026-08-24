import { render, screen } from "@testing-library/react";
import AdminQuizzesPage from "./page";
import { apiClient } from "@/lib/api";

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin/quizzes",
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ""} {...props} />
  ),
}));

jest.mock("@/hooks/use-localized-router", () => ({
  useLocalizedRouter: () => ({ replace: jest.fn() }),
}));

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({ t: (key: string) => key, language: "en" }),
}));

jest.mock("@/components/localized-link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/admin/AdminPageHeader", () => ({
  __esModule: true,
  default: ({
    title,
    actions,
  }: {
    title: string;
    actions: React.ReactNode;
  }) => (
    <header>
      <h1>{title}</h1>
      {actions}
    </header>
  ),
}));

jest.mock("@/lib/api", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
  isServiceUnavailable: () => false,
  logApiError: jest.fn(),
}));

const mockedGet = apiClient.get as jest.Mock;
const question = {
  id: 7,
  categoryCode: "TH01",
  categoryNameEn: "Priority and intersections",
  difficultyLevel: "MEDIUM",
  questionType: "MULTIPLE_CHOICE",
  questionEn: "Question",
  questionAr: "سؤال",
  questionNl: "Vraag",
  questionFr: "Question",
  explanationEn: "Explanation",
  explanationAr: null,
  explanationNl: "Uitleg",
  explanationFr: "Explication",
  contentImageUrl: null,
  isActive: true,
  optionsCount: 2,
  options: [],
  isReferenced: false,
  createdAt: "2026-08-05T10:00:00Z",
  updatedAt: "2026-08-05T10:00:00Z",
};

describe("Admin quiz quality controls", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedGet.mockImplementation((url: string) => {
      if (url === "/admin/quiz/bank-health")
        return Promise.resolve({
          data: {
            generatedAt: "2026-08-24T00:00:00Z",
            summary: {
              totalQuestions: 1,
              activeQuestions: 1,
              inactiveQuestions: 0,
              publishedQuestions: 1,
              eligibleAllLocales: 1,
              translationGapQuestions: 0,
              explanationGapQuestions: 0,
              invalidQuestions: 0,
              underrepresentedCategories: 1,
              overrepresentedCategories: 0,
            },
            locales: [],
            categories: [],
            questionsNeedingReview: [],
            rarelyExposedQuestions: [],
            heavilyExposedQuestions: [],
          },
        });
      if (url === "/admin/quiz/categories")
        return Promise.resolve({
          data: [
            {
              code: "TH01",
              nameEn: "Priority and intersections",
              nameAr: "الأولوية والتقاطعات",
              nameNl: "Voorrang en kruispunten",
              nameFr: "Priorité et carrefours",
            },
          ],
        });
      if (url.includes("correct-answer-distribution")) {
        return Promise.resolve({
          data: {
            total: 1,
            positions: [
              { label: "A", count: 1, percentage: 100 },
              { label: "B", count: 0, percentage: 0 },
              { label: "C", count: 0, percentage: 0 },
            ],
          },
        });
      }
      return Promise.resolve({
        data: {
          items: [question],
          page: 0,
          size: 20,
          totalItems: 1,
          totalPages: 1,
        },
      });
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it("shows read-only distribution without shuffle controls or technical category codes", async () => {
    render(<AdminQuizzesPage />);

    expect(
      await screen.findByText("admin.quizzes.distribution_title"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/shuffle/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(await screen.findAllByText("Priority and intersections")).not.toHaveLength(0);
    expect(screen.queryByText("TH01")).not.toBeInTheDocument();
  });
});
