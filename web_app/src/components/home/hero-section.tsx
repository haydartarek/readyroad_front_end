"use client";

import Link from "@/components/localized-link";
import { Gift, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/constants";

const TRUST_ITEMS = [
  { key: "trust_secure", Icon: Lock },
  { key: "trust_privacy", Icon: Shield },
  { key: "trust_free", Icon: Gift },
] as const;

const CTA_CLASS =
  "h-12 rounded-xl px-7 text-sm font-semibold shadow-none transition-all hover:-translate-y-0.5 active:translate-y-0";

function CtaSkeleton() {
  return (
    <>
      <div className="h-12 w-44 animate-pulse rounded-xl bg-muted" />
      <div className="h-12 w-40 animate-pulse rounded-xl bg-muted" />
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
      <Button size="lg" className={CTA_CLASS} asChild>
        <Link href="/register">{primary}</Link>
      </Button>

      <Button
        size="lg"
        variant="outline"
        className={`${CTA_CLASS} border-border bg-background text-foreground hover:bg-muted/50`}
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
      <Button size="lg" className={CTA_CLASS} asChild>
        <Link href={ROUTES.LESSONS}>{primary}</Link>
      </Button>

      <Button
        size="lg"
        variant="outline"
        className={`${CTA_CLASS} border-border bg-background text-foreground hover:bg-muted/50`}
        asChild
      >
        <Link href={ROUTES.EXAM}>{secondary}</Link>
      </Button>
    </>
  );
}

function PreviewOption({ selected = false, width }: { selected?: boolean; width: string }) {
  return (
    <div
      className={[
        "flex h-11 items-center gap-3 rounded-xl border px-3",
        selected
          ? "border-primary/35 bg-primary/[0.06]"
          : "border-border bg-background",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
          selected
            ? "border-primary bg-primary"
            : "border-muted-foreground/30 bg-background",
        ].join(" ")}
      >
        {selected ? (
          <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
        ) : null}
      </span>
      <span className="h-2 rounded-full bg-muted-foreground/20" style={{ width }} />
    </div>
  );
}

function ExamPreview() {
  return (
    <div className="mx-auto w-full max-w-[34rem]" aria-hidden="true">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_70px_hsl(var(--foreground)/0.08)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-foreground text-xs font-bold text-background">
              12
            </span>
            <div className="space-y-1.5">
              <div className="h-2.5 w-24 rounded-full bg-foreground/15" />
              <div className="h-2 w-14 rounded-full bg-muted" />
            </div>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">12 / 50</span>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[24%] rounded-full bg-primary" />
          </div>

          <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-[7rem_1fr] sm:items-center sm:p-5">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-xl border border-border bg-background sm:mx-0">
              <div className="grid h-16 w-16 place-items-center rounded-full border-[7px] border-rose-500">
                <div className="h-1.5 w-10 -rotate-45 rounded-full bg-rose-500" />
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="h-3 w-full rounded-full bg-foreground/75" />
              <div className="h-3 w-5/6 rounded-full bg-foreground/75" />
              <div className="h-2.5 w-3/5 rounded-full bg-muted-foreground/20" />
            </div>
          </div>

          <div className="grid gap-2.5">
            <PreviewOption width="58%" />
            <PreviewOption selected width="79%" />
            <PreviewOption width="67%" />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="h-2.5 w-24 rounded-full bg-muted" />
            <span className="h-10 w-28 rounded-xl bg-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const { t, isRTL } = useLanguage();
  const { isLoading, isAuthenticated } = useAuth();

  return (
    <section className="rv-section-compact border-b border-border/70 bg-background pt-8 sm:pt-10 lg:pt-14">
      <div className="rv-container">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-20">
          <div className="max-w-3xl">
            <h1
              className={[
                "max-w-3xl text-[clamp(2.55rem,5vw,4.75rem)] font-semibold leading-[1.02] text-foreground",
                isRTL ? "tracking-normal" : "tracking-[-0.045em]",
              ].join(" ")}
            >
              {t("home.hero.headline")}{" "}
              <span className="text-primary">{t("home.hero.headline_highlight")}</span>
            </h1>

            <p className="mt-6 max-w-2xl text-pretty text-base font-normal leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {t("home.hero.subtitle")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
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
              className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-5 text-sm text-muted-foreground"
              aria-label={t("home.hero.trust_indicators_label")}
            >
              {TRUST_ITEMS.map(({ key, Icon }) => (
                <span key={key} className="inline-flex items-center gap-2 font-medium">
                  <Icon className="h-4 w-4 text-foreground/70" aria-hidden />
                  {t(`home.hero.${key}`)}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>RijVia</span>
              <span>Category B</span>
            </div>
            <ExamPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
