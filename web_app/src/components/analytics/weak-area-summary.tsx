'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────

interface WeakArea {
  categoryCode: string;
  categoryName: string;
  accuracy: number;
}

// ─── Constants ───────────────────────────────────────────

const STAT_CARDS = [
  {
    label:    'Overall Accuracy',
    sub:      'Across all categories',
    key:      'overall'   as const,
    color:    'text-primary',
    format:   (v: number) => `${v.toFixed(0)}%`,
  },
  {
    label:    'Critical Areas',
    sub:      'Below 50% accuracy',
    key:      'critical'  as const,
    color:    'text-red-600',
    format:   (v: number) => `${v}`,
  },
  {
    label:    'Needs Practice',
    sub:      '50–70% accuracy',
    key:      'improving' as const,
    color:    'text-orange-600',
    format:   (v: number) => `${v}`,
  },
  {
    label:    'Strong Areas',
    sub:      'Above 70% accuracy',
    key:      'strong'    as const,
    color:    'text-green-600',
    format:   (v: number) => `${v}`,
  },
] as const;

// ─── Component ───────────────────────────────────────────

export function WeakAreaSummary({
  weakAreas,
  totalCategories,
  overallAccuracy,
}: {
  weakAreas: WeakArea[];
  totalCategories: number;
  overallAccuracy: number;
}) {
  const stats = useMemo(() => ({
    overall:   overallAccuracy,
    critical:  weakAreas.filter(a => a.accuracy < 50).length,
    improving: weakAreas.filter(a => a.accuracy >= 50 && a.accuracy < 70).length,
    strong:    totalCategories - weakAreas.length,
  }), [weakAreas, totalCategories, overallAccuracy]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      {STAT_CARDS.map(({ label, sub, key, color, format }) => (
        <Card key={label} className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5">
            <p className={cn('text-3xl font-black', color)}>
              {format(stats[key])}
            </p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
