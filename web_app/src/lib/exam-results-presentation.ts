import type { Language } from "@/lib/constants";

interface LocalizedExamText {
  en?: string | null;
  ar?: string | null;
  nl?: string | null;
  fr?: string | null;
  fallback?: string | null;
}

function normalized(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
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
  const requested = normalized(text[language]);
  if (requested) return requested;

  const english = normalized(text.en);
  if (english) return english;

  const firstAvailable = [text.ar, text.nl, text.fr]
    .map(normalized)
    .find((value): value is string => value !== null);

  return firstAvailable ?? normalized(text.fallback) ?? "";
}

export function localizeExamExplanation(
  language: Language,
  text: LocalizedExamText,
  unavailableLabel: string,
): string {
  return normalized(text[language]) ?? unavailableLabel;
}
