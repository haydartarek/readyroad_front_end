import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminAddQuizQuestionPage from "@/app/admin/quizzes/new/page";
import AdminEditQuizQuestionPage from "@/app/admin/quizzes/[id]/edit/page";
import { apiClient } from "@/lib/api";
import { isValidQuizOptionCount } from "@/lib/admin-quiz-form";

const mockPush = jest.fn();

jest.mock("@/hooks/use-localized-router", () => ({
  useLocalizedRouter: () => ({ push: mockPush }),
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "7" }),
}));

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({ t: (key: string) => key, language: "en" }),
  useOptionalLanguage: () => "en",
}));

jest.mock("@/components/localized-link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("@/lib/api", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
  isServiceUnavailable: () => false,
  logApiError: jest.fn(),
}));

const category = {
  code: "A",
  nameEn: "Danger signs",
  nameAr: "علامات الخطر",
  nameNl: "Gevaarsborden",
  nameFr: "Panneaux de danger",
};

const question = {
  id: 7,
  categoryCode: "A",
  difficultyLevel: "HARD",
  questionType: "MULTIPLE_CHOICE",
  questionEn: "Question EN",
  questionAr: "سؤال",
  questionNl: "Vraag",
  questionFr: "Question FR",
  explanationEn: "Explanation",
  explanationAr: "شرح",
  explanationNl: "Uitleg",
  explanationFr: "Explication",
  contentImageUrl: "",
  isActive: true,
  isReferenced: true,
  options: [
    {
      id: 11,
      textEn: "Yes",
      textAr: "نعم",
      textNl: "Ja",
      textFr: "Oui",
      isCorrect: true,
      displayOrder: 1,
    },
    {
      id: 12,
      textEn: "No",
      textAr: "لا",
      textNl: "Nee",
      textFr: "Non",
      isCorrect: false,
      displayOrder: 2,
    },
  ],
};

describe("Admin theoretical question forms", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("create uses theoretical categories and exposes all explanation fields", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: [category] });
    render(<AdminAddQuizQuestionPage />);

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith("/admin/quiz/categories"),
    );
    for (const language of ["en", "ar", "nl", "fr"]) {
      expect(
        screen.getByLabelText(`admin.quizzes.form.explanation_${language}`),
      ).toBeInTheDocument();
    }

    const difficulty = screen.getByLabelText(
      "admin.quizzes.form.difficulty",
    ) as HTMLSelectElement;
    fireEvent.click(
      screen.getByRole("button", { name: /admin.quizzes.form.add_option/ }),
    );
    expect(difficulty.value).toBe("EASY");
    expect(screen.getAllByText("C")).toHaveLength(1);
    expect(
      screen.queryByLabelText("admin.quizzes.form.question_type"),
    ).not.toBeInTheDocument();
  });

  test("create never mutates a selected difficulty after adding option C", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: [category] });
    render(<AdminAddQuizQuestionPage />);
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());

    const difficulty = screen.getByLabelText(
      "admin.quizzes.form.difficulty",
    ) as HTMLSelectElement;
    fireEvent.change(difficulty, { target: { value: "HARD" } });
    fireEvent.click(
      screen.getByRole("button", { name: /admin.quizzes.form.add_option/ }),
    );
    expect(difficulty.value).toBe("HARD");
  });

  test("edit keeps every field editable for a referenced question", async () => {
    (apiClient.get as jest.Mock).mockImplementation((url: string) =>
      Promise.resolve({
        data: url === "/admin/quiz/categories" ? [category] : question,
      }),
    );
    render(<AdminEditQuizQuestionPage />);

    const categorySelect = (await screen.findByLabelText(
      "admin.quizzes.form.category *",
    )) as HTMLSelectElement;
    expect(categorySelect).not.toBeDisabled();
    expect(
      screen.getByLabelText("admin.quizzes.form.difficulty"),
    ).not.toBeDisabled();
    expect(
      screen.queryByLabelText("admin.quizzes.form.question_type"),
    ).not.toBeInTheDocument();
    for (const language of ["en", "ar", "nl", "fr"]) {
      expect(
        screen.getByLabelText(`admin.quizzes.form.explanation_${language}`),
      ).toBeInTheDocument();
    }
  });

  test("accepts the two-to-three option policy independently of difficulty", () => {
    expect(isValidQuizOptionCount(2)).toBe(true);
    expect(isValidQuizOptionCount(3)).toBe(true);
  });
});
