"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

// ─── Types ───────────────────────────────────────────────

interface ExitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStay: () => void;
  onLeave: () => void;
  context?: "exam" | "practice";
}

// ─── Component ───────────────────────────────────────────

export function ExitConfirmDialog({
  open,
  onOpenChange,
  onStay,
  onLeave,
  context = "exam",
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
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-black">
            {t(
              context === "practice"
                ? "practice.exit_title"
                : "exam.exit_title",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              context === "practice"
                ? "practice.exit_message"
                : "exam.exit_message",
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2 sm:flex-row-reverse">
          <Button onClick={handleStay} className="rounded-xl">
            {t(
              context === "practice" ? "practice.exit_stay" : "exam.exit_stay",
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleLeave}
            className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {t(
              context === "practice"
                ? "practice.exit_leave"
                : "exam.exit_leave",
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
