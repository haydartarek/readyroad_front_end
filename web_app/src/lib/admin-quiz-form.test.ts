import {
  isValidQuizOptionCount,
  QUIZ_DIFFICULTIES,
  optionDisplayLabel,
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
});
