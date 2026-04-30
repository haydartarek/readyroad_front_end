"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { ProgressOverviewCard } from "@/components/dashboard/progress-overview-card";
import { WeakAreasPreview } from "@/components/dashboard/weak-areas-preview";
import {
  getOverallProgress,
  getProgressByCategory,
  getRecentActivity,
  getWeakAreas,
} from "@/services";
import { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import Link from "next/link";
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
} from "lucide-react";
import type {
  CategoryProgressSummary,
  SignWeaknessSummary,
} from "@/services/progressService";
import { QuickActionsSection } from "@/components/dashboard/quick-actions-section";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { WeakAreasPageContent } from "@/app/(protected)/analytics/weak-areas/page";
import { ErrorPatternsContent } from "@/app/(protected)/analytics/error-patterns/page";
import { ExamResultsPageContent } from "@/app/(protected)/exam/results/page";
import { ProfilePageContent } from "@/app/(protected)/profile/page";

// ─── Progress Tracker types (inline, no extra file) ──────────────────────────

interface CategoryProgressItem {
  categoryCode: string;
  categoryName: string;
  questionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
  trend: "improving" | "stable" | "declining";
}

type DashboardSection =
  | "overview"
  | "weak-areas"
  | "error-patterns"
  | "exam-results"
  | "profile";

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

function TrendIcon({ trend }: { trend: "improving" | "stable" | "declining" }) {
  if (trend === "improving")
    return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === "declining")
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

const defaultProgressData = {
  totalExamsTaken: 0,
  totalAttempted: 0,
  averageScore: 0,
  passRate: 0,
  currentStreak: 0,
  passedExams: 0,
  failedExams: 0,
  questionsRemaining: 500,
  recommendedDifficulty: "EASY" as string,
  signPracticeCount: 0,
  signExamCount: 0,
  signPassedCount: 0,
  signRandomExamCount: 0,
  signRandomExamPassedCount: 0,
  lessonsStartedCount: 0,
  lessonsCompletedCount: 0,
  incompleteActivitiesCount: 0,
  activeTheoryExamCount: 0,
  incompleteSignPracticeCount: 0,
  activeRandomSignExamCount: 0,
  weakSigns: [] as SignWeaknessSummary[],
};

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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15 px-6 py-7 shadow-sm">
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="relative space-y-1">
        <p className="text-sm font-medium text-primary">{greeting}</p>
        <h1 className="text-3xl font-black tracking-tight">{name}!</h1>
        <p className="text-muted-foreground text-sm font-medium">{subtitle}</p>
      </div>
    </div>
  );
}

