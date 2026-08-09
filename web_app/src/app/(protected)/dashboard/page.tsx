"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { ProgressOverviewCard } from "@/components/dashboard/progress-overview-card";
import { WeakAreasPreview } from "@/components/dashboard/weak-areas-preview";
import {
  getOverallProgress,
  getStudentIntelligence,
  getProgressByCategory,
  getRecentActivity,
  getWeakAreas,
} from "@/services";
import { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { StatusScreen } from "@/components/ui/status-screen";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  PageHeroDescription,
  PageHeroEyebrow,
  PageHeroSurface,
  PageHeroTitle,
  PageMetricCard,
} from "@/components/ui/page-surface";
import { cn } from "@/lib/utils";
import Link from "@/components/localized-link";
import {
  Trophy,
  Target,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  PenLine,
  Shield,
  Shuffle,
  Zap,
  CheckCircle,
  Clock3,
  AlertTriangle,
} from "lucide-react";
import type {
  CategoryProgressSummary,
  SignWeaknessSummary,
  StudentIntelligence,
} from "@/services/progressService";
import { QuickActionsSection } from "@/components/dashboard/quick-actions-section";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { WeakAreasPageContent } from "@/app/(protected)/analytics/weak-areas/page";
import { ErrorPatternsContent } from "@/app/(protected)/analytics/error-patterns/page";
import { ExamResultsPageContent } from "@/app/(protected)/exam/results/page";
import { ProfilePageContent } from "@/app/(protected)/profile/page";
import { StudentIntelligencePanel } from "@/components/dashboard/student-intelligence-panel";
import { localizedCategoryName } from "@/lib/student-intelligence-presentation";

// ─── Progress Tracker types (inline, no extra file) ──────────────────────────

interface CategoryProgressItem {
  categoryCode: string;
  categoryName: string;
  questionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
  trend: "improving" | "stable" | "declining" | "insufficient";
}

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

function TrendIcon({
  trend,
}: {
  trend: "improving" | "stable" | "declining" | "insufficient";
}) {
  if (trend === "improving")
    return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === "declining")
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
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

function GreetingHeader({
  name,
  subtitle,
}: {
  name: string;
  subtitle: string;
}) {
  const hour = new Date().getHours();
  const { t } = useLanguage();

  const greeting =
    hour < 12
      ? t("dashboard.greeting_morning")
      : hour < 17
        ? t("dashboard.greeting_afternoon")
        : t("dashboard.greeting_evening");

  return (
    <PageHeroSurface>
      <PageHeroEyebrow>{greeting}</PageHeroEyebrow>
      <PageHeroTitle>{name}!</PageHeroTitle>
      <PageHeroDescription>{subtitle}</PageHeroDescription>
    </PageHeroSurface>
  );
}

