import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import LessonDraftEditor from "./LessonDraftEditor";
import { saveAdminLessonDraft } from "@/lib/admin-lessons";
import type {
  AdminLessonDocument,
  AdminLessonDraft,
} from "@/lib/admin-lessons";

jest.mock("@/lib/admin-lessons", () => ({
  saveAdminLessonDraft:
    jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  logApiError:
    jest.fn(),
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

const mockedSaveAdminLessonDraft =
  saveAdminLessonDraft as jest.MockedFunction<
    typeof saveAdminLessonDraft
  >;

const document: AdminLessonDocument = {
  schemaVersion: 1,

  lesson: {
    lessonCode: "TH01",

    title: {
      ar: "الأولوية والتقاطعات",
      nl: "Voorrang en kruispunten",
      fr: "Priorité et carrefours",
      en: "Priority and intersections",
    },

    description: {
      ar: "شرح عربي",
      nl: "Nederlandse beschrijving",
      fr: "Description française",
      en: "English description",
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
        ar: "محتوى عربي",
        nl: "Nederlandse inhoud",
        fr: "Contenu français",
        en: "English content",
      },

      bulletPointsRaw: {
        ar: null,
        nl: null,
        fr: null,
        en: "First point",
      },
    },
  ],

  structuredSections: [
    {
      type: "future-section",
      keep: true,
    },
  ],

  seo: {
    ar: {},
    nl: {},
    fr: {},
    en: {
      futureValue: "keep-me",
    },
  },

  media: [
    {
      futureMedia:
        "keep-me",
    },
  ],

  categoryLinks: [],
};

const draft: AdminLessonDraft = {
  lessonId: 1,
  baseVersionNumber: 2,
  revision: 4,
  document,
  createdByUserId: 1,
  updatedByUserId: 1,
  createdAt:
    "2026-09-24T08:00:00Z",
  updatedAt:
    "2026-09-24T08:30:00Z",
};

describe(
  "LessonDraftEditor",
  () => {
    beforeEach(() => {
      mockedSaveAdminLessonDraft.mockReset();
    });

    it(
      "edits content and saves the complete draft with the current revision",
      async () => {
        const onSaved =
          jest.fn();

        const savedDocument: AdminLessonDocument = {
          ...document,

          lesson: {
            ...document.lesson,

            description: {
              ...document.lesson.description,
              en:
                "Updated description",
            },
          },

          pages:
            document.pages.map(
              (page) => ({
                ...page,

                content: {
                  ...page.content,
                  en:
                    "Updated page content",
                },
              }),
            ),
        };

        const savedDraft: AdminLessonDraft = {
          ...draft,
          revision: 5,
          document:
            savedDocument,
          updatedAt:
            "2026-09-24T08:40:00Z",
        };

        mockedSaveAdminLessonDraft
          .mockResolvedValue(
            savedDraft,
          );

        render(
          <LessonDraftEditor
            idOrCode="TH01"
            draft={draft}
            onSaved={onSaved}
          />,
        );

        fireEvent.change(
          screen.getByLabelText(
            "admin.lessons.editor.field_description",
          ),
          {
            target: {
              value:
                "Updated description",
            },
          },
        );

        fireEvent.change(
          screen.getByLabelText(
            "admin.lessons.editor.page_content 1",
          ),
          {
            target: {
              value:
                "Updated page content",
            },
          },
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "admin.lessons.editor.save_draft",
            },
          ),
        );

        await waitFor(
          () => {
            expect(
              mockedSaveAdminLessonDraft,
            ).toHaveBeenCalledTimes(
              1,
            );
          },
        );

        const [
          calledId,
          calledRequest,
        ] =
          mockedSaveAdminLessonDraft
            .mock.calls[0];

        expect(
          calledId,
        ).toBe("TH01");

        expect(
          calledRequest.expectedRevision,
        ).toBe(4);

        expect(
          calledRequest.document.lesson.description.en,
        ).toBe(
          "Updated description",
        );

        expect(
          calledRequest.document.pages[0].content.en,
        ).toBe(
          "Updated page content",
        );

        expect(
          calledRequest.document.structuredSections,
        ).toEqual(
          document.structuredSections,
        );

        expect(
          calledRequest.document.seo,
        ).toEqual(
          document.seo,
        );

        expect(
          calledRequest.document.media,
        ).toEqual(
          document.media,
        );

        expect(
          calledRequest.document.lesson.lessonCode,
        ).toBe("TH01");

        expect(
          calledRequest.document.lesson.title,
        ).toEqual(
          document.lesson.title,
        );

        expect(
          calledRequest.document.lesson.isActive,
        ).toBe(true);

        expect(
          await screen.findByText(
            "R5",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "status",
          ),
        ).toHaveTextContent(
          "admin.lessons.editor.saved_success",
        );

        expect(
          onSaved,
        ).toHaveBeenCalledWith(
          savedDraft,
        );
      },
    );

    it(
      "keeps local edits after a 409 conflict",
      async () => {
        const onSaved =
          jest.fn();

        mockedSaveAdminLessonDraft
          .mockRejectedValue({
            response: {
              status: 409,
            },
          });

        render(
          <LessonDraftEditor
            idOrCode="TH01"
            draft={draft}
            onSaved={onSaved}
          />,
        );

        const content =
          screen.getByLabelText(
            "admin.lessons.editor.page_content 1",
          );

        fireEvent.change(
          content,
          {
            target: {
              value:
                "My unsaved local edit",
            },
          },
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "admin.lessons.editor.save_draft",
            },
          ),
        );

        expect(
          await screen.findByText(
            "admin.lessons.editor.conflict_title",
          ),
        ).toBeInTheDocument();

        expect(
          content,
        ).toHaveValue(
          "My unsaved local edit",
        );

        expect(
          screen.getByText(
            "R4",
          ),
        ).toBeInTheDocument();

        expect(
          onSaved,
        ).not.toHaveBeenCalled();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "admin.lessons.editor.save_draft",
            },
          ),
        ).toBeDisabled();
      },
    );

    it(
      "uses RTL only for Arabic content fields",
      () => {
        render(
          <LessonDraftEditor
            idOrCode="TH01"
            draft={draft}
            onSaved={jest.fn()}
          />,
        );

        const description =
          screen.getByLabelText(
            "admin.lessons.editor.field_description",
          );

        expect(
          description,
        ).toHaveAttribute(
          "dir",
          "ltr",
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "admin.lessons.editor.language_ar",
            },
          ),
        );

        expect(
          description,
        ).toHaveAttribute(
          "dir",
          "rtl",
        );

        expect(
          description,
        ).toHaveValue(
          "شرح عربي",
        );
      },
    );

    it(
      "reports dirty state to its parent",
      () => {
        const onDirtyChange =
          jest.fn();

        const {
          unmount,
        } = render(
          <LessonDraftEditor
            idOrCode="TH01"
            draft={draft}
            onSaved={jest.fn()}
            onDirtyChange={
              onDirtyChange
            }
          />,
        );

        expect(
          onDirtyChange,
        ).toHaveBeenCalledWith(
          false,
        );

        fireEvent.change(
          screen.getByLabelText(
            "admin.lessons.editor.field_description",
          ),
          {
            target: {
              value:
                "Unsaved description",
            },
          },
        );

        expect(
          onDirtyChange,
        ).toHaveBeenLastCalledWith(
          true,
        );

        unmount();

        expect(
          onDirtyChange,
        ).toHaveBeenLastCalledWith(
          false,
        );
      },
    );

    it(
      "edits only allowed lesson metadata",
      async () => {
        const onSaved =
          jest.fn();

        const savedDocument:
          AdminLessonDocument = {
            ...document,

            lesson: {
              ...document.lesson,
              icon:
                "road-sign",
              displayOrder: 7,
              estimatedMinutes: 18,
            },
          };

        const savedDraft:
          AdminLessonDraft = {
            ...draft,
            revision: 5,
            document:
              savedDocument,
          };

        mockedSaveAdminLessonDraft
          .mockResolvedValue(
            savedDraft,
          );

        render(
          <LessonDraftEditor
            idOrCode="TH01"
            draft={draft}
            onSaved={onSaved}
          />,
        );

        fireEvent.change(
          screen.getByLabelText(
            "admin.lessons.editor.field_icon",
          ),
          {
            target: {
              value:
                "road-sign",
            },
          },
        );

        fireEvent.change(
          screen.getByLabelText(
            "admin.lessons.editor.field_display_order",
          ),
          {
            target: {
              value: "7",
            },
          },
        );

        fireEvent.change(
          screen.getByLabelText(
            "admin.lessons.editor.field_estimated_minutes",
          ),
          {
            target: {
              value: "18",
            },
          },
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "admin.lessons.editor.save_draft",
            },
          ),
        );

        await waitFor(() => {
          expect(
            mockedSaveAdminLessonDraft,
          ).toHaveBeenCalledTimes(
            1,
          );
        });

        const request =
          mockedSaveAdminLessonDraft
            .mock.calls[0][1];

        expect(
          request.document.lesson.icon,
        ).toBe(
          "road-sign",
        );

        expect(
          request.document.lesson.displayOrder,
        ).toBe(7);

        expect(
          request.document.lesson.estimatedMinutes,
        ).toBe(18);

        expect(
          request.document.lesson.lessonCode,
        ).toBe(
          document.lesson.lessonCode,
        );

        expect(
          request.document.lesson.title,
        ).toEqual(
          document.lesson.title,
        );

        expect(
          request.document.lesson.isActive,
        ).toBe(
          document.lesson.isActive,
        );

        expect(
          request.document.structuredSections,
        ).toEqual(
          document.structuredSections,
        );

        expect(
          request.document.seo,
        ).toEqual(
          document.seo,
        );

        expect(
          request.document.media,
        ).toEqual(
          document.media,
        );
      },
    );

    it(
      "keeps save confirmation after parent receives saved draft",
      async () => {
        const onSaved =
          jest.fn();

        const savedDocument:
          AdminLessonDocument = {
            ...document,

            lesson: {
              ...document.lesson,

              description: {
                ...document.lesson.description,
                en:
                  "Saved parent echo",
              },
            },
          };

        const savedDraft:
          AdminLessonDraft = {
            ...draft,
            revision: 5,
            document:
              savedDocument,
        };

        mockedSaveAdminLessonDraft
          .mockResolvedValue(
            savedDraft,
          );

        const {
          rerender,
        } = render(
          <LessonDraftEditor
            idOrCode="TH01"
            draft={draft}
            onSaved={onSaved}
          />,
        );

        fireEvent.change(
          screen.getByLabelText(
            "admin.lessons.editor.field_description",
          ),
          {
            target: {
              value:
                "Saved parent echo",
            },
          },
        );

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name:
                "admin.lessons.editor.save_draft",
            },
          ),
        );

        await waitFor(() => {
          expect(
            onSaved,
          ).toHaveBeenCalledWith(
            savedDraft,
          );
        });

        rerender(
          <LessonDraftEditor
            idOrCode="TH01"
            draft={savedDraft}
            onSaved={onSaved}
          />,
        );

        expect(
          screen.getByRole(
            "status",
          ),
        ).toHaveTextContent(
          "admin.lessons.editor.saved_success",
        );

        expect(
          screen.getByText(
            "R5",
          ),
        ).toBeInTheDocument();
      },
    );
  },
);
