import { apiClient } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import {
  saveAdminLessonDraft,
  type AdminLessonDocument,
  type AdminLessonDraft,
  type SaveAdminLessonDraftRequest,
} from "@/lib/admin-lessons";

jest.mock("@/lib/api", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

const mockedPut =
  apiClient.put as jest.Mock;

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
      en: "Updated English description",
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
        en: "Updated page content",
      },

      bulletPointsRaw: {
        ar: null,
        nl: null,
        fr: null,
        en: "Point one\nPoint two",
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
};

const request: SaveAdminLessonDraftRequest = {
  expectedRevision: 4,
  document,
};

const response: AdminLessonDraft = {
  lessonId: 1,
  baseVersionNumber: 2,
  revision: 5,
  document,
  createdByUserId: 1,
  updatedByUserId: 1,
  createdAt: "2026-09-24T08:00:00Z",
  updatedAt: "2026-09-24T08:30:00Z",
};

describe("admin lesson draft contract", () => {
  beforeEach(() => {
    mockedPut.mockReset();
  });

  it("sends expectedRevision and the complete document to the draft endpoint", async () => {
    mockedPut.mockResolvedValue({
      data: response,
    });

    await expect(
      saveAdminLessonDraft(
        "TH01",
        request,
      ),
    ).resolves.toEqual(
      response,
    );

    expect(
      mockedPut,
    ).toHaveBeenCalledTimes(1);

    expect(
      mockedPut,
    ).toHaveBeenCalledWith(
      API_ENDPOINTS.ADMIN.LESSONS.DRAFT(
        "TH01",
      ),
      request,
    );

    const sentRequest =
      mockedPut.mock.calls[0][1] as SaveAdminLessonDraftRequest;

    expect(
      sentRequest.expectedRevision,
    ).toBe(4);

    expect(
      sentRequest.document.lesson.lessonCode,
    ).toBe("TH01");

    expect(
      sentRequest.document.lesson.title.en,
    ).toBe(
      "Priority and intersections",
    );

    expect(
      sentRequest.document.lesson.description.en,
    ).toBe(
      "Updated English description",
    );

    expect(
      sentRequest.document.pages[0].content.en,
    ).toBe(
      "Updated page content",
    );

    expect(
      sentRequest.document.structuredSections,
    ).toEqual([]);

    expect(
      sentRequest.document.seo,
    ).toEqual({
      ar: {},
      nl: {},
      fr: {},
      en: {},
    });

    expect(
      sentRequest.document.media,
    ).toEqual([]);

    expect(
      sentRequest.document.categoryLinks,
    ).toEqual([]);
  });
});
