import { render, screen, waitFor } from "@testing-library/react";
import { ExamResultsPageContent } from "@/app/(protected)/exam/results/page";
import apiClient from "@/lib/api";
import {
  getRandomPracticeHistory,
  getRandomPracticeResult,
  getSignExamHistory,
} from "@/services/signQuizService";

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "randomSignExamId" ? "10" : null),
  }),
}));

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({
    language: "ar",
    t: (key: string) => key,
  }),
}));

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ user: { id: 1 } }),
}));

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn() },
  isServiceUnavailable: () => false,
  logApiError: jest.fn(),
}));

jest.mock("@/services/signQuizService", () => ({
  getRandomPracticeHistory: jest.fn(),
  getRandomPracticeResult: jest.fn(),
  getSignExamHistory: jest.fn(),
  getSignExamResultById: jest.fn(),
}));

const mockedApiGet = apiClient.get as jest.Mock;
const mockedRandomHistory = getRandomPracticeHistory as jest.Mock;
const mockedRandomResult = getRandomPracticeResult as jest.Mock;
const mockedSignHistory = getSignExamHistory as jest.Mock;

describe("random sign exam review", () => {
  beforeEach(() => {
    mockedApiGet.mockResolvedValue({ data: { totalExams: 0, exams: [] } });
    mockedRandomHistory.mockResolvedValue({
      totalSessions: 1,
      sessions: [
        {
          sessionId: 10,
          status: "COMPLETED",
          totalQuestions: 1,
          answeredCount: 1,
          correctAnswers: 0,
          wrongAnswers: 1,
          unanswered: 0,
          scorePercentage: 0,
          passed: false,
          passingScore: 1,
          startedAt: "2026-08-04T10:00:00",
          completedAt: "2026-08-04T10:01:00",
        },
      ],
    });
    mockedSignHistory.mockResolvedValue({ totalResults: 0, results: [] });
    mockedRandomResult.mockResolvedValue({
      sessionId: 10,
      status: "COMPLETED",
      startedAt: "2026-08-04T10:00:00",
      completedAt: "2026-08-04T10:01:00",
      totalQuestions: 1,
      answeredCount: 1,
      correctAnswers: 0,
      wrongAnswers: 1,
      unanswered: 0,
      scorePercentage: 0,
      passed: false,
      passingScore: 1,
      questions: [
        {
          questionId: 101,
          questionNl: "Vraag",
          questionEn: "Question",
          questionFr: "Question",
          questionAr: "السؤال",
          selectedChoiceId: 2,
          selectedChoiceNl: "Gekozen fout antwoord",
          selectedChoiceEn: "Selected wrong answer",
          selectedChoiceFr: "Réponse incorrecte choisie",
          selectedChoiceAr: "الإجابة الخاطئة المختارة",
          correctChoiceId: 1,
          correctChoiceNl: "Juist antwoord",
          correctChoiceEn: "Correct answer",
          correctChoiceFr: "Bonne réponse",
          correctChoiceAr: "الإجابة الصحيحة",
          isCorrect: false,
          wasTimeout: false,
          explanationNl: "Uitleg",
          explanationEn: "Explanation",
          explanationFr: "Explication",
          explanationAr: "التفسير",
          signCode: "A1",
          signImagePath: null,
          difficulty: "EASY",
        },
      ],
    });
  });

  it("shows the persisted selected answer separately from the correct answer", async () => {
    render(<ExamResultsPageContent />);

    await waitFor(() => {
      expect(screen.getByText("الإجابة الخاطئة المختارة")).toBeVisible();
      expect(screen.getByText("الإجابة الصحيحة")).toBeVisible();
    });
    expect(mockedRandomResult).toHaveBeenCalledWith(10);
  });
});
