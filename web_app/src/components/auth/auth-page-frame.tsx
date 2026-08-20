"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

export function AuthPageFrame({
  showcase,
  title,
  subtitle,
  children,
  footer,
  maxWidthClassName = "max-w-lg",
  cardClassName,
  headerClassName,
}: {
  showcase: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
  cardClassName?: string;
  headerClassName?: string;
}) {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen min-w-0 max-w-full bg-[radial-gradient(circle_at_top_right,rgba(223,88,48,0.08),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(28,48,67,0.08),transparent_28%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.35)_100%)]">
      <div className="flex min-h-screen min-w-0 max-w-full">
        {showcase}

        <section className="flex min-w-0 max-w-full flex-1 items-center justify-center px-5 py-10 sm:px-6 lg:px-10">
          <div className={cn("min-w-0 w-full max-w-full", maxWidthClassName)}>
            <div className="mb-8 flex min-w-0 w-full items-center justify-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background ring-2 ring-primary/20 shadow-sm">
                <Image
                  src="/icons/icon-192.png"
                  alt=""
                  aria-hidden="true"
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                  priority
                />
              </div>
              <div className="min-w-0">
                <p className="break-words text-xl font-black tracking-normal [overflow-wrap:anywhere]">
                  {t("app.name")}
                </p>
                <p className="break-words text-xs font-medium text-muted-foreground [overflow-wrap:anywhere]">
                  {t("auth.mobile_brand_caption")}
                </p>
              </div>
            </div>

            <div
              className={cn(
                "min-w-0 max-w-full rounded-[2rem] border border-border/60 bg-card/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8",
                cardClassName,
              )}
            >
              <div className={cn("mb-8 min-w-0 space-y-2", headerClassName)}>
                <h1 className="break-words text-2xl font-black tracking-normal text-foreground [overflow-wrap:anywhere] sm:text-3xl">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="max-w-md break-words text-sm font-medium leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                    {subtitle}
                  </p>
                ) : null}
              </div>
              {children}
            </div>

            {footer ? <div className="mt-5">{footer}</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
