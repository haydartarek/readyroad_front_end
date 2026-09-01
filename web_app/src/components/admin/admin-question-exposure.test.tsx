import { render, screen, waitFor } from "@testing-library/react";
import { AdminQuestionExposure } from "./admin-question-exposure";
import { apiClient } from "@/lib/api";

const translate = (key: string) => key;

jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({
    t: translate,
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

const categories = [
  {
    code: "TH01",
    nameEn: "Priority and intersections",
    nameNl: "Voorrang en kruispunten",
    nameFr: "Priorité et carrefours",
    nameAr: "الأولوية والتقاطعات",
  },
  {
    code: "TH02",
    nameEn: "Speed, roads and distances",
    nameNl: "Snelheid, wegen en afstanden",
    nameFr: "Vitesse, routes et distances",
    nameAr: "السرعة والطرق والمسافات",
  },
  {
    code: "TH07",
    nameEn: "Vehicle and technical safety",
    nameNl: "Voertuig en technische veiligheid",
    nameFr: "Véhicule et sécurité technique",
    nameAr: "المركبة والسلامة التقنية",
  },
];

describe("AdminQuestionExposure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "/admin/quiz/bank-health") {
        return Promise.resolve({ data: health });
      }
      if (url === "/admin/quiz/categories/manage") {
        return Promise.resolve({ data: categories });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  it("loads exposure analytics with category names and direct edit actions", async () => {
    render(<AdminQuestionExposure />);

    expect(
      await screen.findByTestId("question-exposure-panel"),
    ).toBeInTheDocument();

    expect(apiClient.get).toHaveBeenCalledWith("/admin/quiz/bank-health");
    expect(apiClient.get).toHaveBeenCalledWith("/admin/quiz/categories/manage");

    expect(screen.getByTestId("question-exposure-rare")).toHaveTextContent(
      "admin.quizzes.health.rarely_exposed",
    );
    expect(screen.getByTestId("question-exposure-heavy")).toHaveTextContent(
      "admin.quizzes.health.heavily_exposed",
    );

    expect(screen.getByText("Priority and intersections")).toBeInTheDocument();
    expect(screen.getByText("Speed, roads and distances")).toBeInTheDocument();
    expect(screen.getByText("Vehicle and technical safety")).toBeInTheDocument();

    expect(screen.queryByText(/^TH\d+$/)).not.toBeInTheDocument();
    expect(screen.getAllByText("difficulty.easy")).not.toHaveLength(0);
    expect(screen.getByText("difficulty.medium")).toBeInTheDocument();
    expect(screen.queryByText(/^EASY|MEDIUM|HARD$/)).not.toBeInTheDocument();

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
    (apiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "/admin/quiz/bank-health") {
        return Promise.reject(new Error("offline"));
      }
      if (url === "/admin/quiz/categories/manage") {
        return Promise.resolve({ data: categories });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(<AdminQuestionExposure />);

    await waitFor(() =>
      expect(
        screen.getByText("admin.quizzes.health.load_error"),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getAllByRole("button", {
        name: "admin.quizzes.health.refresh",
      }),
    ).toHaveLength(2);
  });
});
