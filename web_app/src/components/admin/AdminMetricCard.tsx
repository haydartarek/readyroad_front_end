import { cn } from "@/lib/utils";

type AdminMetricCardProps = {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  description?: React.ReactNode;
  loading?: boolean;
  iconClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
  className?: string;
};

export default function AdminMetricCard({
  icon,
  label,
  value,
  description,
  loading = false,
  iconClassName,
  labelClassName,
  valueClassName,
  className,
}: AdminMetricCardProps) {
  return (
    <div
      className={cn(
        "flex h-full min-w-0 flex-col items-center rounded-2xl border border-border/50 bg-card p-4 text-center shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground",
          iconClassName,
        )}
      >
        {icon}
      </div>
      <p
        className={cn(
          "mt-3 break-words text-xs font-semibold uppercase text-muted-foreground",
          labelClassName,
        )}
      >
        {label}
      </p>
      {loading ? (
        <div className="mt-2 h-8 w-20 animate-pulse rounded-lg bg-muted" />
      ) : (
        <p
          className={cn(
            "mt-1 max-w-full break-words text-2xl font-black text-foreground",
            valueClassName,
          )}
        >
          {value ?? "—"}
        </p>
      )}
      {description && !loading ? (
        <p className="mt-1 max-w-full break-words text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
