'use client';

import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────

interface ReviewQuestion {
  id: number;
  questionText: string;
  imageUrl?: string;
  selectedOption: number;
  correctOption: number;
  selectedOptionText?: string;
  correctOptionText?: string;
  isCorrect: boolean;
  categoryName: string;
  explanation?: string;
}

// ─── Component ───────────────────────────────────────────

export function QuestionReview({
  questions,
  showOnlyWrong = false,
}: {
  questions: ReviewQuestion[];
  showOnlyWrong?: boolean;
}) {
  const displayQuestions = showOnlyWrong
    ? questions.filter(q => !q.isCorrect)
    : questions;

  const count = displayQuestions.length;

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="font-black">
            {showOnlyWrong ? 'Wrong Answers' : 'All Questions Review'}
          </CardTitle>
          <Badge variant="secondary" className="text-xs font-semibold">
            {count} question{count !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Empty state */}
        {count === 0 && showOnlyWrong ? (
          <div className="py-12 text-center space-y-2">
            <div className="text-4xl">🎉</div>
            <p className="font-black text-foreground">Perfect Score!</p>
            <p className="text-sm text-muted-foreground">No wrong answers.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayQuestions.map((question, index) => (
              <div
                key={question.id}
                className={cn(
                  'rounded-2xl border p-5 space-y-3 transition-colors',
                  question.isCorrect
                    ? 'border-green-200 bg-green-50/40   dark:bg-green-950/20'
                    : 'border-red-200   bg-red-50/40     dark:bg-red-950/20',
                )}
              >
                {/* Row 1: index + category + result icon */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-card border border-border/50 text-xs font-black text-foreground">
                      {index + 1}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {question.categoryName}
                    </span>
                  </div>
                  {question.isCorrect
                    ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    : <XCircle      className="h-5 w-5 text-red-500   flex-shrink-0" />
                  }
                </div>

                {/* Question text */}
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {question.questionText}
                </p>

                {/* Answer summary */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground shrink-0">Your answer:</span>
                    <span className={cn(
                      'font-bold',
                      question.isCorrect ? 'text-green-600' : 'text-red-600',
                    )}>
                      {question.selectedOptionText || `Option ${question.selectedOption}`}
                    </span>
                  </div>
                  {!question.isCorrect && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground shrink-0">Correct answer:</span>
                      <span className="font-bold text-green-600">
                        {question.correctOptionText || `Option ${question.correctOption}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Explanation */}
                {question.explanation && (
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-start gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-foreground/80">
                      <span className="font-semibold text-primary">Explanation: </span>
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
