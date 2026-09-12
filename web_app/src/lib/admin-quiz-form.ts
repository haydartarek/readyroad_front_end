export const QUIZ_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

export function isValidQuizOptionCount(optionCount: number): boolean {
  return optionCount >= 2 && optionCount <= 3;
}

export function optionDisplayLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

type QuizInput = Record<`question${"En" | "Ar" | "Nl" | "Fr"}`, string> & {
  categoryCode: string;
  difficultyLevel: string;
  contentImageUrl: string;
  options: (Record<`text${"En" | "Ar" | "Nl" | "Fr"}`, string> & {
    isCorrect: boolean;
    displayOrder: number;
  })[];
};

export function quizValidationErrors(form: QuizInput, categoryCodes: string[], t: (key: string) => string) {
  const errors: Record<string, string> = {};
  const msg = (key: string) => t(`admin.quizzes.form.${key}`);
  if (!categoryCodes.includes(form.categoryCode.trim())) errors.categoryCode = msg("error_category");
  if (!(QUIZ_DIFFICULTIES as readonly string[]).includes(form.difficultyLevel)) errors.difficultyLevel = msg("error_difficulty");
  if (!isValidQuizOptionCount(form.options.length)) errors.options = msg(form.options.length < 2 ? "error_min_options" : "error_max_options");
  if (form.options.filter((option) => option.isCorrect).length !== 1) errors.correct = msg("error_exactly_one_correct");
  for (const suffix of ["En", "Ar", "Nl", "Fr"] as const) {
    if (!form[`question${suffix}`].trim()) errors[`question${suffix}`] = msg("error_question_all_languages");
    const seen = new Map<string, number>();
    form.options.forEach((option, index) => {
      const value = option[`text${suffix}`].trim();
      const normalized = value.replace(/\s+/g, " ").toLowerCase();
      if (!value) errors[`option_${index}`] = msg("error_option_all_languages");
      else if (/^(option|optie)\s+[a-z]$/i.test(value) || /\?{2,}/.test(value)) errors[`option_${index}`] = msg("error_option_placeholder");
      else if (seen.has(normalized)) {
        errors[`option_${index}`] = msg("error_option_duplicate");
        errors[`option_${seen.get(normalized)}`] = msg("error_option_duplicate");
      }
      seen.set(normalized, index);
    });
  }
  const image = form.contentImageUrl.trim();
  if (image && !/^\/images\/quiz\/[A-Za-z0-9][A-Za-z0-9._-]*\.(jpg|jpeg|png|webp)$/i.test(image)) {
    try {
      const url = new URL(image);
      if (url.protocol !== "https:" || !url.hostname || url.username || url.password) throw new Error();
    } catch { errors.contentImageUrl = msg("error_image_reference"); }
  }
  return errors;
}

export function quizServerError(error: unknown, fallback: string) {
  const response = (error as { response?: { status?: number; data?: { message?: unknown; error?: unknown; fields?: unknown } } })?.response;
  const data = response?.data;
  const fields: Record<string, string> = {};
  if (data?.fields && typeof data.fields === "object") {
    for (const [path, value] of Object.entries(data.fields)) {
      if (typeof value !== "string" || !value.trim()) continue;
      const option = /^options\[(\d+)\]/.exec(path);
      const key = option ? `option_${option[1]}` : path;
      fields[key] = fields[key] ? `${fields[key]} · ${value}` : value;
    }
  }
  return {
    status: response?.status,
    fields,
    message: typeof data?.message === "string" && data.message.trim() ? data.message
      : typeof data?.error === "string" && data.error.trim() ? data.error : fallback,
  };
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
