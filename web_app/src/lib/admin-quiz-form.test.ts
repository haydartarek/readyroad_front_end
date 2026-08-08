import {
  difficultyAfterAddingOption,
  QUIZ_DIFFICULTIES,
  QUIZ_QUESTION_TYPES,
  optionDisplayLabel,
} from "@/lib/admin-quiz-form";

describe("admin theoretical question form contract", () => {
  test("uses only canonical Backend enum values", () => {
    expect(QUIZ_DIFFICULTIES).toEqual(["EASY", "MEDIUM", "HARD"]);
    expect(QUIZ_QUESTION_TYPES).toEqual([
      "MULTIPLE_CHOICE",
      "TRUE_FALSE",
      "IMAGE_BASED",
    ]);
  });

  test("defaults a newly added third option to MEDIUM", () => {
    expect(difficultyAfterAddingOption(2, "EASY", false)).toBe("MEDIUM");
  });

  test("preserves a manual difficulty override", () => {
    expect(difficultyAfterAddingOption(2, "HARD", true)).toBe("HARD");
  });

  test("uses A, B and C as display labels only", () => {
    expect([0, 1, 2].map(optionDisplayLabel)).toEqual(["A", "B", "C"]);
  });
});
