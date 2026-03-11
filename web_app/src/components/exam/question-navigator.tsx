"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Belgian exam: only Next button. No Previous, no Overview, no End Exam.

interface QuestionNavigatorProps {
  onNext: () => void;
  isLastQuestion: boolean;
  isSubmitting?: boolean;
}

export function QuestionNavigator({
  onNext,
  isLastQuestion,
  isSubmitting = false,
}: QuestionNavigatorProps) {
  return (
    <div className="flex items-center justify-end">
      <Button
        size="sm"
        onClick={onNext}
        disabled={isSubmitting}
        className="rounded-xl gap-1 min-w-[90px]"
      >
        {isLastQuestion ? "Submit" : "Next"}
        {!isLastQuestion && <ChevronRight className="h-4 w-4" />}
      </Button>
    </div>
  );
}
