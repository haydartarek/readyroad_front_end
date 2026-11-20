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
    <main className="min-h-screen min-w-0 max-w-full bg-[radial-gradient(circle_at_top_right,hsl(var(--brand-orange)/0.08),transparent_25%),radial-gradient(circle_at_bottom_left,hsl(var(--brand-navy)/0.08),transparent_28%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.35)_100%)]">
      <div className="flex min-h-screen min-w-0 max-w-full">
        {showcase}

        <section className="flex min-w-0 max-w-full flex-1 items-center justify-center px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-10 [@media(max-height:720px)]:py-2">
          <div className={cn("min-w-0 w-full max-w-full", maxWidthClassName)}>
            <div className="mb-3 flex min-w-0 w-full items-center justify-center gap-3 sm:mb-5 lg:hidden [@media(max-height:720px)]:mb-2">
              <div className="flex h-10 w-28 shrink-0 items-center justify-center [@media(max-height:720px)]:h-8">
                <Image src="/images/logo.png" alt={t("app.name")} width={112} height={40}
                  className="h-10 w-full object-contain dark:hidden" priority />
                <Image src="/images/logo-dark.png" alt={t("app.name")} width={112} height={40}
                  className="hidden h-10 w-full object-contain dark:block" priority />
              </div>
              <div className="min-w-0">
                <p className="break-words text-xs font-medium text-muted-foreground [overflow-wrap:anywhere]">
                  {t("auth.mobile_brand_caption")}
                </p>
              </div>
            </div>

            <div
              className={cn(
                "min-w-0 max-w-full rounded-[2rem] border border-border/60 bg-card/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8 [@media(max-height:720px)]:p-3",
                cardClassName,
              )}
            >
              <div className={cn("mb-8 min-w-0 space-y-2 [@media(max-height:720px)]:mb-3", headerClassName)}>
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

            {footer ? <div className="mt-3 sm:mt-5">{footer}</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
