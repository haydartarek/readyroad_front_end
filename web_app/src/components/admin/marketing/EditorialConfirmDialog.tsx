"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditorialConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  direction?: "rtl" | "ltr";
  destructive?: boolean;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function EditorialConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  direction = "ltr",
  destructive = false,
  busy = false,
  onOpenChange,
  onConfirm,
}: EditorialConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!busy) onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        showCloseButton={false}
        dir={direction}
        className="w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-3xl border border-border/60 bg-card p-0 shadow-2xl"
      >
        <div className="bg-gradient-to-b from-primary/[0.08] to-transparent p-6">
          <DialogHeader className="text-start">
            <div className="mb-1 flex items-center gap-3">
              <span
                className={
                  destructive
                    ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
                    : "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                }
              >
                <AlertTriangle className="h-5 w-5" />
              </span>

              <DialogTitle className="text-start text-lg font-black">
                {title}
              </DialogTitle>
            </div>

            <DialogDescription className="pt-2 text-start text-sm leading-6">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>

            <Button
              type="button"
              variant={destructive ? "destructive" : "default"}
              disabled={busy}
              onClick={onConfirm}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
