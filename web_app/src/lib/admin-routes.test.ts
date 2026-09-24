import {
  getBreadcrumbTrail,
} from "./admin-routes";

const t =
  (key: string) => key;

describe(
  "getBreadcrumbTrail",
  () => {
    it(
      "does not create a link for an alphanumeric identifier before edit",
      () => {
        const trail =
          getBreadcrumbTrail(
            "/admin/lessons/TH01/edit",
            t,
          );

        expect(
          trail.some(
            (segment) =>
              segment.href ===
              "/admin/lessons/TH01",
          ),
        ).toBe(false);

        expect(
          trail,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              href:
                "/admin/lessons",
            }),

            expect.objectContaining({
              href:
                "/admin/lessons/TH01/edit",

              isCurrentPage:
                true,
            }),
          ]),
        );
      },
    );

    it(
      "keeps the existing numeric edit identifier behavior",
      () => {
        const trail =
          getBreadcrumbTrail(
            "/admin/quizzes/123/edit",
            t,
          );

        expect(
          trail.some(
            (segment) =>
              segment.href ===
              "/admin/quizzes/123",
          ),
        ).toBe(false);

        expect(
          trail.at(-1),
        ).toEqual(
          expect.objectContaining({
            href:
              "/admin/quizzes/123/edit",

            isCurrentPage:
              true,
          }),
        );
      },
    );

    it(
      "does not skip known static route segments",
      () => {
        const trail =
          getBreadcrumbTrail(
            "/admin/quizzes/categories",
            t,
          );

        expect(
          trail.some(
            (segment) =>
              segment.href ===
              "/admin/quizzes/categories",
          ),
        ).toBe(true);
      },
    );
  },
);
