import type { Language } from "@/lib/constants";
import type { StudentLearningPriority } from "@/services/progressService";

export type LocalizedCategoryNames = {
  categoryCode?: string | null;
  categoryName?: string | null;
  categoryNameEn?: string | null;
  categoryNameNl?: string | null;
  categoryNameFr?: string | null;
  categoryNameAr?: string | null;
};

export function localizedCategoryName(
  category: LocalizedCategoryNames,
  language: Language,
  unavailable = "",
): string {
  const localized =
    language === "ar"
      ? category.categoryNameAr
      : language === "nl"
        ? category.categoryNameNl
        : language === "fr"
          ? category.categoryNameFr
          : category.categoryNameEn;

  return (
    localized ||
    category.categoryNameEn ||
    category.categoryNameNl ||
    category.categoryNameFr ||
    category.categoryNameAr ||
    category.categoryName ||
    category.categoryCode ||
    unavailable
  );
}

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
  return localizedCategoryName(priority, language, priority.categoryCode);
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
