import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import AdminLessonEditorPage from "./page";
import {
  getAdminLesson,
  getAdminLessonVersions,
  getOrCreateAdminLessonDraft,
} from "@/lib/admin-lessons";
import {
  isServiceUnavailable,
} from "@/lib/api";

jest.mock(
  "next/navigation",
  () => ({
    useParams: () => ({
      idOrCode: "TH01",
    }),
  }),
);

jest.mock(
  "@/lib/admin-lessons",
  () => ({
    getAdminLesson: jest.fn(),
    getAdminLessonVersions:
      jest.fn(),
    getOrCreateAdminLessonDraft:
      jest.fn(),    saveAdminLessonDraft:
      jest.fn(),
  }),
);

jest.mock("@/lib/api", () => ({
  isServiceUnavailable: jest.fn(),
  logApiError: jest.fn(),
}));

jest.mock(
  "@/contexts/language-context",
  () => {
    const translate =
      (key: string) => key;

    return {
      useLanguage: () => ({
        t: translate,
        language: "en",
        isRTL: false,
      }),
    };
  },
);

jest.mock(
  "@/components/localized-link",
  () => ({
    __esModule: true,
    default: ({
      href,
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        href={String(href)}
        {...props}
      >
        {children}
      </a>
    ),
  }),
);

const mockedGetAdminLesson =
  getAdminLesson as jest.MockedFunction<
    typeof getAdminLesson
  >;
const mockedGetAdminLessonVersions =
  getAdminLessonVersions as jest.MockedFunction<
    typeof getAdminLessonVersions
  >;
const mockedGetOrCreateAdminLessonDraft =
  getOrCreateAdminLessonDraft as jest.MockedFunction<
    typeof getOrCreateAdminLessonDraft
  >;
const mockedIsServiceUnavailable =
  isServiceUnavailable as jest.MockedFunction<
    typeof isServiceUnavailable
  >;

const lesson = {
  id: 1,
  lessonCode: "TH01",
  titleAr: "الأولوية والتقاطعات",
  titleNl:
    "Voorrang en kruispunten",
  titleFr:
    "Priorité et carrefours",
  titleEn:
    "Priority and intersections",
  active: true,
  displayOrder: 1,
  estimatedMinutes: 12,
  pageCount: 1,
  currentVersion: 2,

  publishedDocument: {
    schemaVersion: 1 as const,

    lesson: {
      lessonCode: "TH01",

      title: {
        ar: "الأولوية والتقاطعات",
        nl:
          "Voorrang en kruispunten",
        fr:
          "Priorité et carrefours",
        en:
          "Priority and intersections",
      },

      description: {
        ar: "شرح عربي",
        nl:
          "Nederlandse beschrijving",
        fr:
          "Description française",
        en:
          "English description",
      },

      icon: null,
      displayOrder: 1,
      estimatedMinutes: 12,
      isActive: true,
    },

    pages: [
      {
        pageNumber: 1,

        title: {
          ar: "الصفحة الأولى",
          nl: "Eerste pagina",
          fr: "Première page",
          en: "First page",
        },

        content: {
          ar: "محتوى",
          nl: "Inhoud",
          fr: "Contenu",
          en: "Content",
        },

        bulletPointsRaw: {
          ar: null,
          nl: null,
          fr: null,
          en: null,
        },
      },
    ],

    structuredSections: [],

    seo: {
      ar: {},
      nl: {},
      fr: {},
      en: {},
    },

    media: [],
    categoryLinks: [],
  },

  draft: null,
  categoryLinks: [],
  mediaAssets: [],
  versions: [],
};

const draft = {
  lessonId: 1,
  baseVersionNumber: 2,
  revision: 0,
  document:
    lesson.publishedDocument,
  createdByUserId: 1,
  updatedByUserId: 1,
  createdAt:
    "2026-09-24T08:00:00Z",
  updatedAt:
    "2026-09-24T08:00:00Z",
};
describe(
  "AdminLessonEditorPage",
  () => {

    beforeEach(() => {
      mockedGetAdminLesson.mockReset();
      mockedGetAdminLessonVersions.mockReset();
      mockedGetAdminLessonVersions.mockResolvedValue([]);
      mockedGetOrCreateAdminLessonDraft.mockReset();
      mockedIsServiceUnavailable.mockReset();
      mockedIsServiceUnavailable.mockReturnValue(false);
    });

    it(
      "loads published lesson detail without creating a draft",
      async () => {

        mockedGetAdminLesson
          .mockResolvedValue(
            lesson,
          );

        render(
          <AdminLessonEditorPage />,
        );

        expect(
          await screen.findByRole(
            "heading",
            {
              name:
                "Priority and intersections",
              level: 1,
            },
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "English description",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "First page",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Content",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "TH01",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "link",
            {
              name:
                "admin.lessons.editor.back_to_lessons",
            },
          ),
        ).toHaveAttribute(
          "href",
          "/admin/lessons",
        );

        expect(
          screen.getByRole(
            "link",
            {
              name:
                "admin.lessons.open_public",
            },
          ),
        ).toHaveAttribute(
          "href",
          "/lessons/TH01",
        );

        expect(
          mockedGetAdminLesson,
        ).toHaveBeenCalledTimes(1);

        expect(
          mockedGetAdminLesson,
        ).toHaveBeenCalledWith(
          "TH01",
        );

        expect(
          mockedGetAdminLessonVersions,
        ).toHaveBeenCalledWith(
          "TH01",
        );
      },
    );

    it(
      "shows service unavailable state when the initial lesson request returns 503",
      async () => {
        mockedGetAdminLesson
          .mockRejectedValue(
            new Error(
              "Service unavailable",
            ),
          );
        mockedIsServiceUnavailable
          .mockReturnValue(true);

        render(
          <AdminLessonEditorPage />,
        );

        expect(
          await screen.findByText(
            "common.service_unavailable",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "common.retry",
            },
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "shows version history from the dedicated endpoint",
      async () => {
        mockedGetAdminLesson
          .mockResolvedValue(
            lesson,
          );

        mockedGetAdminLessonVersions
          .mockResolvedValue([
            {
              id: 12,
              versionNumber: 2,
              source: "ADMIN",
              changeNote:
                "Initial published version",
              publishedByUserId: 1,
              publishedAt:
                "2026-09-24T09:00:00Z",
            },
          ]);

        render(
          <AdminLessonEditorPage />,
        );

        expect(
          await screen.findByText(
            "Initial published version",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getAllByText(
            "V2",
          ).length,
        ).toBeGreaterThanOrEqual(
          1,
        );
      },
    );

    it(
      "creates a draft only after explicit Start editing action",
      async () => {
        mockedGetAdminLesson
          .mockResolvedValue(
            lesson,
          );

        mockedGetOrCreateAdminLessonDraft
          .mockResolvedValue(
            draft,
          );

        render(
          <AdminLessonEditorPage />,
        );

        expect(
          await screen.findByRole(
            "heading",
            {
              name:
                "Priority and intersections",
              level: 1,
            },
          ),
        ).toBeInTheDocument();

        expect(
          mockedGetOrCreateAdminLessonDraft,
        ).not.toHaveBeenCalled();

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "admin.lessons.editor.start_editing",
            },
          ),
        );

        expect(
          await screen.findByText(
            "admin.lessons.editor.draft_ready_notice",
          ),
        ).toBeInTheDocument();

        expect(
          mockedGetOrCreateAdminLessonDraft,
        ).toHaveBeenCalledTimes(1);

        expect(
          mockedGetOrCreateAdminLessonDraft,
        ).toHaveBeenCalledWith(
          "TH01",
        );

        expect(
          screen.getAllByText(
            "R0",
          ).length,
        ).toBeGreaterThanOrEqual(1);
      },
    );

    it(
      "confirms before internal navigation when the draft is dirty",
      async () => {
        const lessonWithDraft = {
          ...lesson,
          draft,
        };

        mockedGetAdminLesson
          .mockResolvedValue(
            lessonWithDraft,
          );

        const confirmSpy =
          jest.spyOn(
            window,
            "confirm",
          ).mockReturnValue(
            false,
          );

        render(
          <AdminLessonEditorPage />,
        );

        expect(
          await screen.findByRole(
            "heading",
            {
              name:
                "Priority and intersections",
              level: 1,
            },
          ),
        ).toBeInTheDocument();

        fireEvent.change(
          screen.getByLabelText(
            "admin.lessons.editor.field_description",
          ),
          {
            target: {
              value:
                "Unsaved local description",
            },
          },
        );

        fireEvent.click(
          screen.getByRole(
            "link",
            {
              name:
                "admin.lessons.editor.back_to_lessons",
            },
          ),
        );

        expect(
          confirmSpy,
        ).toHaveBeenCalledWith(
          "admin.lessons.editor.unsaved_navigation_warning",
        );

        expect(
          screen.getByLabelText(
            "admin.lessons.editor.field_description",
          ),
        ).toHaveValue(
          "Unsaved local description",
        );

        confirmSpy.mockRestore();
      },
    );
  },
);
