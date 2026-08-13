export const QUIZ_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

export function isValidQuizOptionCount(optionCount: number): boolean {
  return optionCount >= 2 && optionCount <= 3;
}

export function optionDisplayLabel(index: number): string {
  return String.fromCharCode(65 + index);
}
