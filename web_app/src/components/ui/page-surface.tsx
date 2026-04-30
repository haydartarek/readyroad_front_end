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
    "bg-green-100 text-green-700 ring-1 ring-green-200 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-900/40",
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
        "relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-sm",
        className,
      )}
    >
      <div className="pointer-events-none absolute top-0 right-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 translate-y-1/2 -translate-x-1/2 rounded-full bg-primary/5" />

      <div
        className={cn(
          "relative space-y-3 px-6 py-7",
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
    <Component className={cn("text-sm font-medium text-primary", className)}>
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
      className={cn("text-3xl font-black tracking-tight text-foreground", className)}
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
      className={cn("text-sm font-medium text-muted-foreground", className)}
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
        "rounded-[1.5rem] border border-border/60 bg-card/85 p-3.5 md:p-4 shadow-sm",
        className,
      )}
    >
      {title || description || actions ? (
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-0.5">
            {title ? (
              <h2 className="text-lg font-black tracking-tight text-foreground md:text-xl">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-xs leading-5 text-muted-foreground md:text-sm">
                {description}
              </p>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}

      <div className={cn("space-y-3", contentClassName)}>{children}</div>
    </section>
  );
}

export function PageMetricCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: MetricTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.2rem] border border-border/60 bg-background/80 p-3 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[0.9rem]",
            METRIC_ICON_TONE_CLASSES[tone],
          )}
        >
          {icon}
        </div>
        <p
          className={cn(
            "text-xl font-black tracking-tight md:text-2xl",
            METRIC_TONE_CLASSES[tone],
          )}
        >
          {value}
        </p>
      </div>

      <div className="mt-2 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        {hint ? (
          <p className="text-[11px] font-medium leading-4.5 text-foreground/80 md:text-xs">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
