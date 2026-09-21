export type ExamAccessMode = "PREVIEW" | "FULL";

export type ExamAccessState =
  | "PREVIEW_ACTIVE"
  | "FREE_LIMIT_REACHED"
  | "FULL_ACTIVE";

export function resolveVisibleResumeIndex(
  resumeQuestionOrder: number | null | undefined,
  visibleQuestionCount: number,
): number {
  if (visibleQuestionCount <= 0) return 0;

  const requestedOrder =
    Number.isFinite(resumeQuestionOrder)
      ? Math.max(1, Number(resumeQuestionOrder))
      : 1;

  return Math.min(
    visibleQuestionCount - 1,
    requestedOrder - 1,
  );
}

export function isPreviewBoundary({
  accessMode,
  freeQuestionLimit,
  questionOrder,
}: {
  accessMode?: ExamAccessMode;
  freeQuestionLimit?: number;
  questionOrder: number;
}): boolean {
  return (
    accessMode === "PREVIEW" &&
    Number.isFinite(freeQuestionLimit) &&
    questionOrder >= Number(freeQuestionLimit)
  );
}

export function canSubmitTheoryExam({
  finalizedCount,
  totalQuestions,
  accessState,
}: {
  finalizedCount: number;
  totalQuestions: number;
  accessState?: ExamAccessState;
}): boolean {
  if (
    accessState === "PREVIEW_ACTIVE" ||
    accessState === "FREE_LIMIT_REACHED"
  ) {
    return false;
  }

  return (
    totalQuestions > 0 &&
    finalizedCount === totalQuestions
  );
}
export type PreviewOptionState =
  | "idle"
  | "selected"
  | "correct"
  | "incorrect"
  | "neutral";

export function resolvePreviewOptionState({
  optionId,
  selectedOptionId,
  correctOptionId,
  hasFeedback,
}: {
  optionId: number;
  selectedOptionId?: number;
  correctOptionId?: number;
  hasFeedback: boolean;
}): PreviewOptionState {
  if (!hasFeedback) {
    return optionId === selectedOptionId
      ? "selected"
      : "idle";
  }

  if (optionId === correctOptionId) {
    return "correct";
  }

  if (
    optionId === selectedOptionId &&
    optionId !== correctOptionId
  ) {
    return "incorrect";
  }

  return "neutral";
}