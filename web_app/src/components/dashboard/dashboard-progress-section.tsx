"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";



import { ErrorPatternsContent } from "@/app/(protected)/analytics/error-patterns/page";
import { WeakAreasPageContent } from "@/app/(protected)/analytics/weak-areas/page";

import { Button } from "@/components/ui/button";
import {
  PageHeroDescription,
  PageHeroEyebrow,
  PageHeroSurface,
  PageHeroTitle,
  PageMetricCard,
  PageSectionSurface,
} from "@/components/ui/page-surface";
import {
  BookOpen,
  CheckCircle,
  Target,
  Trophy,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { isServiceUnavailable, logApiError } from "@/lib/api";
import {
  getOverallProgress,
  getProgressByCategory,
  getStudentIntelligence,
  getTheoryQuestionCoverage,
  getTheoryTimeoutAnalysis,
  type CategoryProgress,
  type OverallProgress,
  type ProgressByCategory,
  type SignWeaknessSummary,
  type StudentIntelligence,
  type TheoryQuestionCoverage,
  type TheoryTimeoutAnalysis,
} from "@/services/progressService";



const HERO_METRIC_ICONS = [
  Target,
  Trophy,
  CheckCircle,
  BookOpen,
] as const;

type LegacyProgressSection = "weak-areas" | "error-patterns" | null;
type DeepAnalysisSection = Exclude<LegacyProgressSection, null>;

interface DashboardProgressSectionProps {
  legacySection: LegacyProgressSection;
}

function clampPercentage(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function formatPercent(value: number | null | undefined, unavailable: string): string {
  return typeof value === "number" && Number.isFinite(value)
    ? `${Math.round(value)}%`
    : unavailable;
}

function formatSeconds(value: number | null | undefined, unavailable: string): string {
  return typeof value === "number" && Number.isFinite(value)
    ? `${Math.round(value)} s`
    : unavailable;
}

function formatSecondsDelta(value: number | null | undefined, unavailable: string): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return unavailable;
  }

  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded} s`;
}

function localizedText(
  language: string,
  values: {
    en?: string | null;
    nl?: string | null;
    fr?: string | null;
    ar?: string | null;
  },
  fallback: string,
): string {
  const localized =
    language === "ar"
      ? values.ar
      : language === "nl"
        ? values.nl
        : language === "fr"
          ? values.fr
          : values.en;

  return localized ?? values.en ?? values.nl ?? values.fr ?? values.ar ?? fallback;
}

function categoryName(category: CategoryProgress, language: string): string {
  return localizedText(
    language,
    {
      en: category.categoryNameEn,
      nl: category.categoryNameNl,
      fr: category.categoryNameFr,
      ar: category.categoryNameAr,
    },
    category.categoryName || category.categoryCode,
  );
}

function weakSignName(sign: SignWeaknessSummary, language: string): string {
  return localizedText(
    language,
    {
      en: sign.signNameEn,
      nl: sign.signNameNl,
      fr: sign.signNameFr,
      ar: sign.signNameAr,
    },
    sign.signCode,
  );
}

function timeoutQuestion(
  item: TheoryTimeoutAnalysis["items"][number],
  language: string,
): string {
  return localizedText(
    language,
    {
      en: item.questionTextEn,
      nl: item.questionTextNl,
      fr: item.questionTextFr,
      ar: item.questionTextAr,
    },
    `#${item.questionId}`,
  );
}

function timeoutCategory(
  item: TheoryTimeoutAnalysis["items"][number],
  language: string,
): string {
  return localizedText(
    language,
    {
      en: item.categoryNameEn,
      nl: item.categoryNameNl,
      fr: item.categoryNameFr,
      ar: item.categoryNameAr,
    },
    item.categoryCode ?? "",
  );
}

function TimingMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 border-b border-border/60 py-3">
      <p className="text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tracking-normal text-foreground">
        {value}
      </p>
    </div>
  );
}

