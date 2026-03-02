'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { ProgressOverviewCard } from '@/components/dashboard/progress-overview-card';
import { QuickActionsSection } from '@/components/dashboard/quick-actions-section';
import { WeakAreasPreview } from '@/components/dashboard/weak-areas-preview';
import { RecentActivityList } from '@/components/dashboard/recent-activity-list';
import { getOverallProgress, getWeakAreas } from '@/services';
import { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { Flame, Trophy, Target, BookOpen, Star } from 'lucide-react';
import type { CategoryProgressSummary } from '@/services/progressService';

const defaultProgressData = {
  totalExamsTaken: 0,
  averageScore: 0,
  passRate: 0,
  currentStreak: 0,
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
        <p className="text-muted-foreground text-sm">{subtitle}</p>
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
    if (accuracy >= 85) return 'text-green-600 dark:text-green-400';
    if (accuracy >= 70) return 'text-blue-600 dark:text-blue-400';
    return 'text-orange-500 dark:text-orange-400';
  }

  function getMasteryBadge(accuracy: number): { label: string; color: string } {
    if (accuracy >= 85) return {
      label: t('dashboard.mastery_strong'),
      color: 'bg-green-500 text-white dark:bg-green-600 dark:text-white',
    };
    if (accuracy >= 70) return {
      label: t('dashboard.mastery_good'),
      color: 'bg-blue-500 text-white dark:bg-blue-600 dark:text-white',
    };
    return {
      label: t('dashboard.mastery_needs_work'),
      color: 'bg-orange-500 text-white dark:bg-orange-600 dark:text-white',
    };
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center">
          <Star className="w-4 h-4 text-yellow-500" />
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

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [progressData, setProgressData] = useState(defaultProgressData);
  const [mostStudied, setMostStudied] = useState<CategoryProgressSummary[]>([]);
  const [weakAreas, setWeakAreas] = useState<
    { category: string; accuracy: number; totalQuestions: number }[]
  >([]);
  const [recentActivities, setRecentActivities] = useState<
    { id: string; type: 'exam' | 'practice'; date: string; score: number; passed?: boolean; category?: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch progress and weak areas in parallel
        const [progress, weakAreasData] = await Promise.all([
          getOverallProgress(),
          getWeakAreas(),
        ]);

        setProgressData({
          totalExamsTaken: progress.totalAttempted ?? 0,
          averageScore:    progress.overallAccuracy ?? 0,
          passRate:        progress.overallAccuracy >= 82
                             ? 100
                             : (progress.overallAccuracy / 82) * 100,
          currentStreak:   progress.studyStreak ?? 0,
        });

        setMostStudied(progress.mostStudiedCategories ?? []);

        const areas = weakAreasData.weakAreas ?? [];
        setWeakAreas(
          areas.map((area) => ({
            category:       area.categoryName,
            accuracy:       area.accuracy,
            totalQuestions: area.totalCount,
          }))
        );

        if (progress.lastActivityDate) {
          setRecentActivities([
            {
              id:    '1',
              type:  'practice',
              date:  progress.lastActivityDate,
              score: Math.round(progress.overallAccuracy),
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
  }, [fetchKey]);

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
            value: progressData.totalExamsTaken,
            color: 'text-yellow-500',
            bg:    'bg-yellow-500/10',
          },
          {
            icon:  <Target   className="w-4 h-4" />,
            label: t('dashboard.stat_avg_score'),
            value: `${Math.round(progressData.averageScore)}%`,
            color: 'text-blue-500',
            bg:    'bg-blue-500/10',
          },
          {
            icon:  <BookOpen className="w-4 h-4" />,
            label: t('dashboard.stat_pass_rate'),
            value: `${Math.round(progressData.passRate)}%`,
            color: 'text-green-500',
            bg:    'bg-green-500/10',
          },
          {
            icon:  <Flame    className="w-4 h-4" />,
            label: t('dashboard.stat_streak'),
            value: `${progressData.currentStreak} ${t('dashboard.stat_streak_days')}`,
            color: 'text-orange-500',
            bg:    'bg-orange-500/10',
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

      {/* Progress Overview */}
      <ProgressOverviewCard data={progressData} />

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-2xl font-black tracking-tight">{t('dashboard.quick_actions')}</h2>
        <QuickActionsSection />
      </div>

      {/* Weak Areas & Most Studied */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeakAreasPreview weakAreas={weakAreas} />
        <MostStudiedWidget categories={mostStudied} t={t} />
      </div>

      {/* Recent Activity */}
      <RecentActivityList activities={recentActivities} />

    </div>
  );
}
