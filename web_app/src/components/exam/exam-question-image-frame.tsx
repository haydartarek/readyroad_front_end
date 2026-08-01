import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sign: "h-36 w-36 sm:h-44 sm:w-44 md:h-48 md:w-48",
  wide: "h-44 w-full max-w-[520px] sm:h-52 md:h-60",
  review: "h-28 w-28 sm:h-36 sm:w-36",
} as const;

export function ExamQuestionImageFrame({
  children,
  variant = "sign",
  className,
}: {
  children: ReactNode;
  variant?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  return (
    <div className="flex w-full max-w-full justify-center">
      <div
        data-testid="exam-question-image"
        className={cn(
          "relative max-w-full overflow-hidden rounded-2xl border border-border/60 bg-white p-3 shadow-sm",
          SIZE_CLASSES[variant],
          className,
        )}
      >
        <div className="relative h-full w-full">{children}</div>
      </div>
    </div>
  );
}
