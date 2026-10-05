"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";


import {
  getOverallProgress,
  getStudentIntelligence,
  getRecentActivity,
  getWeakAreas,
} from "@/services";
import { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { StatusScreen } from "@/components/ui/status-screen";
import { Button } from "@/components/ui/button";

import {
  PageHeroDescription,
  PageHeroEyebrow,
  PageHeroSurface,
  PageHeroTitle,
  PageSectionSurface,
} from "@/components/ui/page-surface";
import { cn } from "@/lib/utils";
import Link from "@/components/localized-link";
import {
  Trophy,
  Target,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  TimerOff,
} from "lucide-react";
import type {
  SignWeaknessSummary,
  StudentIntelligence,
  TheoryTimeoutAnalysis,
} from "@/services/progressService";

import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { WeakAreasPageContent } from "@/app/(protected)/analytics/weak-areas/page";
import { ErrorPatternsContent } from "@/app/(protected)/analytics/error-patterns/page";
import { ExamResultsPageContent } from "@/app/(protected)/exam/results/page";
import { ProfilePageContent } from "@/app/(protected)/profile/page";

import { localizedPriorityName } from "@/lib/student-intelligence-presentation";

import { AccountAccessCard } from "@/components/payment/account-access-card";

// ─── Progress Tracker types (inline, no extra file) ──────────────────────────

type DashboardSection =
  "overview" | "weak-areas" | "error-patterns" | "exam-results" | "profile";

interface DashboardActivityItem {
  id: string;
  type: "exam" | "practice" | "sign-exam";
  date: string;
  status?: "COMPLETED" | "IN_PROGRESS" | "EXPIRED" | "ABANDONED";
  score?: number;
  category?: string;
  signNameEn?: string;
  signNameNl?: string;
  signNameFr?: string;
  signNameAr?: string;
  passed?: boolean;
  questionsAnswered?: number;
  totalQuestions?: number;
  link?: string;
}

type DashboardProgressData = {
  totalExamsTaken: number;
  totalAttempted: number;
  averageScore: number;
  passRate: number;
  currentStreak: number;
  passedExams: number;
  failedExams: number;
  questionsRemaining: number;
  recommendedDifficulty: string;
  signPracticeCount: number;
  signExamCount: number;
  signPassedCount: number;
  signRandomExamCount: number;
  signRandomExamPassedCount: number;
  lessonsStartedCount: number;
  lessonsCompletedCount: number;
  incompleteActivitiesCount: number;
  activeTheoryExamCount: number;
  incompleteSignPracticeCount: number;
  activeRandomSignExamCount: number;
  weakSigns: SignWeaknessSummary[];
};

const emptyProgressData: DashboardProgressData | null = null;

function SkeletonCard() {
  return (
    <div className="h-32 bg-muted/60 animate-pulse rounded-2xl border border-border/30" />
  );
}

export function TheoryTimeoutWidget({
  analysis,
  t,
  language,
}: {
  analysis: TheoryTimeoutAnalysis;
  t: (key: string) => string;
  language: "en" | "nl" | "fr" | "ar";
}) {
  if (analysis.totalTimeouts === 0 || analysis.items.length === 0) return null;

  const localized = (
    item: TheoryTimeoutAnalysis["items"][number],
    prefix: "questionText" | "categoryName",
  ) => {
    const values = {
      en: item[`${prefix}En`],
      nl: item[`${prefix}Nl`],
      fr: item[`${prefix}Fr`],
      ar: item[`${prefix}Ar`],
    };
    return values[language] || values.en || Object.values(values).find(Boolean) || "";
  };

  return (
    <section
      data-testid="theory-timeout-analysis"
      className="space-y-4 rounded-2xl border border-amber-200/70 bg-card p-5 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <TimerOff className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="font-black text-foreground">
              {t("dashboard.theory_timeouts_title")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("dashboard.theory_timeouts_description")}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">
          {analysis.totalTimeouts} {t("dashboard.theory_timeouts_count")}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {analysis.items.map((item) => {
          const question = localized(item, "questionText");
          const category = localized(item, "categoryName");
          const occurredAt = new Intl.DateTimeFormat(
            `${language}-u-ca-gregory`,
            { dateStyle: "medium" },
          ).format(new Date(item.timedOutAt));
          return (
            <article
              key={`${item.examId}-${item.questionId}`}
              className="flex min-w-0 flex-col gap-3 rounded-xl border border-border/60 bg-background/75 p-4"
            >
              <div className="min-w-0 space-y-1">
                <p className="break-words text-sm font-bold leading-6 text-foreground">
                  {question}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[category, occurredAt].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-auto w-full">
                <Link href={item.reviewPath}>
                  {t("dashboard.theory_timeouts_review")}
                </Link>
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DashboardHome() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [progressData, setProgressData] =
    useState<DashboardProgressData | null>(emptyProgressData);
  const [weakAreas, setWeakAreas] = useState<
    {
      categoryCode?: string;
      category: string;
      accuracy: number;
      totalQuestions: number;
    }[]
  >([]);
  const [recentActivities, setRecentActivities] = useState<
    DashboardActivityItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [studentIntelligence, setStudentIntelligence] =
    useState<StudentIntelligence | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const currentUserId = user?.userId ?? null;

  useEffect(() => {
    setProgressData(null);
    setWeakAreas([]);
    setRecentActivities([]);
    setIsLoading(true);
    setServiceUnavailable(false);
    setLoadError(false);
    setStudentIntelligence(null);
  }, [currentUserId]);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setServiceUnavailable(false);
        setLoadError(false);

        const [
          progress,
          intelligence,
          weakAreasData,
          recentActivityData,
        ] = await Promise.all([
          getOverallProgress(),
          getStudentIntelligence(),
          getWeakAreas(language),
          getRecentActivity(5),
        ]);

        setStudentIntelligence(intelligence);

        setProgressData({
          totalExamsTaken: progress.totalExamsTaken,
          totalAttempted: progress.totalAttempted,
          averageScore: progress.overallAccuracy,
          passRate: progress.passRate,
          currentStreak: progress.studyStreak,
          passedExams: progress.passedExams,
          failedExams: progress.failedExams,
          questionsRemaining: progress.questionsRemaining,
          recommendedDifficulty: progress.recommendedDifficulty,
          signPracticeCount: progress.signPracticeCount,
          signExamCount: progress.signExamCount,
          signPassedCount: progress.signPassedCount,
          signRandomExamCount: progress.signRandomExamCount,
          signRandomExamPassedCount: progress.signRandomExamPassedCount,
          lessonsStartedCount: progress.lessonsStartedCount,
          lessonsCompletedCount: progress.lessonsCompletedCount,
          incompleteActivitiesCount: progress.incompleteActivitiesCount,
          activeTheoryExamCount: progress.activeTheoryExamCount,
          incompleteSignPracticeCount: progress.incompleteSignPracticeCount,
          activeRandomSignExamCount: progress.activeRandomSignExamCount,
          weakSigns: progress.weakSigns,
        });

        const areas = weakAreasData.weakAreas;

        setWeakAreas(
          areas.map((area) => ({
            categoryCode: area.categoryCode,
            category: area.categoryName,
            accuracy: area.accuracy,
            totalQuestions: area.totalCount,
          })),
        );

        setRecentActivities(
          recentActivityData.map((activity) => ({
            id: String(activity.id),
            type:
              String(activity.type).toLowerCase() === "practice"
                ? "practice"
                : String(activity.type).toLowerCase() === "sign-exam"
                  ? "sign-exam"
                  : "exam",
            date: activity.date,
            status: activity.status,
            score: activity.score,
            category: activity.category,
            signNameEn: activity.signNameEn,
            signNameNl: activity.signNameNl,
            signNameFr: activity.signNameFr,
            signNameAr: activity.signNameAr,
            passed: activity.passed,
            questionsAnswered: activity.questionsAnswered,
            totalQuestions: activity.totalQuestions,
            link: activity.link,
          })),
        );
      } catch (error) {
        logApiError("Failed to fetch dashboard data", error);

        if (isServiceUnavailable(error)) {
          setServiceUnavailable(true);
        } else {
          setLoadError(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey, currentUserId, language]);

  const firstName =
    user?.firstName ||
    user?.username ||
    t("dashboard.learner");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)]">
          <div className="h-72 animate-pulse rounded-2xl border border-border/30 bg-muted/40" />
          <div className="h-72 animate-pulse rounded-2xl border border-border/30 bg-muted/40" />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
          <div className="h-64 animate-pulse rounded-2xl border border-border/30 bg-muted/40" />
          <div className="h-64 animate-pulse rounded-2xl border border-border/30 bg-muted/40" />
        </div>

        <div className="h-56 animate-pulse rounded-2xl border border-border/30 bg-muted/40" />
      </div>
    );
  }

  if (serviceUnavailable) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-6">
        <ServiceUnavailableBanner
          onRetry={() => setFetchKey((key) => key + 1)}
          className="max-w-lg"
        />
      </div>
    );
  }

  if (loadError) {
    return (
      <StatusScreen
        badge={t("common.error_badge")}
        title={t("common.error_title")}
        description={t("common.error_desc")}
        icon={<AlertTriangle className="h-9 w-9" />}
        dir={language === "ar" ? "rtl" : "ltr"}
        fullscreen={false}
        primaryAction={{
          label: t("common.retry"),
          onClick: () => setFetchKey((key) => key + 1),
        }}
        secondaryAction={{
          label: t("common.go_home"),
          href: "/",
        }}
      />
    );
  }

  if (!progressData || !studentIntelligence) {
    return (
      <StatusScreen
        badge={t("common.error_badge")}
        title={t("common.error_title")}
        description={t("common.error_desc")}
        icon={<AlertTriangle className="h-9 w-9" />}
        dir={language === "ar" ? "rtl" : "ltr"}
        fullscreen={false}
        primaryAction={{
          label: t("common.retry"),
          onClick: () => setFetchKey((key) => key + 1),
        }}
        secondaryAction={{
          label: t("common.go_home"),
          href: "/",
        }}
      />
    );
  }

  const readiness =
    studentIntelligence.examReadinessScore === null
      ? null
      : Math.max(
          0,
          Math.min(
            100,
            Math.round(studentIntelligence.examReadinessScore),
          ),
        );

  const passProbability =
    studentIntelligence.estimatedPassProbability === null
      ? null
      : Math.max(
          0,
          Math.min(
            100,
            Math.round(studentIntelligence.estimatedPassProbability),
          ),
        );

  const topPriority =
    studentIntelligence.learningPriorities[0] ?? null;

  const topRecommendation =
    studentIntelligence.recommendations[0] ?? null;

  const fallbackWeakArea =
    weakAreas[0] ?? null;

  const priorityName =
    topPriority
      ? localizedPriorityName(topPriority, language)
      : "";

  const focusName =
    priorityName ||
    fallbackWeakArea?.category ||
    t("common.not_available");

  const focusAccuracy =
    topPriority?.accuracy ??
    fallbackWeakArea?.accuracy ??
    null;

  const focusCategoryCode =
    topPriority?.categoryCode ??
    fallbackWeakArea?.categoryCode ??
    null;

  const focusActionPath =
    focusCategoryCode
      ? `/practice/${focusCategoryCode}`
      : topRecommendation?.actionPath || "/practice";

  const hasFocusEvidence =
    Boolean(topPriority || fallbackWeakArea);

  const heroInsight =
    hasFocusEvidence && focusAccuracy !== null
      ? t("student_intelligence.top_priority", {
          category: focusName,
          accuracy: Math.round(focusAccuracy),
        })
      : t("dashboard.subtitle");

  const recommendationText =
    topRecommendation
      ? t(topRecommendation.key, {
          category: focusName,
        })
      : heroInsight;

  const focusCtaLabel =
    focusCategoryCode
      ? t("dashboard.v2_focus_cta")
      : topRecommendation
        ? t(topRecommendation.key, {
            category: focusName,
          })
        : t("dashboard.action_practice_title");

  const recentScores =
    studentIntelligence.examAnalytics.recentScores
      .slice(0, 6)
      .reverse()
      .map((score) =>
        Math.max(
          0,
          Math.min(
            100,
            Number(score) || 0,
          ),
        ),
      );

  const readinessLabel =
    readiness === null
      ? t("common.not_available")
      : `${readiness}%`;

  const passProbabilityLabel =
    passProbability === null
      ? t("common.not_available")
      : `${passProbability}%`;

  const levelLabel =
    t(
      `student_intelligence.level.${studentIntelligence.studentLevel.toLowerCase()}`,
    );

  const trendLabel =
    t(
      `student_intelligence.trend.${studentIntelligence.overallLearningTrend.toLowerCase()}`,
    );

  const metrics = [
    {
      label: t("dashboard.stat_questions_done"),
      value: progressData.totalAttempted,
      icon: BookOpen,
      tone: "primary",
    },
    {
      label: t("analytics.stat_accuracy"),
      value: `${Math.round(progressData.averageScore)}%`,
      icon: Target,
      tone: "primary",
    },
    {
      label: t("student_intelligence.exam.total"),
      value: progressData.totalExamsTaken,
      icon: Trophy,
      tone: "secondary",
    },
    {
      label: t("dashboard.lessons_completed"),
      value: progressData.lessonsCompletedCount,
      icon: CheckCircle,
      tone: "secondary",
    },
  ] as const;

  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8"
    >
      {/* Primary status area */}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="break-words text-lg font-black text-foreground">
            {t("dashboard.welcome_back")} {firstName}
          </p>
        </div>

        <AccountAccessCard compact />
      </div>

      <PageHeroSurface>
        <PageHeroEyebrow>
          {t("student_intelligence.title")}
        </PageHeroEyebrow>

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <PageHeroTitle>
              {t("student_intelligence.readiness")}
            </PageHeroTitle>

            <PageHeroDescription className="mt-2 max-w-3xl">
              {heroInsight}
            </PageHeroDescription>

            <div className="mt-5 flex min-w-0 flex-wrap items-end gap-3">
              <span className="text-4xl font-black tracking-tight text-primary sm:text-5xl">
                {readinessLabel}
              </span>

              <span className="pb-1 text-sm font-semibold text-muted-foreground">
                {levelLabel} · {trendLabel}
              </span>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{
                  width: `${readiness ?? 0}%`,
                }}
              />
            </div>
          </div>

          <div className="min-w-[150px] rounded-2xl border border-secondary/15 bg-secondary/[0.05] p-4">
            <p className="text-xs font-semibold text-muted-foreground">
              {t("student_intelligence.pass_probability")}
            </p>

            <p className="mt-1 text-2xl font-black text-secondary">
              {passProbabilityLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/exam">
              {t("dashboard.v2_exam_cta")}
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Link href={focusActionPath}>
              {focusCtaLabel}
            </Link>
          </Button>
        </div>
      </PageHeroSurface>

      {/* Four key metrics */}
      <section
        aria-label={t("progress.badge")}
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const isPrimary = metric.tone === "primary";

          return (
            <div
              key={metric.label}
              className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    isPrimary
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary/10 text-secondary",
                  )}
                >
                  <Icon
                    className="h-4.5 w-4.5"
                    aria-hidden
                  />
                </span>

                <div className="min-w-0">
                  <p className="break-words text-xs font-semibold text-muted-foreground">
                    {metric.label}
                  </p>

                  <p
                    className={cn(
                      "mt-0.5 break-words text-xl font-black",
                      isPrimary
                        ? "text-primary"
                        : "text-secondary",
                    )}
                  >
                    {metric.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* One trend area + one next-focus area */}
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <PageSectionSurface
          title={t("student_intelligence.exam_history")}
          description={t("student_intelligence.exam.score_trend")}
        >
          {recentScores.length === 0 ? (
            <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 text-center text-sm text-muted-foreground">
              {t("common.not_available")}
            </div>
          ) : (
            <div
              dir="ltr"
              className="flex h-48 min-w-0 items-end gap-2 rounded-2xl border border-border/60 bg-background/70 px-3 pb-3 pt-4 sm:gap-3 sm:px-4"
            >
              {recentScores.map((score, index) => {
                const isLatest =
                  index === recentScores.length - 1;

                return (
                  <div
                    key={`${index}-${score}`}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    title={`${Math.round(score)}%`}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-bold sm:text-xs",
                        isLatest
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {Math.round(score)}%
                    </span>

                    <div className="flex h-28 w-full items-end overflow-hidden rounded-lg bg-muted/50 p-1">
                      <div
                        className={cn(
                          "w-full rounded-md transition-[height] duration-500",
                          isLatest
                            ? "bg-primary"
                            : "bg-secondary/30",
                        )}
                        style={{
                          height: `${Math.max(6, score)}%`,
                        }}
                      />
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-semibold",
                        isLatest
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      #{index + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </PageSectionSurface>

        <PageSectionSurface
          title={t("student_intelligence.next_steps")}
          description={t("analytics.weak_areas")}
        >
          <div className="space-y-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Target
                  className="h-4.5 w-4.5"
                  aria-hidden
                />
              </span>

              <div className="min-w-0">
                <p className="break-words text-base font-black text-foreground">
                  {focusName}
                </p>

                {focusAccuracy !== null ? (
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {t("analytics.stat_accuracy")}:{" "}
                    {Math.round(focusAccuracy)}%
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("common.not_available")}
                  </p>
                )}
              </div>
            </div>

            <p className="rounded-xl bg-muted/40 px-3 py-3 text-sm leading-6 text-muted-foreground">
              {recommendationText}
            </p>

            <div className="border-t border-border/60 pt-4">
              <Button asChild className="w-full">
                <Link href={focusActionPath}>
                  {focusCtaLabel}
                </Link>
              </Button>
            </div>
          </div>
        </PageSectionSurface>
      </div>

      {/* History is intentionally last in the reading flow */}
      <RecentActivityList
        activities={recentActivities.slice(0, 3)}
      />
    </div>
  );
}
function DashboardSectionNav({
  activeSection,
}: {
  activeSection: DashboardSection;
}) {
  const { t } = useLanguage();

  const sections: Array<{
    section: DashboardSection;
    label: string;
    href: string;
  }> = [
    { section: "overview", label: t("nav.dashboard"), href: "/dashboard" },
    {
      section: "weak-areas",
      label: t("analytics.weak_areas"),
      href: "/dashboard?section=weak-areas",
    },
    {
      section: "error-patterns",
      label: t("analytics.error_patterns"),
      href: "/dashboard?section=error-patterns",
    },
    {
      section: "exam-results",
      label: t("user_sidebar.exam_results"),
      href: "/dashboard?section=exam-results",
    },
    {
      section: "profile",
      label: t("nav.profile"),
      href: "/dashboard?section=profile",
    },
  ];

  return (
    <div className="px-6 pt-6 lg:hidden">
      <div className="flex flex-wrap gap-2">
        {sections.map((item) => (
          <Button
            key={item.section}
            asChild
            size="sm"
            variant={activeSection === item.section ? "default" : "outline"}
            className="rounded-full"
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}

function DashboardSectionContent() {
  const searchParams = useSearchParams();
  const requestedSection = searchParams.get("section");

  const activeSection: DashboardSection =
    requestedSection === "weak-areas" ||
    requestedSection === "error-patterns" ||
    requestedSection === "exam-results" ||
    requestedSection === "profile"
      ? requestedSection
      : "overview";

  return (
    <div className="space-y-6">
      <DashboardSectionNav activeSection={activeSection} />

      {activeSection === "overview" && <DashboardHome />}
      {activeSection === "weak-areas" && (
        <div className="px-6 pb-6">
          <WeakAreasPageContent />
        </div>
      )}
      {activeSection === "error-patterns" && (
        <div className="px-6 pb-6">
          <ErrorPatternsContent />
        </div>
      )}
      {activeSection === "exam-results" && (
        <div className="px-6 pb-6">
          <ExamResultsPageContent />
        </div>
      )}
      {activeSection === "profile" && (
        <div className="px-6 pb-6">
          <ProfilePageContent embedded />
        </div>
      )}
    </div>
  );
}

function DashboardLoadingFallback() {
  const { t } = useLanguage();

  return (
    <div className="p-6 text-sm text-muted-foreground">
      {t("dashboard.loading")}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <DashboardSectionContent />
    </Suspense>
  );
}
