import type { Language } from "@/lib/constants";

interface LocalizedExamText {
  en?: string | null;
  ar?: string | null;
  nl?: string | null;
  fr?: string | null;
  fallback?: string | null;
}

export function formatExamDuration(
  totalSeconds: number | null | undefined,
): string | null {
  if (
    totalSeconds === null ||
    totalSeconds === undefined ||
    !Number.isFinite(totalSeconds) ||
    totalSeconds < 0
  ) {
    return null;
  }

  const safeSeconds = Math.floor(totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function localizeExamText(
  language: Language,
  text: LocalizedExamText,
): string {
  switch (language) {
    case "ar":
      return text.ar || text.en || text.fallback || "";
    case "nl":
      return text.nl || text.en || text.fallback || "";
    case "fr":
      return text.fr || text.en || text.fallback || "";
    default:
      return text.en || text.fallback || "";
  }
}
