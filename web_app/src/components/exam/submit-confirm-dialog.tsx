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
import { useLanguage } from '@/contexts/language-context';

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
  const { t } = useLanguage();
  const unansweredCount = totalQuestions - answeredCount;
  const allAnswered     = unansweredCount === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-black">{t('exam.submit.title')}</DialogTitle>
          <DialogDescription>
            {t('exam.submit.description', {
              answered: answeredCount,
              total: totalQuestions,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!allAnswered && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="space-y-1">
                <p className="font-semibold">
                  {unansweredCount === 1
                    ? t('exam.submit.unanswered_one')
                    : t('exam.submit.unanswered_many', { count: unansweredCount })}
                </p>
                <p className="text-xs opacity-90">
                  {t('exam.submit.unanswered_hint')}
                </p>
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">
            {t('exam.submit.warning')}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 sm:flex-row-reverse">
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-xl gap-2 shadow-sm shadow-primary/20"
          >
            {isSubmitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('exam.submit.submitting')}</>
              : t('exam.submit.confirm')
            }
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            {t('exam.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
