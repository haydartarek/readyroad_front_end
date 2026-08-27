import { render, screen } from "@testing-library/react";
import apiClient from "@/lib/api";
import AdminLearningExamDetailPage from "./page";

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "42", examType: "THEORY_EXAM", examId: "77" }),
}));
jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({ t: (key: string) => key, language: "en" }),
}));
jest.mock("@/components/admin/AdminPageHeader", () => ({
  __esModule: true,
  default: ({ title, description }: { title: string; description: string }) => <header><h1>{title}</h1><p>{description}</p></header>,
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

describe("Admin historical theory exam detail", () => {
  beforeEach(() => get.mockReset());

  it("shows complete exam metadata and does not fabricate legacy content", async () => {
    get.mockResolvedValue({ data: {
      userId: 42,
      examType: "THEORY_EXAM",
      examId: 77,
      historicalContentStatus: "LEGACY_NO_SNAPSHOT",
      summary: {
        examId: 77, userId: 42, username: "learner", displayName: "Learner",
        examType: "THEORY_EXAM", subjectCode: null,
        startedAt: "2026-08-15T10:00:00", completedAt: "2026-08-15T10:20:00",
        durationSeconds: 1200, totalQuestions: 50, answeredQuestions: 1,
        correctAnswers: 0, incorrectAnswers: 1, unansweredAnswers: 49,
        scorePercentage: 0, passed: false, languageCode: "ar",
      },
      result: { questions: [{
        questionId: 120, questionOrder: 1, selectedOptionId: 4, correctOptionId: 3,
        isCorrect: false, answered: true, snapshotAvailable: false,
      }] },
    } });

    render(<AdminLearningExamDetailPage />);

    await screen.findByText("admin.learning.legacy_snapshot_notice");
    expect(screen.getByText("admin.learning.exam_summary")).toBeInTheDocument();
    expect(screen.getByText("0/50 · 0%")).toBeInTheDocument();
    expect(screen.getByText("AR")).toBeInTheDocument();
    expect(screen.getByText("#120")).toBeInTheDocument();
    expect(screen.getByText("#4")).toBeInTheDocument();
    expect(screen.getByText("#3")).toBeInTheDocument();
    expect(screen.queryByText("Current edited question")).not.toBeInTheDocument();
  });

  it("renders snapshot-backed localized content and difficulty", async () => {
    get.mockResolvedValue({ data: {
      userId: 42,
      examType: "THEORY_EXAM",
      examId: 77,
      historicalContentStatus: "SNAPSHOT_COMPLETE",
      summary: {
        examId: 77, userId: 42, username: "learner", displayName: "Learner",
        examType: "THEORY_EXAM", subjectCode: null,
        startedAt: "2026-08-15T10:00:00", completedAt: "2026-08-15T10:20:00",
        durationSeconds: 1200, totalQuestions: 50, answeredQuestions: 1,
        correctAnswers: 1, incorrectAnswers: 0, unansweredAnswers: 49,
        scorePercentage: 2, passed: false, languageCode: "en",
      },
      result: { questions: [{
        questionId: 120, questionOrder: 1, questionTextEn: "Historical question",
        selectedOptionId: 3, selectedOptionTextEn: "Historical answer",
        correctOptionId: 3, correctOptionTextEn: "Historical answer",
        explanationEn: "Historical explanation", categoryCode: "A",
        categoryNameEn: "Priority", difficulty: "MEDIUM", isCorrect: true,
        answered: true, snapshotAvailable: true,
      }] },
    } });

    render(<AdminLearningExamDetailPage />);

    await screen.findByText("Historical question");
    expect(screen.getAllByText("Historical answer")).toHaveLength(2);
    expect(screen.getByText("Historical explanation")).toBeInTheDocument();
    expect(screen.getByText("difficulty.medium")).toBeInTheDocument();
    expect(screen.queryByText("admin.learning.legacy_snapshot_notice")).not.toBeInTheDocument();
  });
});
