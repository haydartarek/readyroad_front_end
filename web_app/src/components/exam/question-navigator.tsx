'use client';

import { ChevronLeft, ChevronRight, LayoutGrid, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ───────────────────────────────────────────────

interface QuestionNavigatorProps {
  currentIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onOverview: () => void;
  onSubmit: () => void;
  isLastQuestion: boolean;
}

// ─── Component ───────────────────────────────────────────

export function QuestionNavigator({
  currentIndex,
  onPrevious,
  onNext,
  onOverview,
  onSubmit,
  isLastQuestion,
}: QuestionNavigatorProps) {
  const isFirstQuestion = currentIndex === 0;

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3">

      {/* Previous */}
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevious}
        disabled={isFirstQuestion}
        className="rounded-xl gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      {/* Centre group */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOverview}
          className="rounded-xl gap-1.5"
        >
          <LayoutGrid className="h-4 w-4" />
          Overview
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={onSubmit}
          className="rounded-xl gap-1.5"
        >
          <StopCircle className="h-4 w-4" />
          End Exam
        </Button>
      </div>

      {/* Next — placeholder keeps layout stable on last question */}
      <div className="min-w-[80px] flex justify-end">
        {!isLastQuestion && (
          <Button
            size="sm"
            onClick={onNext}
            className="rounded-xl gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

    </div>
  );
}
