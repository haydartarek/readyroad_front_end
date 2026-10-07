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
import { PageSectionSurface } from "@/components/ui/page-surface";
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
    exam: {
      icon: ClipboardList,
      label: t("dashboard.activity_exam_label"),
    },
    practice: {
      icon: Target,
      label: t("dashboard.activity_practice_label"),
    },
    "sign-exam": {
      icon: Shuffle,
      label: t("dashboard.activity_sign_exam_label"),
    },
  } as const;

  const statusConfig = {
    IN_PROGRESS: {
      label: t("dashboard.activity_status_in_progress"),
      className: "text-primary",
    },
    EXPIRED: {
      label: t("dashboard.activity_status_expired"),
      className: "text-amber-700 dark:text-amber-400",
    },
    ABANDONED: {
      label: t("dashboard.activity_status_abandoned"),
      className: "text-destructive",
    },
    COMPLETED: {
      label: t("dashboard.activity_status_completed"),
      className: "text-secondary",
    },
  } as const;

  if (activities.length === 0) {
    return (
      <PageSectionSurface
        title={t("dashboard.recent_activity")}
        contentClassName="space-y-0"
      >
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("dashboard.no_activity")}
        </p>
      </PageSectionSurface>
    );
  }

  return (
    <PageSectionSurface
      title={t("dashboard.recent_activity")}
      contentClassName="space-y-0"
    >
      <div className="divide-y divide-border/60">
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

          const subject =
            localizedSignName ?? activity.category ?? null;

          const label =
            subject &&
            (activity.type === "practice" ||
              activity.type === "sign-exam")
              ? `${cfg.label} \u00B7 ${subject}`
              : cfg.label;

          const status =
            activity.status && activity.status in statusConfig
              ? statusConfig[activity.status]
              : null;

          const progressLabel =
            activity.questionsAnswered !== undefined &&
            activity.totalQuestions !== undefined
              ? `${activity.questionsAnswered}/${activity.totalQuestions} ${t(
                  "dashboard.activity_questions_progress",
                )}`
              : null;

          const showScore = activity.score !== undefined;
          const showResult =
            showScore && activity.passed !== undefined;

          const shouldShowAction = Boolean(activity.link);

          return (
            <div
              key={activity.id}
              data-testid="recent-activity-card"
              className="group flex min-h-16 min-w-0 flex-col gap-4 py-4 text-start transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-start sm:gap-6"
            >
              <div className="flex min-w-0 items-center gap-4 sm:w-80 sm:shrink-0">
                <span
                  data-testid="recent-activity-icon"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-secondary/10 text-secondary"
                >
                  <Icon
                    className="h-4 w-4"
                    aria-hidden
                  />
                </span>

                <div className="min-w-0">
                  <p
                    data-testid="recent-activity-name"
                    className="line-clamp-2 break-words text-sm font-semibold text-foreground sm:truncate"
                  >
                    {label}
                  </p>

                  <div
                    data-testid="recent-activity-meta"
                    className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span>
                      {formatActivityDate(
                        activity.date,
                        language,
                      )}
                    </span>

                    {progressLabel ? (
                      <>
                        <span aria-hidden="true">
                          {"\u00B7"}
                        </span>

                        <span>
                          {progressLabel}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 w-full items-center justify-between gap-4 sm:w-48 sm:shrink-0">
                {(showScore || status) ? (
                  <div className="flex min-w-0 items-center gap-2">
                    {showScore ? (
                      <p
                        data-testid="recent-activity-score"
                        dir="ltr"
                        className="text-base font-black leading-none text-foreground"
                      >
                        {activity.score}%
                      </p>
                    ) : null}

                    {showResult ? (
                      <div
                        data-testid="recent-activity-status"
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-semibold",
                          activity.passed
                            ? "text-green-600 dark:text-green-400"
                            : "text-destructive",
                        )}
                      >
                        {activity.passed ? (
                          <>
                            <CheckCircle2
                              className="h-3 w-3"
                              aria-hidden
                            />

                            {t("dashboard.result_passed")}
                          </>
                        ) : (
                          <>
                            <XCircle
                              className="h-3 w-3"
                              aria-hidden
                            />

                            {t("dashboard.result_failed")}
                          </>
                        )}
                      </div>
                    ) : null}

                    {!showResult && status ? (
                      <div
                        data-testid="recent-activity-status"
                        className={cn(
                          "inline-flex items-center text-xs font-semibold",
                          status.className,
                        )}
                      >
                        {status.label}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <span aria-hidden="true" />
                )}

                {shouldShowAction ? (
                  <Link
                    data-testid="recent-activity-action"
                    href={
                      activity.link ??
                      (activity.type === "exam"
                        ? `/exam/results/${activity.id}`
                        : "/practice")
                    }
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5 hover:text-primary/80 sm:min-h-9"
                  >
                    {activity.status === "IN_PROGRESS"
                      ? t("dashboard.activity_resume")
                      : t("dashboard.activity_view")}

                    <ArrowRight
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        language === "ar"
                          ? "rotate-180 group-hover:-translate-x-0.5"
                          : "group-hover:translate-x-0.5",
                      )}
                      aria-hidden
                    />
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </PageSectionSurface>
  );
}