export function DashboardProgressSection({
  legacySection,
}: DashboardProgressSectionProps) {
  const { t, language } = useLanguage();

  const [overall, setOverall] = useState<OverallProgress | null>(null);
  const [intelligence, setIntelligence] = useState<StudentIntelligence | null>(null);
  const [categories, setCategories] = useState<ProgressByCategory | null>(null);
  const [coverage, setCoverage] = useState<TheoryQuestionCoverage | null>(null);
  const [timeouts, setTimeouts] = useState<TheoryTimeoutAnalysis | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<"service" | "generic" | null>(null);
  const [fetchKey, setFetchKey] = useState(0);
  const [analysisSection, setAnalysisSection] =
    useState<DeepAnalysisSection | null>(legacySection);

  useEffect(() => {
    setAnalysisSection(legacySection);
  }, [legacySection]);

  useEffect(() => {
    let active = true;

    const fetchProgress = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [overallData, intelligenceData, categoryData, coverageData, timeoutData] =
          await Promise.all([
            getOverallProgress(),
            getStudentIntelligence(),
            getProgressByCategory(),
            getTheoryQuestionCoverage(language),
            getTheoryTimeoutAnalysis(5),
          ]);

        if (!active) return;

        setOverall(overallData);
        setIntelligence(intelligenceData);
        setCategories(categoryData);
        setCoverage(coverageData);
        setTimeouts(timeoutData);
      } catch (error) {
        logApiError("Failed to load dashboard progress", error);

        if (!active) return;

        setLoadError(isServiceUnavailable(error) ? "service" : "generic");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchProgress();

    return () => {
      active = false;
    };
  }, [fetchKey, language]);

  const unavailable = t("dashboard.progress_v2.unavailable");

  const heroMetrics = useMemo(() => {
    const noData = intelligence?.dataStatus === "NO_DATA";

    return [
      {
        label: t("dashboard.progress_v2.weekly"),
        value: noData
          ? unavailable
          : formatPercent(intelligence?.weeklyProgress, unavailable),
      },
      {
        label: t("dashboard.progress_v2.monthly"),
        value: noData
          ? unavailable
          : formatPercent(intelligence?.monthlyProgress, unavailable),
      },
      {
        label: t("dashboard.progress_v2.consistency"),
        value: noData
          ? unavailable
          : formatPercent(intelligence?.learningConsistencyScore, unavailable),
      },
      {
        label: t("dashboard.progress_v2.retention"),
        value: noData
          ? unavailable
          : formatPercent(intelligence?.knowledgeRetentionScore, unavailable),
      },
    ];
  }, [intelligence, t, unavailable]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        {t("dashboard.progress_v2.loading")}
      </div>
    );
  }

  if (loadError || !overall || !intelligence || !categories || !coverage || !timeouts) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-bold text-foreground">
          {loadError === "service"
            ? t("dashboard.progress_v2.service_unavailable")
            : t("dashboard.progress_v2.load_error")}
        </h2>
        <button
          type="button"
          onClick={() => setFetchKey((value) => value + 1)}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90"
        >
          {t("dashboard.progress_v2.retry")}
        </button>
      </div>
    );
  }

  const timing = intelligence.timingAnalytics;

  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      className="space-y-6"
    >
      <PageHeroSurface contentClassName="space-y-4 px-6 py-6 sm:px-8">
        <div className="max-w-3xl space-y-2">
          <PageHeroEyebrow>
            {t("dashboard.progress_v2.nav")}
          </PageHeroEyebrow>

          <PageHeroTitle>
            {t("dashboard.progress_v2.title")}
          </PageHeroTitle>

          <PageHeroDescription>
            {t("dashboard.progress_v2.description")}
          </PageHeroDescription>
        </div>
      </PageHeroSurface>

      <section
        aria-label={t("dashboard.progress_v2.nav")}
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {heroMetrics.map((metric, index) => {
          const Icon =
            HERO_METRIC_ICONS[index] ??
            Target;

          return (
            <PageMetricCard
              key={metric.label}
              icon={<Icon className="h-4 w-4" aria-hidden />}
              label={metric.label}
              value={metric.value}
              mobileStacked
              className="bg-card/90"
            />
          );
        })}
      </section>

      <PageSectionSurface
        title={t("dashboard.progress_v2.categories_title")}
        description={t("dashboard.progress_v2.categories_description")}
        contentClassName="space-y-0"
      >
        <div className="grid gap-y-4 border-b border-border/60 pb-4 sm:grid-cols-3 sm:gap-x-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">
              {t("dashboard.theory_coverage.coverage")}
            </p>
            <p
              dir="ltr"
              className="mt-1 text-xl font-bold text-foreground"
            >
              {formatPercent(coverage.coveragePercentage, unavailable)}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">
              {t("dashboard.theory_coverage.accuracy")}
            </p>
            <p
              dir="ltr"
              className="mt-1 text-xl font-bold text-foreground"
            >
              {formatPercent(coverage.accuracyPercentage, unavailable)}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">
              {t("dashboard.theory_coverage.confidence")}
            </p>
            <p className="mt-1 text-xl font-bold text-foreground">
              {t(
                `dashboard.theory_coverage.confidence_${coverage.confidenceState.toLowerCase()}`,
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-x-6 md:grid-cols-2">
          {coverage.categories.map((coverageCategory) => {
            const progressCategory = categories.categories.find(
              (category) =>
                category.categoryCode === coverageCategory.categoryCode,
            );

            const displayName = progressCategory
              ? categoryName(progressCategory, language)
              : coverageCategory.categoryName;

            const accuracy =
              progressCategory?.accuracyRate ??
              coverageCategory.accuracyPercentage;

            const attempts =
              progressCategory?.questionsAttempted ??
              coverageCategory.timesAnswered;

            const coveragePercent = clampPercentage(
              coverageCategory.coveragePercentage ?? 0,
            );

            return (
              <div
                key={coverageCategory.categoryCode}
                className="min-w-0 border-b border-border/60 py-3.5"
              >
                <div className="min-w-0">
                  <h3 className="min-w-0 text-sm font-semibold">
                    <Link
                      href={`/practice/${coverageCategory.categoryCode}`}
                      className="break-words text-foreground transition-colors hover:text-primary hover:underline hover:underline-offset-4 focus-visible:text-primary focus-visible:outline-none"
                    >
                      {displayName}
                    </Link>
                  </h3>

                  <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      {t("dashboard.theory_coverage.accuracy")}:{" "}
                      <strong
                        dir="ltr"
                        className="font-semibold text-foreground"
                      >
                        {formatPercent(accuracy, unavailable)}
                      </strong>
                    </span>

                    <span>
                      {t("dashboard.theory_coverage.coverage")}:{" "}
                      <strong
                        dir="ltr"
                        className="font-semibold text-primary"
                      >
                        {formatPercent(
                          coverageCategory.coveragePercentage,
                          unavailable,
                        )}
                      </strong>
                    </span>

                    <span>
                      {t("dashboard.progress_v2.questions_attempted")}:{" "}
                      <strong
                        dir="ltr"
                        className="font-semibold text-foreground"
                      >
                        {attempts}
                      </strong>
                    </span>
                  </div>
                </div>

                <div
                  className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${coveragePercent}%`,
                    }}
                  />
                </div>


              </div>
            );
          })}
        </div>
      </PageSectionSurface>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <PageSectionSurface
          title={t("dashboard.progress_v2.timing_title")}
          description={t("dashboard.progress_v2.timing_description")}
          contentClassName="space-y-0"
        >
          <div className="grid grid-cols-2 gap-x-6">
            <TimingMetric
              label={t(
                "dashboard.progress_v2.average_answer_time",
              )}
              value={formatSeconds(
                timing.averageAnswerTimeSeconds,
                unavailable,
              )}
            />

            <TimingMetric
              label={t(
                "dashboard.progress_v2.answer_time_trend",
              )}
              value={formatSecondsDelta(
                timing.answerTimeTrendSeconds,
                unavailable,
              )}
            />

            <TimingMetric
              label={t(
                "dashboard.progress_v2.exam_time_trend",
              )}
              value={formatSecondsDelta(
                timing.examTimeTrendSeconds,
                unavailable,
              )}
            />

            <TimingMetric
              label={t("dashboard.progress_v2.samples")}
              value={
                timing.answerTimingScope === "UNAVAILABLE"
                  ? unavailable
                  : String(timing.answerTimingSamples)
              }
            />
          </div>
        </PageSectionSurface>

        <PageSectionSurface
          title={t("dashboard.progress_v2.weak_signs_title")}
          description={t(
            "dashboard.progress_v2.weak_signs_description",
          )}
          contentClassName="space-y-0"
        >
          {overall.weakSigns.length === 0 ? (
            <p className="rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
              {t("dashboard.progress_v2.no_weak_signs")}
            </p>
          ) : (
            <div className="divide-y divide-border/60">
              {overall.weakSigns.map((sign) => (
                <div
                  key={sign.signCode}
                  className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-foreground">
                      {weakSignName(sign, language)}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(
                        "dashboard.progress_v2.questions_attempted",
                      )}:{" "}
                      {sign.attempted}
                      {" \u00B7 "}
                      {t(
                        "dashboard.progress_v2.wrong_answers",
                      )}:{" "}
                      {sign.wrongAnswers}
                    </p>
                  </div>

                  <strong
                    dir="ltr"
                    className="text-sm font-semibold text-foreground"
                  >
                    {Math.round(sign.accuracy)}%
                  </strong>
                </div>
              ))}
            </div>
          )}
        </PageSectionSurface>
      </div>

      {timeouts.items.length > 0 ? (
        <PageSectionSurface
          title={t("dashboard.progress_v2.timeout_title")}
          description={t(
            "dashboard.progress_v2.timeout_description",
          )}
          className="border-amber-500/30"
          contentClassName="space-y-0"
        >
          <div className="divide-y divide-border/60">
            {timeouts.items.map((item) => (
              <div
                key={`${item.examId}-${item.questionId}-${item.timedOutAt}`}
                className="flex min-w-0 flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-foreground">
                    {timeoutQuestion(item, language)}
                  </p>

                  {timeoutCategory(item, language) ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {timeoutCategory(item, language)}
                    </p>
                  ) : null}
                </div>

                <Button
                  asChild
                  variant="outline"
                  className="w-full shrink-0 sm:w-auto"
                >
                  <Link href={item.reviewPath}>
                    {t("dashboard.progress_v2.review")}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </PageSectionSurface>
      ) : null}


      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={analysisSection === "weak-areas" ? "default" : "outline"}
            aria-pressed={analysisSection === "weak-areas"}
            onClick={() =>
              setAnalysisSection((current) =>
                current === "weak-areas" ? null : "weak-areas",
              )
            }
          >
            {t("analytics.weak_areas")}
          </Button>

          <Button
            type="button"
            variant={analysisSection === "error-patterns" ? "default" : "outline"}
            aria-pressed={analysisSection === "error-patterns"}
            onClick={() =>
              setAnalysisSection((current) =>
                current === "error-patterns" ? null : "error-patterns",
              )
            }
          >
            {t("analytics.error_patterns")}
          </Button>
        </div>

        {analysisSection ? (
          <div className="min-w-0">
            {analysisSection === "weak-areas" ? (
              <WeakAreasPageContent embedded />
            ) : (
              <ErrorPatternsContent embedded />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
