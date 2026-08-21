"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/localized-link";
import { ArrowRight, FileText, SignpostBig, Target } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { EXAM_RULES } from "@/lib/constants";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

interface Step {
  number: string;
  href: string;
  icon: React.ElementType;
  iconWrap: string;
  iconTone: string;
  titleKey: string;
  descKey: string;
  ctaKey: string;
}

const OBSERVER_THRESHOLD = 0.2;
const STAGGER_MS = 120;
const HEADING_ID = "how-it-works-heading";

const STEP_BASES = [
  {
    number: "01",
    href: "/practice",
    icon: Target,
    iconWrap: "border-secondary/20 bg-secondary/10",
    iconTone: "text-secondary",
  },
  {
    number: "02",
    href: "/traffic-signs",
    icon: SignpostBig,
    iconWrap: "border-emerald-500/20 bg-emerald-500/10",
    iconTone: "text-emerald-600 dark:text-emerald-400",
  },
  {
    number: "03",
    href: "/exam",
    icon: FileText,
    iconWrap: "border-primary/20 bg-primary/10",
    iconTone: "text-primary",
  },
] as const;

function buildSteps(): Step[] {
  return STEP_BASES.map((step, index) => ({
    ...step,
    titleKey: `home.how.step${index + 1}_title`,
    descKey: `home.how.step${index + 1}_desc`,
    ctaKey: `home.how.step${index + 1}_cta`,
  }));
}

function StepArrow({ isRTL }: { isRTL: boolean }) {
  return (
    <ArrowRight
      aria-hidden
      className={[
        "h-4 w-4 transition-transform",
        isRTL
          ? "rotate-180 group-hover:-translate-x-0.5"
          : "group-hover:translate-x-0.5",
      ].join(" ")}
    />
  );
}

export function HowItWorksSection() {
  const { t, isRTL } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const hasTriggered = useRef(false);
  const [visible, setVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const steps = buildSteps();

  useEffect(() => {
    if (visible) return;

    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const element = sectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true;
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: OBSERVER_THRESHOLD },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [prefersReducedMotion, visible]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby={HEADING_ID}
      className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 py-16 lg:py-24"
    >
      <div className="pointer-events-none absolute -top-40 start-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="mb-10 text-center lg:mb-14">
          <span className="mb-4 inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-xs font-bold tracking-wide text-primary">
            3
          </span>

          <h2
            id={HEADING_ID}
            className="mb-3 text-balance text-2xl font-extrabold tracking-tight text-secondary md:text-3xl lg:text-4xl"
          >
            {t("home.how.title")}
          </h2>

          <p className="mx-auto max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            {t("home.how.subtitle")}
          </p>
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div
            aria-hidden
            className="pointer-events-none absolute start-[16.66%] end-[16.66%] top-10 hidden h-px bg-gradient-to-r from-secondary/30 via-primary/30 to-emerald-500/30 lg:block"
          />

          <div className="grid gap-5 lg:grid-cols-3 lg:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.number}
                  className={[
                    "group relative flex min-h-[19rem] flex-col rounded-2xl border bg-card p-6 shadow-sm",
                    "transition-all duration-500 ease-out hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg",
                    "lg:p-7",
                    visible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-6 opacity-0",
                  ].join(" ")}
                  style={{
                    transitionDelay: visible ? `${index * STAGGER_MS}ms` : "0ms",
                  }}
                >
                  <div className="mb-6 flex items-center justify-between">
                    <span className="text-sm font-black tracking-[0.2em] text-primary">
                      {step.number}
                    </span>

                    <span
                      className={[
                        "grid h-12 w-12 place-items-center rounded-2xl border bg-background shadow-sm",
                        step.iconWrap,
                      ].join(" ")}
                    >
                      <Icon
                        className={["h-5 w-5", step.iconTone].join(" ")}
                        aria-hidden
                      />
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="mb-2 text-xl font-bold tracking-tight text-secondary">
                      {t(step.titleKey)}
                    </h3>

                    <p className="text-sm font-medium leading-6 text-muted-foreground">
                      {t(step.descKey, {
                        questions: EXAM_RULES.TOTAL_QUESTIONS,
                        duration: t("exam.duration_value", {
                          minutes: EXAM_RULES.DURATION_WHOLE_MINUTES,
                          seconds: EXAM_RULES.DURATION_REMAINING_SECONDS,
                        }),
                      })}
                    </p>
                  </div>

                  <Link
                    href={step.href}
                    className="mt-6 inline-flex w-fit items-center gap-2 border-b border-primary/25 pb-1 text-sm font-bold text-primary transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {t(step.ctaKey)}
                    <StepArrow isRTL={isRTL} />
                  </Link>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-start scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
