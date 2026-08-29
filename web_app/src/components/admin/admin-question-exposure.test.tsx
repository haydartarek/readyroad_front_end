import { render, screen, waitFor } from "@testing-library/react";
import { AdminQuestionExposure } from "./admin-question-exposure";
import { apiClient } from "@/lib/api";

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: "en",
  }),
}));

jest.mock("@/components/localized-link", () => ({
  __esModule: true,
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

jest.mock("@/lib/api", () => ({
  apiClient: {
    get: jest.fn(),
  },
  logApiError: jest.fn(),
}));

const health = {
  rarelyExposedQuestions: [
    {
      questionId: 5,
      categoryCode: "TH01",
      difficulty: "EASY",
      presentations: 0,
    },
    {
      questionId: 66,
      categoryCode: "TH02",
      difficulty: "MEDIUM",
      presentations: 1,
    },
  ],
  heavilyExposedQuestions: [
    {
      questionId: 17,
      categoryCode: "TH07",
      difficulty: "EASY",
      presentations: 9,
    },
  ],
};

describe("AdminQuestionExposure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: health });
  });

  it("loads exposure analytics and turns each question into a direct edit action", async () => {
    render(<AdminQuestionExposure />);

    expect(
      await screen.findByTestId("question-exposure-panel"),
    ).toBeInTheDocument();

    expect(apiClient.get).toHaveBeenCalledWith("/admin/quiz/bank-health");

    expect(screen.getByTestId("question-exposure-rare")).toHaveTextContent(
      "admin.quizzes.health.rarely_exposed",
    );
    expect(screen.getByTestId("question-exposure-heavy")).toHaveTextContent(
      "admin.quizzes.health.heavily_exposed",
    );

    expect(screen.getByRole("link", { name: /#5/ })).toHaveAttribute(
      "href",
      "/admin/quizzes/5/edit",
    );
    expect(screen.getByRole("link", { name: /#17/ })).toHaveAttribute(
      "href",
      "/admin/quizzes/17/edit",
    );
  });

  it("keeps the panel usable when exposure analytics cannot load", async () => {
    (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error("offline"));

    render(<AdminQuestionExposure />);

    await waitFor(() =>
      expect(
        screen.getByText("admin.quizzes.health.load_error"),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getByRole("button", { name: "admin.quizzes.health.refresh" }),
    ).toBeInTheDocument();
  });
});
