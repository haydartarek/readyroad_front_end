export const QUIZ_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

export function isValidQuizOptionCount(optionCount: number): boolean {
  return optionCount >= 2 && optionCount <= 3;
}

export function optionDisplayLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

const ADMIN_QUIZZES_PATH = "/admin/quizzes";

export function buildAdminQuizEditHref(
  questionId: number,
  searchParams: URLSearchParams,
): string {
  const query = searchParams.toString();
  const returnTo = query ? `${ADMIN_QUIZZES_PATH}?${query}` : ADMIN_QUIZZES_PATH;
  return `${ADMIN_QUIZZES_PATH}/${questionId}/edit?returnTo=${encodeURIComponent(returnTo)}`;
}

export function resolveAdminQuizReturnTo(value: string | null): string {
  if (!value) return ADMIN_QUIZZES_PATH;

  try {
    const parsed = new URL(value, "http://localhost");
    if (parsed.origin !== "http://localhost" || parsed.pathname !== ADMIN_QUIZZES_PATH) {
      return ADMIN_QUIZZES_PATH;
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return ADMIN_QUIZZES_PATH;
  }
}
