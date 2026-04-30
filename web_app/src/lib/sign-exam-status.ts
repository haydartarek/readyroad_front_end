import type { SignUserProgress } from "@/services";

export type SignExamStatusTone = "neutral" | "danger" | "warning" | "success";

export interface SignExamStatusMeta {
  tone: SignExamStatusTone;
  labelKey: string;
}

const NEAR_PASS_THRESHOLD = 70;

export function getSignExamStatus(
  progress?: SignUserProgress | null,
): SignExamStatusMeta {
  if (!progress?.exam1Attempted) {
    return { tone: "neutral", labelKey: "practice.exam_status.ready" };
  }

  if (progress.exam1Passed) {
    return { tone: "success", labelKey: "practice.exam_status.passed" };
  }

  if ((progress.exam1BestScorePct ?? 0) >= NEAR_PASS_THRESHOLD) {
    return { tone: "warning", labelKey: "practice.exam_status.close" };
  }

  return { tone: "danger", labelKey: "practice.exam_status.retry" };
}

export function getSignExamStatusClasses(tone: SignExamStatusTone): string {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case "warning":
      return "border-amber-200 bg-amber-100 text-amber-700";
    case "danger":
      return "border-red-200 bg-red-100 text-red-700";
    default:
      return "border-primary/20 bg-primary/10 text-primary";
  }
}
