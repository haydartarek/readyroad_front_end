'use client';

import Link from 'next/link';
import { ClipboardList, Target, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

interface Activity {
  id: string;
  type: 'exam' | 'practice';
  date: string;
  score?: number;
  category?: string;
  passed?: boolean;
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

export function RecentActivityList({ activities }: { activities: Activity[] }) {
  const { t } = useLanguage();

  const TYPE_CONFIG = {
    exam:     { icon: ClipboardList, label: t('dashboard.activity_exam_label') },
    practice: { icon: Target,        label: t('dashboard.activity_practice_label') },
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

            const label =
              activity.type === 'practice' && activity.category
                ? `${t('dashboard.activity_practice_prefix')}${activity.category}`
                : cfg.label;

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
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString('en-US', DATE_FORMAT)}
                    </p>
                  </div>
                </div>

                {activity.score !== undefined && (
                  <div className="flex flex-shrink-0 items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-black leading-tight text-foreground">
                        {activity.score}%
                      </p>

                      {activity.passed !== undefined && (
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
                    </div>

                    <Link
                      href={`/${activity.type}/${activity.id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                    >
                      {t('dashboard.activity_view')}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
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
