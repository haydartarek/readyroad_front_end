import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sign: "aspect-video w-full max-w-[560px]",
  wide: "aspect-video w-full max-w-[640px]",
  theory: "aspect-video w-full max-w-[760px]",
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
          "relative max-w-full overflow-hidden rounded-[8px] border border-border/60 bg-white p-3 shadow-sm",
          SIZE_CLASSES[variant],
          className,
        )}
      >
        <div className="relative h-full w-full">{children}</div>
      </div>
    </div>
  );
}
