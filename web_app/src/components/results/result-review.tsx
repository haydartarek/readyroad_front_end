"use client";

import type { ReactNode } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AnswerTone = "correct" | "incorrect" | "neutral";

const ANSWER_TONE_CLASSES: Record<AnswerTone, string> = {
  correct:
    "border-green-200/70 bg-green-50/35 dark:border-green-900/60 dark:bg-green-950/15",
  incorrect:
    "border-red-200/70 bg-red-50/35 dark:border-red-900/60 dark:bg-red-950/15",
  neutral:
    "border-primary/15 bg-primary/[0.025] dark:border-primary/20 dark:bg-primary/[0.05]",
};

const ANSWER_LABEL_CLASSES: Record<AnswerTone, string> = {
  correct: "text-green-700 dark:text-green-300",
  incorrect: "text-red-700 dark:text-red-300",
  neutral: "text-foreground",
};

const ANSWER_BODY_CLASSES: Record<AnswerTone, string> = {
  correct: "text-foreground",
  incorrect: "text-foreground",
  neutral: "text-foreground",
};

export function ResultAnswerBlock({
  label,
  tone,
  children,
  className,
  marker,
}: {
  label: string;
  tone: AnswerTone;
  children?: ReactNode;
  className?: string;
  marker?: string;
}) {
  return (
    <div
      data-testid="result-answer-block"
      data-answer-tone={tone}
      data-answer-marker={marker}
      className={cn(
        "min-w-0 rounded-xl border px-3.5 py-3",
        ANSWER_TONE_CLASSES[tone],
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border bg-background/80",
            tone === "correct" && "border-green-200 text-green-600",
            tone === "incorrect" && "border-red-200 text-red-600",
            tone === "neutral" && "border-border/60 text-muted-foreground",
          )}
        >
          {tone === "correct" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : tone === "incorrect" ? (
            <XCircle className="h-4 w-4" />
          ) : (
            <Lightbulb className="h-4 w-4" />
          )}
        </span>
        {marker ? (
          <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background px-2 text-xs font-semibold text-foreground">
            {marker}
          </span>
        ) : null}
        <p
          data-testid="result-answer-label"
          className={cn(
            "min-w-0 break-words text-xs font-semibold leading-5",
            ANSWER_LABEL_CLASSES[tone],
          )}
        >
          {label}
        </p>
      </div>
      {children ? (
        <div
          data-testid="result-answer-body"
          className={cn(
            "mt-1.5 min-w-0 break-words text-sm font-medium leading-6",
            ANSWER_BODY_CLASSES[tone],
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function ResultDetailsToggle({
  expanded,
  onToggle,
  showLabel,
  hideLabel,
}: {
  expanded: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      onClick={onToggle}
      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-border hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
    >
      {expanded ? (
        <ChevronUp className="h-4 w-4 shrink-0" />
      ) : (
        <ChevronDown className="h-4 w-4 shrink-0" />
      )}
      <span className="min-w-0 break-words text-center">
        {expanded ? hideLabel : showLabel}
      </span>
    </button>
  );
}
