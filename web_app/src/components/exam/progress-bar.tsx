'use client';

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = total === 0 ? 0 : (current / total) * 100;

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <div className="text-sm font-medium text-gray-600">
        {current}/{total}
      </div>
    </div>
  );
}
