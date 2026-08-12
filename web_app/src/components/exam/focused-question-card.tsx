"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ExamOptionCard } from "@/components/exam/exam-option-card";

interface FocusedQuestionOption {
  key: string | number;
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
}

export function FocusedQuestionCard({
  headerBadges,
  media,
  title,
  titleClassName,
  options,
}: FocusedQuestionCardProps) {
  return (
    <div
      data-testid="exam-question-layout"
      className={cn(
        "grid min-w-0 gap-4 px-3.5 py-4 sm:px-5 lg:gap-6 lg:px-6 lg:py-5",
        media &&
          "lg:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.1fr)] lg:items-center",
      )}
    >
      {media ? (
        <div className="flex min-w-0 justify-center">{media}</div>
      ) : null}

      <div data-testid="exam-question-content" className="min-w-0 space-y-3">
        {headerBadges ? (
          <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            {headerBadges}
          </div>
        ) : null}

        <h2
          data-testid="exam-question-title"
          className={cn(
            "mx-auto max-w-3xl break-words text-center text-lg font-black leading-8 text-foreground sm:text-xl md:text-[1.35rem]",
            titleClassName,
          )}
        >
          {title}
        </h2>

        <div className="space-y-2.5">
          {options.map((option, index) => (
            <ExamOptionCard
              key={option.key}
              index={index}
              text={option.text}
              disabled={option.disabled}
              state={option.selected ? "selected" : "idle"}
              onSelect={option.onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