/** Strong categories widget (categories with >85% accuracy) */
function StrongAreasWidget({
  categories,
  t,
}: {
  categories: CategoryProgressSummary[];
  t: (key: string) => string;
}) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-4">
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
              className="flex items-center justify-between gap-3 rounded-xl border border-green-100 bg-green-50/40 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-green-100 text-xs font-black text-green-700 flex-shrink-0">
                  {cat.categoryCode ?? idx + 1}
                </span>
                <span className="text-sm font-semibold text-foreground truncate">
                  {cat.categoryName}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">
                  {cat.attempted} q
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

  if (orderedCategories.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto text-4xl">
          📊
        </div>
        <div>
          <p className="font-bold text-lg">
            {t("progress.no_categories_title")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("progress.no_categories_desc")}
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-full px-6">
          <Link href="/practice">{t("progress.start_practicing")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-black text-secondary">{t("progress.badge")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("progress.subtitle")}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {orderedCategories.map((cat) => (
          <div
            key={cat.categoryCode}
            className="rounded-xl border border-border/40 bg-background/60 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-muted px-2 text-xs font-black text-muted-foreground">
                    {cat.categoryCode}
                  </span>
                  <p className="truncate text-sm font-bold text-foreground">
                    {cat.categoryName}
                  </p>
                  <TrendIcon trend={cat.trend} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {cat.questionsAttempted} {t("progress.questions_attempted")}
                </p>
              </div>

              <span
                className={cn(
                  "text-lg font-black",
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

            <div className="space-y-1.5">
              <Progress
                value={cat.accuracy}
                className={cn(
                  "h-2",
                  cat.accuracy >= 80
                    ? "[&>div]:bg-green-500"
                    : cat.accuracy >= 60
                      ? "[&>div]:bg-orange-500"
                      : "[&>div]:bg-destructive",
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {cat.correctAnswers} {t("progress.correct")}
                </span>
                <span>
                  {cat.questionsAttempted - cat.correctAnswers}{" "}
                  {t("progress.wrong")}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex-1 gap-1 rounded-full hover:bg-primary/5 hover:border-primary/30 transition-all"
              >
                <Link href={`/practice/${cat.categoryCode}`}>
                  <PenLine className="w-3.5 h-3.5" />
                  {t("progress.practice")}
                </Link>
              </Button>
              {cat.accuracy < 70 && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex-1 gap-1 rounded-full hover:bg-primary/5 hover:border-primary/30 transition-all"
                >
                  <Link href={`/lessons?category=${cat.categoryCode}`}>
                    <BookOpen className="w-3.5 h-3.5" />
                    {t("progress.study")}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ))}
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
  lessonsStartedCount,
  lessonsCompletedCount,
  incompleteActivitiesCount,
  t,
}: {
  practiceCount: number;
  examCount: number;
  randomExamCount: number;
  randomPassedCount: number;
  passedCount: number;
  lessonsStartedCount: number;
  lessonsCompletedCount: number;
  incompleteActivitiesCount: number;
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

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
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
          {
            label: t("dashboard.lessons_completed"),
            value: lessonsCompletedCount,
            color: "text-secondary",
            bg: "bg-secondary/10",
            icon: <BookOpen className="w-4 h-4" />,
          },
        ].map((item, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/40 bg-background/60 p-3 text-center space-y-1"
          >
            <div
              className={`w-8 h-8 rounded-lg ${item.bg} ${item.color} flex items-center justify-center mx-auto`}
            >
              {item.icon}
            </div>
            <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
            <p className="text-xs text-muted-foreground leading-tight">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/40 bg-background/60 px-4 py-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-foreground">
              {t("dashboard.sign_random_exams_passed")}
            </span>
            <span className="font-black text-orange-600">
              {randomPassedCount}/{randomExamCount}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-foreground">
              {t("dashboard.lessons_read_summary")}
            </span>
            <span className="font-black text-secondary">
              {lessonsCompletedCount}/{lessonsStartedCount}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm md:col-span-2">
            <span className="font-medium text-foreground">
              {t("dashboard.incomplete_activity")}
            </span>
            <span className="font-black text-primary">
              {incompleteActivitiesCount}
            </span>
          </div>
        </div>
      </div>

      {practiceCount === 0 &&
        examCount === 0 &&
        randomExamCount === 0 &&
        lessonsStartedCount === 0 && (
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
                <div className="min-w-0">
                  <p className="text-sm font-black text-foreground truncate">
                    {sign.signCode}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {localizedName || sign.signNameEn || sign.signCode}
                  </p>
                </div>
                <p className="text-sm font-black text-destructive">
                  {Number(sign.accuracy ?? 0).toFixed(1)}%
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

  const [progressData, setProgressData] = useState(defaultProgressData);
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
  const [fetchKey, setFetchKey] = useState(0);

  // Reset all dashboard state when the user changes (login / logout).
  // Without this, a previous user's data stays visible while the new
  // user's data is loading — or worse, after logout.
  const currentUserId = user?.userId ?? null;
  useEffect(() => {
    setProgressData(defaultProgressData);
    setStrongAreas([]);
    setWeakAreas([]);
    setRecentActivities([]);
    setCategoryProgress([]);
  }, [currentUserId]);

  useEffect(() => {
    // Don't fetch if not authenticated (avoids leaking data between sessions)
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch all data in parallel
        const [
          progress,
          weakAreasData,
          recentActivityData,
          categoryProgressResponse,
        ] = await Promise.all([
          getOverallProgress(),
          getWeakAreas(),
          getRecentActivity(5),
          getProgressByCategory(),
        ]);

        setProgressData({
          totalExamsTaken: progress.totalExamsTaken ?? 0,
          totalAttempted: progress.totalAttempted ?? 0,
          averageScore: progress.overallAccuracy ?? 0,
          passRate: progress.passRate ?? 0,
          currentStreak: progress.studyStreak ?? 0,
          passedExams: progress.passedExams ?? 0,
          failedExams: progress.failedExams ?? 0,
          questionsRemaining: progress.questionsRemaining ?? 500,
          recommendedDifficulty: progress.recommendedDifficulty ?? "EASY",
          signPracticeCount: progress.signPracticeCount ?? 0,
          signExamCount: progress.signExamCount ?? 0,
          signPassedCount: progress.signPassedCount ?? 0,
          signRandomExamCount: progress.signRandomExamCount ?? 0,
          signRandomExamPassedCount: progress.signRandomExamPassedCount ?? 0,
          lessonsStartedCount: progress.lessonsStartedCount ?? 0,
          lessonsCompletedCount: progress.lessonsCompletedCount ?? 0,
          incompleteActivitiesCount: progress.incompleteActivitiesCount ?? 0,
          activeTheoryExamCount: progress.activeTheoryExamCount ?? 0,
          incompleteSignPracticeCount:
            progress.incompleteSignPracticeCount ?? 0,
          activeRandomSignExamCount: progress.activeRandomSignExamCount ?? 0,
          weakSigns: progress.weakSigns ?? [],
        });

        setStrongAreas(progress.strongCategories ?? []);

        const areas = weakAreasData.weakAreas ?? [];
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
        setCategoryProgress(
          categories.map((cat) => ({
            categoryCode: cat.categoryCode ?? cat.category ?? "",
            categoryName: cat.categoryName,
            questionsAttempted: cat.questionsAttempted ?? 0,
            correctAnswers: cat.correctAnswers ?? 0,
            accuracy: Number(cat.accuracyRate ?? cat.accuracy ?? 0),
            trend:
              Number(cat.accuracyRate ?? cat.accuracy ?? 0) >= 70
                ? "improving"
                : Number(cat.accuracyRate ?? cat.accuracy ?? 0) >= 50
                  ? "stable"
                  : "declining",
          })),
        );
      } catch (error) {
        logApiError("Failed to fetch dashboard data", error);
        if (isServiceUnavailable(error)) {
          setServiceUnavailable(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    // currentUserId is included so the effect re-runs when auth loads after mount
    // (user starts as null → effect bails out → user loads → re-runs with actual data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey, currentUserId]);

  const firstName = user?.firstName || user?.username || t("dashboard.learner");

  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <div className="rounded-2xl bg-muted/40 border border-border/30 px-6 py-7 space-y-2 animate-pulse">
          <div className="h-3 w-24 bg-muted rounded-full" />
          <div className="h-8 w-48 bg-muted rounded-full" />
          <div className="h-3 w-64 bg-muted rounded-full" />
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

  return (
    <div className="space-y-8 p-6">
      {serviceUnavailable && (
        <ServiceUnavailableBanner
          onRetry={() => {
            setServiceUnavailable(false);
            setFetchKey((k) => k + 1);
          }}
          className="mb-2"
        />
      )}

      {/* Welcome Header */}
      <GreetingHeader
        name={`${t("dashboard.welcome_back")} ${firstName}`}
        subtitle={t("dashboard.subtitle")}
      />

      {/* Recent Activity */}
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
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/80 px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div
              className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0`}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-black leading-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <QuickActionsSection />

      {/* Performance Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr,1fr] gap-6">
        <ProgressOverviewCard data={progressData} />
        <SignActivityWidget
          practiceCount={progressData.signPracticeCount}
          examCount={progressData.signExamCount}
          randomExamCount={progressData.signRandomExamCount}
          randomPassedCount={progressData.signRandomExamPassedCount}
          passedCount={progressData.signPassedCount}
          lessonsStartedCount={progressData.lessonsStartedCount}
          lessonsCompletedCount={progressData.lessonsCompletedCount}
          incompleteActivitiesCount={progressData.incompleteActivitiesCount}
          t={t}
        />
      </div>

      {/* Weak Areas & Category Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeakAreasPreview weakAreas={weakAreas} />
        <CategoryProgressWidget categories={categoryProgress} t={t} />
      </div>

      {progressData.weakSigns.length > 0 && (
        <WeakSignsWidget
          weakSigns={progressData.weakSigns}
          t={t}
          language={language}
        />
      )}

      {/* Recent Activity */}
      <RecentActivityList activities={recentActivities} />

      {/* Strong Areas (only shown when user has ≥1 strong category) */}
      {strongAreas.length > 0 && (
        <StrongAreasWidget categories={strongAreas} t={t} />
      )}
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
