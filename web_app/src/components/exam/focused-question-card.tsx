"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  ExamOptionCard,
  type ExamOptionState,
} from "@/components/exam/exam-option-card";

interface FocusedQuestionOption {
  key: string | number;
  text: string;
  selected: boolean;
  state?: ExamOptionState;
  onSelect: () => void;
  disabled?: boolean;
}

interface FocusedQuestionCardProps {
  headerBadges?: ReactNode;
  difficultyBadge?: ReactNode;
  media?: ReactNode;
  title: string;
  titleClassName?: string;
  options: FocusedQuestionOption[];
  feedback?: ReactNode;
  compactOptionGap?: boolean;
  compactMobile?: boolean;
  footer?: ReactNode;
}

export function FocusedQuestionCard({
  headerBadges,
  difficultyBadge,
  media,
  title,
  titleClassName,
  options,
  feedback,
  compactOptionGap = false,
  compactMobile = false,
  footer,
}: FocusedQuestionCardProps) {
  return (
    <div
      data-testid="exam-question-layout"
      className={cn(
        "grid min-w-0 gap-3 px-3 py-3 sm:px-5 sm:py-4 lg:gap-6 lg:px-6 lg:py-5",
        compactMobile && "max-lg:gap-2 max-lg:px-2.5 max-lg:py-2",
        media &&
          "lg:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.05fr)] lg:items-start",
      )}
    >
      {media ? (
        <div className="flex min-w-0 items-start justify-center">{media}</div>
      ) : null}

      <div data-testid="exam-question-content" className="min-w-0 space-y-2.5">
        {headerBadges || difficultyBadge ? (
          <div className="hidden min-h-8 flex-wrap items-center gap-2 lg:flex lg:justify-start">
            {headerBadges}
            {difficultyBadge}
          </div>
        ) : null}

        <h2
          data-testid="exam-question-title"
          className={cn(
            "mx-auto max-w-3xl break-words text-center text-lg font-black leading-8 text-foreground sm:text-xl md:text-[1.35rem] lg:mx-0 lg:text-start",
            compactMobile && "max-lg:text-base max-lg:leading-6",
            titleClassName,
          )}
        >
          {title}
        </h2>

        <div className={compactOptionGap ? "space-y-1.5" : "space-y-2"}>
          {options.map((option, index) => (
            <ExamOptionCard
              key={option.key}
              className={compactMobile ? "max-lg:min-h-11 max-lg:gap-2 max-lg:rounded-xl max-lg:px-2.5 max-lg:py-1.5" : undefined}
              index={index}
              text={option.text}
              disabled={option.disabled}
              state={option.state ?? (option.selected ? "selected" : "idle")}
              onSelect={option.onSelect}
            />
          ))}
        </div>

        {footer ? <div className="pt-1">{footer}</div> : null}
        {feedback ? <div className="min-w-0 pt-0.5">{feedback}</div> : null}
      </div>
    </div>
  );
}
