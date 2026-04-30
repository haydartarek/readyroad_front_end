"use client";

import { cn } from "@/lib/utils";

export default function AdminSectionCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/50 bg-card p-5 shadow-sm",
        className,
      )}
    >
      {title || description || actions ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            {title ? (
              <h2 className="text-base font-black text-foreground">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className={cn("space-y-4", contentClassName)}>{children}</div>
    </section>
  );
}
