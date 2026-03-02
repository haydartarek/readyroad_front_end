'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/language-context';

// ─── Types ───────────────────────────────────────────────

interface PracticeStatsProps {
  totalQuestions:  number;
  currentQuestion: number;
  correctAnswers:  number;
  wrongAnswers:    number;
  accuracy:        number;
}

// ─── Constants ───────────────────────────────────────────

interface StatCell {
  valueKey: 'accuracy' | 'correctAnswers' | 'wrongAnswers';
  labelKey: string;
  bg:       string;
  text:     string;
  subText:  string;
}

const STAT_CELLS: StatCell[] = [
  { valueKey: 'accuracy',       labelKey: 'practice.accuracy',      bg: 'bg-blue-50',  text: 'text-blue-600',  subText: 'text-blue-800'  },
  { valueKey: 'correctAnswers', labelKey: 'practice.correct_label', bg: 'bg-green-50', text: 'text-green-600', subText: 'text-green-800' },
  { valueKey: 'wrongAnswers',   labelKey: 'practice.wrong_label',   bg: 'bg-red-50',   text: 'text-red-600',   subText: 'text-red-800'   },
];

// ─── Component ───────────────────────────────────────────

export function PracticeStats({
  totalQuestions,
  currentQuestion,
  correctAnswers,
  wrongAnswers,
  accuracy,
}: PracticeStatsProps) {
  const { t } = useLanguage();

  const progressPct = totalQuestions === 0
    ? 0
    : ((currentQuestion - 1) / totalQuestions) * 100;

  const values: Record<StatCell['valueKey'], string> = {
    accuracy:       `${accuracy.toFixed(0)}%`,
    correctAnswers: String(correctAnswers),
    wrongAnswers:   String(wrongAnswers),
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">{t('practice.progress')}</span>
              <span className="text-muted-foreground">
                {t('practice.question_of')
                  .replace('{current}', String(currentQuestion))
                  .replace('{total}',   String(totalQuestions))}
              </span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {STAT_CELLS.map(cell => (
              <div key={cell.valueKey} className={`rounded-xl p-3 text-center ${cell.bg}`}>
                <p className={`text-2xl font-black ${cell.text}`}>
                  {values[cell.valueKey]}
                </p>
                <p className={`mt-1 text-xs ${cell.subText}`}>
                  {t(cell.labelKey)}
                </p>
              </div>
            ))}
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
