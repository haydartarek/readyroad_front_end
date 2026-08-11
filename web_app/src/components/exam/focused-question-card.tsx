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
  statusAfterMedia?: ReactNode;
  title: string;
  titleClassName?: string;
  options: FocusedQuestionOption[];
  footer?: ReactNode;
}

export function FocusedQuestionCard({
  headerBadges,
  media,
  statusAfterMedia,
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

      {statusAfterMedia ? <div>{statusAfterMedia}</div> : null}

      <h1
        data-testid="exam-question-title"
        className={cn(
          "mx-auto max-w-3xl break-words text-center text-lg font-black leading-8 text-foreground sm:text-xl md:text-[1.35rem]",
          titleClassName,
        )}
      >
        {title}
      </h1>

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

      {footer ? <div className="space-y-2.5">{footer}</div> : null}
    </div>
  );
}
