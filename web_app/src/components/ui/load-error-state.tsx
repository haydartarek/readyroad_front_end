"use client";

import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

export function LoadErrorState({
  message,
  onRetry,
  secondaryAction,
  fullscreen = true,
  className,
}: {
  message?: string;
  onRetry: () => void;
  secondaryAction?: ReactNode;
  fullscreen?: boolean;
  className?: string;
}) {
  const { t } = useLanguage();

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center px-6 py-12",
        fullscreen ? "min-h-screen" : "min-h-[20rem]",
        className,
      )}
    >
      <div
        role="alert"
        className="w-full max-w-lg rounded-2xl border border-destructive/25 bg-destructive/5 p-6 text-center"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle aria-hidden="true" className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-xl font-bold text-foreground">
          {t("common.error_title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {message ?? t("common.load_error")}
        </p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={onRetry}>
            {t("common.retry")}
          </Button>
          {secondaryAction}
        </div>
      </div>
    </div>
  );
}
