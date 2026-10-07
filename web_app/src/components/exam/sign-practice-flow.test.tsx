import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RandomPracticePage from "@/app/(protected)/practice/random/page";
import ExamResultsPage from "@/app/(protected)/exam/results/page";
import TrafficSignPracticePage from "@/app/traffic-signs/[signCode]/practice/page";
import { translateMessage } from "@/lib/messages";
import {
  getPracticeResults,
  getRandomPracticeHistory,
  getRandomPracticeResult,
  getSignExamHistory,
  startPracticeSession,
  startRandomPracticeSession,
  submitPracticeAnswer,
  submitRandomPracticeSession,
} from "@/services/signQuizService";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockApiGet = jest.fn();
const mockUser = { userId: 42, username: "learner", role: "USER" };
const mockTranslate = (key: string) => translateMessage("en", key);
let mockSignCode = "A1a";
jest.mock("next/navigation", () => ({
  useParams: () => ({ signCode: mockSignCode }),
  usePathname: () => `/traffic-signs/${mockSignCode}/practice`,
  useSearchParams: () => new URLSearchParams("randomSignExamId=37"),
}));
jest.mock("@/hooks/use-localized-router", () => ({
  useLocalizedRouter: () => ({ push: mockPush, replace: mockReplace }),
}));
jest.mock("@/contexts/auth-context", () => ({ useAuth: () => ({
  isAuthenticated: true, isLoading: false, user: mockUser,
}) }));
jest.mock("@/contexts/language-context", () => ({ useLanguage: () => ({
  language: "en", isRTL: false, t: mockTranslate,
}) }));
jest.mock("@/lib/api", () => ({ __esModule: true,
  default: { get: (...args: unknown[]) => mockApiGet(...args) },
  apiClient: { get: (...args: unknown[]) => mockApiGet(...args) },
  isServiceUnavailable: () => false, logApiError: jest.fn(),
}));
jest.mock("@/services/signQuizService", () => ({
  startRandomPracticeSession: jest.fn(), submitRandomPracticeSession: jest.fn(),
  abandonRandomPracticeSession: jest.fn(), getRandomPracticeHistory: jest.fn(),
  getRandomPracticeResult: jest.fn(), getSignExamHistory: jest.fn(),
  getSignExamResultById: jest.fn(), startPracticeSession: jest.fn(),
  submitPracticeAnswer: jest.fn(), getPracticeResults: jest.fn(),
  abandonPracticeSession: jest.fn(),
}));
jest.mock("@/components/localized-link", () => ({ __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
}));
jest.mock("next/image", () => ({ __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) =>
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />,
}));

const image = "/images/signs/danger_signs/A1a%20Gevaarlijke%20bocht%20naar%20links.png";
const questions = [1, 2].map((id) => ({ id, questionRef: `A1a-${id}`,
  difficulty: "EASY" as const, showSign: id === 1 ? false : undefined,
  signCode: "A1a", signImagePath: `https://old.example.com/storage/public${image}`,
  questionEn: `Question ${id}`, questionAr: "سؤال", questionNl: "Vraag", questionFr: "Question",
  choices: [{ id: id * 10, textEn: "Reduce speed", textAr: "خفف السرعة",
    textNl: "Vertraag", textFr: "Ralentissez" }],
}));
const startedAt = "2026-10-07T08:00:00Z";
const result = { sessionId: 37, status: "COMPLETED" as const, startedAt,
  completedAt: "2026-10-07T08:01:00Z", totalQuestions: 2, answeredCount: 2,
  correctAnswers: 2, wrongAnswers: 0, unanswered: 0, scorePercentage: 100,
  passed: true, passingScore: 2, questions: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  window.scrollTo = jest.fn();
  Element.prototype.scrollIntoView = jest.fn();
  jest.mocked(startRandomPracticeSession).mockResolvedValue({
    sessionId: 37, status: "IN_PROGRESS", startedAt, totalQuestions: 2,
    passingScore: 2, questions,
  });
  jest.mocked(submitRandomPracticeSession).mockResolvedValue(result);
  jest.mocked(getRandomPracticeHistory).mockResolvedValue({ totalSessions: 1, sessions: [result] });
  jest.mocked(getRandomPracticeResult).mockResolvedValue(result);
  jest.mocked(getSignExamHistory).mockResolvedValue({ totalResults: 0, results: [] });
  mockApiGet.mockResolvedValue({ data: { totalExams: 0, exams: [] } });
});

