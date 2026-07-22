"use client";

import Image from "next/image";
import { LoaderCircle } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

export function PageLoading({
  message,
  fullscreen = true,
  className,
}: {
  message?: string;
  fullscreen?: boolean;
  className?: string;
}) {
  const { t } = useLanguage();
  const label = message ?? t("common.loading");

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center bg-background px-4",
        fullscreen ? "min-h-screen" : "min-h-[18rem]",
        className,
      )}
      aria-busy="true"
    >
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-3 text-center"
      >
        <Image
          src="/icons/icon-192.png"
          alt=""
          aria-hidden="true"
          width={44}
          height={44}
          className="rounded-xl ring-1 ring-border/60"
        />
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm">
          <LoaderCircle
            aria-hidden="true"
            className="h-6 w-6 motion-safe:animate-spin"
          />
        </span>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
