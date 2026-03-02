'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────

interface OverviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: Array<{ id: number }>;
  answers: Record<number, number>;
  currentIndex: number;
  onQuestionSelect: (index: number) => void;
}

// ─── Component ───────────────────────────────────────────

export function OverviewDialog({
  open,
  onOpenChange,
  questions,
  answers,
  currentIndex,
  onQuestionSelect,
}: OverviewDialogProps) {
  const answeredCount   = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-black">Exam Overview</DialogTitle>
          <DialogDescription>
            {answeredCount}/{questions.length} questions answered
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">

          {/* Legend */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-3.5 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground">
                Answered <span className="font-bold text-foreground">({answeredCount})</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-3.5 rounded-full bg-muted-foreground/30" />
              <span className="text-sm text-muted-foreground">
                Unanswered <span className="font-bold text-foreground">({unansweredCount})</span>
              </span>
            </div>
          </div>

          {/* Question grid */}
          <div className="grid grid-cols-10 gap-2">
            {questions.map((question, index) => {
              const isAnswered = answers[question.id] !== undefined;
              const isCurrent  = index === currentIndex;

              return (
                <button
                  key={question.id}
                  onClick={() => { onQuestionSelect(index); onOpenChange(false); }}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl',
                    'text-sm font-bold transition-all hover:scale-110',
                    isAnswered
                      ? 'bg-green-500 text-white shadow-sm shadow-green-500/30'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    isCurrent && 'ring-2 ring-primary ring-offset-2',
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
