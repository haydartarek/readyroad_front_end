'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface OverviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: Array<{ id: number }>;
  answers: Record<number, number>;
  currentIndex: number;
  onQuestionSelect: (index: number) => void;
}

export function OverviewDialog({
  open,
  onOpenChange,
  questions,
  answers,
  currentIndex,
  onQuestionSelect,
}: OverviewDialogProps) {
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exam Overview</DialogTitle>
          <DialogDescription>
            {answeredCount}/{questions.length} questions answered
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Stats */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-green-500" />
              <span className="text-sm">Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-gray-300" />
              <span className="text-sm">Unanswered ({unansweredCount})</span>
            </div>
          </div>
          
          {/* Question Grid */}
          <div className="grid grid-cols-10 gap-3">
            {questions.map((question, index) => {
              const isAnswered = answers[question.id] !== undefined;
              const isCurrent = index === currentIndex;
              
              return (
                <button
                  key={question.id}
                  onClick={() => {
                    onQuestionSelect(index);
                    onOpenChange(false);
                  }}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full font-semibold transition-all',
                    'hover:scale-110',
                    isAnswered && 'bg-green-500 text-white',
                    !isAnswered && 'bg-gray-300 text-gray-700',
                    isCurrent && 'ring-4 ring-primary ring-offset-2'
                  )}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
