"use client";

import Link from "@/components/localized-link";
import {
  ClipboardList,
  Target,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Shuffle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

interface Activity {
  id: string;
  type: "exam" | "practice" | "sign-exam";
  date: string;
  status?: "COMPLETED" | "IN_PROGRESS" | "EXPIRED" | "ABANDONED";
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
  month: "short",
  day: "numeric",
  year: "numeric",
  calendar: "gregory",
};

export function formatActivityDate(date: string, language: string): string {
  const locale =
    language === "ar"
      ? "ar-BE-u-ca-gregory"
      : language === "nl"
        ? "nl-BE-u-ca-gregory"
        : language === "fr"
          ? "fr-BE-u-ca-gregory"
          : "en-GB-u-ca-gregory";
  return new Intl.DateTimeFormat(locale, DATE_FORMAT).format(new Date(date));
}

export function RecentActivityList({ activities }: { activities: Activity[] }) {
  const { t, language } = useLanguage();

  const TYPE_CONFIG = {
    exam: { icon: ClipboardList, label: t("dashboard.activity_exam_label") },
    practice: { icon: Target, label: t("dashboard.activity_practice_label") },
    "sign-exam": {
      icon: Shuffle,
      label: t("dashboard.activity_sign_exam_label"),
    },
  } as const;

  const statusConfig = {
    IN_PROGRESS: {
      label: t("dashboard.activity_status_in_progress"),
      className: "bg-primary/10 text-primary border-primary/20",
    },
    EXPIRED: {
      label: t("dashboard.activity_status_expired"),
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    ABANDONED: {
      label: t("dashboard.activity_status_abandoned"),
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
    COMPLETED: {
      label: t("dashboard.activity_status_completed"),
      className: "bg-secondary/10 text-secondary border-secondary/20",
    },
  } as const;

  if (activities.length === 0) {
    return (
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="font-black text-secondary">
            {t("dashboard.recent_activity")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("dashboard.no_activity")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="font-black text-secondary">
          {t("dashboard.recent_activity")}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => {
            const cfg = TYPE_CONFIG[activity.type];
            const Icon = cfg.icon;
            const localizedSignName =
              language === "ar"
                ? activity.signNameAr
                : language === "nl"
                  ? activity.signNameNl
                  : language === "fr"
                    ? activity.signNameFr
                    : activity.signNameEn;

            const label =
              activity.type === "practice" &&
              (localizedSignName || activity.category)
                ? `${cfg.label} · ${localizedSignName ?? activity.category}`
                : activity.type === "sign-exam" &&
                    (localizedSignName || activity.category)
                  ? `${cfg.label} · ${localizedSignName ?? activity.category}`
                  : cfg.label;

            const status =
              activity.status && activity.status in statusConfig
                ? statusConfig[activity.status]
                : null;

            const progressLabel =
              activity.questionsAnswered !== undefined &&
              activity.totalQuestions !== undefined
                ? `${activity.questionsAnswered}/${activity.totalQuestions} ${t("dashboard.activity_questions_progress")}`
                : null;

            const showScore = activity.score !== undefined;
            const showResult = showScore && activity.passed !== undefined;
            const shouldShowAction = Boolean(activity.link);

            return (
              <div
                key={activity.id}
                data-testid="recent-activity-card"
                className="group flex min-w-0 flex-col items-center gap-3 rounded-xl border border-border bg-background/60 p-4 text-center transition-colors hover:bg-muted/50 sm:flex-row sm:justify-between sm:text-start"
              >
                <div className="flex min-w-0 max-w-full flex-col items-center gap-2 sm:flex-row sm:gap-3">
                  <div
                    data-testid="recent-activity-icon"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-primary/10"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                  </div>

                  <div className="min-w-0 max-w-full text-center sm:text-start">
                    <p
                      data-testid="recent-activity-name"
                      className="line-clamp-2 min-w-0 max-w-full break-words text-sm font-semibold text-foreground sm:truncate"
                    >
                      {label}
                    </p>
                    <div
                      data-testid="recent-activity-meta"
                      className="mt-1 flex min-w-0 max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:mt-0.5 sm:justify-start"
                    >
                      <span>
                        {formatActivityDate(activity.date, language)}
                      </span>
                      {progressLabel && <span>• {progressLabel}</span>}
                    </div>
                  </div>
                </div>

                {(showScore || status || shouldShowAction) && (
                  <div className="flex min-w-0 w-full max-w-full flex-col items-center gap-3 sm:w-auto sm:flex-shrink-0 sm:flex-row sm:gap-4">
                    <div className="space-y-1 text-center sm:text-end">
                      {showScore && (
                        <p
                          data-testid="recent-activity-score"
                          className="text-lg font-black leading-tight text-foreground"
                        >
                          {activity.score}%
                        </p>
                      )}

                      {showResult && (
                        <div
                          data-testid="recent-activity-status"
                          className={cn(
                            "flex items-center justify-center gap-1 text-xs font-semibold sm:justify-end",
                            activity.passed
                              ? "text-primary"
                              : "text-destructive",
                          )}
                        >
                          {activity.passed ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              {t("dashboard.result_passed")}
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              {t("dashboard.result_failed")}
                            </>
                          )}
                        </div>
                      )}

                      {!showResult && status && (
                        <div
                          data-testid="recent-activity-status"
                          className={cn(
                            "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold sm:justify-end",
                            status.className,
                          )}
                        >
                          {status.label}
                        </div>
                      )}
                    </div>

                    {shouldShowAction && (
                      <Link
                        data-testid="recent-activity-action"
                        href={
                          activity.link ??
                          (activity.type === "exam"
                            ? `/exam/results/${activity.id}`
                            : `/practice`)
                        }
                        className="flex min-h-9 w-full max-w-full items-center justify-center gap-1 rounded-full border border-primary/20 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5 hover:text-primary/80 sm:min-h-0 sm:w-auto sm:rounded-none sm:border-0 sm:p-0 sm:hover:bg-transparent"
                      >
                        {activity.status === "IN_PROGRESS"
                          ? t("dashboard.activity_resume")
                          : t("dashboard.activity_view")}
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
