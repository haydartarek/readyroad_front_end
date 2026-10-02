import {
  render,
  screen,
} from "@testing-library/react";
import LessonDetailClient from "./lesson-detail-client";
import type {
  LessonDetail,
} from "@/lib/types";

jest.mock(
  "next/navigation",
  () => ({
    useParams: () => ({
      lessonId: "TH01",
    }),
    usePathname: () =>
      "/lessons/TH01",
  }),
);

jest.mock(
  "@/contexts/language-context",
  () => ({
    useLanguage: () => ({
      t: (key: string) => key,
      language: "en",
    }),
  }),
);

jest.mock(
  "@/contexts/auth-context",
  () => ({
    useAuth: () => ({
      user: null,
    }),
  }),
);

jest.mock(
  "@/services/lessonService",
  () => ({
    getLessonByCode: jest.fn(),
    getAllLessons: jest.fn(),
    getLessonProgress: jest.fn(),
    markLessonPageRead: jest.fn(),
  }),
);

jest.mock(
  "@/lib/api",
  () => ({
    isServiceUnavailable: jest.fn(
      () => false,
    ),
    logApiError: jest.fn(),
  }),
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

const lesson: LessonDetail = {
  id: 1,
  lessonCode: "TH01",
  icon: "",
  titleEn:
    "Priority and intersections",
  titleAr:
    "الأولوية والتقاطعات",
  titleNl:
    "Voorrang en kruispunten",
  titleFr:
    "Priorité et carrefours",
  descriptionEn:
    "English description",
  descriptionAr:
    "شرح عربي",
  descriptionNl:
    "Nederlandse beschrijving",
  descriptionFr:
    "Description française",
  displayOrder: 1,
  estimatedMinutes: 12,
  pages: [
    {
      id: 11,
      pageNumber: 1,
      titleEn:
        "First page",
      titleAr:
        "الصفحة الأولى",
      titleNl:
        "Eerste pagina",
      titleFr:
        "Première page",
      contentEn:
        "Page content",
      contentAr:
        "محتوى الصفحة",
      contentNl:
        "Pagina-inhoud",
      contentFr:
        "Contenu de la page",
      imageUrl:
        "/images/lessons/TH01/page-1.png",
    },
  ],
};

describe(
  "LessonDetailClient page images",
  () => {
    it(
      "renders the page image when imageUrl is present",
      () => {
        render(
          <LessonDetailClient
            initialLesson={lesson}
            initialLessons={[]}
          />,
        );

        const image =
          screen.getByRole(
            "img",
            {
              name:
                "Priority and intersections — First page",
            },
          );

        expect(
          image,
        ).toBeInTheDocument();

        expect(image).toHaveAttribute(
          "src",
          "/images/lessons/TH01/page-1.png",
        );
        expect(image).toHaveAttribute(
          "alt",
          "Priority and intersections — First page",
        );
      },
    );

    it(
      "does not render a page image when imageUrl is null",
      () => {
        const lessonWithoutImage: LessonDetail = {
          ...lesson,
          pages: [
            {
              ...lesson.pages[0],
              imageUrl: null,
            },
          ],
        };

        render(
          <LessonDetailClient
            initialLesson={
              lessonWithoutImage
            }
            initialLessons={[]}
          />,
        );

        expect(
          screen.queryByRole(
            "img",
            {
              name:
                "Priority and intersections — First page",
            },
          ),
        ).not.toBeInTheDocument();
      },
    );
  },
);
