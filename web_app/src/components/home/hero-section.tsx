"use client";

import Link from "@/components/localized-link";
import {
  Circle,
  Gift,
  Lock,
  Shield,} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/constants";

const TRUST_ICONS = [
  {
    key: "trust_secure",
    Icon: Lock,
    wrapClass: "border-secondary/20 bg-secondary/10",
    iconClass: "text-secondary",
  },
  {
    key: "trust_privacy",
    Icon: Shield,
    wrapClass: "border-primary/20 bg-primary/10",
    iconClass: "text-primary",
  },
  {
    key: "trust_free",
    Icon: Gift,
    wrapClass: "border-amber-500/20 bg-amber-500/10",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
] as const;

function CtaSkeleton() {
  return (
    <>
      <div className="h-12 w-44 animate-pulse rounded-full bg-muted" />
      <div className="h-12 w-40 animate-pulse rounded-full bg-muted" />
    </>
  );
}

function GuestCtas({
  primary,
  secondary,
}: {
  primary: string;
  secondary: string;
}) {
  return (
    <>
      <Button
        size="lg"
        className="h-12 rounded-full px-8 text-sm font-semibold shadow-sm ring-1 ring-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
        asChild
      >
        <Link href="/register">{primary}</Link>
      </Button>

      <Button
        size="lg"
        variant="outline"
        className="h-12 rounded-full border-border px-8 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:bg-muted/60 hover:shadow-sm active:translate-y-0"
        asChild
      >
        <Link href="/exam">{secondary}</Link>
      </Button>
    </>
  );
}

function MemberCtas({
  primary,
  secondary,
}: {
  primary: string;
  secondary: string;
}) {
  return (
    <>
      <Button
        size="lg"
        className="h-12 rounded-full px-8 text-sm font-semibold shadow-sm ring-1 ring-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
        asChild
      >
        <Link href={ROUTES.LESSONS}>{primary}</Link>
      </Button>

      <Button
        size="lg"
        variant="outline"
        className="h-12 rounded-full border-border px-8 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:bg-muted/60 hover:shadow-sm active:translate-y-0"
        asChild
      >
        <Link href={ROUTES.EXAM}>{secondary}</Link>
      </Button>
    </>
  );
}

function PreviewOption({
  selected = false,
  width,
}: {
  selected?: boolean;
  width: string;
}) {
  return (
    <div
      className={[
        "flex h-11 items-center gap-3 rounded-xl border px-3 transition-colors",
        selected
          ? "border-primary/40 bg-primary/10 shadow-sm"
          : "border-border bg-background",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
          selected
            ? "border-primary bg-primary"
            : "border-muted-foreground/40 bg-background",
        ].join(" ")}
      >
        {selected ? (
          <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
        ) : (
          <Circle className="h-2.5 w-2.5 text-transparent" />
        )}
      </span>

      <span
        className="h-2.5 rounded-full bg-muted-foreground/20"
        style={{ width }}
      />
    </div>
  );
}

function ExamPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-xl shadow-secondary/10 dark:border-slate-700 dark:bg-slate-950 sm:p-5">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/10 to-transparent" />

        <div className="relative space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-xs font-black text-secondary-foreground shadow-sm">
                12
              </span>

              <div className="space-y-1">
                <div className="h-2.5 w-20 rounded-full bg-secondary/20" />
                <div className="h-2 w-12 rounded-full bg-muted" />
              </div>
            </div>

            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">
              50
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[24%] rounded-full bg-primary" />
          </div>

          <div className="rounded-2xl border border-border/80 bg-slate-50 p-4 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-4 border-white bg-rose-500 shadow-sm ring-1 ring-rose-600/25 dark:border-slate-950">
                <div className="grid h-14 w-14 place-items-center rounded-full border-[6px] border-white bg-rose-500">
                  <div className="h-1.5 w-9 rotate-[-45deg] rounded-full bg-white" />
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-full rounded-full bg-secondary/85" />
                <div className="h-3 w-4/5 rounded-full bg-secondary/85" />
                <div className="h-2.5 w-3/5 rounded-full bg-muted-foreground/25" />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <PreviewOption width="60%" />
            <PreviewOption selected width="80%" />
            <PreviewOption width="68%" />
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-12 -end-12 h-36 w-36 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -top-16 -start-16 h-32 w-32 rounded-full bg-secondary/15 blur-3xl" />
      </div>

      <div className="pointer-events-none absolute -bottom-5 -start-5 -z-10 h-28 w-28 rounded-full bg-primary/15 blur-2xl" />
      <div className="pointer-events-none absolute -end-5 -top-5 -z-10 h-24 w-24 rounded-full bg-secondary/15 blur-2xl" />
    </div>
  );
}

export function HeroSection() {
  const { t } = useLanguage();
  const { isLoading, isAuthenticated } = useAuth();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30 pb-12 pt-6 lg:pb-20 lg:pt-10">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl border bg-card/70 p-7 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 lg:p-12 xl:p-14">
          <div className="pointer-events-none absolute -top-40 end-0 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl ltr:translate-x-24 rtl:-translate-x-24" />
          <div className="pointer-events-none absolute -bottom-40 start-0 h-[26rem] w-[26rem] rounded-full bg-secondary/10 blur-3xl ltr:-translate-x-20 rtl:translate-x-20" />

          <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="space-y-6 lg:space-y-7">
              <div className="space-y-3">
                <h1 className="text-balance text-4xl font-extrabold leading-[1.12] tracking-tight text-secondary sm:text-5xl lg:text-6xl">
                  {t("home.hero.headline")}{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10">
                      {t("home.hero.headline_highlight")}
                    </span>
                    <span
                      className="absolute inset-x-0 bottom-2 h-3 rounded-full bg-primary/20"
                      aria-hidden
                    />
                  </span>
                </h1>

                <p className="max-w-xl text-pretty text-sm font-medium leading-6 text-muted-foreground">
                  {t("home.hero.subtitle")}
                </p>

                <p className="max-w-xl text-pretty text-xs leading-5 text-muted-foreground/90">
                  {t("home.hero.privacy")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {isLoading ? (
                  <CtaSkeleton />
                ) : isAuthenticated ? (
                  <MemberCtas
                    primary={t("home.hero.cta_primary")}
                    secondary={t("home.hero.cta_secondary")}
                  />
                ) : (
                  <GuestCtas
                    primary={t("home.hero.cta_guest_primary")}
                    secondary={t("home.hero.cta_guest_secondary")}
                  />
                )}
              </div>

              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm font-medium leading-6 text-muted-foreground"
                aria-label={t("home.hero.trust_indicators_label")}
              >
                {TRUST_ICONS.map(({ key, Icon, wrapClass, iconClass }) => (
                  <span key={key} className="inline-flex items-center gap-2">
                    <span
                      className={[
                        "grid h-7 w-7 place-items-center rounded-full border shadow-sm",
                        wrapClass,
                      ].join(" ")}
                    >
                      <Icon
                        className={["h-3.5 w-3.5", iconClass].join(" ")}
                        aria-hidden
                      />
                    </span>
                    {t(`home.hero.${key}`)}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <ExamPreview />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-border/60" />
        </div>
      </div>
    </section>
  );
}


