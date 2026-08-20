export type TimedAttemptStepAction = "advance" | "submit" | "abandon";

export function resolveTheoryTimedAttemptStep({
  reason,
  isLastQuestion,
  finalizedCount,
  totalQuestions,
  continuousInactivitySeconds,
  questionTimeoutSeconds = 15,
  inactivityLimitSeconds = 60,
}: {
  reason: "answered" | "timeout";
  isLastQuestion: boolean;
  finalizedCount: number;
  totalQuestions: number;
  continuousInactivitySeconds: number;
  questionTimeoutSeconds?: number;
  inactivityLimitSeconds?: number;
}): {
  action: TimedAttemptStepAction;
  continuousInactivitySeconds: number;
} {
  const nextInactivitySeconds =
    reason === "answered"
      ? 0
      : continuousInactivitySeconds + questionTimeoutSeconds;

  if (nextInactivitySeconds >= inactivityLimitSeconds) {
    return {
      action: "abandon",
      continuousInactivitySeconds: nextInactivitySeconds,
    };
  }

  if (!isLastQuestion) {
    return {
      action: "advance",
      continuousInactivitySeconds: nextInactivitySeconds,
    };
  }

  return {
    action: finalizedCount === totalQuestions ? "submit" : "abandon",
    continuousInactivitySeconds: nextInactivitySeconds,
  };
}

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
