"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ExamOptionState =
  | "idle"
  | "selected"
  | "correct"
  | "incorrect"
  | "neutral";

const OPTION_LABELS = ["A", "B", "C"] as const;

const IDENTITY_CLASSES = [
  "border-emerald-200/90 bg-emerald-50/45 hover:border-emerald-400 hover:bg-emerald-50/75",
  "border-amber-200/90 bg-amber-50/45 hover:border-amber-400 hover:bg-amber-50/75",
  "border-rose-200/90 bg-rose-50/45 hover:border-rose-400 hover:bg-rose-50/75",
] as const;

const IDENTITY_BADGE_CLASSES = [
  "border-emerald-300 bg-emerald-100 text-emerald-800",
  "border-amber-300 bg-amber-100 text-amber-800",
  "border-rose-300 bg-rose-100 text-rose-800",
] as const;

export function getExamOptionLabel(index: number): string {
  return OPTION_LABELS[index] ?? String(index + 1);
}

export function ExamOptionCard({
  index,
  text,
  state = "idle",
  disabled = false,
  onSelect,
  className,
}: {
  index: number;
  text: string;
  state?: ExamOptionState;
  disabled?: boolean;
  onSelect: () => void;
  className?: string;
}) {
  const identityIndex = Math.min(index, IDENTITY_CLASSES.length - 1);
  const isResultState = state === "correct" || state === "incorrect";

  return (
    <button
      type="button"
      data-testid="exam-option-card"
      data-option-label={getExamOptionLabel(index)}
      data-option-state={state}
      aria-pressed={state === "selected"}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex min-h-12 w-full min-w-0 items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-start shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 sm:px-4",
        state === "idle" && IDENTITY_CLASSES[identityIndex],
        state === "selected" &&
          "border-primary bg-primary/10 shadow-md shadow-primary/10",
        state === "correct" &&
          "border-emerald-400 bg-emerald-50 text-emerald-950 shadow-emerald-100/80",
        state === "incorrect" &&
          "border-red-400 bg-red-50 text-red-950 shadow-red-100/80",
        state === "neutral" &&
          "border-border/60 bg-background/80 text-foreground opacity-75",
        disabled && !isResultState && state !== "selected" && "cursor-default",
        !disabled && "hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-black",
          (state === "idle" || state === "neutral") &&
            IDENTITY_BADGE_CLASSES[identityIndex],
          state === "selected" &&
            "border-primary bg-primary text-primary-foreground",
          state === "correct" &&
            "border-emerald-500 bg-emerald-600 text-white",
          state === "incorrect" && "border-red-500 bg-red-600 text-white",
        )}
      >
        {getExamOptionLabel(index)}
      </span>

      <span className="min-w-0 flex-1 break-words text-[0.95rem] font-semibold leading-6 text-foreground sm:text-base">
        {text}
      </span>

      {state === "correct" ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
      ) : state === "incorrect" ? (
        <XCircle className="h-5 w-5 shrink-0 text-red-600" />
      ) : null}
    </button>
  );
}
