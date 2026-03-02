import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ─── Constants ───────────────────────────────────────────

const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const PASS_THRESHOLD = 82;
const WARN_THRESHOLD = 70;

// ─── Tailwind ────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Formatting ──────────────────────────────────────────

/** Format seconds as MM:SS */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/** Format minutes as human-readable duration: "45 minutes" / "1 hour 30 minutes" */
export function formatDuration(minutes: number): string {
  const plural = (n: number, word: string) => `${n} ${word}${n !== 1 ? 's' : ''}`;

  if (minutes < 60) return plural(minutes, 'minute');

  const hours = Math.floor(minutes / 60);
  const mins  = minutes % 60;
  return mins === 0
    ? plural(hours, 'hour')
    : `${plural(hours, 'hour')} ${plural(mins, 'minute')}`;
}

/** Format a date to a readable locale string */
export function formatDate(date: string | Date, locale = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Format a date with time */
export function formatDateTime(date: string | Date, locale = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(locale, {
    year:   'numeric',
    month:  'long',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

// ─── Math ────────────────────────────────────────────────

/** Returns rounded percentage of value/total. Returns 0 for zero total. */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// ─── Score Colors ────────────────────────────────────────

export function getScoreColor(score: number): string {
  if (score >= PASS_THRESHOLD) return 'text-success';
  if (score >= WARN_THRESHOLD) return 'text-warning';
  return 'text-error';
}

export function getScoreBgColor(score: number): string {
  if (score >= PASS_THRESHOLD) return 'bg-success/10';
  if (score >= WARN_THRESHOLD) return 'bg-warning/10';
  return 'bg-error/10';
}

// ─── Validation ──────────────────────────────────────────

/** Validates email format */
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

/** Validates password: min 8 chars, 1 uppercase, 1 lowercase, 1 number */
export function isValidPassword(password: string): boolean {
  return PASSWORD_RE.test(password);
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

/** Returns seconds remaining until expiry (0 if already expired) */
export function getTimeRemaining(expiresAt: string | Date): number {
  const expiry = typeof expiresAt === 'string'
    ? new Date(expiresAt).getTime()
    : expiresAt.getTime();
  return Math.max(0, Math.floor((expiry - Date.now()) / 1000));
}

/** Returns true if the exam expiry time has passed */
export function isExamExpired(expiresAt: string | Date): boolean {
  return getTimeRemaining(expiresAt) === 0;
}
