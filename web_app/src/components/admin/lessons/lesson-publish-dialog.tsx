"use client";

import {
  AlertTriangle,
  Loader2,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/language-context";

interface LessonPublishDialogProps {
  open: boolean;
  busy: boolean;
  revision: number;
  currentVersion: number;
  changeNote: string;
  error: string | null;
  direction: "rtl" | "ltr";
  onChangeNote: (
    value: string,
  ) => void;
  onOpenChange: (
    open: boolean,
  ) => void;
  onConfirm: () => void;
}

export default function LessonPublishDialog({
  open,
  busy,
  revision,
  currentVersion,
  changeNote,
  error,
  direction,
  onChangeNote,
  onOpenChange,
  onConfirm,
}: LessonPublishDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!busy) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent
        showCloseButton={!busy}
        dir={direction}
        className="w-[calc(100vw-2rem)] max-w-lg rounded-3xl border border-border/60 bg-card p-0 shadow-2xl"
      >
        <div className="p-6">
          <DialogHeader className="text-start">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Send className="h-5 w-5" />
              </span>

              <div className="min-w-0">
                <DialogTitle className="text-start text-lg font-black">
                  {t(
                    "admin.lessons.publish.title",
                  )}
                </DialogTitle>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    dir="ltr"
                    className="rounded-lg border border-border/60 bg-muted/30 px-2 py-1 text-xs font-bold"
                  >
                    R{revision}
                  </span>

                  <span
                    dir="ltr"
                    className="rounded-lg border border-border/60 bg-muted/30 px-2 py-1 text-xs font-bold"
                  >
                    V{currentVersion}
                    {"  "}
                    V{currentVersion + 1}
                  </span>
                </div>
              </div>
            </div>

            <DialogDescription className="pt-3 text-start leading-6">
              {t(
                "admin.lessons.publish.description",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-2">
            <label
              htmlFor="lesson-publish-change-note"
              className="text-sm font-bold"
            >
              {t(
                "admin.lessons.publish.change_note_label",
              )}
            </label>

            <textarea
              id="lesson-publish-change-note"
              value={changeNote}
              disabled={busy}
              dir="auto"
              onChange={(event) =>
                onChangeNote(
                  event.target.value,
                )
              }
              placeholder={t(
                "admin.lessons.publish.change_note_placeholder",
              )}
              className="min-h-24 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"
            />

            <p className="text-xs leading-5 text-muted-foreground">
              {t(
                "admin.lessons.publish.change_note_help",
              )}
            </p>
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />

              <p className="text-sm font-semibold leading-6 text-destructive">
                {error}
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() =>
                onOpenChange(false)
              }
            >
              {t(
                "admin.lessons.publish.cancel",
              )}
            </Button>

            <Button
              type="button"
              disabled={busy}
              className="gap-2"
              onClick={onConfirm}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}

              {busy
                ? t(
                    "admin.lessons.publish.publishing",
                  )
                : t(
                    "admin.lessons.publish.confirm",
                  )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
