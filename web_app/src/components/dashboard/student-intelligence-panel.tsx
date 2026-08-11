"use client";

import Link from "@/components/localized-link";
import { useLanguage } from "@/contexts/language-context";
import {
  durationValue,
  intelligenceMetricValue,
  localizedPriorityName,
  signedMetricValue,
} from "@/lib/student-intelligence-presentation";
import type { StudentIntelligence } from "@/services/progressService";
import {
  ArrowRight,
  Brain,
  CalendarCheck2,
  Gauge,
  Target,
  TrendingDown,
  TrendingUp,
  Minus,
  ChevronDown,
} from "lucide-react";

export function StudentIntelligencePanel({
  data,
}: {
  data: StudentIntelligence;
}) {
  const { t, language } = useLanguage();
  const unavailable = t("common.not_available");

  if (data.dataStatus === "NO_DATA") {
    return (
      <section className="rounded-2xl border border-border bg-card px-5 py-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-primary">
              {t("student_intelligence.title")}
            </p>
            <h2 className="text-xl font-bold">
              {t("student_intelligence.no_data_title")}
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t("student_intelligence.no_data_description")}
            </p>
          </div>
          <Link
            href="/lessons"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            {t("student_intelligence.start_learning")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Link>
        </div>
      </section>
    );
  }

  const metrics = [
    {
      label: t("student_intelligence.readiness"),
      value: intelligenceMetricValue(data.examReadinessScore, unavailable),
      icon: Gauge,
    },
    {
      label: t("student_intelligence.pass_probability"),
      value: intelligenceMetricValue(
        data.estimatedPassProbability,
        unavailable,
      ),
      icon: Target,
    },
    {
      label: t("student_intelligence.consistency"),
      value: intelligenceMetricValue(
        data.learningConsistencyScore,
        unavailable,
      ),
      icon: CalendarCheck2,
    },
    {
      label: t("student_intelligence.retention"),
      value: intelligenceMetricValue(data.knowledgeRetentionScore, unavailable),
      icon: Brain,
    },
  ];
  const exam = data.examAnalytics;
  const timing = data.timingAnalytics;
  const journey = data.progressJourney;
  const examHistoryMetrics = [
    {
      label: t("student_intelligence.exam.total"),
      value: exam.totalExams.toString(),
    },
    {
      label: t("student_intelligence.exam.completed"),
      value: exam.completedExams.toString(),
    },
    {
      label: t("student_intelligence.exam.passed"),
      value: exam.passedExams.toString(),
    },
    {
      label: t("student_intelligence.exam.failed"),
      value: exam.failedExams.toString(),
    },
    {
      label: t("student_intelligence.exam.average_score"),
      value: intelligenceMetricValue(exam.averageScore, unavailable),
    },
    {
      label: t("student_intelligence.exam.highest_score"),
      value: intelligenceMetricValue(exam.highestScore, unavailable),
    },
    {
      label: t("student_intelligence.exam.lowest_score"),
      value: intelligenceMetricValue(exam.lowestScore, unavailable),
    },
    {
      label: t("student_intelligence.exam.pass_rate"),
      value: intelligenceMetricValue(exam.passRate, unavailable),
    },
    {
      label: t("student_intelligence.exam.average_duration"),
      value: durationValue(exam.averageCompletionTimeSeconds, unavailable),
    },
    {
      label: t("student_intelligence.exam.fastest_duration"),
      value: durationValue(exam.fastestCompletionTimeSeconds, unavailable),
    },
    {
      label: t("student_intelligence.exam.slowest_duration"),
      value: durationValue(exam.slowestCompletionTimeSeconds, unavailable),
    },
    {
      label: t("student_intelligence.exam.score_trend"),
      value: signedMetricValue(exam.scoreTrend, "%", unavailable),
    },
    {
      label: t("student_intelligence.exam.pass_trend"),
      value: signedMetricValue(exam.passTrend, "%", unavailable),
    },
  ];

  const TrendIcon =
    data.overallLearningTrend === "IMPROVING"
      ? TrendingUp
      : data.overallLearningTrend === "DECLINING"
        ? TrendingDown
        : Minus;
  const trendClass =
    data.overallLearningTrend === "IMPROVING"
      ? "text-green-600"
      : data.overallLearningTrend === "DECLINING"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <section
      className="rounded-2xl border border-border bg-card shadow-sm"
      aria-labelledby="student-intelligence-title"
    >
      <div className="grid gap-6 px-5 py-6 xl:grid-cols-[1fr_1.35fr]">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-primary">
              {t("student_intelligence.title")}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2
                id="student-intelligence-title"
                className="text-xl font-bold"
              >
                {t(
                  `student_intelligence.level.${data.studentLevel.toLowerCase()}`,
                )}
              </h2>
              <span
                className={`inline-flex items-center gap-1 text-sm font-semibold ${trendClass}`}
              >
                <TrendIcon className="h-4 w-4" aria-hidden />
                {t(
                  `student_intelligence.trend.${data.overallLearningTrend.toLowerCase()}`,
                )}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {data.dataStatus === "LIMITED"
                ? t("student_intelligence.limited_data")
                : t("student_intelligence.sufficient_data", {
                    count: data.evidenceQuestions,
                  })}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            {metrics.map(({ label, value, icon: Icon }) => (
              <div key={label} className="min-w-0">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-4 w-4 flex-none" aria-hidden />
                  <span className="truncate text-xs font-medium">{label}</span>
                </div>
                <p className="mt-1 text-lg font-bold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-5 xl:border-s xl:border-t-0 xl:ps-6 xl:pt-0">
          <h3 className="text-sm font-bold">
            {t("student_intelligence.next_steps")}
          </h3>
          <div className="mt-3 grid gap-3">
            {data.recommendations.map((recommendation) => {
              const category = recommendation.categoryCode
                ? data.learningPriorities.find(
                    (priority) =>
                      priority.categoryCode === recommendation.categoryCode,
                  )
                : undefined;
              return (
                <Link
                  key={`${recommendation.priority}-${recommendation.key}`}
                  href={recommendation.actionPath}
                  className="group flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-primary/10 bg-primary/[0.04] px-4 py-3 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/[0.07] hover:shadow-md"
                >
                  <span>
                    {t(recommendation.key, {
                      category: category
                        ? localizedPriorityName(category, language)
                        : "",
                    })}
                  </span>
                  <ArrowRight
                    className="h-4 w-4 flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              );
            })}
          </div>

          {data.learningPriorities.length > 0 && (
            <p className="mt-4 rounded-xl border border-secondary/15 bg-secondary/[0.05] px-3 py-2 text-xs font-medium text-muted-foreground">
              {t("student_intelligence.top_priority", {
                category: localizedPriorityName(
                  data.learningPriorities[0],
                  language,
                ),
                accuracy: Math.round(data.learningPriorities[0].accuracy),
              })}
            </p>
          )}
        </div>
      </div>

      <details className="group mx-5 mb-5 overflow-hidden rounded-2xl border border-border/60 bg-background/70 shadow-sm">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarCheck2 className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 break-words">
              {t("student_intelligence.history_details")}
            </span>
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>

        <div className="space-y-6 border-t border-border/60 px-4 py-5">
          <div>
            <h3 className="text-sm font-bold">
              {t("student_intelligence.exam_history")}
            </h3>
            <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
              {examHistoryMetrics.map((metric) => (
                <div key={metric.label} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">
                    {metric.label}
                  </dt>
                  <dd className="mt-0.5 font-semibold">{metric.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold">
                {t("student_intelligence.learning_journey")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3">
                {[
                  [
                    t("student_intelligence.journey.lessons"),
                    `${journey.lessonsCompleted}/${journey.lessonsStarted}`,
                  ],
                  [
                    t("student_intelligence.journey.lesson_revisits"),
                    journey.lessonRevisitCount === null
                      ? unavailable
                      : journey.lessonRevisitCount.toString(),
                  ],
                  [
                    t("student_intelligence.journey.practice_sessions"),
                    journey.completedPracticeSessions.toString(),
                  ],
                  [
                    t("student_intelligence.journey.active_today"),
                    journey.activeToday
                      ? t("student_intelligence.journey.yes")
                      : t("student_intelligence.journey.no"),
                  ],
                  [
                    t("student_intelligence.journey.active_days"),
                    journey.activeDaysLast30.toString(),
                  ],
                  [
                    t("student_intelligence.journey.study_streak"),
                    journey.currentStudyStreak.toString(),
                  ],
                  [
                    t("student_intelligence.journey.weekly_progress"),
                    signedMetricValue(data.weeklyProgress, "%", unavailable),
                  ],
                  [
                    t("student_intelligence.journey.monthly_progress"),
                    signedMetricValue(data.monthlyProgress, "%", unavailable),
                  ],
                  [
                    t("student_intelligence.journey.mastered_categories"),
                    journey.masteredCategories.toString(),
                  ],
                  [
                    t("student_intelligence.journey.mastered_signs"),
                    journey.masteredSigns.toString(),
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-bold">
                {t("student_intelligence.timing.title")}
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t("student_intelligence.timing.average_answer")}
                  </dt>
                  <dd className="mt-0.5 font-semibold">
                    {durationValue(
                      timing.averageAnswerTimeSeconds,
                      unavailable,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t("student_intelligence.timing.answer_trend")}
                  </dt>
                  <dd className="mt-0.5 font-semibold">
                    {signedMetricValue(
                      timing.answerTimeTrendSeconds,
                      "s",
                      unavailable,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t("student_intelligence.timing.exam_trend")}
                  </dt>
                  <dd className="mt-0.5 font-semibold">
                    {signedMetricValue(
                      timing.examTimeTrendSeconds,
                      "s",
                      unavailable,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t("student_intelligence.timing.samples")}
                  </dt>
                  <dd className="mt-0.5 font-semibold">
                    {timing.answerTimingSamples}
                  </dd>
                </div>
              </dl>
              {timing.answerTimingScope === "LATEST_RECORDED_PER_QUESTION" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("student_intelligence.timing.scope_note")}
                </p>
              )}
              {timing.categoryTimings.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold">
                    {t("student_intelligence.timing.by_category")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {timing.categoryTimings.slice(0, 4).map((category) => (
                      <span
                        key={category.categoryCode}
                        className="rounded-md border border-border px-2.5 py-1 text-xs"
                      >
                        {localizedPriorityName(category, language)} ·{" "}
                        {durationValue(
                          category.averageAnswerTimeSeconds,
                          unavailable,
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {data.strongestCategories.length > 0 && (
            <div>
              <h3 className="text-sm font-bold">
                {t("student_intelligence.strongest_categories")}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.strongestCategories.map((category) => (
                  <span
                    key={category.categoryCode}
                    className="rounded-md border border-border px-2.5 py-1 text-xs"
                  >
                    {localizedPriorityName(category, language)} ·{" "}
                    {Math.round(category.accuracy)}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </details>
    </section>
  );
}
