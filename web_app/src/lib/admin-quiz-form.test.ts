import {
  buildAdminQuizEditHref,
  isValidQuizOptionCount,
  QUIZ_DIFFICULTIES,
  optionDisplayLabel,
  resolveAdminQuizReturnTo,
} from "@/lib/admin-quiz-form";

describe("admin theoretical question form contract", () => {
  test("uses only canonical Backend enum values", () => {
    expect(QUIZ_DIFFICULTIES).toEqual(["EASY", "MEDIUM", "HARD"]);
  });

  test("allows every admin difficulty with two or three options", () => {
    expect(isValidQuizOptionCount(2)).toBe(true);
    expect(isValidQuizOptionCount(3)).toBe(true);
    expect(isValidQuizOptionCount(1)).toBe(false);
    expect(isValidQuizOptionCount(4)).toBe(false);
  });

  test("uses A, B and C as display labels only", () => {
    expect([0, 1, 2].map(optionDisplayLabel)).toEqual(["A", "B", "C"]);
  });

  test("preserves the source list page and filters in an edit link", () => {
    const href = buildAdminQuizEditHref(
      17,
      new URLSearchParams("page=4&size=20&q=priority&sortDir=asc"),
    );

    expect(href).toBe(
      "/admin/quizzes/17/edit?returnTo=%2Fadmin%2Fquizzes%3Fpage%3D4%26size%3D20%26q%3Dpriority%26sortDir%3Dasc",
    );
    expect(
      resolveAdminQuizReturnTo(
        "/admin/quizzes?page=4&size=20&q=priority&sortDir=asc",
      ),
    ).toBe("/admin/quizzes?page=4&size=20&q=priority&sortDir=asc");
  });

  test("uses the canonical list for direct or unsafe return paths", () => {
    expect(resolveAdminQuizReturnTo(null)).toBe("/admin/quizzes");
    expect(resolveAdminQuizReturnTo("/admin/users?page=4")).toBe(
      "/admin/quizzes",
    );
    expect(resolveAdminQuizReturnTo("https://example.com/admin/quizzes?page=4")).toBe(
      "/admin/quizzes",
    );
  });
});
