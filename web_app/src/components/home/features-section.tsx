"use client";

import Link from "@/components/localized-link";
import {
  FileText,
  Target,
  BarChart3,
  SignpostBig,
  BookOpen,
  Languages,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { EXAM_RULES } from "@/lib/constants";

interface FeatureItem {
  icon: React.ElementType;
  iconWrap: string;
  iconTone: string;
  cta: string;
  title: string;
  description: string;
  isPrimary: boolean;
  href: string;
}

export function FeaturesSection() {
  const { t, isRTL } = useLanguage();

  const features: FeatureItem[] = [
    {
      icon: FileText,
      iconWrap: "border-primary/20 bg-primary/10 ring-1 ring-primary/10",
      iconTone: "text-primary",
      cta: t("home.features.cta_exam"),
      title: t("home.features.exam_title"),
      description: t("home.features.exam_desc", {
        questions: EXAM_RULES.TOTAL_QUESTIONS,
        minutes: EXAM_RULES.DURATION_MINUTES,
      }),
      isPrimary: false,
      href: "/exam",
    },
    {
      icon: Target,
      iconWrap: "border-secondary/20 bg-secondary/10 ring-1 ring-secondary/10",
      iconTone: "text-secondary",
      cta: t("home.features.cta_practice"),
      title: t("home.features.practice_title"),
      description: t("home.features.practice_desc"),
      isPrimary: true,
      href: "/practice",
    },
    {
      icon: BarChart3,
      iconWrap: "border-sky-500/20 bg-sky-500/10 ring-1 ring-sky-500/10",
      iconTone: "text-sky-600 dark:text-sky-400",
      cta: t("home.features.cta_analytics"),
      title: t("home.features.analytics_title"),
      description: t("home.features.analytics_desc"),
      isPrimary: false,
      href: "/dashboard",
    },
    {
      icon: SignpostBig,
      iconWrap:
        "border-emerald-500/20 bg-emerald-500/10 ring-1 ring-emerald-500/10",
      iconTone: "text-emerald-600 dark:text-emerald-400",
      cta: t("home.features.cta_signs"),
      title: t("home.features.signs_title"),
      description: t("home.features.signs_desc"),
      isPrimary: false,
      href: "/traffic-signs",
    },
    {
      icon: BookOpen,
      iconWrap: "border-amber-500/20 bg-amber-500/10 ring-1 ring-amber-500/10",
      iconTone: "text-amber-600 dark:text-amber-400",
      cta: t("home.features.cta_lessons"),
      title: t("home.features.lessons_title"),
      description: t("home.features.lessons_desc"),
      isPrimary: false,
      href: "/lessons",
    },
    {
      icon: Languages,
      iconWrap: "border-teal-500/20 bg-teal-500/10 ring-1 ring-teal-500/10",
      iconTone: "text-teal-600 dark:text-teal-400",
      cta: t("home.features.cta_language"),
      title: t("home.features.multilingual_title"),
      description: t("home.features.multilingual_desc"),
      isPrimary: false,
      href: "#footer-lang",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 py-16 lg:py-24">
      <div className="pointer-events-none absolute -top-44 start-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="container relative mx-auto px-4">
        <div className="mb-12 text-center lg:mb-16">
          <h2 className="mb-4 text-balance text-3xl font-extrabold tracking-tight text-secondary md:text-4xl lg:text-5xl">
            {t("home.features.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("home.features.subtitle")}
          </p>
        </div>

        <div
          data-testid="home-features-grid"
          className="grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-7"
        >
          {features.map((feature) => {
            const Icon = feature.icon;

            const cardBase =
              "group relative overflow-hidden rounded-3xl border bg-card/80 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md";

            const cardPrimary =
              "border-primary/20 ring-1 ring-primary/15 hover:ring-primary/25";

            const cardDefault = "border-border hover:border-primary/20";

            return (
              <Link
                key={feature.title}
                href={feature.href}
                prefetch={false}
                data-testid="home-feature-link"
                aria-label={`${feature.cta}: ${feature.title}`}
                className="group block h-full min-w-0 rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                <Card
                  data-testid="home-feature-card"
                  className={`${cardBase} h-full ${feature.isPrimary ? cardPrimary : cardDefault}`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/35 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-border/60" />

                  <CardHeader className="pb-0 pt-6">
                    <div
                      className={[
                        "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border bg-background/60 shadow-sm",
                        "transition-transform duration-200 group-hover:scale-[1.03]",
                        feature.isPrimary
                          ? "shadow-sm shadow-primary/10"
                          : "border-border/80",
                        feature.iconWrap,
                      ].join(" ")}
                    >
                      <Icon
                        className={["h-5 w-5", feature.iconTone].join(" ")}
                        aria-hidden
                      />
                    </div>

                    <CardTitle className="text-base font-semibold tracking-tight text-secondary sm:text-lg">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col pb-7 pt-0">
                    <p className="flex-1 text-sm font-medium leading-6 text-muted-foreground">
                      {feature.description}
                    </p>

                    <div className="mt-6 border-t border-border/60 pt-5">
                      <span
                        data-testid="home-feature-cta"
                        className={buttonVariants({
                          variant: feature.isPrimary ? "default" : "outline",
                          className:
                            "h-11 w-full gap-2 rounded-xl font-bold shadow-sm group-hover:shadow-md",
                        })}
                      >
                        {feature.cta}
                        <ArrowRight
                          aria-hidden
                          className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`}
                        />
                      </span>
                    </div>
                  </CardContent>

                  {feature.isPrimary && (
                    <>
                      <div className="pointer-events-none absolute -bottom-12 -end-12 h-48 w-48 rounded-full bg-primary/12 blur-3xl" />
                      <div className="pointer-events-none absolute -top-10 -start-10 h-36 w-36 rounded-full bg-secondary/10 blur-3xl" />
                    </>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
