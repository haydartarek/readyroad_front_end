"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import apiClient, { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Lightbulb,
  RefreshCw,
  RotateCcw,
  Timer,
  Trophy,
  XCircle,
} from "lucide-react";

interface BackendCategoryBreakdown {
  categoryId: number;
  categoryCode: string;
  categoryNameEn: string;
  categoryNameAr: string;
  categoryNameNl: string;
  categoryNameFr: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracyPercentage: number;
  performanceLevel: string;
  isWeakArea: boolean;
}

interface BackendIncorrectQuestion {
  questionId: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  selectedOptionId: number;
  selectedOptionText: string | null;
  correctOptionId: number;
  correctOptionText: string | null;
  categoryName: string;
  categoryCode: string;
  contentImageUrl?: string;
}

interface AllAnsweredQuestion {
  questionId: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  selectedOptionText: string | null;
  correctOptionText: string | null;
  categoryName: string;
  categoryCode: string;
  contentImageUrl?: string;
  isCorrect: boolean;
}

interface ExamResults {
  examId: number;
  userId: number;
  completedAt: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  scorePercentage: number;
  passed: boolean;
  passingScore: number;
  passingThreshold: number;
  pointsToPass: number;
  timeTakenSeconds: number;
  averageTimePerQuestion: number;
  answeredCount: number;
  unansweredCount: number;
  weakCategories: string[];
  categoryBreakdown: BackendCategoryBreakdown[];
  incorrectQuestions: BackendIncorrectQuestion[];
  allAnswers: AllAnsweredQuestion[];
}

interface ReviewAnswer {
  questionId: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  selectedOptionText: string | null;
  correctOptionText: string | null;
  categoryName: string;
  categoryCode: string;
  contentImageUrl?: string;
  isCorrect: boolean;
}

