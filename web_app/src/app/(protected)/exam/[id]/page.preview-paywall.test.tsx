import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";

import apiClient from "@/lib/api";
import ExamQuestionsPage from "./page";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();

const mockRouter = {
  replace: mockReplace,
  push: mockPush,
  back: mockBack,
};

const mockTranslate = (key: string) => key;

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "42" }),
}));

jest.mock("@/hooks/use-localized-router", () => ({
  useLocalizedRouter: () => mockRouter,
}));

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({
    language: "en",
    isRTL: false,
    t: mockTranslate,
  }),
}));

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
  isServiceUnavailable: () => false,
  logApiError: jest.fn(),
}));

jest.mock(
  "@/hooks/use-exam-question-presentation",
  () => ({
    useExamQuestionPresentation: jest.fn(),
  }),
);

jest.mock("@/components/localized-link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock(
  "@/components/exam/exit-confirm-dialog",
  () => ({
    ExitConfirmDialog: () => null,
  }),
);

jest.mock(
  "@/components/exam/free-exam-paywall",
  () => ({
    FreeExamPaywall: ({
      open,
      examId,
    }: {
      open: boolean;
      examId: number;
    }) =>
      open ? (
        <div
          role="dialog"
          data-testid="free-exam-paywall"
        >
          PAYWALL EXAM {examId}
        </div>
      ) : null,
  }),
);

jest.mock(
  "@/components/exam/focused-exam-shell",
  () => ({
    FocusedExamShell: ({
      children,
      afterCard,
      counter,
    }: {
      children: ReactNode;
      afterCard?: ReactNode;
      counter?: ReactNode;
    }) => (
      <main>
        <div data-testid="exam-counter">
          {counter}
        </div>
        {children}
        {afterCard}
      </main>
    ),
  }),
);

jest.mock(
  "@/components/exam/focused-question-card",
  () => ({
    FocusedQuestionCard: ({
      title,
      options,
      feedback,
      footer,
    }: {
      title?: ReactNode;
      feedback?: ReactNode;
      footer?: ReactNode;
      options: Array<{
        key: number | string;
        text: ReactNode;
        disabled?: boolean;
        onSelect: () => void;
      }>;
    }) => (
      <section>
        <h1>{title}</h1>

        <div>
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              disabled={option.disabled}
              onClick={option.onSelect}
            >
              {option.text}
            </button>
          ))}
        </div>

        {feedback}
        {footer}
      </section>
    ),
  }),
);

jest.mock("next/image", () => ({
  __esModule: true,
  default: () => null,
  getImageProps: () => ({
    props: {},
  }),
}));

jest.mock("@/lib/image-utils", () => ({
  convertToPublicImageUrl: () => null,
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
  },
}));

const get = apiClient.get as jest.Mock;
const post = apiClient.post as jest.Mock;

function question(order: number) {
  return {
    questionId: order,
    questionOrder: order,

    questionTextEn: `Question ${order}`,
    questionTextAr: `Question ${order}`,
    questionTextNl: `Question ${order}`,
    questionTextFr: `Question ${order}`,

    difficultyLevel: "EASY" as const,

    options: [
      {
        optionId: order * 10 + 1,
        optionTextEn: `Q${order} A`,
        optionTextAr: `Q${order} A`,
        optionTextNl: `Q${order} A`,
        optionTextFr: `Q${order} A`,
      },
      {
        optionId: order * 10 + 2,
        optionTextEn: `Q${order} B`,
        optionTextAr: `Q${order} B`,
        optionTextNl: `Q${order} B`,
        optionTextFr: `Q${order} B`,
      },
    ],
  };
}

function previewExam(
  accessState:
    | "PREVIEW_ACTIVE"
    | "FREE_LIMIT_REACHED",
) {
  return {
    examId: 42,
    totalQuestions: 50,
    startedAt: "2026-09-20T12:00:00Z",
    expiresAt: "2026-09-20T12:12:30Z",

    questions: Array.from(
      { length: 10 },
      (_, index) => question(index + 1),
    ),

    accessMode: "PREVIEW" as const,
    accessState,
    freeQuestionLimit: 10,

    resumeQuestionOrder:
      accessState === "FREE_LIMIT_REACHED"
        ? 11
        : 10,

    finalizedQuestionIds:
      accessState === "FREE_LIMIT_REACHED"
        ? Array.from(
            { length: 10 },
            (_, index) => index + 1,
          )
        : Array.from(
            { length: 9 },
            (_, index) => index + 1,
          ),
  };
}

