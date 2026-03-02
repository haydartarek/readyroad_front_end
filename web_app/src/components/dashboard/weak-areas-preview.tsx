'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

interface WeakArea {
  category: string;
  accuracy: number;
  totalQuestions: number;
}

function getBarColor(accuracy: number): string {
  if (accuracy < 60) return 'bg-destructive';
  if (accuracy < 75) return 'bg-primary/60';
  return 'bg-primary';
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy < 60) return 'text-destructive';
  if (accuracy < 75) return 'text-primary';
  return 'text-primary';
}

export function WeakAreasPreview({ weakAreas }: { weakAreas: WeakArea[] }) {
  const { t } = useLanguage();
  const topThree = weakAreas.slice(0, 3);

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="font-black text-secondary">
          {t('analytics.weak_areas')}
        </CardTitle>

        <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
          <Link href="/analytics/weak-areas">
            {t('dashboard.view_all')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        {topThree.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('dashboard.no_weak_areas')}
          </p>
        ) : (
          <div className="space-y-5">
            {topThree.map((area) => (
              <div key={area.category} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {area.category}
                  </span>

                  <span
                    className={cn(
                      'flex-shrink-0 text-xs font-bold',
                      getAccuracyColor(area.accuracy)
                    )}
                  >
                    {area.accuracy.toFixed(1)}%{' '}
                    <span className="font-normal text-muted-foreground">
                      ({area.totalQuestions} q)
                    </span>
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      getBarColor(area.accuracy)
                    )}
                    style={{ width: `${area.accuracy}%` }}
                  />
                </div>

                <Link
                  href={`/practice?category=${encodeURIComponent(area.category)}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80"
                >
                  {t('dashboard.practice_this_category')}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
