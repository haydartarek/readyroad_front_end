"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import apiClient, { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Trophy,
  XCircle,
  Clock,
  ChevronRight,
  ClipboardList,
  RefreshCw,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────

interface ExamHistoryItem {
  examId: number;
  startedAt: string;
  completedAt: string | null;
  status: "COMPLETED" | "IN_PROGRESS" | "ABANDONED" | "EXPIRED";
  scorePercentage: number;
  totalQuestions: number;
  correctAnswers: number;
  passed: boolean;
}

interface ExamHistoryResponse {
  totalExams: number;
  exams: ExamHistoryItem[];
}

// ─── Component ───────────────────────────────────────────

export default function ExamResultsPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [data, setData] = useState<ExamHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceDown, setServiceDown] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ExamHistoryResponse>(
        "/exams/simulations/history",
      );
      setData(res.data);
    } catch (err) {
      if (isServiceUnavailable(err)) {
        setServiceDown(true);
        return;
      }
      logApiError("ExamResultsPage", err);
      setError(t("common.load_error"));
    } finally {
      setIsLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ── Format date by active language ──
  function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(
      language === "ar"
        ? "ar-SA"
        : language === "nl"
          ? "nl-BE"
          : language === "fr"
            ? "fr-BE"
            : "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  }

  return (
    <div className="space-y-6">
      {serviceDown && <ServiceUnavailableBanner />}

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-background border border-amber-500/15 px-6 py-7 shadow-sm">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6 text-amber-600" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-amber-600">
              {t("user_sidebar.exam_results")}
            </p>
            <h1 className="text-3xl font-black tracking-tight">
              {t("user_sidebar.exam_history_title")}
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              {t("user_sidebar.exam_history_subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-muted/60 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {!isLoading && error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center space-y-3">
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHistory}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t("common.retry")}
          </Button>
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && !error && data && data.exams.length === 0 && (
        <div className="rounded-2xl border border-border bg-muted/30 p-10 text-center space-y-3">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="font-semibold text-foreground">
            {t("user_sidebar.exam_no_results")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("user_sidebar.exam_no_results_hint")}
          </p>
          <Button asChild className="mt-2 rounded-xl">
            <Link href="/exam">{t("user_sidebar.take_first_exam")}</Link>
          </Button>
        </div>
      )}

      {/* ── Results list ── */}
      {!isLoading && !error && data && data.exams.length > 0 && (
        <div className="space-y-6">
          {/* Summary stats */}
          {(() => {
            const passedCount = data.exams.filter((e) => e.passed).length;
            const failedCount = data.exams.filter(
              (e) => !e.passed && e.status === "COMPLETED",
            ).length;
            const passRate =
              data.totalExams > 0
                ? Math.round((passedCount / data.totalExams) * 100)
                : 0;
            return (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border bg-card px-4 py-3 text-center space-y-0.5 shadow-sm">
                  <p className="text-2xl font-black text-foreground">
                    {data.totalExams}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {t("user_sidebar.exam_total_taken")}
                  </p>
                </div>
                <div className="rounded-2xl border border-green-100 bg-green-50/60 px-4 py-3 text-center space-y-0.5 shadow-sm">
                  <p className="text-2xl font-black text-green-600">
                    {passedCount}
                  </p>
                  <p className="text-xs text-green-600/80 font-medium">
                    {t("dashboard.result_passed")}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card px-4 py-3 text-center space-y-0.5 shadow-sm">
                  <p className="text-2xl font-black text-foreground">
                    {passRate}%
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {t("progress.pass_rate")}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Exam list */}
          <div className="space-y-3">
            {data.exams.map((exam, index) => {
              const isCompleted = exam.status === "COMPLETED";
              const pct = Math.round(exam.scorePercentage ?? 0);
              const isPassed = isCompleted && exam.passed;
              const isFailed = isCompleted && !exam.passed;

              return (
                <Link
                  key={exam.examId}
                  href={isCompleted ? `/exam/results/${exam.examId}` : "#"}
                  className={cn(
                    "group block rounded-2xl border bg-card shadow-sm overflow-hidden transition-all duration-200",
                    "hover:shadow-md hover:-translate-y-[1px]",
                    isPassed ? "border-green-200 hover:border-green-400" : "",
                    isFailed ? "border-red-200   hover:border-red-400" : "",
                    !isCompleted
                      ? "border-border opacity-60 pointer-events-none"
                      : "",
                  )}
                >
                  {/* Accent top strip */}
                  <div
                    className={cn(
                      "h-1 w-full",
                      isPassed
                        ? "bg-gradient-to-r from-green-400 to-emerald-500"
                        : "",
                      isFailed
                        ? "bg-gradient-to-r from-red-400   to-rose-500"
                        : "",
                      !isCompleted ? "bg-muted" : "",
                    )}
                  />

                  <div className="p-5 flex items-center gap-4">
                    {/* Icon bubble */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                        isPassed ? "bg-green-100  text-green-600" : "",
                        isFailed ? "bg-red-100    text-red-600" : "",
                        !isCompleted ? "bg-muted   text-muted-foreground" : "",
                      )}
                    >
                      {isCompleted ? (
                        exam.passed ? (
                          <Trophy className="w-6 h-6" />
                        ) : (
                          <XCircle className="w-6 h-6" />
                        )
                      ) : (
                        <Clock className="w-6 h-6" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground">
                          {t("user_sidebar.exam_number")} #
                          {data.totalExams - index}
                        </span>
                        {isCompleted ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                              isPassed
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100   text-red-700",
                            )}
                          >
                            {isPassed ? t("exam.passed") : t("exam.failed")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {exam.status}
                          </span>
                        )}
                      </div>

                      {/* Date */}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 opacity-60" />
                        {formatDate(exam.completedAt ?? exam.startedAt)}
                      </p>

                      {/* Score bar */}
                      {isCompleted && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {exam.correctAnswers}/{exam.totalQuestions}{" "}
                              {t("exam.correct_answers")}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                isPassed
                                  ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                  : "bg-gradient-to-r from-red-400   to-rose-500",
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Score badge */}
                    {isCompleted && (
                      <div
                        className={cn(
                          "shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 font-black text-xl leading-none",
                          isPassed
                            ? "bg-green-50  border-green-200 text-green-700"
                            : "bg-red-50    border-red-200   text-red-600",
                        )}
                      >
                        <span>{pct}</span>
                        <span className="text-xs font-semibold mt-0.5">%</span>
                      </div>
                    )}

                    {/* Arrow */}
                    {isCompleted && (
                      <ChevronRight
                        className={cn(
                          "w-5 h-5 shrink-0 transition-all duration-150 group-hover:translate-x-1",
                          isPassed ? "text-green-500" : "text-red-400",
                        )}
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