function fullExam() {
  return {
    examId: 42,
    totalQuestions: 50,
    startedAt: "2026-09-20T12:00:00Z",
    expiresAt: "2026-09-20T12:12:30Z",

    questions: Array.from(
      { length: 50 },
      (_, index) => question(index + 1),
    ),

    accessMode: "FULL" as const,
    accessState: "FULL_ACTIVE" as const,
    freeQuestionLimit: 10,
    resumeQuestionOrder: 11,

    finalizedQuestionIds: Array.from(
      { length: 10 },
      (_, index) => index + 1,
    ),
  };
}

function activeResponse(
  activeExam: ReturnType<
    typeof previewExam
  > | ReturnType<typeof fullExam>,
) {
  return {
    data: {
      hasActiveExam: true,
      activeExam,
    },
  };
}

describe("theory exam preview paywall integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    get.mockReset();
    post.mockReset();

    post.mockImplementation(
      async (url: string) => {
        if (
          url ===
          "/exams/simulations/42/questions/10/answer"
        ) {
          return {
            data: {
              correct: true,
              correctOptionId: 101,
              accessState:
                "FREE_LIMIT_REACHED",
            },
          };
        }

        return {
          data: {},
        };
      },
    );
  });

  test("question ten shows preview feedback then Next opens paywall without exposing question eleven", async () => {
    get.mockResolvedValue(
      activeResponse(
        previewExam("PREVIEW_ACTIVE"),
      ),
    );

    render(<ExamQuestionsPage />);

    await waitFor(() =>
      expect(
        screen.getByText("Question 10"),
      ).toBeVisible(),
    );

    expect(
      screen.getByTestId("exam-counter"),
    ).toHaveTextContent("10 / 50");

    expect(
      screen.queryByTestId(
        "free-exam-paywall",
      ),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Q10 A",
      }),
    );

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        "/exams/simulations/42/questions/10/answer",
        expect.objectContaining({
          selectedOptionId: 101,
        }),
      ),
    );

    expect(
      await screen.findByText(
        "practice_exam.score_correct",
      ),
    ).toBeVisible();

    const nextButton =
      screen.getByTestId("exam-next");

    await waitFor(() =>
      expect(nextButton).toBeEnabled(),
    );

    fireEvent.click(nextButton);

    expect(
      await screen.findByTestId(
        "free-exam-paywall",
      ),
    ).toHaveTextContent(
      "PAYWALL EXAM 42",
    );

    expect(
      screen.queryByText("Question 11"),
    ).not.toBeInTheDocument();

    expect(post).not.toHaveBeenCalledWith(
      "/exams/simulations/42/submit",
    );
  });

  test("refresh at FREE_LIMIT_REACHED restores question ten behind an immediate paywall", async () => {
    get.mockResolvedValue(
      activeResponse(
        previewExam("FREE_LIMIT_REACHED"),
      ),
    );

    render(<ExamQuestionsPage />);

    await waitFor(() =>
      expect(
        screen.getByText("Question 10"),
      ).toBeVisible(),
    );

    expect(
      await screen.findByTestId(
        "free-exam-paywall",
      ),
    ).toHaveTextContent(
      "PAYWALL EXAM 42",
    );

    expect(
      screen.getByTestId("exam-counter"),
    ).toHaveTextContent("10 / 50");

    expect(
      screen.queryByText("Question 11"),
    ).not.toBeInTheDocument();

    expect(get).toHaveBeenCalledWith(
      "/exams/simulations/active",
    );
  });

  test("after entitlement becomes FULL the same exam resumes directly at question eleven", async () => {
    get.mockResolvedValue(
      activeResponse(fullExam()),
    );

    render(<ExamQuestionsPage />);

    await waitFor(() =>
      expect(
        screen.getByText("Question 11"),
      ).toBeVisible(),
    );

    expect(
      screen.getByTestId("exam-counter"),
    ).toHaveTextContent("11 / 50");

    expect(
      screen.queryByText("Question 10"),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId(
        "free-exam-paywall",
      ),
    ).not.toBeInTheDocument();

    expect(mockReplace).not.toHaveBeenCalledWith(
      "/exam",
    );
  });
});