'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────

interface ErrorPattern {
  pattern: string;
  count: number;
  percentage: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

// ─── Constants ───────────────────────────────────────────

const STAT_CARDS = [
  {
    label:     'Total Errors',
    sub:       'Across all exams',
    valueKey:  'total'    as const,
    valueClass: 'text-foreground',
  },
  {
    label:     'Critical Patterns',
    sub:       'Need immediate attention',
    valueKey:  'high'     as const,
    valueClass: 'text-red-600',
  },
  {
    label:     'Important Patterns',
    sub:       'Should be addressed',
    valueKey:  'medium'   as const,
    valueClass: 'text-orange-600',
  },
  {
    label:     'Top Pattern',
    sub:       null, // dynamic
    valueKey:  'topCount' as const,
    valueClass: 'text-primary',
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
  const stats = useMemo(() => ({
    total:    totalErrors,
    high:     patterns.filter(p => p.severity === 'HIGH').length,
    medium:   patterns.filter(p => p.severity === 'MEDIUM').length,
    topCount: patterns[0]?.count ?? 0,
    topLabel: patterns[0]?.pattern ?? 'No patterns',
  }), [totalErrors, patterns]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      {STAT_CARDS.map(({ label, sub, valueKey, valueClass }) => (
        <Card key={label} className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5">
            <p className={cn('text-3xl font-black', valueClass)}>
              {stats[valueKey]}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {valueKey === 'topCount' ? stats.topLabel : sub}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
