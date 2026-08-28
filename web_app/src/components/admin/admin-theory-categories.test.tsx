import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { AdminTheoryCategories } from "./admin-theory-categories";
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
    post: jest.fn(),
    put: jest.fn(),
  },
  logApiError: jest.fn(),
}));

const category = {
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

  minimumRequired: 6,
  questionsNeeded: 0,
  examEligible: true,
};

describe("AdminTheoryCategories", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (apiClient.get as jest.Mock).mockResolvedValue({
      data: [category],
    });

    (apiClient.post as jest.Mock).mockResolvedValue({
      data: {},
    });

    (apiClient.put as jest.Mock).mockResolvedValue({
      data: {},
    });
  });

  it("loads the dedicated management endpoint and links to filtered questions", async () => {
    render(<AdminTheoryCategories />);

    expect(
      await screen.findByText("Priority and intersections"),
    ).toBeInTheDocument();

    expect(apiClient.get).toHaveBeenCalledWith(
      "/admin/quiz/categories/manage",
    );

    expect(
      screen.getByText(
        /45\/6.*admin\.quizzes\.health\.exam_ready/,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "admin.quizzes.health.view_questions",
      }),
    ).toHaveAttribute(
      "href",
      "/admin/quizzes?categoryCode=TH01",
    );
  });

  it("creates a category without requiring an admin-entered code", async () => {
    render(<AdminTheoryCategories />);

    await screen.findByText("Priority and intersections");

    fireEvent.click(
      screen.getByRole("button", {
        name: "admin.quizzes.health.add_category",
      }),
    );

    expect(
      screen.queryByRole("textbox", {
        name: "admin.quizzes.health.code",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("admin.quizzes.health.auto_code_hint"),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText("admin.quizzes.health.name_en"),
      { target: { value: "Emergency situations" } },
    );

    fireEvent.change(
      screen.getByLabelText("admin.quizzes.health.name_nl"),
      { target: { value: "Noodsituaties" } },
    );

    fireEvent.change(
      screen.getByLabelText("admin.quizzes.health.name_fr"),
      { target: { value: "Situations d'urgence" } },
    );

    fireEvent.change(
      screen.getByLabelText("admin.quizzes.health.name_ar"),
      { target: { value: "حالات الطوارئ" } },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "admin.quizzes.health.save",
      }),
    );

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        "/admin/quiz/categories",
        expect.objectContaining({
          code: null,
          examTargetWeight: 10,
          nameEn: "Emergency situations",
        }),
      ),
    );
  });

  it("shows how many questions an underfilled category still needs", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: [
        {
          ...category,
          id: 2,
          code: "TH09",
          nameEn: "Emergency situations",
          totalQuestions: 3,
          activeQuestions: 3,
          publishedQuestions: 3,
          eligibleAllLocales: 3,
          eligibleByLocale: {
            ar: 3,
            nl: 3,
            en: 3,
            fr: 3,
          },
          eligibleByDifficulty: {
            EASY: 0,
            MEDIUM: 1,
            HARD: 2,
          },
          minimumRequired: 6,
          questionsNeeded: 3,
          examEligible: false,
        },
      ],
    });

    render(<AdminTheoryCategories />);

    expect(
      await screen.findByText("Emergency situations"),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /3\/6.*admin\.quizzes\.health\.questions_needed.*3/,
      ),
    ).toBeInTheDocument();
  });
  it("preserves the stable category code while toggling activation", async () => {
    render(<AdminTheoryCategories />);

    await screen.findByText("Priority and intersections");

    fireEvent.click(
      screen.getByRole("button", {
        name: "admin.quizzes.health.deactivate",
      }),
    );

    await waitFor(() =>
      expect(apiClient.put).toHaveBeenCalledWith(
        "/admin/quiz/categories/1",
        expect.objectContaining({
          code: "TH01",
          active: false,
          examTargetWeight: 14,
        }),
      ),
    );
  });
});
