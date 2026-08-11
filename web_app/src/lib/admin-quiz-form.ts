export const QUIZ_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

export function isDifficultyCompatibleWithOptions(
  optionCount: number,
  difficulty: string,
): boolean {
  return (
    (optionCount === 2 && difficulty === "HARD") ||
    (optionCount === 3 &&
      (difficulty === "EASY" || difficulty === "MEDIUM"))
  );
}

export function optionDisplayLabel(index: number): string {
  return String.fromCharCode(65 + index);
}
