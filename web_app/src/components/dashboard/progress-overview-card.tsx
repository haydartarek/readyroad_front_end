'use client';

import {
  TrendingUp,
  TrendingDown,
  ClipboardList,
  BarChart2,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

interface ProgressData {
  totalExamsTaken: number;
  averageScore: number;
  passRate: number;
  currentStreak: number;
}

type Trend = 'up' | 'down' | 'neutral';

interface MetricItem {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: Trend;
  trendLabel?: string;
  trendClass?: string;
  TrendIcon?: React.ElementType;
}

function MetricCard({ label, value, icon: Icon, trend, trendLabel, trendClass, TrendIcon }: MetricItem) {
  const showTrend = trend && trend !== 'neutral' && TrendIcon && trendLabel;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur">
      <div className="pointer-events-none absolute inset-0 ring-1 ring-border/60" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-background/60 shadow-sm">
          <Icon className="h-5 w-5 text-primary" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>

          <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-foreground">
            {value}
          </p>

          {showTrend && (
            <div className={cn('mt-1 inline-flex items-center gap-1 text-xs font-medium', trendClass)}>
              <TrendIcon className="h-3.5 w-3.5" aria-hidden />
              {trendLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProgressOverviewCard({ data }: { data: ProgressData }) {
  const { t } = useLanguage();

  const trendUp = {
    icon: TrendingUp,
    className: 'text-primary',
    label: t('dashboard.trend_good_progress'),
  };
  const trendDown = {
    icon: TrendingDown,
    className: 'text-destructive',
    label: t('dashboard.trend_needs_improvement'),
  };

  const metrics: MetricItem[] = [
    {
      label: t('dashboard.metric_exams_taken'),
      value: data.totalExamsTaken,
      icon: ClipboardList,
    },
    {
      label:      t('dashboard.metric_avg_score'),
      value:      `${data.averageScore.toFixed(1)}%`,
      icon:       BarChart2,
      trend:      data.averageScore >= 82 ? 'up' : 'neutral',
      trendLabel: trendUp.label,
      trendClass: trendUp.className,
      TrendIcon:  trendUp.icon,
    },
    {
      label:      t('dashboard.metric_pass_rate'),
      value:      `${data.passRate.toFixed(1)}%`,
      icon:       CheckCircle2,
      trend:      data.passRate >= 70 ? 'up' : 'down',
      trendLabel: data.passRate >= 70 ? trendUp.label : trendDown.label,
      trendClass: data.passRate >= 70 ? trendUp.className : trendDown.className,
      TrendIcon:  data.passRate >= 70 ? trendUp.icon : trendDown.icon,
    },
    {
      label: t('dashboard.metric_current_streak'),
      value: `${data.currentStreak} ${t('dashboard.stat_streak_days')}`,
      icon:  Flame,
    },
  ];

  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-extrabold tracking-tight text-secondary">
          {t('dashboard.progress_title')}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
