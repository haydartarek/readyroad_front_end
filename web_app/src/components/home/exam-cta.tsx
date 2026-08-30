"use client";

import Link from "@/components/localized-link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/constants";

const PRIMARY_BUTTON_CLASS =
  "h-12 rounded-xl px-8 text-sm font-semibold shadow-sm ring-1 ring-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0";

function CtaSkeleton() {
  return <div className="mx-auto h-12 w-44 animate-pulse rounded-xl bg-secondary-foreground/10" />;
}

function PrimaryAction({
  href,
  label,
  isRTL,
}: {
  href: string;
  label: string;
  isRTL: boolean;
}) {
  return (
    <Button size="lg" className={PRIMARY_BUTTON_CLASS} asChild>
      <Link href={href} className="inline-flex items-center gap-2">
        {label}
        <ArrowRight
          aria-hidden
          className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`}
        />
      </Link>
    </Button>
  );
}

function SecondaryAction({
  href,
  label,
  isRTL,
}: {
  href: string;
  label: string;
  isRTL: boolean;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-semibold text-secondary-foreground/75 transition-colors hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
    >
      {label}
      <ArrowRight
        aria-hidden
        className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`}
      />
    </Link>
  );
}

export function ExamCta() {
  const { t, isRTL } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();

  const primaryHref = ROUTES.PRACTICE;
  const primaryLabel = t("home.quiz_cta.start_quiz");
  const secondaryHref = ROUTES.EXAM;
  const secondaryLabel = t("home.quiz_cta.take_exam");

  return (
    <section
      id="exam-cta"
      className="relative overflow-hidden bg-secondary py-16 lg:py-24"
    >
      <div className="pointer-events-none absolute -top-44 end-0 h-[34rem] w-[34rem] rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-44 start-0 h-[30rem] w-[30rem] rounded-full bg-primary/8 blur-3xl" />

      <div className="rv-container relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="relative overflow-hidden rounded-2xl border border-secondary-foreground/10 bg-secondary-foreground/5 px-6 py-10 shadow-sm md:px-10 md:py-12">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-secondary-foreground/10 via-transparent to-transparent" />

            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight text-secondary-foreground md:text-4xl lg:text-5xl">
                {t("home.quiz_cta.title")}
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-pretty text-base font-normal leading-relaxed text-secondary-foreground/70 sm:text-lg">
                {t("home.quiz_cta.subtitle")}
              </p>

              <div className="mt-8">
                {isLoading ? (
                  <CtaSkeleton />
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <PrimaryAction
                      href={primaryHref}
                      label={primaryLabel}
                      isRTL={isRTL}
                    />

                    <SecondaryAction
                      href={secondaryHref}
                      label={secondaryLabel}
                      isRTL={isRTL}
                    />

                    {!isAuthenticated && (
                      <p className="text-sm font-normal text-secondary-foreground/60">
                        {t("home.quiz_cta.login_hint")}{" "}
                        <Link
                          href={ROUTES.LOGIN}
                          className="font-semibold text-primary transition-colors hover:text-primary/85"
                        >
                          {t("home.quiz_cta.login_cta")}
                        </Link>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="pointer-events-none absolute -bottom-20 start-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
