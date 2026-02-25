'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/language-context';

interface PracticeCompleteProps {
  categoryName?: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  onRestart: () => void;
}

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

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="space-y-6">
        {/* Celebration Header */}
        <div className="text-center">
          <div className="text-6xl mb-4">{isPassing ? '🎉' : '💪'}</div>
          <h1 className="text-4xl font-bold">
            {isPassing ? t('practice.excellent_work') : t('practice.practice_complete')}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {categoryName
              ? t('practice.completed_for').replace('{category}', categoryName)
              : t('practice.completed_session')}
          </p>
        </div>

        {/* Score Card */}
        <Card className={isPassing ? 'border-green-500 bg-green-50/50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('practice.your_score')}</span>
              <Badge
                variant={isPassing ? 'default' : 'secondary'}
                className={isPassing ? 'bg-green-600 text-white' : ''}
              >
                {accuracy.toFixed(1)}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Progress value={accuracy} className="h-3" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center rounded-lg bg-muted p-4">
                <div className="text-3xl font-bold">{totalQuestions}</div>
                <div className="text-sm text-muted-foreground mt-1">{t('practice.total_label')}</div>
              </div>
              <div className="text-center rounded-lg bg-green-50 p-4">
                <div className="text-3xl font-bold text-green-600">{correctAnswers}</div>
                <div className="text-sm text-muted-foreground mt-1">{t('practice.correct_label')}</div>
              </div>
              <div className="text-center rounded-lg bg-red-50 p-4">
                <div className="text-3xl font-bold text-red-600">{wrongAnswers}</div>
                <div className="text-sm text-muted-foreground mt-1">{t('practice.wrong_label')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Message */}
        <Card>
          <CardContent className="pt-6">
            {accuracy >= 90 ? (
              <div className="text-center">
                <p className="text-lg font-semibold text-green-700">{t('practice.outstanding')}</p>
                <p className="mt-2 text-muted-foreground">{t('practice.outstanding_desc')}</p>
              </div>
            ) : accuracy >= 75 ? (
              <div className="text-center">
                <p className="text-lg font-semibold text-blue-700">{t('practice.good_job')}</p>
                <p className="mt-2 text-muted-foreground">{t('practice.good_job_desc')}</p>
              </div>
            ) : accuracy >= 50 ? (
              <div className="text-center">
                <p className="text-lg font-semibold text-orange-700">{t('practice.keep_practicing')}</p>
                <p className="mt-2 text-muted-foreground">{t('practice.keep_practicing_desc')}</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg font-semibold text-red-700">{t('practice.more_study')}</p>
                <p className="mt-2 text-muted-foreground">{t('practice.more_study_desc')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button size="lg" onClick={onRestart}>
            {t('practice.practice_again')}
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/practice">
              {t('practice.choose_category')}
            </Link>
          </Button>
        </div>

        {/* Additional Options */}
        <Card>
          <CardHeader>
            <CardTitle>{t('practice.whats_next')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <Button variant="outline" asChild>
                <Link href="/lessons">
                  {t('practice.study_lessons')}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/exam">
                  {t('practice.take_exam')}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/analytics/weak-areas">
                  {t('practice.view_analytics')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
