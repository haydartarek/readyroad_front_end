import type { Language } from "@/lib/constants";
import type { StudentLearningPriority } from "@/services/progressService";

export function localizedPriorityName(
  priority: Pick<
    StudentLearningPriority,
    | "categoryCode"
    | "categoryNameEn"
    | "categoryNameNl"
    | "categoryNameFr"
    | "categoryNameAr"
  >,
  language: Language,
): string {
  if (language === "ar") {
    return (
      priority.categoryNameAr ||
      priority.categoryNameEn ||
      priority.categoryCode
    );
  }
  if (language === "nl") {
    return (
      priority.categoryNameNl ||
      priority.categoryNameEn ||
      priority.categoryCode
    );
  }
  if (language === "fr") {
    return (
      priority.categoryNameFr ||
      priority.categoryNameEn ||
      priority.categoryCode
    );
  }
  return priority.categoryNameEn || priority.categoryCode;
}

export function intelligenceMetricValue(
  value: number | null,
  unavailable: string,
): string {
  return value === null ? unavailable : `${Math.round(value)}%`;
}

export function durationValue(
  seconds: number | null,
  unavailable: string,
): string {
  if (seconds === null) return unavailable;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0
    ? `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`
    : `${remainingSeconds}s`;
}

export function signedMetricValue(
  value: number | null,
  suffix: string,
  unavailable: string,
): string {
  if (value === null) return unavailable;
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}${suffix}`;
}
