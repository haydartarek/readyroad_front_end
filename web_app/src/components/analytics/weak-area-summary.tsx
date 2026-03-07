'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────

interface WeakArea {
  categoryCode: string;
  categoryName: string;
  accuracy: number;
}

// ─── Constants ───────────────────────────────────────────

const STAT_CARDS = [
  { labelKey: 'analytics.overall_accuracy', subKey: 'analytics.across_all_categories', key: 'overall'   as const, color: 'text-primary',     format: (v: number) => `${v.toFixed(0)}%` },
  { labelKey: 'analytics.critical_areas',   subKey: 'analytics.below_50_accuracy',     key: 'critical'  as const, color: 'text-destructive', format: (v: number) => `${v}` },
  { labelKey: 'analytics.needs_practice',   subKey: 'analytics.between_50_70_accuracy',key: 'improving' as const, color: 'text-primary',     format: (v: number) => `${v}` },
  { labelKey: 'analytics.strong_areas',     subKey: 'analytics.above_80_accuracy',     key: 'strong'    as const, color: 'text-secondary',   format: (v: number) => `${v}` },
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
  const { t } = useLanguage();

  const stats = useMemo(() => ({
    overall:   overallAccuracy,
    critical:  weakAreas.filter(a => a.accuracy < 50).length,
    improving: weakAreas.filter(a => a.accuracy >= 50).length, // 50–<80% (all weakAreas are <80)
    strong:    totalCategories - weakAreas.length,
  }), [weakAreas, totalCategories, overallAccuracy]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      {STAT_CARDS.map(({ labelKey, subKey, key, color, format }) => (
        <Card key={labelKey} className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t(labelKey)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5">
            <p className={cn('text-3xl font-black', color)}>
              {format(stats[key])}
            </p>
            <p className="text-xs text-muted-foreground">{t(subKey)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
