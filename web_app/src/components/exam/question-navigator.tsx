'use client';

import { Button } from '@/components/ui/button';

interface QuestionNavigatorProps {
  currentIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onOverview: () => void;
  onSubmit: () => void;
  isLastQuestion: boolean;
}

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
    <div className="flex items-center justify-between gap-4">
      {/* Previous Button */}
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstQuestion}
        className="flex-1 sm:flex-initial"
      >
        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </Button>
      
      {/* Overview Button */}
      <Button variant="outline" onClick={onOverview} className="flex-1 sm:flex-initial">
        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Overview
      </Button>
      
      {/* Next/Submit Button */}
      {isLastQuestion ? (
        <Button onClick={onSubmit} className="flex-1 sm:flex-initial">
          Submit Exam
          <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </Button>
      ) : (
        <Button onClick={onNext} className="flex-1 sm:flex-initial">
          Next
          <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      )}
    </div>
  );
}
