import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { AdminTheoryCategories } from "./admin-theory-categories";
import { apiClient } from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";
import { translateMessage } from "@/lib/messages";

jest.mock("@/contexts/language-context", () => ({
  useLanguage: jest.fn(),
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
  publishedQuestions: 45,
  eligibleAllLocales: 45,
  eligibleByDifficulty: {
    EASY: 20,
    MEDIUM: 15,
    HARD: 10,
  },
  minimumRequired: 6,
  questionsNeeded: 0,
  examEligible: true,
};

describe("AdminTheoryCategories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLanguage as jest.Mock).mockReturnValue({
      t: (key: string) => key,
      language: "en",
    });

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

  it("loads category names while keeping stable codes out of the visible UI", async () => {
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

    expect(screen.queryByText(/^TH\d+$/)).not.toBeInTheDocument();
    expect(screen.getByText("difficulty.easy")).toBeInTheDocument();
    expect(screen.getByText("difficulty.medium")).toBeInTheDocument();
    expect(screen.getByText("difficulty.hard")).toBeInTheDocument();
    expect(screen.queryByText(/^EASY|MEDIUM|HARD$/)).not.toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "admin.quizzes.health.view_questions",
      }),
    ).toHaveAttribute(
      "href",
      "/admin/quizzes?categoryCode=TH01",
    );
  });

  it.each([
    ["ar", "nameAr"], ["en", "nameEn"], ["nl", "nameNl"], ["fr", "nameFr"],
  ] as const)("uses shared admin surfaces and readable localized controls in %s", async (locale, nameKey) => {
    const t = (key: string) => translateMessage(locale, key);
    (useLanguage as jest.Mock).mockReturnValue({ t, language: locale });
    render(<AdminTheoryCategories />);

    const heading = await screen.findByRole("heading", { name: category[nameKey] });
    const section = screen.getByRole("heading", {
      name: t("admin.quizzes.health.categories"), level: 2,
    }).closest("section");
    expect(section).toHaveClass("rounded-2xl", "border-border/50", "bg-card");
    expect(heading.closest("article")).toHaveClass("rounded-2xl", "border-border/50", "bg-card");
    expect(heading.parentElement?.parentElement).toHaveClass("flex-col", "sm:flex-row");
    expect(screen.getByTestId("theory-category-management").querySelector('[class*="bg-gradient"]')).toBeNull();
    expect(screen.getByText(t("difficulty.medium"))).toHaveClass("break-words");
    expect(screen.getByRole("button", { name: t("admin.quizzes.health.refresh") })).toHaveAttribute("data-size", "icon");
    expect(screen.queryByText(/TH\d+/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("admin.quizzes.health.edit_category") }));
    const arabicName = screen.getByLabelText(t("admin.quizzes.health.name_ar"));
    expect(arabicName.closest("form")).toHaveClass("rounded-2xl", "border-border/50", "bg-card");
    expect(arabicName).toHaveAttribute("dir", "rtl");
    for (const language of ["en", "nl", "fr"]) {
      expect(screen.getByLabelText(t(`admin.quizzes.health.name_${language}`))).toHaveAttribute("dir", "ltr");
    }
  });

  it("preserves the category payload when editing through the restyled form", async () => {
    render(<AdminTheoryCategories />);
    await screen.findByText(category.nameEn);
    fireEvent.click(screen.getByRole("button", { name: "admin.quizzes.health.edit_category" }));
    fireEvent.change(screen.getByLabelText("admin.quizzes.health.name_en"), {
      target: { value: "Priority rules" },
    });
    fireEvent.click(screen.getByRole("button", { name: "admin.quizzes.health.save" }));

    await waitFor(() => expect(apiClient.put).toHaveBeenCalledWith(
      "/admin/quiz/categories/1",
      expect.objectContaining({
        code: category.code,
        nameEn: "Priority rules",
        nameAr: category.nameAr,
        nameNl: category.nameNl,
        nameFr: category.nameFr,
        examTargetWeight: category.examTargetWeight,
        displayOrder: category.displayOrder,
        active: category.active,
        contentScope: category.contentScope,
      }),
    ));
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
          publishedQuestions: 3,
          eligibleAllLocales: 3,
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

    expect(screen.queryByText(/^TH\d+$/)).not.toBeInTheDocument();
  });

  it("preserves the stable category code internally while toggling activation", async () => {
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
