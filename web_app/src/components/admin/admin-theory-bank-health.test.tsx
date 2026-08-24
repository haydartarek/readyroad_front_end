import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AdminTheoryBankHealth } from "./admin-theory-bank-health";
import { apiClient } from "@/lib/api";

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({ t: (key: string) => key, language: "en" }),
}));

jest.mock("@/lib/api", () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
  logApiError: jest.fn(),
}));

const health = {
  generatedAt: "2026-08-24T00:00:00Z",
  summary: {
    totalQuestions: 204,
    activeQuestions: 204,
    inactiveQuestions: 0,
    publishedQuestions: 204,
    eligibleAllLocales: 204,
    translationGapQuestions: 0,
    explanationGapQuestions: 9,
    invalidQuestions: 0,
    underrepresentedCategories: 1,
    overrepresentedCategories: 0,
  },
  locales: [
    { locale: "en", eligibleQuestions: 204, translationGapQuestions: 0 },
    { locale: "ar", eligibleQuestions: 204, translationGapQuestions: 0 },
  ],
  categories: [
    {
      id: 1,
      code: "TH01",
      nameEn: "Priority and intersections",
      nameNl: "Voorrang en kruispunten",
      nameFr: "Priorité et carrefours",
      nameAr: "الأولوية والتقاطعات",
      descriptionEn: null,
      descriptionNl: null,
      descriptionFr: null,
      descriptionAr: null,
      displayOrder: 1,
      active: true,
      contentScope: "THEORETICAL_EXAM",
      examTargetWeight: 14,
      totalQuestions: 45,
      activeQuestions: 45,
      publishedQuestions: 45,
      eligibleAllLocales: 45,
      eligibleByLocale: { ar: 45, nl: 45, en: 45, fr: 45 },
      eligibleByDifficulty: { EASY: 20, MEDIUM: 15, HARD: 10 },
      translationGapQuestions: 0,
      explanationGapQuestions: 0,
      invalidQuestions: 0,
      totalPresentations: 17,
      inventoryShare: 22,
      targetShare: 14,
      representationStatus: "BALANCED",
    },
  ],
  questionsNeedingReview: [{
    questionId: 11,
    categoryCode: "TH01",
    difficulty: "HARD",
    presentations: 42,
    answered: 40,
    correctRate: 25,
    incorrectRate: 75,
    averageAnswerTimeSeconds: 12,
    performanceByLocale: {
      en: { answered: 20, correct: 10, correctRate: 50, averageAnswerTimeSeconds: 10 },
      ar: { answered: 20, correct: 0, correctRate: 0, averageAnswerTimeSeconds: 14 },
      nl: { answered: 0, correct: 0, correctRate: null, averageAnswerTimeSeconds: null },
      fr: { answered: 0, correct: 0, correctRate: null, averageAnswerTimeSeconds: null },
    },
    flags: ["LOCALE_DIVERGENCE"],
  }],
  rarelyExposedQuestions: [{ questionId: 12, categoryCode: "TH01", difficulty: "EASY", presentations: 1 }],
  heavilyExposedQuestions: [{ questionId: 13, categoryCode: "TH01", difficulty: "MEDIUM", presentations: 99 }],
};

describe("AdminTheoryBankHealth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: health });
    (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });
    (apiClient.put as jest.Mock).mockResolvedValue({ data: {} });
  });

  it("renders real inventory and updates category activation through the API", async () => {
    render(<AdminTheoryBankHealth />);

    expect(await screen.findByText("Priority and intersections")).toBeInTheDocument();
    expect(screen.getAllByText("204")).not.toHaveLength(0);
    expect(screen.getByText("#11 · TH01 · HARD")).toBeInTheDocument();
    expect(screen.getByText("#12 · TH01 · EASY · 1")).toBeInTheDocument();
    expect(screen.getByText("#13 · TH01 · MEDIUM · 99")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "admin.quizzes.health.deactivate" }));

    await waitFor(() =>
      expect(apiClient.put).toHaveBeenCalledWith(
        "/admin/quiz/categories/1",
        expect.objectContaining({ code: "TH01", active: false, examTargetWeight: 14 }),
      ),
    );
  });

  it("creates a fully localized category without inventing an exam weight", async () => {
    render(<AdminTheoryBankHealth />);
    await screen.findByText("Priority and intersections");

    fireEvent.click(screen.getByRole("button", { name: "admin.quizzes.health.add_category" }));
    fireEvent.change(screen.getByLabelText("admin.quizzes.health.code"), { target: { value: "TH09" } });
    fireEvent.change(screen.getByLabelText("admin.quizzes.health.name_en"), { target: { value: "New category" } });
    fireEvent.change(screen.getByLabelText("admin.quizzes.health.name_nl"), { target: { value: "Nieuwe categorie" } });
    fireEvent.change(screen.getByLabelText("admin.quizzes.health.name_fr"), { target: { value: "Nouvelle catégorie" } });
    fireEvent.change(screen.getByLabelText("admin.quizzes.health.name_ar"), { target: { value: "فئة جديدة" } });
    fireEvent.click(screen.getByRole("button", { name: "admin.quizzes.health.save" }));

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        "/admin/quiz/categories",
        expect.objectContaining({ code: "TH09", examTargetWeight: null }),
      ),
    );
  });
});
