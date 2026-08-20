import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ExamResultsPage from "./page";
import apiClient from "@/lib/api";

let mockLanguage: "en" | "ar" | "nl" | "fr" = "ar";
let mockUser: { firstName?: string; fullName?: string; username?: string } = {
  firstName: "Haydar",
};
const mockT = (key: string, values?: Record<string, string | number>) => {
  const value =
    ({
    "common.not_available":
      mockLanguage === "ar"
        ? "غير متوفر"
        : mockLanguage === "nl"
          ? "Niet beschikbaar"
          : mockLanguage === "fr"
            ? "Non disponible"
            : "Not available",
    "practice_exam.review_show_details": "Show details",
    "practice_exam.review_hide_details": "Hide details",
    "practice_exam.review_explanation": "Explanation",
    "practice_exam.review_explanation_unavailable":
      mockLanguage === "fr"
        ? "L’explication n’est pas disponible pour le moment."
        : "The explanation is currently unavailable.",
    "practice_exam.score_timeout": "Time expired",
    "practice_exam.difficulty_easy": "Easy",
    "exam.results_score_label": "النتيجة النهائية",
    "exam.results_passed_title": "أحسنت.",
    "exam.results_passed_subtitle":
      "مبروك! انتقل إلى لوحة التحكم لمعرفة مدى جاهزيتك للامتحان الرسمي.",
    "exam.results_passed_subtitle_named":
      "مبروك يا {firstName}، انتقل إلى لوحة التحكم لمعرفة مدى جاهزيتك للامتحان الرسمي.",
  })[key] ?? key;
  return Object.entries(values ?? {}).reduce(
    (text, [name, replacement]) =>
      text.replaceAll(`{${name}}`, String(replacement)),
    value,
  );
};

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "77" }),
}));

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({
    language: mockLanguage,
    t: mockT,
  }),
}));

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ user: mockUser }),
}));

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn() },
  isServiceUnavailable: () => false,
  logApiError: jest.fn(),
}));

