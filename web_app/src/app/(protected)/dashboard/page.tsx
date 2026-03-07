'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { ProgressOverviewCard } from '@/components/dashboard/progress-overview-card';
import { QuickActionsSection } from '@/components/dashboard/quick-actions-section';
import { WeakAreasPreview } from '@/components/dashboard/weak-areas-preview';
import { RecentActivityList } from '@/components/dashboard/recent-activity-list';
import { getOverallProgress, getWeakAreas } from '@/services';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  Flame, Trophy, Target, BookOpen, Star,
  TrendingUp, TrendingDown, Minus, PenLine, ExternalLink,
  Shield, Zap, CheckCircle,
} from 'lucide-react';
import type { CategoryProgressSummary } from '@/services/progressService';

// ─── Progress Tracker types (inline, no extra file) ──────────────────────────

interface ExamHistoryItem {
  id: number;
  date: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
}

interface CategoryProgressItem {
  categoryCode: string;
  categoryName: string;
  questionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
  trend: 'improving' | 'stable' | 'declining';
}

function TrendIcon({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
  if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />;
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
  recommendedDifficulty: 'EASY' as string,
  signPracticeCount: 0,
  signExamCount: 0,
  signPassedCount: 0,
};

function SkeletonCard() {
  return <div className="h-32 bg-muted/60 animate-pulse rounded-2xl border border-border/30" />;
}

function GreetingHeader({ name, subtitle }: { name: string; subtitle: string }) {
  const hour = new Date().getHours();
  const { t } = useLanguage();

  const greeting =
    hour < 12 ? t('dashboard.greeting_morning') :
    hour < 17 ? t('dashboard.greeting_afternoon') :
    t('dashboard.greeting_evening');

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15 px-6 py-7 shadow-sm">
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="relative space-y-1">
        <p className="text-sm font-medium text-primary">{greeting}</p>
        <h1 className="text-3xl font-black tracking-tight">
          {name}!
        </h1>
        <p className="text-muted-foreground text-sm font-medium">{subtitle}</p>
      </div>
    </div>
  );
}

