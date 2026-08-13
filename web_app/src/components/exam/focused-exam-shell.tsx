"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FocusedExamShellProps {
  dir?: "ltr" | "rtl";
  counter: string;
  difficultyLabel?: string;
  difficultyClassName?: string;
  timerPill?: ReactNode;
  progressPercent?: number;
  afterCard?: ReactNode;
  compactInformationBar?: boolean;
  children: ReactNode;
}

export function FocusedExamShell({
  dir = "ltr",
  counter,
  difficultyLabel,
  difficultyClassName,
  timerPill,
  progressPercent = 0,
  afterCard,
  compactInformationBar = false,
  children,
}: FocusedExamShellProps) {
  const informationGridClass = timerPill
    ? difficultyLabel
      ? "grid-cols-4 lg:grid-cols-3"
      : "grid-cols-3"
    : difficultyLabel
      ? "grid-cols-3 lg:grid-cols-2"
      : "grid-cols-2";

  return (
    <div
      dir={dir}
      className="min-h-[calc(100dvh-4rem)] bg-gradient-to-br from-background via-muted/10 to-background"
    >
      <div className="container mx-auto max-w-[1680px] px-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-4 md:py-4 xl:px-6">
        <div className="space-y-2.5">
          <div
            data-testid="exam-main-card"
            className="overflow-hidden rounded-lg border border-border/50 bg-card/94 shadow-md backdrop-blur"
          >
            {children}
          </div>

          <div
            data-testid="exam-status-card"
            className={cn(
              "rounded-lg border border-border/50 bg-card/92 px-3 shadow-sm backdrop-blur sm:px-4",
              compactInformationBar ? "py-2" : "py-2.5",
            )}
          >
            <div
              data-testid="exam-information-bar"
              dir="ltr"
              className={`grid ${informationGridClass} items-center [&>*+*]:border-s [&>*+*]:border-border/50`}
            >
              <div className={cn("flex min-w-0 items-center justify-center px-1.5 font-black tabular-nums text-primary", compactInformationBar ? "text-[13px] sm:text-sm" : "text-sm sm:text-base")}>
                {Math.round(progressPercent)}%
              </div>
              {timerPill ? (
                <div
                  data-testid="exam-timer-slot"
                  className="flex min-w-0 items-center justify-center px-1.5"
                >
                  {timerPill}
                </div>
              ) : null}
              {difficultyLabel ? (
                <div className="flex min-w-0 items-center justify-center px-1.5 lg:hidden">
                  <span
                    data-testid="exam-mobile-difficulty"
                    className={`inline-flex min-h-7 max-w-full items-center justify-center rounded-full px-2.5 text-xs font-bold ${difficultyClassName ?? "bg-primary/10 text-primary"}`}
                  >
                    {difficultyLabel}
                  </span>
                </div>
              ) : null}
              <div className={cn("flex min-w-0 items-center justify-center px-1.5 font-black tabular-nums text-foreground", compactInformationBar ? "text-[13px] sm:text-sm" : "text-sm sm:text-base")}>
                {counter}
              </div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                data-testid="exam-question-progress"
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{
                  width: `${Math.max(0, Math.min(100, progressPercent))}%`,
                }}
              />
            </div>
          </div>

          {afterCard ? <div>{afterCard}</div> : null}
        </div>
      </div>
    </div>
  );
}
