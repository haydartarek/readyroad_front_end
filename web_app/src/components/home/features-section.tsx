"use client";

import Link from "@/components/localized-link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  FileText,
  Languages,
  SignpostBig,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { EXAM_RULES } from "@/lib/constants";

interface FeatureItem {
  icon: React.ElementType;
  iconWrap: string;
  iconTone: string;
  cta: string;
  title: string;
  description: string;
  href: string;
  emphasis?: "primary" | "secondary";
}

function FeatureArrow({ isRTL }: { isRTL: boolean }) {
  return (
    <ArrowRight
      aria-hidden
      className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${
        isRTL ? "rotate-180 group-hover:-translate-x-0.5" : ""
      }`}
    />
  );
}

export function FeaturesSection() {
  const { t, isRTL } = useLanguage();

  const primaryFeatures: FeatureItem[] = [
    {
      icon: FileText,
      iconWrap: "border-primary/20 bg-primary/10",
      iconTone: "text-primary",
      cta: t("home.features.cta_exam"),
      title: t("home.features.exam_title"),
      description: t("home.features.exam_desc", {
        questions: EXAM_RULES.TOTAL_QUESTIONS,
        duration: t("exam.duration_value", {
          minutes: EXAM_RULES.DURATION_WHOLE_MINUTES,
          seconds: EXAM_RULES.DURATION_REMAINING_SECONDS,
        }),
      }),
      href: "/exam",
    },
    {
      icon: Target,
      iconWrap: "border-secondary/20 bg-secondary/10",
      iconTone: "text-secondary",
      cta: t("home.features.cta_practice"),
      title: t("home.features.practice_title"),
      description: t("home.features.practice_desc"),
      href: "/practice",
      emphasis: "primary",
    },
    {
      icon: BarChart3,
      iconWrap: "border-sky-500/20 bg-sky-500/10",
      iconTone: "text-sky-600 dark:text-sky-400",
      cta: t("home.features.cta_analytics"),
      title: t("home.features.analytics_title"),
      description: t("home.features.analytics_desc"),
      href: "/dashboard",
    },
  ];

  const supportingFeatures: FeatureItem[] = [
    {
      icon: SignpostBig,
      iconWrap: "border-emerald-500/20 bg-emerald-500/10",
      iconTone: "text-emerald-600 dark:text-emerald-400",
      cta: t("home.features.cta_signs"),
      title: t("home.features.signs_title"),
      description: t("home.features.signs_desc"),
      href: "/traffic-signs",
    },
    {
      icon: BookOpen,
      iconWrap: "border-amber-500/20 bg-amber-500/10",
      iconTone: "text-amber-600 dark:text-amber-400",
      cta: t("home.features.cta_lessons"),
      title: t("home.features.lessons_title"),
      description: t("home.features.lessons_desc"),
      href: "/lessons",
    },
    {
      icon: Languages,
      iconWrap: "border-teal-500/20 bg-teal-500/10",
      iconTone: "text-teal-600 dark:text-teal-400",
      cta: t("home.features.cta_language"),
      title: t("home.features.multilingual_title"),
      description: t("home.features.multilingual_desc"),
      href: "#footer-lang",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 py-16 lg:py-24">
      <div className="pointer-events-none absolute -top-44 start-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="mb-10 text-center lg:mb-14">
          <h2 className="mb-4 text-balance text-3xl font-extrabold tracking-tight text-secondary md:text-4xl lg:text-5xl">
            {t("home.features.title")}
          </h2>

          <p className="mx-auto max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("home.features.subtitle")}
          </p>
        </div>

        <div
          data-testid="home-features-grid"
          className="grid gap-5 lg:grid-cols-3 lg:gap-7"
        >
          {primaryFeatures.map((feature) => {
            const Icon = feature.icon;
            const isPrimary = feature.emphasis === "primary";

            return (
              <Link
                key={feature.title}
                href={feature.href}
                prefetch={false}
                data-testid="home-feature-link"
                aria-label={`${feature.cta}: ${feature.title}`}
                className="group block min-w-0 rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                <Card
                  data-testid="home-feature-card"
                  className={[
                    "relative h-full overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200",
                    "hover:-translate-y-1 hover:shadow-lg",
                    isPrimary
                      ? "border-primary/25 ring-1 ring-primary/15"
                      : "border-border hover:border-primary/25",
                  ].join(" ")}
                >
                  {isPrimary && (
                    <>
                      <div className="pointer-events-none absolute -end-16 -top-16 h-44 w-44 rounded-full bg-primary/12 blur-3xl" />
                      <div className="pointer-events-none absolute -bottom-20 -start-16 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />
                    </>
                  )}

                  <CardHeader className="relative pb-2 pt-7">
                    <div
                      className={[
                        "mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm",
                        feature.iconWrap,
                      ].join(" ")}
                    >
                      <Icon
                        className={["h-5 w-5", feature.iconTone].join(" ")}
                        aria-hidden
                      />
                    </div>

                    <CardTitle className="text-xl font-bold tracking-tight text-secondary">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="relative flex flex-col pb-7 pt-1">
                    <p className="min-h-[4.5rem] text-sm font-medium leading-6 text-muted-foreground">
                      {feature.description}
                    </p>

                    <span
                      className={[
                        "mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-all",
                        isPrimary
                          ? "bg-primary text-primary-foreground shadow-sm group-hover:shadow-md"
                          : "border border-border bg-background text-secondary group-hover:border-primary/25 group-hover:bg-primary/5",
                      ].join(" ")}
                    >
                      {feature.cta}
                      <FeatureArrow isRTL={isRTL} />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="my-8 h-px bg-border/70 lg:my-10" />

        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {supportingFeatures.map((feature) => {
            const Icon = feature.icon;

            return (
              <Link
                key={feature.title}
                href={feature.href}
                prefetch={false}
                aria-label={`${feature.cta}: ${feature.title}`}
                className="group min-w-0 rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                <article className="flex h-full items-start gap-4 rounded-2xl border bg-card/65 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-md">
                  <span
                    className={[
                      "grid h-11 w-11 shrink-0 place-items-center rounded-xl border bg-background shadow-sm",
                      feature.iconWrap,
                    ].join(" ")}
                  >
                    <Icon
                      className={["h-5 w-5", feature.iconTone].join(" ")}
                      aria-hidden
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold tracking-tight text-secondary">
                      {feature.title}
                    </span>

                    <span className="mt-1.5 block text-sm leading-5 text-muted-foreground">
                      {feature.description}
                    </span>

                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary">
                      {feature.cta}
                      <FeatureArrow isRTL={isRTL} />
                    </span>
                  </span>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
