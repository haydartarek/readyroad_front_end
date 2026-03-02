'use client';

import Link from 'next/link';
import { RefreshCw, ClipboardList, BarChart2, Timer, Zap, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────

interface TimeAnalysis {
  totalTime: string;
  averagePerQuestion: string;
  fastestQuestion: string;
  slowestQuestion: string;
}

interface ExamStatsProps {
  score: number;
  totalQuestions: number;
  passed: boolean;
  passingScore: number;
  timeAnalysis?: TimeAnalysis;
}

// ─── Helpers ─────────────────────────────────────────────

function toSafeNumber(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const TIME_ROWS = (t: TimeAnalysis) => [
  { label: 'Total Time',       value: t.totalTime,           color: 'text-foreground',  icon: Timer  },
  { label: 'Avg per Question', value: t.averagePerQuestion,  color: 'text-foreground',  icon: Clock  },
  { label: 'Fastest',          value: t.fastestQuestion,     color: 'text-green-600',   icon: Zap    },
  { label: 'Slowest',          value: t.slowestQuestion,     color: 'text-orange-500',  icon: Clock  },
] as const;

const NEXT_STEPS = [
  { label: 'Try Another Exam', href: '/exam',                  icon: RefreshCw,    variant: 'default'  as const },
  { label: 'Practice Mode',    href: '/practice',              icon: ClipboardList, variant: 'outline' as const },
  { label: 'View Analytics',   href: '/analytics/weak-areas',  icon: BarChart2,    variant: 'outline'  as const },
];

// ─── Component ───────────────────────────────────────────

export function ExamStats({
  score, totalQuestions, passed, passingScore, timeAnalysis,
}: ExamStatsProps) {
  const safeScore   = toSafeNumber(score);
  const safeTotal   = toSafeNumber(totalQuestions);
  const safePassing = toSafeNumber(passingScore);

  const percentage        = safeTotal === 0 ? '0.0' : ((safeScore  / safeTotal) * 100).toFixed(1);
  const passingPercentage = safeTotal === 0 ? '0'   : ((safePassing / safeTotal) * 100).toFixed(0);
  const wrongCount        = Math.max(0, safeTotal - safeScore);

  return (
    <div className="grid gap-6 md:grid-cols-2">

      {/* ── Score card ── */}
      <Card className={cn(
        'rounded-2xl border-2 shadow-sm',
        passed
          ? 'border-green-200 bg-green-50/40   dark:bg-green-950/20'
          : 'border-red-200   bg-red-50/40     dark:bg-red-950/20',
      )}>
        <CardHeader>
          <CardTitle className="text-center font-black">Your Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Big score */}
          <div className="text-center space-y-1">
            <div>
              <span className={cn('text-6xl font-black', passed ? 'text-green-600' : 'text-red-600')}>
                {safeScore}
              </span>
              <span className="text-3xl text-muted-foreground">/{safeTotal}</span>
            </div>
            <p className={cn('text-2xl font-black', passed ? 'text-green-600' : 'text-red-600')}>
              {percentage}%
            </p>
            <p className="text-xs text-muted-foreground">
              Required: {safePassing}/{safeTotal} ({passingPercentage}%)
            </p>
          </div>

          {/* Correct / Wrong */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-card border border-border/50 p-3 text-center">
              <p className="text-2xl font-black text-green-600">{safeScore}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Correct</p>
            </div>
            <div className="rounded-xl bg-card border border-border/50 p-3 text-center">
              <p className="text-2xl font-black text-red-600">{wrongCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Wrong</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Time analysis card ── */}
      {timeAnalysis && (
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="font-black">Time Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {TIME_ROWS(timeAnalysis).map(({ label, value, color, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    {label}
                  </div>
                  <span className={cn('text-sm font-bold', color)}>{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Next steps card ── */}
      <Card className={cn('rounded-2xl border-border/50 shadow-sm', timeAnalysis ? 'md:col-span-2' : '')}>
        <CardHeader>
          <CardTitle className="font-black">Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-3">
            {NEXT_STEPS.map(({ label, href, icon: Icon, variant }) => (
              <Button
                key={href}
                variant={variant}
                className={cn('w-full rounded-xl gap-2', variant === 'default' && 'shadow-sm shadow-primary/20')}
                asChild
              >
                <Link href={href}>
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
