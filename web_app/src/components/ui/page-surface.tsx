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
        "relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-sm",
        className,
      )}
    >
      <div className="pointer-events-none absolute top-0 right-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 translate-y-1/2 -translate-x-1/2 rounded-full bg-primary/5" />

      <div className={cn("relative space-y-3 px-6 py-7", contentClassName)}>
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
      className={cn(
        "text-3xl font-black tracking-tight text-foreground",
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
  size = "default",
  className,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: MetricTone;
  size?: "default" | "sm";
  className?: string;
}) {
  const isSmall = size === "sm";

  return (
    <div
      className={cn(
        isSmall
          ? "rounded-[0.75rem] border border-border/60 bg-background/80 p-1.5 shadow-sm"
          : "rounded-[1.2rem] border border-border/60 bg-background/80 p-3 shadow-sm",
        className,
      )}
    >
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
              ? "text-[13px] font-semibold leading-4 tracking-tight md:text-[13px]"
              : "text-xl font-black tracking-tight md:text-2xl",
            METRIC_TONE_CLASSES[tone],
          )}
        >
          {value}
        </p>
      </div>

      <div className={cn(isSmall ? "mt-0.5 space-y-0" : "mt-2 space-y-0.5")}>
        <p
          className={cn(
            "font-semibold uppercase text-muted-foreground",
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
              "font-medium text-foreground/80",
              isSmall
                ? "text-[9px] leading-3.5 md:text-[9px]"
                : "text-[11px] leading-4.5 md:text-xs",
            )}
          >
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
