"use client";

import type { ReactNode } from "react";

interface FocusedExamShellProps {
  dir?: "ltr" | "rtl";
  backControl: ReactNode;
  timerPill: ReactNode;
  progressLabel: string;
  progressPercent: number;
  integratedStatusRow?: boolean;
  children: ReactNode;
}

export function FocusedExamShell({
  dir = "ltr",
  backControl,
  timerPill,
  progressLabel,
  progressPercent,
  integratedStatusRow = false,
  children,
}: FocusedExamShellProps) {
  return (
    <div
      dir={dir}
      className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background"
    >
      <div className="container mx-auto max-w-[860px] px-4 py-0.5 md:py-1">
        <div className="space-y-2">
          <div
            className={
              integratedStatusRow
                ? "flex items-center gap-2.5"
                : "flex items-center justify-between gap-2.5"
            }
          >
            {backControl}
            {!integratedStatusRow ? timerPill : null}
          </div>

          <div
            data-testid="exam-status-card"
            className="rounded-[1.3rem] border border-border/50 bg-card/88 px-3 py-2 shadow-sm backdrop-blur"
          >
            <div
              className={
                integratedStatusRow
                  ? "flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
                  : undefined
              }
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {progressLabel}
                  </span>
                  <span className="text-[11px] font-bold text-primary">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              {integratedStatusRow ? (
                <div
                  data-testid="exam-timer-slot"
                  className="flex shrink-0 justify-center sm:justify-normal"
                >
                  {timerPill}
                </div>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.55rem] border border-border/50 bg-card/94 shadow-md backdrop-blur">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/25" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
