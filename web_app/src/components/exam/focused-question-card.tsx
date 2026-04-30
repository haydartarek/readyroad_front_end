"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FocusedQuestionOption {
  key: string | number;
  marker: string | number;
  text: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

interface FocusedQuestionCardProps {
  headerBadges?: ReactNode;
  media?: ReactNode;
  title: string;
  titleClassName?: string;
  options: FocusedQuestionOption[];
  footer?: ReactNode;
}

export function FocusedQuestionCard({
  headerBadges,
  media,
  title,
  titleClassName,
  options,
  footer,
}: FocusedQuestionCardProps) {
  return (
    <div className="space-y-3 px-3.5 pb-3.5 pt-3.5 md:px-4 md:pb-4">
      {headerBadges ? (
        <div className="flex flex-wrap items-center gap-2">{headerBadges}</div>
      ) : null}

      {media ? <div className="flex justify-center">{media}</div> : null}

      <h1
        className={cn(
          "text-[0.9rem] font-black leading-[1.45] text-foreground md:text-[1.05rem]",
          titleClassName,
        )}
      >
        {title}
      </h1>

      <div className="space-y-1.5">
        {options.map((option) => (
          <button
            key={option.key}
            disabled={option.disabled}
            onClick={option.onSelect}
            className={cn(
              "w-full rounded-[1rem] border-2 p-3 text-start transition-all",
              !option.disabled &&
                !option.selected &&
                "border-border bg-background/60 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm",
              option.selected &&
                "border-primary bg-primary/10 shadow-md shadow-primary/10",
              option.disabled &&
                !option.selected &&
                "border-border/40 bg-muted/30 opacity-50",
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-6.5 w-6.5 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-black transition-colors",
                  option.selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {option.marker}
              </span>
              <span className="flex-1 text-[0.92rem] font-medium leading-6 text-foreground md:text-[0.94rem]">
                {option.text}
              </span>
            </div>
          </button>
        ))}
      </div>

      {footer ? <div className="space-y-2.5">{footer}</div> : null}
    </div>
  );
}
