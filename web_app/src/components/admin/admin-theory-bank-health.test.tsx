import { render, screen } from "@testing-library/react";
import { AdminTheoryBankHealth } from "./admin-theory-bank-health";
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
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

jest.mock("@/lib/api", () => ({
  apiClient: {
    get: jest.fn(),
  },
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
    {
      locale: "en",
      eligibleQuestions: 204,
      translationGapQuestions: 0,
    },
    {
      locale: "ar",
      eligibleQuestions: 204,
      translationGapQuestions: 0,
    },
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
      eligibleByLocale: {
        ar: 45,
        nl: 45,
        en: 45,
        fr: 45,
      },
      eligibleByDifficulty: {
        EASY: 20,
        MEDIUM: 15,
        HARD: 10,
      },

      translationGapQuestions: 0,
      explanationGapQuestions: 0,
      invalidQuestions: 0,
      totalPresentations: 17,

      inventoryShare: 22,
      targetShare: 14,
      representationStatus: "BALANCED",

      minimumRequired: 5,
      questionsNeeded: 0,
      examEligible: true,
    },
  ],

  questionsNeedingReview: [
    {
      questionId: 11,
      categoryCode: "TH01",
      difficulty: "HARD",
      presentations: 42,
      answered: 40,
      correctRate: 25,
      incorrectRate: 75,
      averageAnswerTimeSeconds: 12,

      performanceByLocale: {
        en: {
          answered: 20,
          correct: 10,
          correctRate: 50,
          averageAnswerTimeSeconds: 10,
        },
        ar: {
          answered: 20,
          correct: 0,
          correctRate: 0,
          averageAnswerTimeSeconds: 14,
        },
        nl: {
          answered: 0,
          correct: 0,
          correctRate: null,
          averageAnswerTimeSeconds: null,
        },
        fr: {
          answered: 0,
          correct: 0,
          correctRate: null,
          averageAnswerTimeSeconds: null,
        },
      },

      flags: ["LOCALE_DIVERGENCE"],
    },
  ],

  rarelyExposedQuestions: [
    {
      questionId: 12,
      categoryCode: "TH01",
      difficulty: "EASY",
      presentations: 1,
    },
  ],

  heavilyExposedQuestions: [
    {
      questionId: 13,
      categoryCode: "TH01",
      difficulty: "MEDIUM",
      presentations: 99,
    },
  ],
};

describe("AdminTheoryBankHealth", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (apiClient.get as jest.Mock).mockResolvedValue({
      data: health,
    });
  });

  it("renders theory-bank analytics without category write controls", async () => {
    render(<AdminTheoryBankHealth />);

    expect(
      await screen.findByText("Priority and intersections"),
    ).toBeInTheDocument();

    expect(screen.getAllByText("204")).not.toHaveLength(0);

    expect(
      screen.getByText("#11 · TH01 · HARD"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("#12 · TH01 · EASY · 1"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("#13 · TH01 · MEDIUM · 99"),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "admin.quizzes.health.add_category",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "admin.quizzes.health.deactivate",
      }),
    ).not.toBeInTheDocument();
  });

  it("links category management to the dedicated admin page", async () => {
    render(<AdminTheoryBankHealth />);

    await screen.findByText("Priority and intersections");

    expect(
      screen.getByRole("link", {
        name: "admin.quizzes.health.category_management_title",
      }),
    ).toHaveAttribute(
      "href",
      "/admin/quizzes/categories",
    );
  });
});
