"use client";

import Link from "@/components/localized-link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/constants";

const CTA_CLASS =
  "h-12 w-full rounded-xl px-7 text-sm font-bold shadow-none transition-all hover:-translate-y-0.5 active:translate-y-0 sm:w-auto";

function CtaSkeleton() {
  return (
    <>
      <div className="h-12 w-full animate-pulse rounded-xl bg-muted sm:w-44" />
      <div className="h-12 w-full animate-pulse rounded-xl bg-muted sm:w-40" />
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
        <Link href="/exam">{secondary}</Link>
      </Button>

      <Button
        size="lg"
        variant="outline"
        className={`${CTA_CLASS} border-border bg-background text-foreground hover:bg-muted/50`}
        asChild
      >
        <Link href="/register">{primary}</Link>
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
        <Link href={ROUTES.EXAM}>{secondary}</Link>
      </Button>

      <Button
        size="lg"
        variant="outline"
        className={`${CTA_CLASS} border-border bg-background text-foreground hover:bg-muted/50`}
        asChild
      >
        <Link href={ROUTES.LESSONS}>{primary}</Link>
      </Button>
    </>
  );
}

export function HeroSection() {
  const { t } = useLanguage();
  const { isLoading, isAuthenticated } = useAuth();

  const headline = t("home.hero.headline").replace(
    /^RijVia\s*\|\s*/i,
    "",
  );

  return (
    <section className="relative isolate overflow-hidden border-b border-border/60 bg-background py-12 sm:py-16 lg:py-20 xl:py-24">
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-primary/[0.07] blur-3xl sm:h-96 sm:w-96 lg:-left-32 lg:h-[30rem] lg:w-[30rem]" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/[0.06] blur-3xl sm:h-80 sm:w-80 lg:h-96 lg:w-96" />
        <div className="absolute bottom-6 left-[28%] h-36 w-36 rounded-full bg-primary/[0.045] blur-2xl sm:h-48 sm:w-48" />
      </div>

      <div className="rv-container">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <div
            dir="ltr"
            className="inline-flex items-baseline text-[clamp(4rem,10vw,8.5rem)] font-black leading-none tracking-[-0.065em] text-foreground"
          >
            <span className="text-primary">R</span>
            <span>ij</span>
            <span className="text-primary">V</span>
            <span>ia</span>
          </div>

          <h1 className="mt-6 max-w-4xl text-balance text-[clamp(2.1rem,5vw,4.35rem)] font-black leading-[1.08] tracking-normal text-foreground">
            {headline}{" "}
            <span className="text-primary">
              {t("home.hero.headline_highlight")}
            </span>
          </h1>

          <p className="mt-5 max-w-3xl text-pretty text-base font-normal leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">
            {t("home.hero.subtitle")}
          </p>

          <div className="mt-8 flex w-full max-w-xl flex-col justify-center gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
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
        </div>
      </div>
    </section>
  );
}