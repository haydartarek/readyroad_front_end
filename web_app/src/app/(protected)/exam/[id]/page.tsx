"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { ExitConfirmDialog } from "@/components/exam/exit-confirm-dialog";
import { FocusedExamShell } from "@/components/exam/focused-exam-shell";
import { FocusedQuestionCard } from "@/components/exam/focused-question-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import apiClient, { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { convertToPublicImageUrl } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Clock,
} from "lucide-react";

/** Seconds per question — Belgian theoretical driving exam rule */
const QUESTION_TIME = 15;

interface Question {
  id: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  imageUrl?: string;
  options: Array<{
    id: number;
    number: 1 | 2 | 3;
    textEn: string;
    textAr: string;
    textNl: string;
    textFr: string;
  }>;
}

interface ExamData {
  id: number;
  createdAt: string;
  expiresAt: string;
  questions: Question[];
}

interface BackendQuestion {
  questionId: number;
  questionOrder?: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  imageUrl?: string;
  options: Array<{
    optionId: number;
    optionTextEn: string;
    optionTextAr: string;
    optionTextNl: string;
    optionTextFr: string;
  }>;
}

interface BackendExamData {
  examId: number;
  startedAt?: string;
  startTime?: string;
  expiresAt: string;
  questions: BackendQuestion[];
}

function normalizeExamData(backendData: BackendExamData): ExamData {
  return {
    id: backendData.examId,
    createdAt:
      backendData.startedAt ||
      backendData.startTime ||
      new Date().toISOString(),
    expiresAt: backendData.expiresAt,
    questions: (backendData.questions ?? []).map((q) => ({
      id: q.questionId,
      questionTextEn: q.questionTextEn,
      questionTextAr: q.questionTextAr,
      questionTextNl: q.questionTextNl,
      questionTextFr: q.questionTextFr,
      imageUrl: q.imageUrl,
      options: (q.options ?? []).slice(0, 3).map((opt, optIndex) => ({
        id: opt.optionId,
        number: (optIndex + 1) as 1 | 2 | 3,
        textEn: opt.optionTextEn,
        textAr: opt.optionTextAr,
        textNl: opt.optionTextNl,
        textFr: opt.optionTextFr,
      })),
    })),
  };
}

/** Returns Tailwind color classes based on seconds remaining */
function timerColor(secondsLeft: number): string {
  if (secondsLeft >= 10) return "bg-green-500";
  if (secondsLeft >= 5) return "bg-orange-400";
  return "bg-red-500";
}

function localizeText(
  language: string,
  en?: string,
  ar?: string,
  nl?: string,
  fr?: string,
): string {
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
}

function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            📝
          </div>
        </div>
        <p className="text-base text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

