'use client';

import Link from 'next/link';
import { AlertTriangle, BookOpen, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

// ─── Types ───────────────────────────────────────────────

interface WeakArea {
  categoryCode: string;
  categoryName: string;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  estimatedTime: string;
  commonMistakes: string[];
  recommendedLessons: Array<{ code: string; title: string }>;
  accuracyGap?: number;
  recommendedQuestions?: number;
  recommendedDifficulty?: string;
}

// ─── Helpers ─────────────────────────────────────────────

type Severity = 'critical' | 'weak';

function getSeverity(accuracy: number): Severity | null {
  if (accuracy < 50)  return 'critical';
  if (accuracy < 80)  return 'weak';   // matches backend TARGET_ACCURACY = 80%
  return null;
}

const SEVERITY = {
  critical: {
    card:      'border-destructive/30 bg-destructive/5',
    badge:     'bg-destructive',
    accuracy:  'text-destructive',
    bar:       '[&>div]:bg-destructive',
    labelKey:  'analytics.badge_critical',
  },
  weak: {
    card:      'border-primary/30 bg-primary/5',
    badge:     'bg-primary',
    accuracy:  'text-primary',
    bar:       '[&>div]:bg-primary',
    labelKey:  'analytics.needs_practice',
  },
} as const;


// ─── Component ───────────────────────────────────────────

export function WeakAreaDetails({ weakAreas }: { weakAreas: WeakArea[] }) {
  const { t } = useLanguage();

  if (weakAreas.length === 0) {
    return (
      <Card className="rounded-2xl border-border/50 bg-muted/20 shadow-sm">
        <CardContent className="py-16 text-center space-y-3">
          <div className="text-6xl">🎉</div>
          <h3 className="text-2xl font-black text-foreground">
            {t('analytics.excellent_title')}
          </h3>
          <p className="text-muted-foreground">
            {t('analytics.excellent_desc')}
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
                        {t(cfg.labelKey)}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl font-black">{area.categoryName}</CardTitle>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={cn('text-4xl font-black', cfg?.accuracy ?? 'text-secondary')}>
                    {area.accuracy.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">{t('analytics.stat_accuracy')}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">

              {/* Stats */}
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: t('analytics.stat_correct'),        value: area.correctCount,                  color: 'text-secondary'   },
                  { label: t('analytics.stat_wrong'),          value: area.totalCount - area.correctCount, color: 'text-destructive' },
                  { label: t('analytics.stat_estimated_time'), value: area.estimatedTime,                  color: 'text-primary'     },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl bg-card border border-border/50 p-4 text-center">
                    <p className={cn('text-2xl font-black', color)}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold text-foreground">{t('analytics.your_progress')}</span>
                  <span className="text-muted-foreground">
                    {area.correctCount}/{area.totalCount} questions
                  </span>
                </div>
                <Progress
                  value={area.accuracy}
                  className={cn('h-2.5 rounded-full', cfg?.bar)}
                />
              </div>

              {/* Improvement plan */}
              {(area.recommendedQuestions != null || area.recommendedDifficulty) && (
                <div className="rounded-xl bg-muted/40 border border-border/50 p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    🎯 {t('analytics.improvement_plan')}
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {area.recommendedQuestions != null && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{area.recommendedQuestions}</span>
                        {t('analytics.recommended_questions')}
                      </div>
                    )}
                    {area.recommendedDifficulty && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground capitalize">
                          {area.recommendedDifficulty.toLowerCase()}
                        </span>
                        {t('analytics.stat_difficulty')}
                      </div>
                    )}
                    {(area.accuracyGap ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <span className="font-semibold text-primary">+{area.accuracyGap?.toFixed(0)}%</span>
                        {t('analytics.accuracy_needed')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Common mistakes */}
              {area.commonMistakes.length > 0 && (
                <div className="rounded-xl bg-muted/50 border border-border/50 p-4">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                    <AlertTriangle className="w-4 h-4 text-primary flex-shrink-0" />
                    {t('analytics.common_mistakes')}
                  </h4>
                  <ul className="space-y-1.5">
                    {area.commonMistakes.map((mistake, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-destructive" />
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
                    {t('analytics.recommended_material')}
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
                    {t('analytics.practice_now')}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 rounded-xl gap-2">
                  <Link href={`/lessons?category=${area.categoryCode}`}>
                    <BookOpen className="w-4 h-4" />
                    {t('analytics.study_lessons')}
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