jest.mock("@/components/localized-link", () => {
  return function MockLink({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return <a href={href}>{children}</a>;
  };
});

const mockedApiGet = apiClient.get as jest.Mock;

function result(explanationFr: string | null = "Explication enregistrée") {
  const answer = {
    questionId: 12,
    questionTextEn: "English question",
    questionTextAr: "السؤال العربي",
    questionTextNl: "Nederlandse vraag",
    questionTextFr: "Question française",
    selectedOptionText: "English selected",
    selectedOptionTextEn: "English selected",
    selectedOptionTextAr: "الإجابة المختارة" as string | null,
    selectedOptionTextNl: "Gekozen antwoord",
    selectedOptionTextFr: "Réponse choisie",
    correctOptionText: "English correct",
    correctOptionTextEn: "English correct",
    correctOptionTextAr: "الإجابة الصحيحة" as string | null,
    correctOptionTextNl: "Juist antwoord",
    correctOptionTextFr: "Bonne réponse",
    explanationEn: "Saved English explanation",
    explanationAr: "الشرح المحفوظ",
    explanationNl: "Opgeslagen uitleg",
    explanationFr,
    categoryName: "Priority",
    categoryNameEn: "Priority",
    categoryNameAr: "الأولوية",
    categoryNameNl: "Voorrang",
    categoryNameFr: "Priorité",
    categoryCode: "PRIORITY",
    isCorrect: false,
  };

  return {
    examId: 77,
    userId: 1,
    completedAt: "2026-08-05T12:00:00Z",
    totalQuestions: 1,
    correctAnswers: 0,
    wrongAnswers: 1,
    scorePercentage: 0,
    passed: false,
    passingScore: 41,
    passingThreshold: 41,
    pointsToPass: 41,
    timeTakenSeconds: 30,
    averageTimePerQuestion: 30,
    answeredCount: 1,
    unansweredCount: 0,
    weakCategories: [],
    categoryBreakdown: [],
    incorrectQuestions: [answer],
    allAnswers: [answer],
  };
}

describe("localized theory exam review", () => {
  const scrollIntoView = jest.fn();

  beforeEach(() => {
    mockLanguage = "ar";
    mockUser = { firstName: "Haydar" };
    mockedApiGet.mockReset();
    mockedApiGet.mockResolvedValue({ data: result() });
    scrollIntoView.mockReset();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
  });

  it("opens, scrolls to, and focuses the first review question without changing route", async () => {
    render(<ExamResultsPage />);
    await waitFor(() => expect(mockedApiGet).toHaveBeenCalled());
    const pathBefore = window.location.pathname;

    fireEvent.click(
      await screen.findByRole("button", {
        name: "exam.results_toggle_review",
      }),
    );

    const firstQuestion = await screen.findByTestId(
      "result-review-first-question",
    );
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    }));
    expect(firstQuestion).toHaveFocus();
    expect(window.location.pathname).toBe(pathBefore);
  });

  it.each([
    ["ar", "الإجابة المختارة", "الإجابة الصحيحة", "الشرح المحفوظ"],
    ["nl", "Gekozen antwoord", "Juist antwoord", "Opgeslagen uitleg"],
    ["en", "English selected", "English correct", "Saved English explanation"],
    ["fr", "Réponse choisie", "Bonne réponse", "Explication enregistrée"],
  ] as const)(
    "shows selected answer, correct answer, and saved explanation in %s",
    async (language, selected, correct, explanation) => {
      mockLanguage = language;
      render(<ExamResultsPage />);

      await waitFor(() => expect(mockedApiGet).toHaveBeenCalled());
      fireEvent.click(
        await screen.findByRole("button", {
          name: "practice_exam.review_title",
        }),
      );
      expect(await screen.findByText(selected)).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: "Show details" }));

      expect(screen.getByText(correct)).toBeVisible();
      expect(screen.getByText(explanation)).toBeVisible();
      if (language !== "en") {
        expect(screen.queryByText("English selected")).not.toBeInTheDocument();
      }
    },
  );

  it("uses the localized unavailable label instead of another language", async () => {
    mockLanguage = "fr";
    mockedApiGet.mockResolvedValue({ data: result(null) });
    render(<ExamResultsPage />);

    await waitFor(() => expect(mockedApiGet).toHaveBeenCalled());
    fireEvent.click(
      await screen.findByRole("button", {
        name: "practice_exam.review_title",
      }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Show details" }),
    );

    expect(
      screen.getByText("L’explication n’est pas disponible pour le moment."),
    ).toBeVisible();
    expect(
      screen.queryByText("Saved English explanation"),
    ).not.toBeInTheDocument();
  });

  it("does not fall back to English when a localized answer is missing", async () => {
    const missingArabicAnswer = result();
    missingArabicAnswer.allAnswers[0].selectedOptionTextAr = null;
    missingArabicAnswer.allAnswers[0].correctOptionTextAr = null;
    mockedApiGet.mockResolvedValue({ data: missingArabicAnswer });
    render(<ExamResultsPage />);

    await waitFor(() => expect(mockedApiGet).toHaveBeenCalled());
    fireEvent.click(
      await screen.findByRole("button", {
        name: "practice_exam.review_title",
      }),
    );

    expect(await screen.findByText("غير متوفر")).toBeVisible();
    expect(screen.queryByText("English selected")).not.toBeInTheDocument();
  });

  it("keeps question/category and status in responsive header groups", async () => {
    render(<ExamResultsPage />);

    await waitFor(() => expect(mockedApiGet).toHaveBeenCalled());
    fireEvent.click(
      await screen.findByRole("button", {
        name: "practice_exam.review_title",
      }),
    );

    const header = await screen.findByTestId("result-review-header");
    expect(header).toHaveClass("grid", "sm:grid-cols-[minmax(0,1fr)_auto]");
    expect(
      screen.getByTestId("result-review-question-category"),
    ).toBeVisible();
    expect(screen.getByTestId("result-review-status")).toBeVisible();
  });

  it("renders a timed-out question as unanswered instead of a wrong selection", async () => {
    const timeoutResult = result();
    timeoutResult.answeredCount = 0;
    timeoutResult.unansweredCount = 1;
    timeoutResult.wrongAnswers = 0;
    timeoutResult.incorrectQuestions = [];
    Object.assign(timeoutResult.allAnswers[0], {
      selectedOptionText: null,
      selectedOptionTextEn: null,
      selectedOptionTextAr: null,
      selectedOptionTextNl: null,
      selectedOptionTextFr: null,
      wasTimeout: true,
      difficulty: "EASY",
    });
    mockedApiGet.mockResolvedValue({ data: timeoutResult });

    render(<ExamResultsPage />);
    await waitFor(() => expect(mockedApiGet).toHaveBeenCalled());
    fireEvent.click(
      await screen.findByRole("button", {
        name: "exam.results_toggle_review",
      }),
    );

    expect(await screen.findByTestId("result-review-status")).toHaveTextContent(
      "Time expired",
    );
    expect(screen.getByText("Easy")).toBeVisible();
    expect(screen.queryByText("English selected")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show details" }));
    expect(screen.getByText("الإجابة الصحيحة")).toBeVisible();
  });

  it("leads with the final result and personalizes a passed result safely", async () => {
    const passedResult = result();
    passedResult.passed = true;
    passedResult.correctAnswers = 1;
    passedResult.wrongAnswers = 0;
    passedResult.scorePercentage = 100;
    mockedApiGet.mockResolvedValue({ data: passedResult });

    render(<ExamResultsPage />);

    expect(await screen.findByText("النتيجة النهائية")).toBeVisible();
    expect(
      screen.getByText(
        "مبروك يا Haydar، انتقل إلى لوحة التحكم لمعرفة مدى جاهزيتك للامتحان الرسمي.",
      ),
    ).toBeVisible();
    expect(screen.queryByText("exam.results_badge")).not.toBeInTheDocument();
    expect(screen.queryByText("practice_exam.badge")).not.toBeInTheDocument();
  });

  it("uses the natural fallback instead of exposing a technical username", async () => {
    mockUser = { username: "internal-user-42" };
    const passedResult = result();
    passedResult.passed = true;
    mockedApiGet.mockResolvedValue({ data: passedResult });

    render(<ExamResultsPage />);

    expect(
      await screen.findByText(
        "مبروك! انتقل إلى لوحة التحكم لمعرفة مدى جاهزيتك للامتحان الرسمي.",
      ),
    ).toBeVisible();
    expect(screen.queryByText(/internal-user-42/)).not.toBeInTheDocument();
  });
});
