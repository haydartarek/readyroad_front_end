"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import apiClient, { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getRandomPracticeHistory,
  getRandomPracticeResult,
  getSignExamHistory,
  getSignExamResultById,
  type SignRandomPracticeHistoryResponse,
  type SignRandomPracticeResult,
  type SignExamHistoryResponse,
  type SignExamHistoryItem,
  type SignExamResult,
} from "@/services/signQuizService";
import {
  Trophy,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Shuffle,
  Shield,
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

interface AllAnsweredQuestion {
  questionId: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  selectedOptionText: string;
  correctOptionText: string;
  categoryName: string;
  categoryCode: string;
  contentImageUrl?: string;
  isCorrect: boolean;
}

interface CategoryBreakdown {
  categoryCode: string;
  categoryNameEn: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
}

interface ExamDetail {
  allAnswers: AllAnsweredQuestion[];
  categoryBreakdown: CategoryBreakdown[];
}

type StoredSignExamResult = SignExamResult;

// ─── Component ───────────────────────────────────────────

export function ExamResultsPageContent() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const highlightedRandomSessionId = Number.parseInt(
    searchParams.get("randomSignExamId") ?? "",
    10,
  );
  const highlightedSignResultId = Number.parseInt(
    searchParams.get("signExamResultId") ?? "",
    10,
  );

  const [data, setData] = useState<ExamHistoryResponse | null>(null);
  const [randomHistory, setRandomHistory] =
    useState<SignRandomPracticeHistoryResponse | null>(null);
  const [signExamHistory, setSignExamHistory] =
    useState<SignExamHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceDown, setServiceDown] = useState(false);

  // Accordion state
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailsCache, setDetailsCache] = useState<Record<number, ExamDetail>>(
    {},
  );
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [expandedRandomId, setExpandedRandomId] = useState<number | null>(null);
  const [randomDetailsCache, setRandomDetailsCache] = useState<
    Record<number, SignRandomPracticeResult>
  >({});
  const [loadingRandomDetailId, setLoadingRandomDetailId] = useState<number | null>(
    null,
  );
  const [expandedSignResultId, setExpandedSignResultId] = useState<number | null>(null);
  const [signDetailsCache, setSignDetailsCache] = useState<
    Record<number, StoredSignExamResult>
  >({});
  const [loadingSignDetailId, setLoadingSignDetailId] = useState<number | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [theoryHistory, mixedSignHistory, signHistory] = await Promise.all([
        apiClient.get<ExamHistoryResponse>("/exams/simulations/history"),
        getRandomPracticeHistory(),
        getSignExamHistory(),
      ]);
      setData(theoryHistory.data);
      setRandomHistory(mixedSignHistory);
      setSignExamHistory(signHistory);
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

  // ── Toggle accordion for an exam card ──
  const toggleExpand = useCallback(
    async (examId: number) => {
      if (expandedId === examId) {
        setExpandedId(null);
        return;
      }
      setExpandedId(examId);
      if (detailsCache[examId]) return; // already fetched

      setLoadingDetailId(examId);
      try {
        const res = await apiClient.get<ExamDetail>(
          `/exams/simulations/${examId}/results`,
        );
        setDetailsCache((prev) => ({ ...prev, [examId]: res.data }));
      } catch (err) {
        logApiError("ExamDetail", err);
      } finally {
        setLoadingDetailId(null);
      }
    },
    [expandedId, detailsCache],
  );

  const toggleExpandRandom = useCallback(
    async (sessionId: number) => {
      if (expandedRandomId === sessionId) {
        setExpandedRandomId(null);
        return;
      }

      setExpandedRandomId(sessionId);
      if (randomDetailsCache[sessionId]) return;

      setLoadingRandomDetailId(sessionId);
      try {
        const result = await getRandomPracticeResult(sessionId);
        setRandomDetailsCache((prev) => ({ ...prev, [sessionId]: result }));
      } catch (err) {
        logApiError("RandomSignExamDetail", err);
      } finally {
        setLoadingRandomDetailId(null);
      }
    },
    [expandedRandomId, randomDetailsCache],
  );

  const toggleExpandSign = useCallback(
    async (resultId: number) => {
      if (expandedSignResultId === resultId) {
        setExpandedSignResultId(null);
        return;
      }

      setExpandedSignResultId(resultId);
      if (signDetailsCache[resultId]) return;

      setLoadingSignDetailId(resultId);
      try {
        const result = await getSignExamResultById(resultId);
        setSignDetailsCache((prev) => ({ ...prev, [resultId]: result }));
      } catch (err) {
        logApiError("SignExamDetail", err);
      } finally {
        setLoadingSignDetailId(null);
      }
    },
    [expandedSignResultId, signDetailsCache],
  );

  // ── Resolve question text for active language ──
  function getQuestionText(q: AllAnsweredQuestion): string {
    if (language === "ar" && q.questionTextAr) return q.questionTextAr;
    if (language === "nl" && q.questionTextNl) return q.questionTextNl;
    if (language === "fr" && q.questionTextFr) return q.questionTextFr;
    return q.questionTextEn ?? "";
  }

  function getStoredSignQuestionText(q: StoredSignExamResult["questionResults"][number]): string {
    if (language === "ar" && q.questionAr) return q.questionAr;
    if (language === "nl" && q.questionNl) return q.questionNl;
    if (language === "fr" && q.questionFr) return q.questionFr;
    return q.questionEn ?? "";
  }

  function getStoredSignName(item: Pick<
    SignExamHistoryItem,
    "nameAr" | "nameNl" | "nameFr" | "nameEn" | "signCode"
  >): string {
    if (language === "ar" && item.nameAr) return item.nameAr;
    if (language === "nl" && item.nameNl) return item.nameNl;
    if (language === "fr" && item.nameFr) return item.nameFr;
    return item.nameEn ?? item.signCode;
  }

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

  useEffect(() => {
    if (
      !Number.isFinite(highlightedRandomSessionId) ||
      highlightedRandomSessionId <= 0
    ) {
      return;
    }
    if (!randomHistory?.sessions.some((session) => session.sessionId === highlightedRandomSessionId)) {
      return;
    }
    if (expandedRandomId === highlightedRandomSessionId) {
      return;
    }
    void toggleExpandRandom(highlightedRandomSessionId);
  }, [
    expandedRandomId,
    highlightedRandomSessionId,
    randomHistory,
    toggleExpandRandom,
  ]);

  useEffect(() => {
    if (!Number.isFinite(highlightedSignResultId) || highlightedSignResultId <= 0) {
      return;
    }
    if (!signExamHistory?.results.some((result) => result.resultId === highlightedSignResultId)) {
      return;
    }
    if (expandedSignResultId === highlightedSignResultId) {
      return;
    }
    void toggleExpandSign(highlightedSignResultId);
  }, [
    expandedSignResultId,
    highlightedSignResultId,
    signExamHistory,
    toggleExpandSign,
  ]);

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
      {!isLoading &&
        !error &&
        data &&
        randomHistory &&
        signExamHistory &&
        data.exams.length === 0 &&
        randomHistory.sessions.length === 0 &&
        signExamHistory.results.length === 0 && (
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
              const isExpanded = expandedId === exam.examId;
              const detail = detailsCache[exam.examId];
              const isLoadingThis = loadingDetailId === exam.examId;

              return (
                <div
                  key={exam.examId}
                  className={cn(
                    "rounded-2xl border bg-card shadow-sm overflow-hidden transition-all duration-200",
                    isPassed ? "border-green-200" : "",
                    isFailed ? "border-red-200" : "",
                    !isCompleted ? "border-border opacity-60" : "",
                    isExpanded ? "shadow-md" : "",
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
                        ? "bg-gradient-to-r from-red-400 to-rose-500"
                        : "",
                      !isCompleted ? "bg-muted" : "",
                    )}
                  />

                  {/* Card header — clickable to expand */}
                  <div
                    className={cn(
                      "p-5 flex items-center gap-4",
                      isCompleted ? "cursor-pointer select-none" : "",
                    )}
                    onClick={() => isCompleted && toggleExpand(exam.examId)}
                  >
                    {/* Icon bubble */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        isPassed ? "bg-green-100 text-green-600" : "",
                        isFailed ? "bg-red-100 text-red-600" : "",
                        !isCompleted ? "bg-muted text-muted-foreground" : "",
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
                                : "bg-red-100 text-red-700",
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
                                  : "bg-gradient-to-r from-red-400 to-rose-500",
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
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-red-50 border-red-200 text-red-600",
                        )}
                      >
                        <span>{pct}</span>
                        <span className="text-xs font-semibold mt-0.5">%</span>
                      </div>
                    )}

                    {/* Expand/collapse chevron */}
                    {isCompleted &&
                      (isLoadingThis ? (
                        <Loader2 className="w-5 h-5 shrink-0 animate-spin text-muted-foreground" />
                      ) : isExpanded ? (
                        <ChevronUp
                          className={cn(
                            "w-5 h-5 shrink-0",
                            isPassed ? "text-green-500" : "text-red-400",
                          )}
                        />
                      ) : (
                        <ChevronDown
                          className={cn(
                            "w-5 h-5 shrink-0",
                            isPassed ? "text-green-500" : "text-red-400",
                          )}
                        />
                      ))}
                  </div>

                  {/* ── Expandable question review ── */}
                  {isExpanded && (
                    <div
                      className={cn(
                        "border-t",
                        isPassed ? "border-green-100" : "border-red-100",
                      )}
                    >
                      {isLoadingThis || !detail ? (
                        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading questions…
                        </div>
                      ) : (
                        <div className="p-5 space-y-4">
                          {/* Category breakdown pills */}
                          {detail.categoryBreakdown &&
                            detail.categoryBreakdown.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {detail.categoryBreakdown.map((cat) => (
                                  <span
                                    key={cat.categoryCode}
                                    className={cn(
                                      "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border",
                                      cat.accuracyPercentage >= 80
                                        ? "bg-green-50 border-green-200 text-green-700"
                                        : cat.accuracyPercentage >= 60
                                          ? "bg-amber-50 border-amber-200 text-amber-700"
                                          : "bg-red-50 border-red-200 text-red-700",
                                    )}
                                  >
                                    {cat.categoryNameEn}: {cat.correctAnswers}/
                                    {cat.totalQuestions}
                                  </span>
                                ))}
                              </div>
                            )}

                          {/* Question list */}
                          {detail.allAnswers && detail.allAnswers.length > 0 ? (
                            <div className="space-y-3">
                              {detail.allAnswers.map((q, qi) => (
                                <div
                                  key={q.questionId}
                                  className={cn(
                                    "rounded-xl border p-4 space-y-2.5",
                                    q.isCorrect
                                      ? "border-green-200 bg-green-50/40"
                                      : "border-red-200 bg-red-50/40",
                                  )}
                                >
                                  {/* Header row */}
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-card border border-border/50 text-xs font-black text-foreground">
                                        {qi + 1}
                                      </span>
                                      <span className="text-xs font-medium text-muted-foreground">
                                        {q.categoryName}
                                      </span>
                                    </div>
                                    {q.isCorrect ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                    )}
                                  </div>

                                  {/* Question text */}
                                  <p className="text-sm font-medium text-foreground leading-relaxed">
                                    {getQuestionText(q)}
                                  </p>

                                  {/* Answer summary */}
                                  <div className="space-y-1 text-sm">
                                    <div className="flex items-start gap-2">
                                      <span className="text-muted-foreground shrink-0 text-xs">
                                        {t("exam.your_answer") ??
                                          "Your answer:"}
                                      </span>
                                      <span
                                        className={cn(
                                          "font-bold text-xs",
                                          q.isCorrect
                                            ? "text-green-600"
                                            : "text-red-600",
                                        )}
                                      >
                                        {q.selectedOptionText}
                                      </span>
                                    </div>
                                    {!q.isCorrect && (
                                      <div className="flex items-start gap-2">
                                        <span className="text-muted-foreground shrink-0 text-xs">
                                          {t("exam.correct_answer") ??
                                            "Correct answer:"}
                                        </span>
                                        <span className="font-bold text-xs text-green-600">
                                          {q.correctOptionText}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No question details available for this exam.
                            </p>
                          )}

                          {/* Link to full detail page */}
                          <div className="pt-1">
                            <Link
                              href={`/exam/results/${exam.examId}`}
                              className={cn(
                                "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors",
                                isPassed
                                  ? "border-green-200 text-green-700 hover:bg-green-50"
                                  : "border-red-200 text-red-700 hover:bg-red-50",
                              )}
                            >
                              {t("exam.view_full_results") ??
                                "View full results"}
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && !error && randomHistory && randomHistory.sessions.length > 0 && (
        <div className="space-y-6">
          {(() => {
            const passedCount = randomHistory.sessions.filter((session) => session.passed).length;
            const passRate =
              randomHistory.totalSessions > 0
                ? Math.round((passedCount / randomHistory.totalSessions) * 100)
                : 0;

            return (
              <>
                <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 py-7 shadow-sm">
                  <div className="pointer-events-none absolute top-0 right-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5" />
                  <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 translate-y-1/2 -translate-x-1/2 rounded-full bg-primary/5" />
                  <div className="relative flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Shuffle className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-primary">
                        {t("sign_practice.badge")}
                      </p>
                      <h2 className="text-xl font-black tracking-tight text-secondary">
                        {t("sign_practice.history_title")}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-border bg-card px-4 py-3 text-center space-y-0.5 shadow-sm">
                    <p className="text-2xl font-black text-foreground">
                      {randomHistory.totalSessions}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {t("sign_practice.history_total")}
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

                <div className="space-y-3">
                  {randomHistory.sessions.map((session, index) => {
                    const pct = Math.round(session.scorePercentage ?? 0);
                    const isPassed = session.passed;
                    const isExpanded = expandedRandomId === session.sessionId;
                    const detail = randomDetailsCache[session.sessionId];
                    const isLoadingThis = loadingRandomDetailId === session.sessionId;
                    const isHighlighted = highlightedRandomSessionId === session.sessionId;

                    return (
                      <div
                        key={session.sessionId}
                        className={cn(
                          "overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200",
                          isPassed ? "border-green-200" : "border-red-200",
                          isExpanded ? "shadow-md" : "",
                          isHighlighted ? "ring-2 ring-primary/25" : "",
                        )}
                      >
                        <div
                          className={cn(
                            "h-1 w-full",
                            isPassed
                              ? "bg-gradient-to-r from-green-400 to-emerald-500"
                              : "bg-gradient-to-r from-red-400 to-rose-500",
                          )}
                        />

                        <div
                          className="cursor-pointer select-none p-5 flex items-center gap-4"
                          onClick={() => void toggleExpandRandom(session.sessionId)}
                        >
                          <div
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-2xl shrink-0",
                              isPassed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600",
                            )}
                          >
                            {isPassed ? (
                              <Trophy className="w-6 h-6" />
                            ) : (
                              <XCircle className="w-6 h-6" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-foreground">
                                {t("sign_practice.history_session")} #{randomHistory.totalSessions - index}
                              </span>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                                  isPassed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
                                )}
                              >
                                {isPassed ? t("exam.passed") : t("exam.failed")}
                              </span>
                              {isHighlighted && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                  {t("sign_practice.history_latest")}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3 opacity-60" />
                              {formatDate(session.completedAt ?? session.startedAt)}
                            </p>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {session.correctAnswers}/{session.totalQuestions} {t("exam.correct_answers")}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    isPassed
                                      ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                      : "bg-gradient-to-r from-red-400 to-rose-500",
                                  )}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "shrink-0 flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 text-xl font-black leading-none",
                              isPassed ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600",
                            )}
                          >
                            <span>{pct}</span>
                            <span className="mt-0.5 text-xs font-semibold">%</span>
                          </div>

                          {isLoadingThis ? (
                            <Loader2 className="w-5 h-5 shrink-0 animate-spin text-muted-foreground" />
                          ) : isExpanded ? (
                            <ChevronUp className={cn("w-5 h-5 shrink-0", isPassed ? "text-green-500" : "text-red-400")} />
                          ) : (
                            <ChevronDown className={cn("w-5 h-5 shrink-0", isPassed ? "text-green-500" : "text-red-400")} />
                          )}
                        </div>

                        {isExpanded && (
                          <div className={cn("border-t p-5", isPassed ? "border-green-100" : "border-red-100")}>
                            {isLoadingThis || !detail ? (
                              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t("common.loading")}
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-3">
                                  <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3">
                                    <p className="text-xs font-medium text-muted-foreground">
                                      {t("practice_exam.score_correct")}
                                    </p>
                                    <p className="text-lg font-black text-green-600">{detail.correctAnswers}</p>
                                  </div>
                                  <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3">
                                    <p className="text-xs font-medium text-muted-foreground">
                                      {t("practice_exam.score_wrong")}
                                    </p>
                                    <p className="text-lg font-black text-red-600">{detail.wrongAnswers}</p>
                                  </div>
                                  <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3">
                                    <p className="text-xs font-medium text-muted-foreground">
                                      {t("practice_exam.score_timeout")}
                                    </p>
                                    <p className="text-lg font-black text-amber-600">{detail.unanswered}</p>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  {detail.questions.map((question, questionIndex) => {
                                    const questionText =
                                      language === "ar"
                                        ? question.questionAr
                                        : language === "nl"
                                          ? question.questionNl
                                          : language === "fr"
                                            ? question.questionFr
                                            : question.questionEn;
                                    const correctText =
                                      language === "ar"
                                        ? question.correctChoiceAr
                                        : language === "nl"
                                          ? question.correctChoiceNl
                                          : language === "fr"
                                            ? question.correctChoiceFr
                                            : question.correctChoiceEn;

                                    return (
                                      <div
                                        key={question.questionId}
                                        className={cn(
                                          "rounded-xl border p-4 space-y-2.5",
                                          question.isCorrect
                                            ? "border-green-200 bg-green-50/40"
                                            : "border-red-200 bg-red-50/40",
                                        )}
                                      >
                                        <div className="flex items-center justify-between gap-3">
                                          <div className="flex items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-card border border-border/50 text-xs font-black text-foreground">
                                              {questionIndex + 1}
                                            </span>
                                            {question.signCode ? (
                                              <span className="text-xs font-medium text-muted-foreground">
                                                {question.signCode}
                                              </span>
                                            ) : null}
                                          </div>
                                          {question.isCorrect ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                          ) : (
                                            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                          )}
                                        </div>

                                        <p className="text-sm font-medium text-foreground leading-relaxed">
                                          {questionText}
                                        </p>

                                        {!question.isCorrect && correctText ? (
                                          <div className="text-xs font-semibold text-green-700">
                                            {t("practice_exam.review_correct_answer")}: {correctText}
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {!isLoading && !error && signExamHistory && signExamHistory.results.length > 0 && (
        <div className="space-y-6">
          {(() => {
            const passedCount = signExamHistory.results.filter((result) => result.passed).length;
            const passRate =
              signExamHistory.totalResults > 0
                ? Math.round((passedCount / signExamHistory.totalResults) * 100)
                : 0;

            return (
              <>
                <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 py-7 shadow-sm">
                  <div className="pointer-events-none absolute top-0 right-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5" />
                  <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 translate-y-1/2 -translate-x-1/2 rounded-full bg-primary/5" />
                  <div className="relative flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-primary">
                        {t("sign_quiz.history_badge")}
                      </p>
                      <h2 className="text-xl font-black tracking-tight text-secondary">
                        {t("sign_quiz.history_title")}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-border bg-card px-4 py-3 text-center space-y-0.5 shadow-sm">
                    <p className="text-2xl font-black text-foreground">
                      {signExamHistory.totalResults}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("sign_quiz.history_total")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-green-100 bg-green-50/60 px-4 py-3 text-center space-y-0.5 shadow-sm">
                    <p className="text-2xl font-black text-green-600">
                      {passedCount}
                    </p>
                    <p className="text-xs font-medium text-green-600/80">
                      {t("dashboard.result_passed")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card px-4 py-3 text-center space-y-0.5 shadow-sm">
                    <p className="text-2xl font-black text-foreground">
                      {passRate}%
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("progress.pass_rate")}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {signExamHistory.results.map((result) => {
                    const pct = Math.round(result.scorePercentage ?? 0);
                    const isPassed = result.passed;
                    const isExpanded = expandedSignResultId === result.resultId;
                    const detail = signDetailsCache[result.resultId];
                    const isLoadingThis = loadingSignDetailId === result.resultId;
                    const isHighlighted = highlightedSignResultId === result.resultId;
                    const signName = getStoredSignName(result);

                    return (
                      <div
                        key={result.resultId}
                        className={cn(
                          "overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200",
                          isPassed ? "border-green-200" : "border-red-200",
                          isExpanded ? "shadow-md" : "",
                          isHighlighted ? "ring-2 ring-primary/25" : "",
                        )}
                      >
                        <div
                          className={cn(
                            "h-1 w-full",
                            isPassed
                              ? "bg-gradient-to-r from-green-400 to-emerald-500"
                              : "bg-gradient-to-r from-red-400 to-rose-500",
                          )}
                        />

                        <div
                          className="cursor-pointer select-none p-5 flex items-center gap-4"
                          onClick={() => void toggleExpandSign(result.resultId)}
                        >
                          <div
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-2xl shrink-0",
                              isPassed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600",
                            )}
                          >
                            {isPassed ? (
                              <Trophy className="w-6 h-6" />
                            ) : (
                              <XCircle className="w-6 h-6" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="truncate text-sm font-bold text-foreground">
                                {signName}
                              </span>
                              {result.routeCode ? (
                                <span className="inline-flex items-center rounded-full border border-border/60 bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                                  {result.routeCode}
                                </span>
                              ) : null}
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                                  isPassed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
                                )}
                              >
                                {isPassed ? t("exam.passed") : t("exam.failed")}
                              </span>
                              {isHighlighted && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                  {t("sign_quiz.history_latest")}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3 opacity-60" />
                              {formatDate(result.completedAt ?? null)}
                            </p>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {result.correctAnswers}/{result.totalQuestions} {t("exam.correct_answers")}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    isPassed
                                      ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                      : "bg-gradient-to-r from-red-400 to-rose-500",
                                  )}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "shrink-0 flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 text-xl font-black leading-none",
                              isPassed ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600",
                            )}
                          >
                            <span>{pct}</span>
                            <span className="mt-0.5 text-xs font-semibold">%</span>
                          </div>

                          {isLoadingThis ? (
                            <Loader2 className="w-5 h-5 shrink-0 animate-spin text-muted-foreground" />
                          ) : isExpanded ? (
                            <ChevronUp className={cn("w-5 h-5 shrink-0", isPassed ? "text-green-500" : "text-red-400")} />
                          ) : (
                            <ChevronDown className={cn("w-5 h-5 shrink-0", isPassed ? "text-green-500" : "text-red-400")} />
                          )}
                        </div>

                        {isExpanded && (
                          <div className={cn("border-t p-5", isPassed ? "border-green-100" : "border-red-100")}>
                            {isLoadingThis || !detail ? (
                              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t("common.loading")}
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-3">
                                  <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3">
                                    <p className="text-xs font-medium text-muted-foreground">
                                      {t("practice_exam.score_correct")}
                                    </p>
                                    <p className="text-lg font-black text-green-600">{detail.correctAnswers}</p>
                                  </div>
                                  <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3">
                                    <p className="text-xs font-medium text-muted-foreground">
                                      {t("practice_exam.score_wrong")}
                                    </p>
                                    <p className="text-lg font-black text-red-600">{detail.wrongAnswers}</p>
                                  </div>
                                  <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3">
                                    <p className="text-xs font-medium text-muted-foreground">
                                      {t("practice_exam.score_timeout")}
                                    </p>
                                    <p className="text-lg font-black text-amber-600">{detail.unansweredCount}</p>
                                  </div>
                                </div>

                                {detail.questionResults.length > 0 ? (
                                  <div className="space-y-3">
                                    {detail.questionResults.map((question, questionIndex) => {
                                      const correctText =
                                        language === "ar"
                                          ? question.correctTextAr
                                          : language === "nl"
                                            ? question.correctTextNl
                                            : language === "fr"
                                              ? question.correctTextFr
                                              : question.correctTextEn;

                                      return (
                                        <div
                                          key={question.questionId}
                                          className={cn(
                                            "rounded-xl border p-4 space-y-2.5",
                                            question.isCorrect
                                              ? "border-green-200 bg-green-50/40"
                                              : "border-red-200 bg-red-50/40",
                                          )}
                                        >
                                          <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-card border border-border/50 text-xs font-black text-foreground">
                                                {questionIndex + 1}
                                              </span>
                                              <span className="text-xs font-medium text-muted-foreground">
                                                {question.difficulty}
                                              </span>
                                            </div>
                                            {question.isCorrect ? (
                                              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                            ) : (
                                              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                            )}
                                          </div>

                                          <p className="text-sm font-medium text-foreground leading-relaxed">
                                            {getStoredSignQuestionText(question)}
                                          </p>

                                          {!question.isCorrect && correctText ? (
                                            <div className="text-xs font-semibold text-green-700">
                                              {t("practice_exam.review_correct_answer")}: {correctText}
                                            </div>
                                          ) : null}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                                    {t("sign_quiz.history_no_review")}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default function ExamResultsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard?section=exam-results");
  }, [router]);

  return null;
}
