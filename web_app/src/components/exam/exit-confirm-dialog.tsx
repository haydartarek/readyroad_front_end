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

interface ExitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStay: () => void;
  onLeave: () => void;
}

export function ExitConfirmDialog({
  open,
  onOpenChange,
  onStay,
  onLeave,
}: ExitConfirmDialogProps) {
  const { t } = useLanguage();

  const handleStay = () => {
    onStay();
    onOpenChange(false);
  };

  const handleLeave = () => {
    onLeave();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('exam.exit_title')}</DialogTitle>
          <DialogDescription>
            {t('exam.exit_message')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleLeave}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {t('exam.exit_leave')}
          </Button>
          <Button onClick={handleStay}>
            {t('exam.exit_stay')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
