'use client';

import Link from 'next/link';
import { ClipboardList, Target, CheckCircle2, XCircle, ArrowRight, Shuffle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

interface Activity {
  id: string;
  type: 'exam' | 'practice' | 'sign-exam';
  date: string;
  status?: 'COMPLETED' | 'IN_PROGRESS' | 'EXPIRED' | 'ABANDONED';
  score?: number;
  category?: string;
  signNameEn?: string;
  signNameNl?: string;
  signNameFr?: string;
  signNameAr?: string;
  passed?: boolean;
  questionsAnswered?: number;
  totalQuestions?: number;
  link?: string;
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

export function RecentActivityList({ activities }: { activities: Activity[] }) {
  const { t, language } = useLanguage();

  const TYPE_CONFIG = {
    exam:     { icon: ClipboardList, label: t('dashboard.activity_exam_label') },
    practice: { icon: Target,        label: t('dashboard.activity_practice_label') },
    'sign-exam': { icon: Shuffle,    label: t('dashboard.activity_sign_exam_label') },
  } as const;

  const statusConfig = {
    IN_PROGRESS: {
      label: t('dashboard.activity_status_in_progress'),
      className: 'bg-primary/10 text-primary border-primary/20',
    },
    EXPIRED: {
      label: t('dashboard.activity_status_expired'),
      className: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    ABANDONED: {
      label: t('dashboard.activity_status_abandoned'),
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
    COMPLETED: {
      label: t('dashboard.activity_status_completed'),
      className: 'bg-secondary/10 text-secondary border-secondary/20',
    },
  } as const;

  if (activities.length === 0) {
    return (
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="font-black text-secondary">
            {t('dashboard.recent_activity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('dashboard.no_activity')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="font-black text-secondary">
          {t('dashboard.recent_activity')}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => {
            const cfg = TYPE_CONFIG[activity.type];
            const Icon = cfg.icon;
            const localizedSignName =
              language === 'ar'
                ? activity.signNameAr
                : language === 'nl'
                  ? activity.signNameNl
                  : language === 'fr'
                    ? activity.signNameFr
                    : activity.signNameEn;

            const label =
              activity.type === 'practice' && (localizedSignName || activity.category)
                ? `${cfg.label} · ${localizedSignName ?? activity.category}`
                : activity.type === 'sign-exam' && (localizedSignName || activity.category)
                  ? `${cfg.label} · ${localizedSignName ?? activity.category}`
                : cfg.label;

            const status =
              activity.status && activity.status in statusConfig
                ? statusConfig[activity.status]
                : null;

            const progressLabel =
              activity.questionsAnswered !== undefined && activity.totalQuestions !== undefined
                ? `${activity.questionsAnswered}/${activity.totalQuestions} ${t('dashboard.activity_questions_progress')}`
                : null;

            const showScore = activity.score !== undefined;
            const showResult = showScore && activity.passed !== undefined;
            const shouldShowAction = Boolean(activity.link);

            return (
              <div
                key={activity.id}
                className="group flex items-center justify-between rounded-xl border border-border bg-background/60 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {label}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {new Date(activity.date).toLocaleDateString(
                          language === 'ar'
                            ? 'ar-SA'
                            : language === 'nl'
                              ? 'nl-BE'
                              : language === 'fr'
                                ? 'fr-BE'
                                : 'en-GB',
                          DATE_FORMAT,
                        )}
                      </span>
                      {progressLabel && <span>• {progressLabel}</span>}
                    </div>
                  </div>
                </div>

                {(showScore || status || shouldShowAction) && (
                  <div className="flex flex-shrink-0 items-center gap-4">
                    <div className="text-right space-y-1">
                      {showScore && (
                        <p className="text-lg font-black leading-tight text-foreground">
                          {activity.score}%
                        </p>
                      )}

                      {showResult && (
                        <div
                          className={cn(
                            'flex items-center justify-end gap-1 text-xs font-semibold',
                            activity.passed
                              ? 'text-primary'
                              : 'text-destructive'
                          )}
                        >
                          {activity.passed ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              {t('dashboard.result_passed')}
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              {t('dashboard.result_failed')}
                            </>
                          )}
                        </div>
                      )}

                      {!showResult && status && (
                        <div
                          className={cn(
                            'inline-flex items-center justify-end rounded-full border px-2 py-0.5 text-xs font-semibold',
                            status.className,
                          )}
                        >
                          {status.label}
                        </div>
                      )}
                    </div>

                    {shouldShowAction && (
                      <Link
                        href={activity.link ?? (activity.type === 'exam' ? `/exam/results/${activity.id}` : `/practice`)}
                        className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                      >
                        {activity.status === 'IN_PROGRESS'
                          ? t('dashboard.activity_resume')
                          : t('dashboard.activity_view')}
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