function LoadingSpinner({
  message,
  subtitle,
}: {
  message: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-muted/35 px-4">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ClipboardList className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{message}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function formatDuration(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds)
    ? Math.max(0, totalSeconds)
    : 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function ExamResultsPage() {
  const params = useParams();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const localize = (
    en?: string | null,
    ar?: string | null,
    nl?: string | null,
    fr?: string | null,
  ): string => {
    switch (language) {
      case "ar":
        return ar || en || "";
      case "nl":
        return nl || en || "";
      case "fr":
        return fr || en || "";
      default:
        return en || "";
    }
  };

  const paramIdRaw = (params as Record<string, string | string[] | undefined>)
    .id;
  const paramId = Array.isArray(paramIdRaw) ? paramIdRaw[0] : paramIdRaw;
  const fromParam = paramId ? parseInt(paramId, 10) : NaN;

  const fromStorage = useMemo(() => {
    if (typeof window === "undefined") return NaN;
    try {
      const raw = localStorage.getItem("current_exam");
      if (!raw) return NaN;
      const parsed = JSON.parse(raw);
      return typeof parsed?.examId === "number" ? parsed.examId : NaN;
    } catch {
      return NaN;
    }
  }, []);

  const examId = Number.isFinite(fromParam) ? fromParam : fromStorage;
  const [results, setResults] = useState<ExamResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "correct">(
    "wrong",
  );

  useEffect(() => {
    if (!Number.isFinite(examId) || examId <= 0) {
      setIsLoading(false);
      setError(t("exam.results_invalid"));
      return;
    }

    const fetchResults = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<ExamResults>(
          `/exams/simulations/${examId}/results`,
        );
        setResults(response.data);
        setError(null);
      } catch (err) {
        logApiError("Failed to fetch results", err);
        if (isServiceUnavailable(err)) {
          setServiceUnavailable(true);
        } else {
          const message = t("exam.results_load_failed");
          setError(message);
          toast.error(message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [examId, fetchKey, t]);

  if (isLoading) {
    return (
      <LoadingSpinner
        message={t("exam.results_loading")}
        subtitle={t("practice_exam.badge")}
      />
    );
  }

  if (serviceUnavailable) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-muted/35 px-4">
        <ServiceUnavailableBanner
          onRetry={() => {
            setServiceUnavailable(false);
            setFetchKey((current) => current + 1);
          }}
          className="max-w-md"
        />
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-muted/35 px-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="text-6xl">⚠️</div>
          <Alert variant="destructive">
            <AlertDescription>
              {error || t("exam.results_not_found")}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              setFetchKey((current) => current + 1);
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t("common.retry")}
          </Button>
        </div>
      </div>
    );
  }

  const safeScore = Number.isFinite(results.correctAnswers)
    ? results.correctAnswers
    : 0;
  const safeTotalQuestions = Number.isFinite(results.totalQuestions)
    ? results.totalQuestions
    : 50;
  const scorePercent = Math.round(
    Number.isFinite(results.scorePercentage) ? results.scorePercentage : 0,
  );
  const passingScore = results.passingScore ?? results.passingThreshold ?? 41;
  const answeredCount = Number.isFinite(results.answeredCount)
    ? results.answeredCount
    : 0;
  const unansweredCount = Number.isFinite(results.unansweredCount)
    ? results.unansweredCount
    : 0;
  const averagePerQuestion = formatDuration(
    Math.round(
      Number.isFinite(results.averageTimePerQuestion)
        ? results.averageTimePerQuestion
        : 0,
    ),
  );

  const allAnswers: ReviewAnswer[] =
    results.allAnswers && results.allAnswers.length > 0
      ? results.allAnswers
      : (results.incorrectQuestions ?? []).map((question) => ({
          questionId: question.questionId,
          questionTextEn: question.questionTextEn,
          questionTextAr: question.questionTextAr,
          questionTextNl: question.questionTextNl,
          questionTextFr: question.questionTextFr,
          selectedOptionText: question.selectedOptionText,
          correctOptionText: question.correctOptionText,
          categoryName: question.categoryName,
          categoryCode: question.categoryCode,
          contentImageUrl: question.contentImageUrl,
          isCorrect: false,
        }));

  const filteredAnswers = allAnswers.filter((answer) => {
    if (reviewFilter === "correct") return answer.isCorrect;
    if (reviewFilter === "wrong") return !answer.isCorrect;
    return true;
  });

  const localizedCategoryBreakdown = (results.categoryBreakdown ?? []).map(
    (category) => ({
      ...category,
      displayName: localize(
        category.categoryNameEn,
        category.categoryNameAr,
        category.categoryNameNl,
        category.categoryNameFr,
      ),
    }),
  );

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/35 pb-8"
    >
      <div className="pointer-events-none absolute -top-32 right-[-8rem] h-[24rem] w-[24rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-[-8rem] h-[20rem] w-[20rem] rounded-full bg-secondary/10 blur-3xl" />

      <div className="container relative mx-auto max-w-5xl space-y-4 px-4 py-6">
        <div
          className={cn(
            "overflow-hidden rounded-[2rem] border bg-card shadow-sm",
            results.passed ? "border-green-200" : "border-red-200/70",
          )}
        >
          <div
            className={cn(
              "h-1.5 w-full",
              results.passed ? "bg-green-400" : "bg-red-400",
            )}
          />

          <div className="grid gap-5 px-5 py-5 md:px-6 md:py-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
            <div className="space-y-4">
              <div
                className={cn(
                  "flex aspect-square w-full max-w-[160px] items-center justify-center rounded-[1.7rem] border shadow-sm",
                  results.passed
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50",
                )}
              >
                {results.passed ? (
                  <CheckCircle2 className="h-14 w-14 text-green-600" />
                ) : (
                  <XCircle className="h-14 w-14 text-red-500" />
                )}
              </div>

              <div className="space-y-2 text-center lg:text-start">
                <Badge
                  className={cn(
                    "border",
                    results.passed
                      ? "border-green-200 bg-green-100 text-green-800"
                      : "border-red-200 bg-red-100 text-red-700",
                  )}
                >
                  {t("exam.results_badge")}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {t("practice_exam.badge")}
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {t("exam.results_score_label")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {t("exam.results_score_label")}
                  </p>
                  <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
                    {results.passed
                      ? t("exam.results_passed_title")
                      : t("exam.results_failed_title")}
                  </h1>
                  <p className="max-w-xl text-sm text-muted-foreground">
                    {results.passed
                      ? t("exam.results_passed_subtitle")
                      : t("exam.results_failed_subtitle")}
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-[1.25rem] border border-border/60 bg-background/80 px-4 py-3 shadow-sm">
                  {results.passed ? (
                    <Trophy className="h-8 w-8 text-green-500" />
                  ) : (
                    <ClipboardList className="h-8 w-8 text-primary" />
                  )}
                  <div className="text-end">
                    <div
                      className={cn(
                        "text-4xl font-black tabular-nums leading-none md:text-5xl",
                        results.passed ? "text-green-600" : "text-foreground",
                      )}
                    >
                      {scorePercent}%
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {results.correctAnswers}/{results.totalQuestions}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 rounded-[1.5rem] border border-border/60 bg-background/80 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-foreground">
                    {t("practice_exam.score_pass_threshold").replace(
                      "{n}",
                      String(passingScore),
                    )}
                  </span>
                  <span className="font-semibold text-primary">
                    {scorePercent}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-muted/70">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-700",
                      results.passed ? "bg-green-500" : "bg-red-400",
                    )}
                    style={{ width: `${scorePercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {safeScore}/{safeTotalQuestions}
                  </span>
                  <span>
                    {passingScore}/{safeTotalQuestions}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
                    label: t("practice_exam.score_correct"),
                    value: results.correctAnswers,
                    tone: "text-green-600",
                  },
                  {
                    icon: <XCircle className="h-5 w-5 text-destructive" />,
                    label: t("practice_exam.score_wrong"),
                    value: results.wrongAnswers,
                    tone: "text-red-500",
                  },
                  {
                    icon: <Clock className="h-5 w-5 text-orange-500" />,
                    label: t("practice_exam.score_timeout"),
                    value: unansweredCount,
                    tone: "text-orange-500",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[1.35rem] border border-border/60 bg-background/80 px-4 py-4 shadow-sm"
                  >
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/10">
                      {stat.icon}
                    </div>
                    <p
                      className={cn(
                        "text-3xl font-black tabular-nums",
                        stat.tone,
                      )}
                    >
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground/80">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3">
                <Button className="h-10 rounded-xl font-semibold" asChild>
                  <Link href="/exam">
                    <RotateCcw className="me-2 h-4 w-4" />
                    {t("exam.results_take_another")}
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  className="h-10 rounded-xl font-medium"
                  onClick={() => setShowReview((current) => !current)}
                >
                  {t("exam.results_toggle_review")}
                </Button>
                <Button
                  variant="outline"
                  className="h-10 rounded-xl font-medium"
                  asChild
                >
                  <Link href="/dashboard">
                    {isRTL ? (
                      <ArrowRight className="me-2 h-4 w-4" />
                    ) : (
                      <ArrowLeft className="me-2 h-4 w-4" />
                    )}
                    {t("exam.results_back_dashboard")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <section className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/85 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border/40 px-5 py-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/10">
                <BarChart2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">
                  {t("exam.results_category_title")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("exam.results_category_desc")}
                </p>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5">
              {localizedCategoryBreakdown.length > 0 ? (
                localizedCategoryBreakdown.map((category) => {
                  const barTone =
                    category.accuracyPercentage >= 80
                      ? "bg-green-500"
                      : category.accuracyPercentage >= 60
                        ? "bg-orange-500"
                        : "bg-red-500";

                  return (
                    <div key={category.categoryCode} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {category.displayName}
                          </p>
                        </div>
                        <div className="text-end text-xs font-semibold text-muted-foreground">
                          <span>
                            {category.correctAnswers}/{category.totalQuestions}
                          </span>
                          <span className="ms-2">
                            {Math.round(category.accuracyPercentage)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted/70">
                        <div
                          className={cn("h-full rounded-full", barTone)}
                          style={{ width: `${category.accuracyPercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("exam.results_no_answers")}
                </p>
              )}

              {!results.passed && (
                <Button variant="outline" className="w-full rounded-xl" asChild>
                  <Link href="/dashboard?section=weak-areas">
                    <Lightbulb className="me-2 h-4 w-4" />
                    {t("exam.results_study_weak_areas")}
                  </Link>
                </Button>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/85 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border/40 px-5 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/10">
                  <Timer className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">
                    {t("exam.results_time_title")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("exam.results_time_desc")}
                  </p>
                </div>
              </div>

              <div className="space-y-3 px-5 py-5">
                {[
                  {
                    icon: <Clock className="h-4 w-4 text-orange-500" />,
                    label: t("exam.results_total_time"),
                    value: formatDuration(results.timeTakenSeconds),
                  },
                  {
                    icon: <Timer className="h-4 w-4 text-primary" />,
                    label: t("exam.results_average_time"),
                    value: averagePerQuestion,
                  },
                  {
                    icon: <ClipboardList className="h-4 w-4 text-green-500" />,
                    label: t("exam.answered"),
                    value: `${answeredCount}/${safeTotalQuestions}`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-border/50 bg-background/80 px-4 py-3"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
                        {item.icon}
                      </div>
                      {item.label}
                    </div>
                    <span className="text-sm font-black text-foreground">
                      {item.value}
                    </span>
                  </div>
                ))}

                <Button variant="outline" className="w-full rounded-xl" asChild>
                  <Link href="/dashboard?section=error-patterns">
                    <AlertTriangle className="me-2 h-4 w-4" />
                    {t("exam.results_view_error_patterns")}
                  </Link>
                </Button>
              </div>
            </section>
          </aside>
        </div>

        <section className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/85 shadow-sm">
          <button
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/20"
            onClick={() => setShowReview((current) => !current)}
          >
            <span className="text-base font-black text-foreground">
              {t("practice_exam.review_title")}
            </span>
            {showReview ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {showReview && (
            <div className="space-y-4 border-t border-border/40 px-5 pb-5 pt-4">
              <div className="flex flex-wrap gap-2">
                {(["all", "wrong", "correct"] as const).map((filterValue) => (
                  <button
                    key={filterValue}
                    onClick={() => setReviewFilter(filterValue)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                      reviewFilter === filterValue
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border/50 text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {t(`practice_exam.filter_${filterValue}`)}
                  </button>
                ))}
              </div>

              {filteredAnswers.length > 0 ? (
                <div className="space-y-3">
                  {filteredAnswers.map((answer, index) => (
                    <ExamReviewCard
                      key={answer.questionId}
                      answer={answer}
                      index={index + 1}
                      isRTL={isRTL}
                      localize={localize}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-border/50 bg-background/70 px-5 py-8 text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("exam.results_no_answers")}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ExamReviewCard({
  answer,
  index,
  isRTL,
  localize,
  t,
}: {
  answer: ReviewAnswer;
  index: number;
  isRTL: boolean;
  localize: (
    en?: string | null,
    ar?: string | null,
    nl?: string | null,
    fr?: string | null,
  ) => string;
  t: (key: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  const questionText = localize(
    answer.questionTextEn,
    answer.questionTextAr,
    answer.questionTextNl,
    answer.questionTextFr,
  );

  const statusConfig = answer.isCorrect
    ? {
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
        accent: "bg-green-500",
        card: "border-green-200/60 bg-green-50/40",
        badge: "border-green-200 bg-green-100 text-green-700",
      }
    : {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        accent: "bg-red-500",
        card: "border-red-200/60 bg-red-50/40",
        badge: "border-red-200 bg-red-100 text-red-700",
      };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border",
        statusConfig.card,
      )}
    >
      <div
        className={cn("absolute inset-y-0 left-0 w-1", statusConfig.accent)}
      />

      <div className="space-y-3 px-4 py-4 ps-5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-shrink-0">{statusConfig.icon}</div>
          <span className="text-xs font-black text-foreground/70">
            Q{index}
          </span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-xs font-semibold",
              statusConfig.badge,
            )}
          >
            {answer.categoryName}
          </span>
        </div>

        {answer.contentImageUrl && (
          <div className="flex justify-center">
            <Image
              src={answer.contentImageUrl}
              alt={questionText || "Question image"}
              width={320}
              height={160}
              className="max-h-40 w-auto rounded-2xl border border-border/50 bg-background/80 object-contain"
              unoptimized
            />
          </div>
        )}

        <p
          className={cn(
            "text-sm font-semibold leading-6 text-foreground",
            isRTL && "text-right",
          )}
        >
          {questionText}
        </p>

        <div className="space-y-2 rounded-2xl border border-border/40 bg-background/80 p-3">
          <div className="flex items-start gap-2">
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">
              {t("exam.your_answer")}
            </span>
            <span
              className={cn(
                "text-sm font-bold",
                answer.isCorrect ? "text-green-600" : "text-red-500",
              )}
            >
              {answer.selectedOptionText || "—"}
            </span>
          </div>

          {!answer.isCorrect && (
            <div className="flex items-start gap-2">
              <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                {t("exam.correct_answer")}
              </span>
              <span className="text-sm font-bold text-green-600">
                {answer.correctOptionText || "—"}
              </span>
            </div>
          )}
        </div>

        {!answer.isCorrect && answer.correctOptionText && (
          <>
            <button
              onClick={() => setExpanded((current) => !current)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              {expanded
                ? t("practice_exam.review_hide")
                : t("practice_exam.review_show_answer")}
            </button>

            {expanded && (
              <div className="space-y-2">
                {answer.correctOptionText && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    <div className="min-w-0">
                      <p className="mb-0.5 text-xs font-bold uppercase tracking-wide text-green-700">
                        {t("practice_exam.review_correct_answer")}
                      </p>
                      <p className="text-sm font-medium text-green-800">
                        {answer.correctOptionText}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