test("mixed questions retain their sign image when showSign is false or absent", async () => {
  render(<RandomPracticePage />);
  fireEvent.click(screen.getByTestId("sign-exam-start-button"));
  await screen.findByText("Question 1");
  expect(screen.getByRole("img", { name: "A1a" })).toHaveAttribute("src", image);
  fireEvent.click(screen.getByTestId("exam-option-card"));
  fireEvent.click(screen.getByTestId("exam-next"));
  await screen.findByText("Question 2");
  expect(screen.getByRole("img", { name: "A1a" })).toHaveAttribute("src", image);
});

test("finishing a mixed exam submits stable choice IDs and opens the matching results route", async () => {
  render(<RandomPracticePage />);
  fireEvent.click(screen.getByTestId("sign-exam-start-button"));
  for (const question of questions) {
    await screen.findByText(question.questionEn);
    fireEvent.click(screen.getByTestId("exam-option-card"));
    fireEvent.click(screen.getByTestId("exam-next"));
  }
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/exam/results?randomSignExamId=37"));
  expect(submitRandomPracticeSession).toHaveBeenCalledWith(37, [
    { questionId: 1, selectedChoiceId: 10 }, { questionId: 2, selectedChoiceId: 20 },
  ]);
});

test("the results route renders and opens the requested attempt instead of redirecting to dashboard", async () => {
  render(<ExamResultsPage />);
  expect(await screen.findByTestId("mixed-sign-exam-result-card")).toBeVisible();
  await waitFor(() => expect(getRandomPracticeResult).toHaveBeenCalledWith(37));
  expect(mockReplace).not.toHaveBeenCalled();
  expect(mockPush).not.toHaveBeenCalled();
});

test.each(["A1a", "B1", "C9", "D3b", "E9f", "F99b", "F83", "Zone-F111"])(
  "%s practice keeps its image and ends with results and answer review", async (signCode) => {
    mockSignCode = signCode;
    const sign = { id: 1, signCode, routeCode: signCode,
      categoryCode: signCode.startsWith("Zone") ? "Z" : signCode[0],
      nameEn: `Sign ${signCode}`, nameAr: "علامة", nameNl: "Bord", nameFr: "Panneau",
      imageUrl: image,
    };
    mockApiGet.mockResolvedValue({ data: sign });
    jest.mocked(startPracticeSession).mockResolvedValue({ sessionId: 18, signCode,
      status: "IN_PROGRESS", totalQuestions: 2, correctCount: 0, startedAt, questions,
    });
    jest.mocked(getPracticeResults).mockResolvedValue({ sessionId: 18, signCode,
      nameEn: sign.nameEn, nameAr: sign.nameAr, nameNl: sign.nameNl, nameFr: sign.nameFr,
      status: "IN_PROGRESS", totalQuestions: 2, correctAnswers: 0, wrongAnswers: 0,
      scorePercentage: 0, passed: false, startedAt, questionResults: [],
    });
    for (const [index, question] of questions.entries()) {
      jest.mocked(submitPracticeAnswer).mockResolvedValueOnce({ questionId: question.id,
        isCorrect: true, selectedChoiceId: question.id * 10, correctChoiceId: question.id * 10,
        selectedTextEn: "Reduce speed", selectedTextAr: "خفف السرعة", selectedTextNl: "Vertraag", selectedTextFr: "Ralentissez",
        correctTextEn: "Reduce speed", correctTextAr: "خفف السرعة", correctTextNl: "Vertraag", correctTextFr: "Ralentissez",
        questionsAnswered: index + 1, totalQuestions: 2, sessionCompleted: index === 1,
        signAccuracyPercentage: 100, signTotalAttempts: index + 1,
      });
    }
    render(<TrafficSignPracticePage />);
    await screen.findByText("Question 1");
    for (const [index, question] of questions.entries()) {
      expect(screen.getByRole("img", { name: sign.nameEn })).toHaveAttribute("src", image);
      fireEvent.click(screen.getByTestId("exam-option-card"));
      fireEvent.click(screen.getByTestId("submit-practice-answer"));
      if (index === 0) {
        fireEvent.click(await screen.findByRole("button", { name: translateMessage("en", "sign_quiz.practice.next_question") }));
        await screen.findByText("Question 2");
      }
      await waitFor(() => expect(submitPracticeAnswer).toHaveBeenCalledWith(18, question.id, question.id * 10, expect.any(Number)));
    }
    expect(await screen.findByTestId("show-answer-review")).toBeVisible();
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("show-answer-review"));
    expect(document.getElementById("answer-review")).toBeVisible();
  },
);
