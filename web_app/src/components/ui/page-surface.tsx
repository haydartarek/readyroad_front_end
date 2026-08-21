"use client";

import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type MetricTone = "default" | "primary" | "success" | "warning" | "danger";

const METRIC_TONE_CLASSES: Record<MetricTone, string> = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-green-600",
  warning: "text-amber-600",
  danger: "text-destructive",
};

const METRIC_ICON_TONE_CLASSES: Record<MetricTone, string> = {
  default:
    "bg-muted/70 text-foreground/70 ring-1 ring-border/50 dark:bg-muted/40 dark:text-foreground/80",
  primary:
    "bg-primary/10 text-primary ring-1 ring-primary/15 dark:bg-primary/15 dark:text-primary",
  success:
    "bg-green-50 text-green-800 ring-1 ring-green-300 dark:bg-green-950/40 dark:text-green-300 dark:ring-green-800/60",
  warning:
    "bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-900/40",
  danger:
    "bg-red-100 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-900/40",
};

export function PageHeroSurface({
  children,
  className,
  contentClassName,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn(
        "relative min-w-0 max-w-full overflow-hidden rounded-2xl border border-primary/15 bg-card/95 shadow-sm",
        className,
      )}
    >
      <div
        className={cn(
          "relative min-w-0 space-y-3 border-s-4 border-primary px-4 py-6 sm:px-6 sm:py-7",
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function PageHeroEyebrow({
  children,
  className,
  as: Component = "p",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Component
      className={cn(
        "min-w-0 break-words text-sm font-semibold text-primary",
        className,
      )}
    >
      {children}
    </Component>
  );
}

export function PageHeroTitle({
  children,
  className,
  as: Component = "h1",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Component
      className={cn(
        "min-w-0 break-words text-2xl font-black tracking-normal text-foreground sm:text-3xl",
        className,
      )}
    >
      {children}
    </Component>
  );
}

export function PageHeroDescription({
  children,
  className,
  as: Component = "p",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Component
      className={cn(
        "min-w-0 break-words text-sm font-medium leading-6 text-muted-foreground",
        className,
      )}
    >
      {children}
    </Component>
  );
}

export function PageSectionSurface({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      {title || description || actions ? (
        <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            {title ? (
              <h2 className="break-words text-lg font-black tracking-normal text-foreground sm:text-xl">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="break-words text-xs leading-5 text-muted-foreground sm:text-sm">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="min-w-0 shrink-0">{actions}</div> : null}
        </div>
      ) : null}

      <div className={cn("min-w-0 space-y-3", contentClassName)}>
        {children}
      </div>
    </section>
  );
}

export function PageMetricCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
  size = "default",
  mobileStacked = false,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: MetricTone;
  size?: "default" | "sm";
  mobileStacked?: boolean;
  className?: string;
}) {
  const isSmall = size === "sm";

  return (
    <div
      data-testid={mobileStacked ? "dashboard-stat-card" : undefined}
      data-stat-kind={mobileStacked ? "summary" : undefined}
      className={cn(
        isSmall
          ? "min-w-0 rounded-xl border border-border/60 bg-background/80 p-2 shadow-sm"
          : "min-w-0 rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm",
        className,
      )}
    >
      {mobileStacked ? (
        <div
          className={cn(
            "grid min-w-0 grid-cols-1 justify-items-center text-center sm:grid-cols-[auto_minmax(0,1fr)] sm:justify-items-stretch sm:text-start",
            isSmall ? "gap-y-1 sm:gap-x-1" : "gap-y-2 sm:gap-x-3",
          )}
        >
          <div
            data-testid="dashboard-stat-icon"
            className={cn(
              "row-start-1 shrink-0 sm:col-start-1",
              isSmall
                ? "flex h-5 w-5 items-center justify-center rounded-[0.55rem]"
                : "flex h-8 w-8 items-center justify-center rounded-[0.9rem]",
              METRIC_ICON_TONE_CLASSES[tone],
            )}
          >
            {icon}
          </div>
          <p
            data-testid="dashboard-stat-label"
            className={cn(
              "row-start-2 min-w-0 max-w-full break-words font-semibold uppercase text-muted-foreground sm:col-span-2 sm:justify-self-start",
              isSmall
                ? "text-[8px] tracking-[0.08em] sm:mt-0.5"
                : "text-[10px] tracking-[0.16em] sm:mt-2",
            )}
          >
            {label}
          </p>
          <p
            data-testid="dashboard-stat-value"
            className={cn(
              "row-start-3 min-w-0 max-w-full break-words sm:col-start-2 sm:row-start-1 sm:justify-self-end",
              isSmall
                ? "text-[13px] font-semibold leading-4 tracking-normal"
                : "text-xl font-black tracking-normal sm:text-2xl",
              METRIC_TONE_CLASSES[tone],
            )}
          >
            {value}
          </p>
          {hint ? (
            <p
              className={cn(
                "row-start-4 min-w-0 max-w-full break-words font-medium text-foreground/80 sm:col-span-2 sm:justify-self-start",
                isSmall
                  ? "text-[9px] leading-3.5 md:text-[9px]"
                  : "text-sm leading-4.5 md:text-base",
              )}
            >
              {hint}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <div
            className={cn(
              "flex items-start justify-between",
              isSmall ? "gap-1" : "gap-3",
            )}
          >
            <div
              className={cn(
                isSmall
                  ? "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[0.55rem]"
                  : "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[0.9rem]",
                METRIC_ICON_TONE_CLASSES[tone],
              )}
            >
              {icon}
            </div>
            <p
              className={cn(
                isSmall
                  ? "break-words text-[13px] font-semibold leading-4 tracking-normal"
                  : "break-words text-xl font-black tracking-normal sm:text-2xl",
                METRIC_TONE_CLASSES[tone],
              )}
            >
              {value}
            </p>
          </div>

          <div
            className={cn(isSmall ? "mt-0.5 space-y-0" : "mt-2 space-y-0.5")}
          >
            <p
              className={cn(
                "break-words font-semibold uppercase text-muted-foreground",
                isSmall
                  ? "text-[8px] tracking-[0.08em]"
                  : "text-[10px] tracking-[0.16em]",
              )}
            >
              {label}
            </p>
            {hint ? (
              <p
                className={cn(
                  "break-words font-medium text-foreground/80",
                  isSmall
                    ? "text-[9px] leading-3.5 md:text-[9px]"
                    : "text-sm leading-4.5 md:text-base",
                )}
              >
                {hint}
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