export default function ExamQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const paramIdRaw = (params as Record<string, string | string[] | undefined>)
    ?.id;
  const paramId = Array.isArray(paramIdRaw) ? paramIdRaw[0] : paramIdRaw;
  const examId = paramId ? parseInt(paramId, 10) : NaN;

  const [examData, setExamData] = useState<ExamData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // ── Per-question countdown ──────────────────────────────
  const [questionTimeLeft, setQuestionTimeLeft] = useState(QUESTION_TIME);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isExamActive = useRef(true);
  const pendingNavigation = useRef<string | null>(null);
  // Ref for submit so timer callback always sees the latest version
  const submitExamRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // ── Block browser back ──────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isExamActive.current) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    const handlePopState = (e: PopStateEvent) => {
      if (isExamActive.current) {
        e.preventDefault();
        window.history.pushState(null, "", window.location.href);
        setShowExitDialog(true);
      }
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // ── Load exam ───────────────────────────────────────────
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setIsLoading(true);
        if (!Number.isFinite(examId) || examId <= 0) {
          setIsLoading(false);
          setError(t("exam.results_invalid"));
          toast.error(t("exam.results_invalid"));
          return;
        }
        const storedExam = localStorage.getItem("current_exam");
        if (storedExam) {
          let parsedExam: BackendExamData | null = null;
          try {
            parsedExam = JSON.parse(storedExam) as BackendExamData;
          } catch {
            localStorage.removeItem("current_exam");
          }
          if (parsedExam && parsedExam.examId === examId) {
            setExamData(normalizeExamData(parsedExam));
            setError(null);
            setIsLoading(false);
            return;
          }
        }
        const response = await apiClient.get<{
          hasActiveExam: boolean;
          activeExam: BackendExamData;
        }>(`/exams/simulations/active`);

        if (response.data.hasActiveExam && response.data.activeExam) {
          const normalized = normalizeExamData(response.data.activeExam);
          if (normalized.id !== examId)
            router.replace(`/exam/${normalized.id}`);
          setExamData(normalized);
          setError(null);
        } else {
          toast.info(t("exam.no_active_exam"));
          router.replace("/exam");
        }
      } catch (err) {
        logApiError("Failed to fetch exam data", err);
        if (isServiceUnavailable(err)) setServiceUnavailable(true);
        else {
          setError(t("exam.load_failed"));
          toast.error(t("exam.load_failed"));
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchExamData();
  }, [examId, fetchKey, router, t]);

  // ── Save answer ─────────────────────────────────────────
  const handleAnswerSelect = useCallback(
    async (optionNumber: number) => {
      if (!examData) return;
      const currentQuestion = examData.questions[currentQuestionIndex];
      if (!currentQuestion) return;

      const questionId = currentQuestion.id;
      if (!Number.isFinite(questionId)) {
        toast.error(t("common.load_error"));
        return;
      }

      const safeExamId = Number(examId);
      if (!Number.isFinite(safeExamId)) {
        toast.error(t("exam.results_invalid"));
        return;
      }

      const selectedOption = currentQuestion.options.find(
        (opt) => opt.number === optionNumber,
      );
      if (!selectedOption) {
        toast.error(t("common.load_error"));
        return;
      }

      const selectedOptionId = selectedOption.id;
      if (!selectedOptionId) {
        toast.error(t("common.load_error"));
        return;
      }

      // Optimistic local update — user can still change during the 15s window
      setAnswers((prev) => ({ ...prev, [questionId]: optionNumber }));

      try {
        await apiClient.post(
          `/exams/simulations/${safeExamId}/questions/${questionId}/answer`,
          {
            selectedOptionId,
          },
        );
      } catch (err) {
        logApiError("Failed to save answer", err);
        if (!isServiceUnavailable(err)) {
          toast.error(t("exam.answer_save_failed"));
        }
      }
    },
    [currentQuestionIndex, examData, examId, t],
  );

  // ── Submit exam ─────────────────────────────────────────
  const submitExam = useCallback(async () => {
    if (!examData) return;
    try {
      setIsSubmitting(true);
      isExamActive.current = false;
      if (timerRef.current) clearInterval(timerRef.current);

      await apiClient.post(`/exams/simulations/${examId}/submit`);

      localStorage.removeItem("current_exam");
      toast.success(t("exam.submit_success"));
      router.push(`/exam/results/${examId}`);
    } catch (err) {
      logApiError("Failed to submit exam", err);
      isExamActive.current = true;
      if (!isServiceUnavailable(err)) {
        toast.error(t("exam.submit_failed"));
      }
      setIsSubmitting(false);
    }
  }, [examData, examId, router, t]);

  // Keep ref in sync so timer callbacks always fire the latest version
  useEffect(() => {
    submitExamRef.current = submitExam;
  }, [submitExam]);

  // ── Advance to next question (or submit on last) ────────
  const handleNextOrSubmit = useCallback(() => {
    if (!examData) return;
    const isLast = currentQuestionIndex === examData.questions.length - 1;
    if (isLast) {
      submitExamRef.current?.();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setQuestionTimeLeft(QUESTION_TIME);
    }
  }, [examData, currentQuestionIndex]);

  // Ref so the timer interval closure always sees the latest handler
  const handleNextOrSubmitRef = useRef(handleNextOrSubmit);
  useEffect(() => {
    handleNextOrSubmitRef.current = handleNextOrSubmit;
  }, [handleNextOrSubmit]);

  // ── Per-question 15-second countdown ───────────────────
  useEffect(() => {
    // Reset timer whenever the question changes
    setQuestionTimeLeft(QUESTION_TIME);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up — auto-advance
          clearInterval(timerRef.current!);
          handleNextOrSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex]); // re-run only when question changes

  const handleExitStay = useCallback(() => {
    pendingNavigation.current = null;
  }, []);
  const handleExitLeave = useCallback(() => {
    isExamActive.current = false;
    const target = pendingNavigation.current;
    pendingNavigation.current = null;
    if (target) {
      router.push(target);
      return;
    }
    router.back();
  }, [router]);

  if (isLoading) return <LoadingSpinner message={t("exam.loading_active")} />;

  if (serviceUnavailable) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <ServiceUnavailableBanner
          onRetry={() => {
            setServiceUnavailable(false);
            setFetchKey((k) => k + 1);
          }}
          className="max-w-md"
        />
      </div>
    );
  }

  if (error || !examData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-background via-muted/20 to-background">
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
              setFetchKey((k) => k + 1);
            }}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t("common.retry")}
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = examData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === examData.questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round(
    (answeredCount / examData.questions.length) * 100,
  );
  const timerWidthPct = Math.round((questionTimeLeft / QUESTION_TIME) * 100);
  const questionProgressLabel = t("practice_exam.question_of")
    .replace("{n}", String(currentQuestionIndex + 1))
    .replace("{m}", String(examData.questions.length));
  const timerToneClass =
    questionTimeLeft >= 10
      ? "border-green-200 bg-green-50 text-green-700"
      : questionTimeLeft >= 5
      ? "border-orange-200 bg-orange-50 text-orange-600"
        : "border-red-200 bg-red-50 text-red-600 animate-pulse";
  const questionText = localizeText(
    language,
    currentQuestion.questionTextEn,
    currentQuestion.questionTextAr,
    currentQuestion.questionTextNl,
    currentQuestion.questionTextFr,
  );
  const questionImageUrl = currentQuestion.imageUrl
    ? convertToPublicImageUrl(currentQuestion.imageUrl) ?? null
    : null;

  return (
    <FocusedExamShell
      dir={isRTL ? "rtl" : "ltr"}
      backControl={
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 rounded-full px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={() => {
            pendingNavigation.current = "/practice";
            setShowExitDialog(true);
          }}
        >
          {isRTL ? (
            <ArrowRight className="me-2 h-4 w-4" />
          ) : (
            <ArrowLeft className="me-2 h-4 w-4" />
          )}
          {t("practice_exam.back_practice")}
        </Button>
      }
      timerPill={
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-[1.35rem] border px-4 py-2.5 text-base font-black tabular-nums shadow-sm",
            timerToneClass,
          )}
        >
          <Clock className="h-4 w-4" />
          {questionTimeLeft}s
        </div>
      }
      progressLabel={questionProgressLabel}
      progressPercent={progressPercent}
    >
      <FocusedQuestionCard
        headerBadges={
          <>
            <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
              {currentQuestionIndex + 1}
            </span>
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {t("nav.exam")}
            </span>
          </>
        }
        media={
          questionImageUrl ? (
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-background/70 p-3 shadow-sm">
              <div className="relative h-40 w-full min-w-[250px] max-w-[430px] md:h-44">
                <Image
                  src={questionImageUrl}
                  alt="Question illustration"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          ) : null
        }
        title={questionText}
        options={currentQuestion.options.map((option) => ({
          key: option.id,
          marker: option.number,
          text: localizeText(
            language,
            option.textEn,
            option.textAr,
            option.textNl,
            option.textFr,
          ),
          selected: answers[currentQuestion.id] === option.number,
          onSelect: () => handleAnswerSelect(option.number),
        }))}
        footer={
          <>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${timerColor(questionTimeLeft)}`}
                style={{ width: `${timerWidthPct}%` }}
              />
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleNextOrSubmit}
                disabled={isSubmitting}
                className="h-11 min-w-[112px] gap-2 rounded-full px-6 font-semibold shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25"
              >
                {isLastQuestion
                  ? t("practice_exam.submit_btn")
                  : t("practice_exam.next_btn")}
                {!isLastQuestion &&
                  (isRTL ? (
                    <ArrowLeft className="h-4 w-4" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  ))}
              </Button>
            </div>
          </>
        }
      />

      <ExitConfirmDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onStay={handleExitStay}
        onLeave={handleExitLeave}
      />
    </FocusedExamShell>
  );
}
