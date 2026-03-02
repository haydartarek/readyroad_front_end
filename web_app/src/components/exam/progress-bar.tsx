'use client';

// ─── Types ───────────────────────────────────────────────

interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
}

// ─── Component ───────────────────────────────────────────

export function ProgressBar({ current, total, showLabel = true }: ProgressBarProps) {
  const percentage = total === 0 ? 0 : Math.min((current / total) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      {showLabel && (
        <span className="text-sm font-bold text-muted-foreground tabular-nums">
          {current}/{total}
        </span>
      )}
    </div>
  );
}
