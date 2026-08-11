import {
  isDifficultyCompatibleWithOptions,
  QUIZ_DIFFICULTIES,
  optionDisplayLabel,
} from "@/lib/admin-quiz-form";

describe("admin theoretical question form contract", () => {
  test("uses only canonical Backend enum values", () => {
    expect(QUIZ_DIFFICULTIES).toEqual(["EASY", "MEDIUM", "HARD"]);
  });

  test("validates option count without mutating difficulty", () => {
    expect(isDifficultyCompatibleWithOptions(2, "HARD")).toBe(true);
    expect(isDifficultyCompatibleWithOptions(2, "EASY")).toBe(false);
    expect(isDifficultyCompatibleWithOptions(3, "EASY")).toBe(true);
    expect(isDifficultyCompatibleWithOptions(3, "MEDIUM")).toBe(true);
    expect(isDifficultyCompatibleWithOptions(3, "HARD")).toBe(false);
  });

  test("uses A, B and C as display labels only", () => {
    expect([0, 1, 2].map(optionDisplayLabel)).toEqual(["A", "B", "C"]);
  });
});
