'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, BarChart2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

// ─── Types ───────────────────────────────────────────────

interface ErrorPattern {
  pattern: string;
  count: number;
  percentage: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

// ─── Constants (label/sub use translation keys) ──────────

const STAT_CARDS = [
  {
    labelKey:   'error_patterns.metric_total_label',
    subKey:     'error_patterns.metric_total_sub',
    valueKey:   'total'    as const,
    valueClass: 'text-foreground',
    icon:       BarChart2,
    iconBg:     'bg-secondary/10 text-secondary',
  },
  {
    labelKey:   'error_patterns.metric_critical_label',
    subKey:     'error_patterns.metric_critical_sub',
    valueKey:   'high'     as const,
    valueClass: 'text-destructive',
    icon:       AlertCircle,
    iconBg:     'bg-destructive/10 text-destructive',
  },
  {
    labelKey:   'error_patterns.metric_important_label',
    subKey:     'error_patterns.metric_important_sub',
    valueKey:   'medium'   as const,
    valueClass: 'text-primary',
    icon:       AlertTriangle,
    iconBg:     'bg-primary/10 text-primary',
  },
  {
    labelKey:   'error_patterns.metric_top_label',
    subKey:     null, // dynamic — uses topLabel from stats
    valueKey:   'topCount' as const,
    valueClass: 'text-secondary',
    icon:       TrendingUp,
    iconBg:     'bg-secondary/10 text-secondary',
  },
] as const;

// ─── Component ───────────────────────────────────────────

export function ErrorSummary({
  totalErrors,
  patterns,
}: {
  totalErrors: number;
  patterns: ErrorPattern[];
}) {
  const { t } = useLanguage();

  const stats = useMemo(() => ({
    total:    totalErrors,
    high:     patterns.filter(p => p.severity === 'HIGH').length,
    medium:   patterns.filter(p => p.severity === 'MEDIUM').length,
    topCount: patterns[0]?.count ?? 0,
    topLabel: patterns[0]?.pattern ?? t('error_patterns.metric_no_patterns'),
  }), [totalErrors, patterns, t]);

  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-extrabold tracking-tight text-secondary">
          {t('error_patterns.summary_title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAT_CARDS.map(({ labelKey, subKey, valueKey, valueClass, icon: Icon, iconBg }) => (
            <div
              key={labelKey}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur"
            >
              <div className="pointer-events-none absolute inset-0 ring-1 ring-border/60" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <div className="relative flex items-start gap-3">
                <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-background/60 shadow-sm', iconBg)}>
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t(labelKey)}
                  </p>
                  <p className={cn('mt-0.5 text-2xl font-extrabold tracking-tight', valueClass)}>
                    {stats[valueKey]}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {valueKey === 'topCount' ? stats.topLabel : (subKey ? t(subKey) : '')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
