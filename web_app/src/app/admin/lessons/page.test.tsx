import { fireEvent, render, screen } from "@testing-library/react";
import AdminLessonsPage from "./page";
import { getAdminLessons } from "@/lib/admin-lessons";

jest.mock("@/lib/admin-lessons", () => ({
  getAdminLessons: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  isServiceUnavailable: () => false,
  logApiError: jest.fn(),
}));

jest.mock("@/contexts/language-context", () => {
  const translate = (key: string) => key;

  return {
    useLanguage: () => ({
      t: translate,
      language: "en",
      isRTL: false,
    }),
  };
});

jest.mock("@/components/localized-link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

const mockedGetAdminLessons =
  getAdminLessons as jest.MockedFunction<typeof getAdminLessons>;

const lessons = [
  {
    id: 1,
    lessonCode: "LES-01",
    titleAr: "الأولوية والتقاطعات",
    titleNl: "Voorrang en kruispunten",
    titleFr: "Priorité et carrefours",
    titleEn: "Priority and intersections",
    active: true,
    editorState: "PUBLISHED_WITH_DRAFT" as const,
    displayOrder: 1,
    estimatedMinutes: 12,
    pageCount: 8,
    currentVersion: 2,
    hasDraft: true,
    draftRevision: 4,
    categoryCount: 0,
    mediaCount: 0,
    updatedAt: "2026-09-24T06:00:00Z",
  },
  {
    id: 2,
    lessonCode: "LES-02",
    titleAr: "السرعة والطرق",
    titleNl: "Snelheid en wegen",
    titleFr: "Vitesse et routes",
    titleEn: "Speed and roads",
    active: true,
    editorState: "PUBLISHED" as const,
    displayOrder: 2,
    estimatedMinutes: 10,
    pageCount: 6,
    currentVersion: 1,
    hasDraft: false,
    draftRevision: null,
    categoryCount: 0,
    mediaCount: 0,
    updatedAt: "2026-09-23T06:00:00Z",
  },
];

describe("AdminLessonsPage", () => {
  beforeEach(() => {
    mockedGetAdminLessons.mockReset();
  });

  it("renders lesson summaries and filters by search and draft state", async () => {
    mockedGetAdminLessons.mockResolvedValue(lessons);

    render(<AdminLessonsPage />);

    expect(
      await screen.findByText("Priority and intersections"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Speed and roads"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("LES-01"),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "admin.lessons.status_published_with_draft",
      ),
    ).toBeInTheDocument();

    const search =
      screen.getByLabelText("admin.lessons.search_label");

    fireEvent.change(search, {
      target: { value: "speed" },
    });

    expect(
      screen.queryByText("Priority and intersections"),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("Speed and roads"),
    ).toBeInTheDocument();

    fireEvent.change(search, {
      target: { value: "" },
    });

    const filter =
      screen.getByLabelText("admin.lessons.filter_label");

    fireEvent.change(filter, {
      target: { value: "DRAFT" },
    });

    expect(
      screen.getByText("Priority and intersections"),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Speed and roads"),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: "admin.lessons.open_public",
      }),
    ).toHaveAttribute(
      "href",
      "/lessons/LES-01",
    );
    expect(
      screen.getByRole("link", {
        name: "admin.lessons.manage",
      }),
    ).toHaveAttribute(
      "href",
      "/admin/lessons/LES-01/edit",
    );
  });

  it("shows a recoverable load error", async () => {
    mockedGetAdminLessons
      .mockRejectedValueOnce(new Error("load failed"))
      .mockResolvedValueOnce([]);

    render(<AdminLessonsPage />);

    expect(
      await screen.findByText("admin.lessons.load_error"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "admin.lessons.retry",
      }),
    );

    expect(
      await screen.findByText("admin.lessons.empty_title"),
    ).toBeInTheDocument();

    expect(mockedGetAdminLessons).toHaveBeenCalledTimes(2);
  });
});
