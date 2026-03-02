'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/language-context';

// ─── Types ───────────────────────────────────────────────

interface PracticeCompleteProps {
  categoryName?:  string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers:   number;
  accuracy:       number;
  onRestart:      () => void;
}

// ─── Constants ───────────────────────────────────────────

interface PerformanceTier {
  minAccuracy: number;
  titleKey:    string;
  descKey:     string;
  color:       string;
}

const PERFORMANCE_TIERS: PerformanceTier[] = [
  { minAccuracy: 90, titleKey: 'practice.outstanding',    descKey: 'practice.outstanding_desc',    color: 'text-green-700'  },
  { minAccuracy: 75, titleKey: 'practice.good_job',       descKey: 'practice.good_job_desc',       color: 'text-blue-700'   },
  { minAccuracy: 50, titleKey: 'practice.keep_practicing', descKey: 'practice.keep_practicing_desc', color: 'text-orange-700' },
  { minAccuracy:  0, titleKey: 'practice.more_study',     descKey: 'practice.more_study_desc',     color: 'text-red-700'    },
];

const NEXT_STEPS = [
  { href: '/lessons',             labelKey: 'practice.study_lessons' },
  { href: '/exam',                labelKey: 'practice.take_exam'     },
  { href: '/analytics/weak-areas', labelKey: 'practice.view_analytics' },
] as const;

// ─── Sub-components ──────────────────────────────────────

function StatBox({
  value,
  label,
  className = '',
}: {
  value: number;
  label: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl p-4 text-center ${className}`}>
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export function PracticeComplete({
  categoryName,
  totalQuestions,
  correctAnswers,
  wrongAnswers,
  accuracy,
  onRestart,
}: PracticeCompleteProps) {
  const { t } = useLanguage();

  const isPassing = accuracy >= 85;

  const tier = PERFORMANCE_TIERS.find(p => accuracy >= p.minAccuracy)
    ?? PERFORMANCE_TIERS[PERFORMANCE_TIERS.length - 1];

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="space-y-6">

        {/* Header */}
        <div className="text-center">
          <p className="mb-4 text-6xl" aria-hidden>{isPassing ? '🎉' : '💪'}</p>
          <h1 className="text-4xl font-black">
            {isPassing ? t('practice.excellent_work') : t('practice.practice_complete')}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {categoryName
              ? t('practice.completed_for').replace('{category}', categoryName)
              : t('practice.completed_session')}
          </p>
        </div>

        {/* Score card */}
        <Card className={isPassing ? 'border-green-500 bg-green-50/50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('practice.your_score')}</span>
              <Badge className={isPassing ? 'bg-green-600 text-white' : ''} variant={isPassing ? 'default' : 'secondary'}>
                {accuracy.toFixed(1)}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={accuracy} className="h-3" />
            <div className="grid grid-cols-3 gap-4">
              <StatBox value={totalQuestions} label={t('practice.total_label')}   className="bg-muted"      />
              <StatBox value={correctAnswers} label={t('practice.correct_label')} className="bg-green-50 text-green-600" />
              <StatBox value={wrongAnswers}   label={t('practice.wrong_label')}   className="bg-red-50 text-red-600"     />
            </div>
          </CardContent>
        </Card>

        {/* Performance message */}
        <Card>
          <CardContent className="pt-6 text-center">
            <p className={`text-lg font-black ${tier.color}`}>{t(tier.titleKey)}</p>
            <p className="mt-2 text-muted-foreground">{t(tier.descKey)}</p>
          </CardContent>
        </Card>

        {/* Primary actions */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button size="lg" onClick={onRestart}>
            {t('practice.practice_again')}
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/practice">{t('practice.choose_category')}</Link>
          </Button>
        </div>

        {/* Next steps */}
        <Card>
          <CardHeader>
            <CardTitle className="font-black">{t('practice.whats_next')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {NEXT_STEPS.map(step => (
                <Button key={step.href} variant="outline" asChild>
                  <Link href={step.href}>{t(step.labelKey)}</Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
