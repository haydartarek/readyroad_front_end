export type TimedAttemptStepAction = "advance" | "submit" | "abandon";

export function resolveTimedAttemptStep({
  reason,
  isCurrentAnswered,
  isLastQuestion,
  answeredCount,
  totalQuestions,
  consecutiveUnanswered,
}: {
  reason: "manual" | "timeout";
  isCurrentAnswered: boolean;
  isLastQuestion: boolean;
  answeredCount: number;
  totalQuestions: number;
  consecutiveUnanswered: number;
}): {
  action: TimedAttemptStepAction;
  consecutiveUnanswered: number;
} {
  const nextConsecutiveUnanswered =
    reason === "timeout" && !isCurrentAnswered ? consecutiveUnanswered + 1 : 0;

  if (nextConsecutiveUnanswered >= 3) {
    return {
      action: "abandon",
      consecutiveUnanswered: nextConsecutiveUnanswered,
    };
  }

  if (!isLastQuestion) {
    return {
      action: "advance",
      consecutiveUnanswered: nextConsecutiveUnanswered,
    };
  }

  return {
    action: answeredCount === totalQuestions ? "submit" : "abandon",
    consecutiveUnanswered: nextConsecutiveUnanswered,
  };
}
