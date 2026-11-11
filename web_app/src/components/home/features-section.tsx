"use client";

import Link from "@/components/localized-link";
import {
  ArrowRight,
  BarChart3,
  FileText,
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
  ctaStyle?: "primary" | "outline";
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
      ctaStyle: "primary",
    },
    {
      icon: BarChart3,
      iconWrap: "border-primary/20 bg-primary/10",
      iconTone: "text-primary",
      cta: t("home.features.cta_analytics"),
      title: t("home.features.analytics_title"),
      description: t("home.features.analytics_desc"),
      href: "/dashboard",
    },
  ];

  const features = primaryFeatures;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 py-14 sm:py-16 lg:py-20">
      <div className="pointer-events-none absolute -top-44 start-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="mb-10 text-center sm:mb-12">
          <h2 data-testid="home-features-heading" className="mx-auto max-w-3xl text-balance text-3xl font-black leading-tight tracking-tight text-secondary sm:text-4xl lg:max-w-[66.666667%]">
            {t("home.features.title")}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            {t("home.features.subtitle")}
          </p>
        </div>

        <div
          data-testid="home-features-grid"
          className="mx-auto grid auto-rows-fr gap-5 md:grid-cols-2 lg:w-[calc(66.666667%_-_9.333333px)] lg:gap-7"
        >
          {features.map((feature) => {
            const Icon = feature.icon;

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
                    "border-border hover:border-primary/25",
                  ].join(" ")}
                >
                  <CardHeader className="relative pb-2 pt-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={[
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm",
                          feature.iconWrap,
                        ].join(" ")}
                      >
                        <Icon
                          className={["h-4 w-4", feature.iconTone].join(" ")}
                          aria-hidden
                        />
                      </div>

                      <CardTitle className="min-w-0 text-lg font-bold leading-6 tracking-tight text-secondary sm:text-xl sm:leading-7">
                        {feature.title}
                      </CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent className="relative flex flex-1 flex-col pb-7 pt-1">
                    <p className="min-h-[4.5rem] text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                      {feature.description}
                    </p>

                    <span
                      data-testid="home-feature-cta"
                      className={[
                        "mt-auto inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-all",
                        feature.ctaStyle === "primary"
                          ? "bg-primary text-primary-foreground shadow-sm group-hover:bg-primary/90 group-hover:shadow-md"
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
      </div>
    </section>
  );
}
