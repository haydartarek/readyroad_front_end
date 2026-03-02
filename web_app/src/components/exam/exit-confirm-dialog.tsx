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
import { useLanguage } from '@/contexts/language-context';

// ─── Types ───────────────────────────────────────────────

interface ExitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStay: () => void;
  onLeave: () => void;
}

// ─── Component ───────────────────────────────────────────

export function ExitConfirmDialog({
  open,
  onOpenChange,
  onStay,
  onLeave,
}: ExitConfirmDialogProps) {
  const { t } = useLanguage();

  const handleStay = () => { onStay();  onOpenChange(false); };
  const handleLeave = () => { onLeave(); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-black">{t('exam.exit_title')}</DialogTitle>
          <DialogDescription>{t('exam.exit_message')}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2 sm:flex-row-reverse">
          <Button onClick={handleStay} className="rounded-xl">
            {t('exam.exit_stay')}
          </Button>
          <Button
            variant="outline"
            onClick={handleLeave}
            className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {t('exam.exit_leave')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
