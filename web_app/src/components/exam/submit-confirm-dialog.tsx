'use client';

import { Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ─── Types ───────────────────────────────────────────────

interface SubmitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  answeredCount: number;
  totalQuestions: number;
  onConfirm: () => void;
  isSubmitting: boolean;
}

// ─── Component ───────────────────────────────────────────

export function SubmitConfirmDialog({
  open,
  onOpenChange,
  answeredCount,
  totalQuestions,
  onConfirm,
  isSubmitting,
}: SubmitConfirmDialogProps) {
  const unansweredCount = totalQuestions - answeredCount;
  const allAnswered     = unansweredCount === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-black">Submit Exam?</DialogTitle>
          <DialogDescription>
            You have answered{' '}
            <span className="font-bold text-foreground">
              {answeredCount}/{totalQuestions}
            </span>{' '}
            questions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!allAnswered && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="space-y-1">
                <p className="font-semibold">
                  {unansweredCount} question{unansweredCount > 1 ? 's are' : ' is'} unanswered
                </p>
                <p className="text-xs opacity-90">
                  Unanswered questions will be marked as incorrect.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">
            Once submitted, you cannot change your answers. Are you sure?
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 sm:flex-row-reverse">
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-xl gap-2 shadow-sm shadow-primary/20"
          >
            {isSubmitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
              : 'Submit Exam'
            }
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
