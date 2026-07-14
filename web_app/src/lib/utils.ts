import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ─── Tailwind ────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Formatting ──────────────────────────────────────────

/** Format minutes as human-readable duration: "45 minutes" / "1 hour 30 minutes" */
export function formatDuration(minutes: number): string {
  const plural = (n: number, word: string) =>
    `${n} ${word}${n !== 1 ? "s" : ""}`;

  if (minutes < 60) return plural(minutes, "minute");

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0
    ? plural(hours, "hour")
    : `${plural(hours, "hour")} ${plural(mins, "minute")}`;
}

/** Format a date to a readable locale string */
export function formatDate(date: string | Date, locale = "en-US"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── String ──────────────────────────────────────────────

/** Truncate text to `length` characters, appending '…' if trimmed */
export function truncate(text: string, length: number): string {
  return text.length <= length ? text : `${text.substring(0, length)}…`;
}

// ─── Timing ──────────────────────────────────────────────

/** Debounce a function by `wait` ms */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), wait);
  };
}
