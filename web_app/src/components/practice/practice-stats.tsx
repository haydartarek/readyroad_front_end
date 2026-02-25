'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/language-context';

interface PracticeStatsProps {
  totalQuestions: number;
  currentQuestion: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
}

export function PracticeStats({
  totalQuestions,
  currentQuestion,
  correctAnswers,
  wrongAnswers,
  accuracy,
}: PracticeStatsProps) {
  const { t } = useLanguage();
  const progressPercentage = totalQuestions === 0 ? 0 : ((currentQuestion - 1) / totalQuestions) * 100;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">{t('practice.progress')}</span>
              <span className="text-muted-foreground">
                {t('practice.question_of').replace('{current}', String(currentQuestion)).replace('{total}', String(totalQuestions))}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center rounded-lg bg-blue-50 p-3">
              <div className="text-2xl font-bold text-blue-600">
                {accuracy.toFixed(0)}%
              </div>
              <div className="text-xs text-blue-800 mt-1">{t('practice.accuracy')}</div>
            </div>
            <div className="text-center rounded-lg bg-green-50 p-3">
              <div className="text-2xl font-bold text-green-600">
                {correctAnswers}
              </div>
              <div className="text-xs text-green-800 mt-1">{t('practice.correct_label')}</div>
            </div>
            <div className="text-center rounded-lg bg-red-50 p-3">
              <div className="text-2xl font-bold text-red-600">
                {wrongAnswers}
              </div>
              <div className="text-xs text-red-800 mt-1">{t('practice.wrong_label')}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
