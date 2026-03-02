'use client';

import Link from 'next/link';
import { AlertTriangle, BookOpen, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────

interface WeakArea {
  categoryCode: string;
  categoryName: string;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  averageTime: string;
  commonMistakes: string[];
  recommendedLessons: Array<{ code: string; title: string }>;
}

// ─── Helpers ─────────────────────────────────────────────

type Severity = 'critical' | 'weak';

function getSeverity(accuracy: number): Severity | null {
  if (accuracy < 50)  return 'critical';
  if (accuracy < 70)  return 'weak';
  return null;
}

const SEVERITY = {
  critical: {
    card:     'border-red-200    bg-red-50/40    dark:bg-red-950/20',
    badge:    'bg-red-600',
    accuracy: 'text-red-600',
    bar:      '[&>div]:bg-red-600',
    label:    'Critical',
  },
  weak: {
    card:     'border-orange-200 bg-orange-50/40 dark:bg-orange-950/20',
    badge:    'bg-orange-500',
    accuracy: 'text-orange-600',
    bar:      '[&>div]:bg-orange-500',
    label:    'Needs Practice',
  },
} as const;

const STAT_CELLS = (area: WeakArea) => [
  { label: 'Correct',  value: area.correctCount,                      color: 'text-green-600' },
  { label: 'Wrong',    value: area.totalCount - area.correctCount,     color: 'text-red-600'   },
  { label: 'Avg Time', value: area.averageTime,                        color: 'text-primary'   },
];

// ─── Component ───────────────────────────────────────────

export function WeakAreaDetails({ weakAreas }: { weakAreas: WeakArea[] }) {

  if (weakAreas.length === 0) {
    return (
      <Card className="rounded-2xl border-2 border-green-200 bg-green-50/40 dark:bg-green-950/20 shadow-sm">
        <CardContent className="py-16 text-center space-y-3">
          <div className="text-6xl">🎉</div>
          <h3 className="text-2xl font-black text-green-900 dark:text-green-100">
            Excellent Performance!
          </h3>
          <p className="text-green-700 dark:text-green-300">
            You don&apos;t have any weak areas. All categories show strong performance!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {weakAreas.map((area, index) => {
        const severity = getSeverity(area.accuracy);
        const cfg      = severity ? SEVERITY[severity] : null;

        return (
          <Card
            key={area.categoryCode}
            className={cn(
              'rounded-2xl border-2 shadow-sm transition-all hover:shadow-md',
              cfg?.card ?? 'border-border/50',
            )}
          >
            {/* ── Header ── */}
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-black text-foreground">
                      {index + 1}
                    </span>
                    {cfg && (
                      <Badge variant="destructive" className={cfg.badge}>
                        {cfg.label}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl font-black">{area.categoryName}</CardTitle>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={cn('text-4xl font-black', cfg?.accuracy ?? 'text-green-600')}>
                    {area.accuracy.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">

              {/* Stats */}
              <div className="grid gap-3 sm:grid-cols-3">
                {STAT_CELLS(area).map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl bg-card border border-border/50 p-4 text-center">
                    <p className={cn('text-2xl font-black', color)}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold text-foreground">Your Progress</span>
                  <span className="text-muted-foreground">
                    {area.correctCount}/{area.totalCount} questions
                  </span>
                </div>
                <Progress
                  value={area.accuracy}
                  className={cn('h-2.5 rounded-full', cfg?.bar)}
                />
              </div>

              {/* Common mistakes */}
              {area.commonMistakes.length > 0 && (
                <div className="rounded-xl bg-muted/50 border border-border/50 p-4">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                    <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    Common Mistakes
                  </h4>
                  <ul className="space-y-1.5">
                    {area.commonMistakes.map((mistake, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                        {mistake}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended lessons */}
              {area.recommendedLessons.length > 0 && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-primary mb-3">
                    <BookOpen className="w-4 h-4 flex-shrink-0" />
                    Recommended Study Material
                  </h4>
                  <div className="space-y-1.5">
                    {area.recommendedLessons.map(lesson => (
                      <Link
                        key={lesson.code}
                        href={`/lessons/${lesson.code}`}
                        className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors group"
                      >
                        <span className="text-primary group-hover:translate-x-0.5 transition-transform">→</span>
                        {lesson.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button asChild className="flex-1 rounded-xl gap-2 shadow-sm shadow-primary/20">
                  <Link href={`/practice/${area.categoryCode}`}>
                    <ClipboardList className="w-4 h-4" />
                    Practice Now
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 rounded-xl gap-2">
                  <Link href={`/lessons?category=${area.categoryCode}`}>
                    <BookOpen className="w-4 h-4" />
                    Study Lessons
                  </Link>
                </Button>
              </div>

            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
