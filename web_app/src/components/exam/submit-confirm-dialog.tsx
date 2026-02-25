'use client';

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

interface SubmitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  answeredCount: number;
  totalQuestions: number;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function SubmitConfirmDialog({
  open,
  onOpenChange,
  answeredCount,
  totalQuestions,
  onConfirm,
  isSubmitting,
}: SubmitConfirmDialogProps) {
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Exam?</DialogTitle>
          <DialogDescription>
            You have answered {answeredCount}/{totalQuestions} questions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {unansweredCount > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <p className="font-semibold">⚠️ Warning</p>
                <p className="mt-1 text-sm">
                  {unansweredCount} question{unansweredCount > 1 ? 's are' : ' is'} unanswered.
                  Unanswered questions will be marked as incorrect.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">
            Once submitted, you cannot change your answers. Are you sure you want to submit?
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Exam'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