/** Most-studied categories widget */
function MostStudiedWidget({
  categories,
  t,
}: {
  categories: CategoryProgressSummary[];
  t: (key: string) => string;
}) {
  if (!categories || categories.length === 0) return null;

  function getAccuracyColor(accuracy: number): string {
    if (accuracy >= 85) return 'text-secondary';
    if (accuracy >= 70) return 'text-primary';
    return 'text-destructive';
  }

  function getMasteryBadge(accuracy: number): { label: string; color: string } {
    if (accuracy >= 85) return {
      label: t('dashboard.mastery_strong'),
      color: 'bg-secondary text-secondary-foreground',
    };
    if (accuracy >= 70) return {
      label: t('dashboard.mastery_good'),
      color: 'bg-primary/20 text-primary',
    };
    return {
      label: t('dashboard.mastery_needs_work'),
      color: 'bg-destructive/15 text-destructive',
    };
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Star className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-black text-secondary">{t('dashboard.most_studied')}</h3>
      </div>

      <div className="space-y-3">
        {categories.map((cat, idx) => {
          const accuracyNum = typeof cat.accuracy === 'number'
            ? cat.accuracy
            : Number(cat.accuracy);
          const badge = getMasteryBadge(accuracyNum);
          return (
            <div
              key={cat.categoryCode ?? cat.categoryName ?? idx}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/60 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-muted text-xs font-black text-muted-foreground flex-shrink-0">
                  {cat.categoryCode ?? (idx + 1)}
                </span>
                <span className="text-sm font-semibold text-foreground truncate">
                  {cat.categoryName}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">
                  {cat.attempted} q
                </span>
                <span className={`text-xs font-bold ${getAccuracyColor(accuracyNum)}`}>
                  {accuracyNum.toFixed(1)}%
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
            </div>
          );
        })}
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
        <h3 className="font-black text-secondary">{t('dashboard.strong_areas') || 'Strong Areas'}</h3>
      </div>

      <div className="space-y-3">
        {categories.map((cat, idx) => {
          const accuracyNum = typeof cat.accuracy === 'number' ? cat.accuracy : Number(cat.accuracy);
          return (
            <div
              key={cat.categoryCode ?? cat.categoryName ?? idx}
              className="flex items-center justify-between gap-3 rounded-xl border border-green-100 bg-green-50/40 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-green-100 text-xs font-black text-green-700 flex-shrink-0">
                  {cat.categoryCode ?? (idx + 1)}
                </span>
                <span className="text-sm font-semibold text-foreground truncate">
                  {cat.categoryName}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">{cat.attempted} q</span>
                <span className="text-xs font-bold text-green-600">{accuracyNum.toFixed(1)}%</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-500 text-white">
                  {t('dashboard.mastery_strong') || 'Strong'}
                </span>
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
  passedCount,
  t,
}: {
  practiceCount: number;
  examCount: number;
  passedCount: number;
  t: (key: string) => string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-black text-secondary">{t('dashboard.sign_activity_title') || 'Sign Quiz Activity'}</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: t('dashboard.sign_practice_sessions') || 'Practice Sessions',
            value: practiceCount,
            color: 'text-primary',
            bg:    'bg-primary/10',
            icon:  <PenLine className="w-4 h-4" />,
          },
          {
            label: t('dashboard.sign_exams_taken') || 'Sign Exams Taken',
            value: examCount,
            color: 'text-secondary',
            bg:    'bg-secondary/10',
            icon:  <Zap className="w-4 h-4" />,
          },
          {
            label: t('dashboard.sign_passed_signs') || 'Signs Passed',
            value: passedCount,
            color: 'text-green-600',
            bg:    'bg-green-100',
            icon:  <CheckCircle className="w-4 h-4" />,
          },
        ].map((item, i) => (
          <div key={i} className="rounded-xl border border-border/40 bg-background/60 p-3 text-center space-y-1">
            <div className={`w-8 h-8 rounded-lg ${item.bg} ${item.color} flex items-center justify-center mx-auto`}>
              {item.icon}
            </div>
            <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
            <p className="text-xs text-muted-foreground leading-tight">{item.label}</p>
          </div>
        ))}
      </div>

      {practiceCount === 0 && examCount === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {t('dashboard.sign_no_activity') || 'No sign quiz activity yet. Visit Signs to get started.'}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {  const { user } = useAuth();
  const { t } = useLanguage();

  const [progressData, setProgressData] = useState(defaultProgressData);
  const [mostStudied, setMostStudied] = useState<CategoryProgressSummary[]>([]);
  const [strongAreas, setStrongAreas] = useState<CategoryProgressSummary[]>([]);
  const [weakAreas, setWeakAreas] = useState<
    { category: string; accuracy: number; totalQuestions: number }[]
  >([]);
  const [recentActivities, setRecentActivities] = useState<
    { id: string; type: 'exam' | 'practice'; date: string; score: number; passed?: boolean; category?: string }[]
  >([]);
  const [examHistory, setExamHistory] = useState<ExamHistoryItem[]>([]);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  // Reset all dashboard state when the user changes (login / logout).
  // Without this, a previous user's data stays visible while the new
  // user's data is loading — or worse, after logout.
  const currentUserId = user?.userId ?? null;
  useEffect(() => {
    setProgressData(defaultProgressData);
    setMostStudied([]);
    setStrongAreas([]);
    setWeakAreas([]);
    setRecentActivities([]);
    setExamHistory([]);
    setCategoryProgress([]);
  }, [currentUserId]);

  useEffect(() => {
    // Don't fetch if not authenticated (avoids leaking data between sessions)
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch all data in parallel
        const [progress, weakAreasData, categoriesResponse, historyResponse] = await Promise.all([
          getOverallProgress(),
          getWeakAreas(),
          apiClient.get<Array<{
            categoryCode: string;
            categoryName: string;
            questionsAttempted: number;
            correctAnswers: number;
            accuracyRate: number;
          }>>('/users/me/progress/categories'),
          apiClient.get<{
            totalExams: number;
            exams: Array<{
              examId: number;
              startedAt: string;
              completedAt: string | null;
              scorePercentage: number;
              totalQuestions: number;
              correctAnswers: number;
              passed: boolean;
            }>;
          }>('/exams/simulations/history'),
        ]);

        setProgressData({
          totalExamsTaken:       progress.totalExamsTaken ?? 0,
          totalAttempted:        progress.totalAttempted  ?? 0,
          averageScore:          progress.overallAccuracy ?? 0,
          passRate:              progress.passRate ?? 0,
          currentStreak:         progress.studyStreak ?? 0,
          passedExams:           progress.passedExams ?? 0,
          failedExams:           progress.failedExams ?? 0,
          questionsRemaining:    progress.questionsRemaining ?? 500,
          recommendedDifficulty: progress.recommendedDifficulty ?? 'EASY',
          signPracticeCount:     progress.signPracticeCount ?? 0,
          signExamCount:         progress.signExamCount ?? 0,
          signPassedCount:       progress.signPassedCount ?? 0,
        });

        setMostStudied(progress.mostStudiedCategories ?? []);
        setStrongAreas(progress.strongCategories ?? []);

        const areas = weakAreasData.weakAreas ?? [];
        setWeakAreas(
          areas.map((area) => ({
            category:       area.categoryName,
            accuracy:       area.accuracy,
            totalQuestions: area.totalCount,
          }))
        );

        // Progress Tracker data
        const categories = categoriesResponse.data ?? [];
        setCategoryProgress(
          categories.map(cat => ({
            categoryCode:       cat.categoryCode,
            categoryName:       cat.categoryName,
            questionsAttempted: cat.questionsAttempted ?? 0,
            correctAnswers:     cat.correctAnswers ?? 0,
            accuracy:           Number(cat.accuracyRate ?? 0),
            trend:              Number(cat.accuracyRate ?? 0) >= 70 ? 'improving'
                                  : Number(cat.accuracyRate ?? 0) >= 50 ? 'stable' : 'declining',
          }))
        );

        const historyExams = historyResponse.data?.exams ?? [];
        const mappedHistory = historyExams.map(exam => ({
          id:             exam.examId,
          date:           exam.completedAt || exam.startedAt,
          score:          exam.correctAnswers ?? 0,
          totalQuestions: exam.totalQuestions ?? 50,
          percentage:     Number(exam.scorePercentage ?? 0),
          passed:         exam.passed ?? false,
        }));
        setExamHistory(mappedHistory);

        // Recent Activity: use real exam data when available, otherwise practice accuracy
        if (progress.lastActivityDate) {
          const hasExams = (progress.totalExamsTaken ?? 0) > 0;
          const latestExam = mappedHistory[0]; // history is ordered newest-first from backend
          setRecentActivities([
            {
              id:    '1',
              type:  hasExams ? 'exam' : 'practice',
              date:  hasExams && latestExam ? latestExam.date : progress.lastActivityDate,
              // Always show the true exam score, not practice accuracy
              score: hasExams && latestExam
                       ? Math.round(latestExam.percentage)
                       : Math.round(progress.overallAccuracy),
              passed: hasExams && latestExam
                        ? latestExam.passed
                        : undefined,
            },
          ]);
        }

      } catch (error) {
        logApiError('Failed to fetch dashboard data', error);
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

  const firstName = user?.firstName || 'User';

  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <div className="rounded-2xl bg-muted/40 border border-border/30 px-6 py-7 space-y-2 animate-pulse">
          <div className="h-3 w-24 bg-muted rounded-full" />
          <div className="h-8 w-48 bg-muted rounded-full" />
          <div className="h-3 w-64 bg-muted rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
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
          onRetry={() => { setServiceUnavailable(false); setFetchKey(k => k + 1); }}
          className="mb-2"
        />
      )}

      {/* Welcome Header */}
      <GreetingHeader
        name={`${t('dashboard.welcome_back')} ${firstName}`}
        subtitle={t('dashboard.subtitle')}
      />

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon:  <Trophy   className="w-4 h-4" />,
            label: t('dashboard.stat_questions_done'),
            value: progressData.totalAttempted,
            color: 'text-primary',
            bg:    'bg-primary/10',
          },
          {
            icon:  <BookOpen className="w-4 h-4" />,
            label: t('dashboard.stat_formal_exams') || 'Formal Exams',
            value: progressData.totalExamsTaken,
            color: 'text-secondary',
            bg:    'bg-secondary/10',
          },
          {
            icon:  <Target   className="w-4 h-4" />,
            label: t('dashboard.stat_goal_remaining') || 'Questions Goal',
            value: `${progressData.totalAttempted}/500`,
            color: 'text-primary',
            bg:    'bg-primary/10',
          },
          {
            icon:  <Flame    className="w-4 h-4" />,
            label: t('dashboard.stat_streak'),
            value: `${progressData.currentStreak} ${t('dashboard.stat_streak_days')}`,
            color: 'text-primary',
            bg:    'bg-primary/10',
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/80 px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-black leading-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Exam Performance Overview */}
      <ProgressOverviewCard data={progressData} />

      {/* Practice Accuracy + Recommended Difficulty — non-exam stats not in the card above */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/80 px-4 py-3 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('dashboard.stat_avg_score') || 'Practice Accuracy'}</p>
            <p className="text-lg font-black leading-tight">{Math.round(progressData.averageScore)}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/80 px-4 py-3 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('dashboard.recommended_difficulty') || 'Recommended Level'}</p>
            <p className="text-lg font-black leading-tight capitalize">{progressData.recommendedDifficulty?.toLowerCase() ?? 'Easy'}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-2xl font-black tracking-tight">{t('dashboard.quick_actions')}</h2>
        <QuickActionsSection />
      </div>

      {/* ══ Progress Tracker Section ══════════════════════════════════════════ */}
      <div className="space-y-5">
        {/* Section header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">{t('progress.badge') || 'Progress Tracker'}</h2>
            <p className="text-xs text-muted-foreground">{t('progress.subtitle') || 'Track your improvement and stay motivated'}</p>
          </div>
        </div>

        {/* Tabs: Exam History + Category Progress */}
        <Tabs defaultValue="history" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 rounded-xl h-12">
            <TabsTrigger value="history" className="rounded-lg font-semibold">
              {t('progress.tab_history') || 'Exam History'}
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg font-semibold">
              {t('progress.tab_categories') || 'Category Progress'}
            </TabsTrigger>
          </TabsList>

          {/* ── Exam History ── */}
          <TabsContent value="history" className="space-y-3">
            {examHistory.length === 0 ? (
              <div className="rounded-2xl border border-border/50 bg-card py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto text-4xl">📋</div>
                <div>
                  <p className="font-bold text-lg">{t('progress.no_history_title') || 'No exam history yet'}</p>
                  <p className="text-sm text-muted-foreground">{t('progress.no_history_desc') || 'Take your first exam to see your history here.'}</p>
                </div>
                <Button asChild className="shadow-md shadow-primary/20 rounded-full px-6">
                  <Link href="/exam">{t('progress.take_first_exam') || 'Take Your First Exam'}</Link>
                </Button>
              </div>
            ) : (
              examHistory.map((exam) => (
                <div key={exam.id} className="rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm flex-shrink-0',
                        exam.passed ? 'bg-green-500' : 'bg-destructive'
                      )}>
                        {(exam.percentage ?? 0).toFixed(0)}%
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            'inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full',
                            exam.passed ? 'bg-green-500 text-white' : 'bg-destructive text-white'
                          )}>
                            {exam.passed ? t('progress.result_passed') || 'Passed' : t('progress.result_failed') || 'Failed'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(exam.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-bold text-sm">
                          {exam.score}/{exam.totalQuestions}{' '}
                          <span className="font-normal text-muted-foreground">{t('progress.correct_answers') || 'correct'}</span>
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="gap-1 flex-shrink-0 rounded-full">
                      <Link href={`/exam/results/${exam.id}`}>
                        <ExternalLink className="w-3.5 h-3.5" />
                        {t('progress.details') || 'Details'}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* ── Category Progress ── */}
          <TabsContent value="categories" className="space-y-3">
            {categoryProgress.length === 0 ? (
              <div className="rounded-2xl border border-border/50 bg-card py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto text-4xl">📊</div>
                <div>
                  <p className="font-bold text-lg">{t('progress.no_categories_title') || 'No category data yet'}</p>
                  <p className="text-sm text-muted-foreground">{t('progress.no_categories_desc') || 'Start practicing to see your progress.'}</p>
                </div>
                <Button asChild variant="outline" className="rounded-full px-6">
                  <Link href="/practice">{t('progress.start_practicing') || 'Start Practicing'}</Link>
                </Button>
              </div>
            ) : (
              categoryProgress.map((cat) => (
                <div key={cat.categoryCode} className="rounded-2xl border border-border/40 bg-card shadow-sm hover:shadow-md transition-shadow p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-base">{cat.categoryName}</p>
                        <TrendIcon trend={cat.trend} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cat.categoryCode} · {cat.questionsAttempted} {t('progress.questions_attempted') || 'attempted'}
                      </p>
                    </div>
                    <span className={cn(
                      'text-2xl font-black',
                      cat.accuracy >= 80 ? 'text-green-600' :
                      cat.accuracy >= 60 ? 'text-orange-500' : 'text-destructive'
                    )}>
                      {cat.accuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Progress
                      value={cat.accuracy}
                      className={cn(
                        'h-2',
                        cat.accuracy >= 80 ? '[&>div]:bg-green-500' :
                        cat.accuracy >= 60 ? '[&>div]:bg-orange-500' : '[&>div]:bg-destructive'
                      )}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{cat.correctAnswers} {t('progress.correct') || 'correct'}</span>
                      <span>{cat.questionsAttempted - cat.correctAnswers} {t('progress.wrong') || 'wrong'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1 gap-1 hover:bg-primary/5 hover:border-primary/30 rounded-full transition-all">
                      <Link href={`/practice/${cat.categoryCode}`}>
                        <PenLine className="w-3.5 h-3.5" />
                        {t('progress.practice') || 'Practice'}
                      </Link>
                    </Button>
                    {cat.accuracy < 70 && (
                      <Button variant="outline" size="sm" asChild className="flex-1 gap-1 hover:bg-primary/5 hover:border-primary/30 rounded-full transition-all">
                        <Link href={`/lessons?category=${cat.categoryCode}`}>
                          <BookOpen className="w-3.5 h-3.5" />
                          {t('progress.study') || 'Study'}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* Sign Activity */}
      <SignActivityWidget
        practiceCount={progressData.signPracticeCount}
        examCount={progressData.signExamCount}
        passedCount={progressData.signPassedCount}
        t={t}
      />

      {/* Weak Areas & Most Studied & Strong Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeakAreasPreview weakAreas={weakAreas} />
        <MostStudiedWidget categories={mostStudied} t={t} />
      </div>

      {/* Strong Areas (only shown when user has ≥1 strong category) */}
      {strongAreas.length > 0 && (
        <StrongAreasWidget categories={strongAreas} t={t} />
      )}

      {/* Recent Activity */}
      <RecentActivityList activities={recentActivities} />

    </div>
  );
}
