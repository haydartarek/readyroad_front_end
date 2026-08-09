import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  apiClient: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
  isServiceUnavailable: () => false,
  logApiError: jest.fn(),
}));

const mockedGet = apiClient.get as jest.Mock;
const mockedPost = apiClient.post as jest.Mock;

const question = {
  id: 7,
  categoryCode: "A",
  categoryNameEn: "Danger",
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
    mockedPost.mockReset();
    mockedGet.mockImplementation((url: string) => {
      if (url === "/admin/quiz/categories")
        return Promise.resolve({ data: [] });
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
    mockedPost.mockResolvedValue({
      data: {
        selectedQuestions: 1,
        before: [
          {
            difficulty: "MEDIUM",
            optionCount: 2,
            total: 1,
            positions: [
              { label: "A", count: 1, percentage: 100 },
              { label: "B", count: 0, percentage: 0 },
            ],
          },
        ],
        after: [
          {
            difficulty: "MEDIUM",
            optionCount: 2,
            total: 1,
            positions: [
              { label: "A", count: 1, percentage: 100 },
              { label: "B", count: 0, percentage: 0 },
            ],
          },
        ],
      },
    });
    jest.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  it("shows distribution and shuffles only the selected question", async () => {
    render(<AdminQuizzesPage />);

    expect(
      await screen.findByText("admin.quizzes.distribution_title"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "admin.quizzes.shuffle_selected" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByLabelText("admin.quizzes.select_question"));
    expect(
      screen.getByRole("button", { name: "admin.quizzes.shuffle_selected" }),
    ).toBeEnabled();
    fireEvent.click(
      screen.getByRole("button", { name: "admin.quizzes.shuffle_selected" }),
    );

    await waitFor(() => {
      expect(mockedPost).toHaveBeenNthCalledWith(
        1,
        "/admin/quiz/questions/shuffle-answer-order/preview",
        { questionIds: [7] },
      );
      expect(mockedPost).toHaveBeenNthCalledWith(
        2,
        "/admin/quiz/questions/shuffle-answer-order",
        { questionIds: [7] },
      );
    });
    expect(
      screen.getByText("admin.quizzes.balance_before"),
    ).toBeInTheDocument();
    expect(screen.getByText("admin.quizzes.balance_after")).toBeInTheDocument();
  });
});
