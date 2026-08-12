"use client";

import type { ReactNode } from "react";

interface FocusedExamShellProps {
  dir?: "ltr" | "rtl";
  title: string;
  counter: string;
  backControl?: ReactNode;
  timerPill?: ReactNode;
  progressLabel?: string;
  progressPercent?: number;
  timerProgressPercent?: number;
  timerProgressClassName?: string;
  showStatusCard?: boolean;
  afterCard?: ReactNode;
  children: ReactNode;
}

export function FocusedExamShell({
  dir = "ltr",
  title,
  counter,
  backControl,
  timerPill,
  progressLabel,
  progressPercent = 0,
  timerProgressPercent,
  timerProgressClassName,
  showStatusCard = true,
  afterCard,
  children,
}: FocusedExamShellProps) {
  return (
    <div
      dir={dir}
      className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background"
    >
      <div className="container mx-auto max-w-[1480px] px-3 py-3 sm:px-4 md:py-4 xl:px-6">
        <div className="space-y-3">
          <header
            data-testid="exam-shell-header"
            className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 px-4 py-3 shadow-sm sm:px-5"
          >
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {backControl ? <div className="shrink-0">{backControl}</div> : null}
                <h1 className="min-w-0 break-words text-lg font-black text-foreground sm:text-xl">
                  {title}
                </h1>
              </div>
              <span className="shrink-0 rounded-full border border-primary/20 bg-background/90 px-3 py-1.5 text-xs font-bold text-foreground shadow-sm sm:text-sm">
                {counter}
              </span>
            </div>
          </header>

          <div
            data-testid="exam-main-card"
            className="overflow-hidden rounded-lg border border-border/50 bg-card/94 shadow-md backdrop-blur"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/25" />
            {children}
          </div>

          {showStatusCard ? (
            <div
              data-testid="exam-status-card"
              className="rounded-lg border border-border/50 bg-card/88 px-3 py-2.5 shadow-sm backdrop-blur sm:px-4"
            >
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
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
                {timerPill ? (
                  <div
                    data-testid="exam-timer-slot"
                    className="flex shrink-0 justify-center sm:justify-normal"
                  >
                    {timerPill}
                  </div>
                ) : null}
              </div>
              {timerProgressPercent !== undefined ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/60">
                  <div
                    data-testid="exam-timer-progress"
                    className={`h-full rounded-full transition-[width,background-color] duration-1000 ease-linear ${timerProgressClassName ?? "bg-primary"}`}
                    style={{
                      width: `${Math.max(0, Math.min(100, timerProgressPercent))}%`,
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
          {afterCard ? <div>{afterCard}</div> : null}
        </div>
      </div>
    </div>
  );
}
