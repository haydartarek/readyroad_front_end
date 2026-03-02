'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────

interface CategoryBreakdown {
  categoryCode: string;
  categoryName: string;
  correct: number;
  total: number;
  percentage: number;
}

// ─── Helpers ─────────────────────────────────────────────

type Tier = 'strong' | 'average' | 'weak';

function getTier(pct: number): Tier {
  if (pct >= 85) return 'strong';
  if (pct >= 70) return 'average';
  return 'weak';
}

const TIER_CONFIG = {
  strong:  { bar: '[&>div]:bg-green-600', badge: 'bg-green-100 text-green-800 border-green-200', label: 'Strong'         },
  average: { bar: '',                      badge: '',                                             label: ''               },
  weak:    { bar: '[&>div]:bg-red-500',   badge: 'bg-red-100   text-red-800   border-red-200',   label: 'Needs Practice' },
} as const;

const SUMMARY_CELLS = [
  { tier: 'strong'  as Tier, label: 'Strong Areas',  color: 'text-green-600'  },
  { tier: 'average' as Tier, label: 'Average Areas', color: 'text-orange-500' },
  { tier: 'weak'    as Tier, label: 'Weak Areas',    color: 'text-red-600'    },
];

// ─── Component ───────────────────────────────────────────

export function ScoreBreakdown({ categoryBreakdown }: { categoryBreakdown: CategoryBreakdown[] }) {

  const tierCounts = useMemo(() => ({
    strong:  categoryBreakdown.filter(c => getTier(c.percentage) === 'strong').length,
    average: categoryBreakdown.filter(c => getTier(c.percentage) === 'average').length,
    weak:    categoryBreakdown.filter(c => getTier(c.percentage) === 'weak').length,
  }), [categoryBreakdown]);

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="font-black">Score by Category</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Per-category rows */}
        <div className="space-y-4">
          {categoryBreakdown.map(category => {
            const tier = getTier(category.percentage);
            const cfg  = TIER_CONFIG[tier];

            return (
              <div key={category.categoryCode} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-sm text-foreground truncate">
                      {category.categoryName}
                    </span>
                    {cfg.label && (
                      <Badge className={cn('border text-xs flex-shrink-0', cfg.badge)}>
                        {cfg.label}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-bold text-muted-foreground flex-shrink-0">
                    {category.correct}/{category.total}
                    {' '}
                    <span className={cn(
                      tier === 'strong' ? 'text-green-600' :
                      tier === 'weak'   ? 'text-red-600'   : 'text-foreground'
                    )}>
                      ({category.percentage.toFixed(0)}%)
                    </span>
                  </span>
                </div>
                <Progress
                  value={category.percentage}
                  className={cn('h-2 rounded-full', cfg.bar)}
                />
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-muted/60 p-4">
          {SUMMARY_CELLS.map(({ tier, label, color }) => (
            <div key={tier} className="text-center">
              <p className={cn('text-2xl font-black', color)}>{tierCounts[tier]}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

      </CardContent>
    </Card>
  );
}
