"use client";

import { cn } from "@/lib/utils";

type MetricTone = "default" | "primary" | "success" | "warning" | "danger";

type AdminPageMetric = {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: MetricTone;
};

const TONE_CLASSES: Record<MetricTone, string> = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-green-600",
  warning: "text-amber-600",
  danger: "text-destructive",
};

export default function AdminPageHeader({
  icon,
  title,
  description,
  badge,
  actions,
  metrics,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  metrics?: AdminPageMetric[];
  className?: string;
}) {
  const hasAside = Boolean(actions) || Boolean(metrics?.length);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 py-7 shadow-sm",
        className,
      )}
    >
      <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5" />

      <div
        className={cn(
          "relative flex flex-col gap-5",
          hasAside && "xl:flex-row xl:items-start xl:justify-between",
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
            {icon}
          </div>
          <div className="min-w-0 space-y-1.5">
            {badge}
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {title}
            </h1>
            {description ? (
              <p className="max-w-3xl text-sm font-medium text-muted-foreground md:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {hasAside ? (
          <div className="flex flex-col gap-3 xl:max-w-xl xl:items-end">
            {actions ? (
              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                {actions}
              </div>
            ) : null}

            {metrics?.length ? (
              <div className="flex flex-wrap gap-2 xl:justify-end">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="flex min-w-[132px] items-center gap-2 rounded-2xl border border-border/50 bg-card px-3 py-2 shadow-sm"
                  >
                    {metric.icon ? (
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        {metric.icon}
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {metric.label}
                      </p>
                      <p
                        className={cn(
                          "truncate text-sm font-black leading-tight",
                          TONE_CLASSES[metric.tone ?? "default"],
                        )}
                      >
                        {metric.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
