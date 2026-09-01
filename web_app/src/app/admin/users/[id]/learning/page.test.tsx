import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import apiClient from "@/lib/api";
import AdminUserLearningPage from "./page";

jest.mock("next/navigation", () => ({ useParams: () => ({ id: "42" }) }));
jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({ t: (key: string) => key, language: "en" }),
}));
jest.mock("@/components/localized-link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={String(href)} {...props}>{children}</a>,
}));
jest.mock("@/components/admin/AdminPageHeader", () => ({
  __esModule: true,
  default: ({ title, actions }: { title: string; actions?: React.ReactNode }) => <header><h1>{title}</h1>{actions}</header>,
}));
jest.mock("@/components/admin/AdminMetricCard", () => ({
  __esModule: true,
  default: ({ label, value }: { label: string; value?: React.ReactNode }) => <div><span>{label}</span><strong>{value}</strong></div>,
}));
jest.mock("@/components/admin/AdminSectionCard", () => ({
  __esModule: true,
  default: ({ title, children }: { title: string; children: React.ReactNode }) => <section><h2>{title}</h2>{children}</section>,
}));
jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn() },
  logApiError: jest.fn(),
}));

const get = apiClient.get as jest.Mock;
const summary = {
  userId: 42,
  username: "learner",
  displayName: "Learner",
  email: "learner@test.local",
  preferredLanguage: "en",
  accountCreatedAt: "2026-01-01T10:00:00",
  lastActiveAt: "2026-01-03T10:00:00",
  totalCompletedExams: 2,
  totalCompletedPractices: 1,
  averageExamScore: 75,
  latestExamScore: 80,
  strongestCategories: [{ categoryId: 1, categoryCode: "A", nameEn: "Priority", nameNl: "Voorrang", nameFr: "Priorite", nameAr: "الأولوية", questionsAttempted: 10, correctAnswers: 9, accuracy: 90, lastPracticedAt: null }],
  weakestCategories: [{ categoryId: 2, categoryCode: "B", nameEn: "Speed", nameNl: "Snelheid", nameFr: "Vitesse", nameAr: "السرعة", questionsAttempted: 10, correctAnswers: 4, accuracy: 40, lastPracticedAt: null }],
  learningTrend: "IMPROVING",
  lastActivityType: "EXAM",
};

describe("Admin learner profile", () => {
  beforeEach(() => {
    get.mockReset();
    get.mockImplementation((url: string, params?: { page?: number }) => {
      if (url === "/admin/learning/users/42") return Promise.resolve({ data: summary });
      if (url.endsWith("/coverage")) return Promise.resolve({ data: {
        languageCode: "en", eligibleQuestions: 100, uniqueQuestionsSeen: 50, uniqueQuestionsAnswered: 40, unseenQuestions: 50,
        coveragePercentage: 50, timesPresented: 60, timesAnswered: 50, timesCorrect: 40,
        timesIncorrect: 10, accuracyPercentage: 80, confidenceState: "MEDIUM",
        categories: [{ categoryId: 1, categoryCode: "A", categoryName: "Priority", eligibleQuestions: 20,
          uniqueQuestionsSeen: 10, uniqueQuestionsAnswered: 10, unseenQuestions: 10, coveragePercentage: 50, timesPresented: 12,
          timesAnswered: 10, timesCorrect: 8, timesIncorrect: 2, accuracyPercentage: 80, confidenceState: "MEDIUM" }],
      } });
      if (url.endsWith("/difficulty")) return Promise.resolve({ data: {
        items: [{ difficulty: "EASY", answeredQuestions: 10, correctAnswers: 8, accuracy: 80 }],
        snapshotBackedAnswers: 10, legacyAnswersExcluded: 3, evidenceStatus: "SNAPSHOT_PARTIAL",
      } });
      return Promise.resolve({ data: { items: [], total: 0, page: params?.page ?? 0, size: 20, totalPages: 2 } });
    });
  });

  it("loads coverage, difficulty evidence, and existing strong and weak areas lazily", async () => {
    render(<AdminUserLearningPage />);

    await screen.findByText("Priority");
    expect(screen.getByRole("link", { name: "admin.learning.back_to_users" })).toHaveAttribute("href", "/admin/users");
    expect(screen.getByText("Speed")).toBeInTheDocument();
    expect(screen.queryByText(/^[A-Z]\d* · /)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "admin.learning.section.coverage" }));
    await screen.findByText("50/100");
    expect(screen.getAllByText("dashboard.theory_coverage.confidence_medium")).toHaveLength(2);
    expect(screen.getAllByText("Priority")).toHaveLength(2);
    expect(get).toHaveBeenCalledWith("/admin/learning/users/42/coverage");

    fireEvent.click(screen.getByRole("tab", { name: "admin.learning.section.difficulty" }));
    await screen.findByText("difficulty.easy");
    expect(screen.getByText("admin.learning.legacy_answers_excluded: 3")).toBeInTheDocument();
  });

  it("requests the next page only for paginated learning sections", async () => {
    render(<AdminUserLearningPage />);
    const next = await screen.findByRole("button", { name: "admin.learning.next" });

    fireEvent.click(next);

    await waitFor(() => expect(get).toHaveBeenCalledWith(
      "/admin/learning/users/42/exams",
      { page: 1, size: 20 },
    ));
  });

  it("uses the backend error-patterns contract for the errors tab", async () => {
    render(<AdminUserLearningPage />);
    await screen.findByText("Priority");

    fireEvent.click(screen.getByRole("tab", { name: "admin.learning.section.errors" }));

    await waitFor(() => expect(get).toHaveBeenCalledWith(
      "/admin/learning/users/42/error-patterns",
      { page: 0, size: 20 },
    ));
  });
});