/** Strong categories widget (categories with >85% accuracy) */
function StrongAreasWidget({
  categories,
  t,
  language,
}: {
  categories: CategoryProgressSummary[];
  t: (key: string) => string;
  language: "en" | "nl" | "fr" | "ar";
}) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-secondary" />
        </div>
        <h3 className="font-black text-secondary">
          {t("dashboard.strong_areas")}
        </h3>
      </div>

      <div className="space-y-3">
        {categories.map((cat, idx) => {
          const accuracyNum =
            typeof cat.accuracy === "number"
              ? cat.accuracy
              : Number(cat.accuracy);
          return (
            <div
              key={cat.categoryCode ?? cat.categoryName ?? idx}
              className="flex flex-col gap-2 rounded-xl border border-green-100 bg-green-50/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                  <CheckCircle className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 break-words text-sm font-semibold text-foreground">
                  {localizedCategoryName(
                    cat,
                    language,
                    t("common.not_available"),
                  )}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
                <span className="text-xs text-muted-foreground">
                  {cat.attempted} {t("progress.questions_attempted")}
                </span>
                <span className="text-xs font-bold text-green-600">
                  {accuracyNum.toFixed(1)}%
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-500 text-white">
                  {t("dashboard.mastery_strong")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Compact category progress overview */
function CategoryProgressWidget({
  categories,
  t,
}: {
  categories: CategoryProgressItem[];
  t: (key: string) => string;
}) {
  const orderedCategories = [...categories].sort((a, b) => {
    if (a.accuracy !== b.accuracy) {
      return a.accuracy - b.accuracy;
    }
    return b.questionsAttempted - a.questionsAttempted;
  });

  if (orderedCategories.length === 0) return null;

  return (
    <div
      data-testid="category-progress-widget"
      className="min-w-0 max-w-full rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h3 className="break-words font-black text-secondary">
            {t("progress.badge")}
          </h3>
          <p className="break-words text-xs text-muted-foreground">
            {t("progress.subtitle")}
          </p>
        </div>
      </div>

      <div
        data-testid="category-progress-grid"
        className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
      >
        {orderedCategories.map((cat) => {
          const needsStudy = cat.accuracy < 70;

          return (
            <div
              key={cat.categoryCode}
              data-testid="category-progress-card"
              className="min-w-0 w-full max-w-full rounded-xl border border-border/40 bg-background/60 p-4 space-y-3"
            >
              <div
                data-testid="category-progress-header"
                className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-3"
              >
                <div className="min-w-0">
                  <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2">
                    <span
                      data-testid="category-progress-icon"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                    >
                      <BookOpen className="h-4 w-4" aria-hidden />
                    </span>
                    <p
                      data-testid="category-progress-name"
                      className="line-clamp-2 min-w-0 break-words text-sm font-bold leading-5 text-foreground"
                    >
                      {cat.categoryName}
                    </p>
                    <span
                      data-testid="category-progress-trend"
                      className="shrink-0"
                    >
                      <TrendIcon trend={cat.trend} />
                    </span>
                  </div>
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {cat.questionsAttempted} {t("progress.questions_attempted")}
                  </p>
                </div>

                <span
                  data-testid="category-progress-percentage"
                  className={cn(
                    "max-w-full shrink-0 justify-self-start whitespace-nowrap text-lg font-black sm:justify-self-auto",
                    cat.accuracy >= 80
                      ? "text-green-600"
                      : cat.accuracy >= 60
                        ? "text-orange-500"
                        : "text-destructive",
                  )}
                >
                  {cat.accuracy.toFixed(1)}%
                </span>
              </div>

              <div
                data-testid="category-progress-progress"
                className="min-w-0 max-w-full space-y-1.5"
              >
                <Progress
                  value={cat.accuracy}
                  className={cn(
                    "h-2 max-w-full",
                    cat.accuracy >= 80
                      ? "[&>div]:bg-green-500"
                      : cat.accuracy >= 60
                        ? "[&>div]:bg-orange-500"
                        : "[&>div]:bg-destructive",
                  )}
                />
                <div
                  data-testid="category-progress-counts"
                  className="flex min-w-0 flex-wrap justify-between gap-x-2 gap-y-1 text-xs text-muted-foreground"
                >
                  <span>
                    {cat.correctAnswers} {t("progress.correct")}
                  </span>
                  <span>
                    {cat.questionsAttempted - cat.correctAnswers}{" "}
                    {t("progress.wrong")}
                  </span>
                </div>
              </div>

              <div
                data-testid="category-progress-actions"
                className={cn(
                  "grid min-w-0 max-w-full grid-cols-1 gap-2",
                  needsStudy &&
                    "min-[360px]:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2",
                )}
              >
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="min-h-9 h-auto min-w-0 w-full gap-1 whitespace-normal rounded-full py-2 text-center transition-all hover:border-primary/30 hover:bg-primary/5 sm:h-9 sm:whitespace-nowrap sm:py-0"
                >
                  <Link href="/exam">
                    <PenLine className="w-3.5 h-3.5 shrink-0" />
                    {t("progress.practice")}
                  </Link>
                </Button>
                {needsStudy && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="min-h-9 h-auto min-w-0 w-full gap-1 whitespace-normal rounded-full py-2 text-center transition-all hover:border-primary/30 hover:bg-primary/5 sm:h-9 sm:whitespace-nowrap sm:py-0"
                  >
                    <Link href="/lessons">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      {t("progress.study")}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Sign quiz activity summary widget */
function SignActivityWidget({
  practiceCount,
  examCount,
  randomExamCount,
  randomPassedCount,
  passedCount,
  t,
}: {
  practiceCount: number;
  examCount: number;
  randomExamCount: number;
  randomPassedCount: number;
  passedCount: number;
  t: (key: string) => string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-black text-secondary">
          {t("dashboard.learning_activity_title")}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: t("dashboard.sign_practice_sessions"),
            value: practiceCount,
            color: "text-primary",
            bg: "bg-primary/10",
            icon: <PenLine className="w-4 h-4" />,
          },
          {
            label: t("dashboard.sign_exams_taken"),
            value: examCount,
            color: "text-secondary",
            bg: "bg-secondary/10",
            icon: <Zap className="w-4 h-4" />,
          },
          {
            label: t("dashboard.sign_random_exams_taken"),
            value: randomExamCount,
            color: "text-orange-600",
            bg: "bg-orange-100",
            icon: <Shuffle className="w-4 h-4" />,
          },
          {
            label: t("dashboard.sign_passed_signs"),
            value: passedCount,
            color: "text-green-600",
            bg: "bg-green-100",
            icon: <CheckCircle className="w-4 h-4" />,
          },
        ].map((item, i) => (
          <div
            key={i}
            data-testid="dashboard-stat-card"
            data-stat-kind="activity"
            className="flex min-w-0 flex-col items-center gap-1 rounded-xl border border-border/40 bg-background/60 p-3 text-center"
          >
            <div
              data-testid="dashboard-stat-icon"
              className={`order-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.bg} ${item.color}`}
            >
              {item.icon}
            </div>
            <p
              data-testid="dashboard-stat-label"
              className="order-2 min-w-0 max-w-full break-words text-xs leading-tight text-muted-foreground sm:order-3"
            >
              {item.label}
            </p>
            <p
              data-testid="dashboard-stat-value"
              className={`order-3 min-w-0 max-w-full break-words text-xl font-black sm:order-2 ${item.color}`}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/60 px-4 py-3 text-sm">
        <span className="font-medium text-foreground">
          {t("dashboard.sign_random_exams_passed")}
        </span>
        <span className="font-black text-orange-600">
          {randomPassedCount}/{randomExamCount}
        </span>
      </div>

      {practiceCount === 0 && examCount === 0 && randomExamCount === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {t("dashboard.sign_no_activity")}
          </p>
        )}
    </div>
  );
}

function WeakSignsWidget({
  weakSigns,
  t,
  language,
}: {
  weakSigns: SignWeaknessSummary[];
  t: (key: string) => string;
  language: string;
}) {
  if (!weakSigns || weakSigns.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
          <Target className="w-4 h-4 text-destructive" />
        </div>
        <div>
          <h3 className="font-black text-secondary">
            {t("dashboard.weak_signs_title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.weak_signs_desc")}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {weakSigns.map((sign, idx) => {
          const localizedName =
            language === "ar"
              ? sign.signNameAr
              : language === "nl"
                ? sign.signNameNl
                : language === "fr"
                  ? sign.signNameFr
                  : sign.signNameEn;

          return (
            <div
              key={`${sign.signCode}-${idx}`}
              className="rounded-xl border border-red-100 bg-red-50/40 px-3 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 break-words text-sm font-black text-foreground">
                  {localizedName ||
                    sign.signNameEn ||
                    t("common.not_available")}
                </p>
                <p className="text-sm font-black text-destructive">
                  {sign.accuracy.toFixed(1)}%
                </p>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {t("dashboard.weak_signs_attempts")}: {sign.attempted}
                </span>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs font-semibold"
                >
                  <Link
                    href={`/traffic-signs/${encodeURIComponent(sign.signCode)}`}
                  >
                    {t("dashboard.weak_signs_view_sign")}
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DashboardHome() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [progressData, setProgressData] =
    useState<DashboardProgressData | null>(emptyProgressData);
  const [strongAreas, setStrongAreas] = useState<CategoryProgressSummary[]>([]);
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
  const [categoryProgress, setCategoryProgress] = useState<
    CategoryProgressItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [studentIntelligence, setStudentIntelligence] =
    useState<StudentIntelligence | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  // Reset all dashboard state when the user changes (login / logout).
  // Without this, a previous user's data stays visible while the new
  // user's data is loading — or worse, after logout.
  const currentUserId = user?.userId ?? null;
  useEffect(() => {
    setProgressData(null);
    setStrongAreas([]);
    setWeakAreas([]);
    setRecentActivities([]);
    setCategoryProgress([]);
    setIsLoading(true);
    setServiceUnavailable(false);
    setLoadError(false);
    setStudentIntelligence(null);
  }, [currentUserId]);

  useEffect(() => {
    // Don't fetch if not authenticated (avoids leaking data between sessions)
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setServiceUnavailable(false);
        setLoadError(false);

        // Fetch all data in parallel
        const [
          progress,
          intelligence,
          weakAreasData,
          recentActivityData,
          categoryProgressResponse,
        ] = await Promise.all([
          getOverallProgress(),
          getStudentIntelligence(),
          getWeakAreas(language),
          getRecentActivity(5),
          getProgressByCategory(),
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

        setStrongAreas(progress.strongCategories);

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

        // Progress Tracker data
        const categories = categoryProgressResponse.categories ?? [];
        const categoryTrends = new Map(
          intelligence.learningPriorities.map((category) => [
            category.categoryCode,
            category.trend,
          ]),
        );
        setCategoryProgress(
          categories.map((cat) => ({
            categoryCode: cat.categoryCode,
            categoryName: localizedCategoryName(
              cat,
              language,
              t("common.not_available"),
            ),
            questionsAttempted: cat.questionsAttempted,
            correctAnswers: cat.correctAnswers,
            accuracy: cat.accuracyRate,
            trend:
              categoryTrends.get(cat.categoryCode) === "IMPROVING"
                ? "improving"
                : categoryTrends.get(cat.categoryCode) === "STABLE"
                  ? "stable"
                  : categoryTrends.get(cat.categoryCode) === "DECLINING"
                    ? "declining"
                    : "insufficient",
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
    // currentUserId is included so the effect re-runs when auth loads after mount
    // (user starts as null → effect bails out → user loads → re-runs with actual data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey, currentUserId, language]);

  const firstName = user?.firstName || user?.username || t("dashboard.learner");
  const representedCategoryCodes = new Set([
    ...weakAreas
      .map((area) => area.categoryCode)
      .filter((code): code is string => Boolean(code)),
    ...strongAreas
      .map((area) => area.categoryCode)
      .filter((code): code is string => Boolean(code)),
  ]);
  const remainingCategoryProgress = categoryProgress.filter(
    (category) => !representedCategoryCodes.has(category.categoryCode),
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-2 rounded-2xl border border-border/30 bg-muted/40 px-4 py-6 animate-pulse sm:px-6 sm:py-7">
          <div className="h-3 w-24 bg-muted rounded-full" />
          <div className="h-8 w-48 bg-muted rounded-full" />
          <div className="h-3 w-64 max-w-full bg-muted rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="h-40 bg-muted/40 animate-pulse rounded-2xl border border-border/30" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-muted/40 animate-pulse rounded-2xl border border-border/30" />
          <div className="h-64 bg-muted/40 animate-pulse rounded-2xl border border-border/30" />
        </div>
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

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Welcome Header */}
      <GreetingHeader
        name={`${t("dashboard.welcome_back")} ${firstName}`}
        subtitle={t("dashboard.subtitle")}
      />

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: <Trophy className="w-4 h-4" />,
            label: t("dashboard.stat_questions_done"),
            value: progressData.totalAttempted,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            icon: <Target className="w-4 h-4" />,
            label: t("analytics.stat_accuracy"),
            value: `${Math.round(progressData.averageScore)}%`,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            icon: <BookOpen className="w-4 h-4" />,
            label: t("dashboard.stat_lessons_read"),
            value: progressData.lessonsStartedCount,
            color: "text-secondary",
            bg: "bg-secondary/10",
          },
          {
            icon: <Clock3 className="w-4 h-4" />,
            label: t("dashboard.stat_incomplete_activity"),
            value: progressData.incompleteActivitiesCount,
            color: "text-primary",
            bg: "bg-primary/10",
          },
        ].map((stat, i) => (
          <PageMetricCard
            key={i}
            icon={<span className={stat.color}>{stat.icon}</span>}
            label={stat.label}
            value={stat.value}
            tone={stat.color === "text-secondary" ? "default" : "primary"}
            mobileStacked
          />
        ))}
      </div>

      {/* Recent Activity */}
      <RecentActivityList activities={recentActivities} />

      {/* Performance Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr,1fr] gap-6">
        <ProgressOverviewCard data={progressData} />
        <SignActivityWidget
          practiceCount={progressData.signPracticeCount}
          examCount={progressData.signExamCount}
          randomExamCount={progressData.signRandomExamCount}
          randomPassedCount={progressData.signRandomExamPassedCount}
          passedCount={progressData.signPassedCount}
          t={t}
        />
      </div>

      {/* Weak Areas & Category Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeakAreasPreview weakAreas={weakAreas} />
        <CategoryProgressWidget categories={remainingCategoryProgress} t={t} />
      </div>

      {progressData.weakSigns.length > 0 && (
        <WeakSignsWidget
          weakSigns={progressData.weakSigns}
          t={t}
          language={language}
        />
      )}

      {/* Strong Areas (only shown when user has ≥1 strong category) */}
      {strongAreas.length > 0 && (
        <StrongAreasWidget categories={strongAreas} t={t} language={language} />
      )}

      {/* Recommendations / Next Action */}
      <QuickActionsSection />
      <StudentIntelligencePanel data={studentIntelligence} />
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
