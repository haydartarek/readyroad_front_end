export const QUIZ_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

export const QUIZ_QUESTION_TYPES = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "IMAGE_BASED",
] as const;

export function difficultyAfterAddingOption(
  optionCount: number,
  currentDifficulty: string,
  manuallyChanged: boolean,
): string {
  return optionCount === 2 && !manuallyChanged
    ? "MEDIUM"
    : currentDifficulty;
}

export function optionDisplayLabel(index: number): string {
  return String.fromCharCode(65 + index);
}
