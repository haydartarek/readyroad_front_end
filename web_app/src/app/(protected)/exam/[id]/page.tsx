"use client";

import { useLocalizedRouter } from "@/hooks/use-localized-router";
import { useState, useEffect, useCallback, useRef } from "react";
import Image, { getImageProps } from "next/image";
import { useParams } from "next/navigation";
import Link from "@/components/localized-link";
import { ExitConfirmDialog } from "@/components/exam/exit-confirm-dialog";
import { FreeExamPaywall } from "@/components/exam/free-exam-paywall";
import { FocusedExamShell } from "@/components/exam/focused-exam-shell";
import { FocusedQuestionCard } from "@/components/exam/focused-question-card";
import { ExamQuestionImageFrame } from "@/components/exam/exam-question-image-frame";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import apiClient, { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { convertToPublicImageUrl } from "@/lib/image-utils";
import { API_ENDPOINTS, EXAM_RULES } from "@/lib/constants";
import {
  canSubmitTheoryExam,
  isPreviewBoundary,
  resolvePreviewOptionState,
  resolveVisibleResumeIndex,
  type ExamAccessMode,
  type ExamAccessState,
} from "@/lib/theory-exam-access";
import { useExamQuestionPresentation } from "@/hooks/use-exam-question-presentation";
import {
  resolveNextTheoryQuestionIndex,
  resolveTheoryTimedAttemptStep,
} from "@/lib/attempt-lifecycle";
import { StatusScreen } from "@/components/ui/status-screen";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Clock,
  Flag,
  ImageOff,
  TimerOff,
} from "lucide-react";

/** Seconds per question from the shared Theory Exam timing contract. */
const QUESTION_TIME = EXAM_RULES.QUESTION_TIME_SECONDS;
const QUESTION_IMAGE_SIZES = "(max-width: 1023px) calc(100vw - 48px), 700px";

interface Question {
  id: number;
  order: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  imageUrl?: string;
  difficultyLevel?: "EASY" | "MEDIUM" | "HARD";
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
  totalQuestions: number;
  expiresAt: string;
  questions: Question[];
  accessMode?: ExamAccessMode;
  accessState?: ExamAccessState;
  freeQuestionLimit?: number;
  resumeQuestionOrder?: number;
  finalizedQuestionIds: number[];
}

interface BackendQuestion {
  questionId: number;
  questionOrder?: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  imageUrl?: string;
  difficultyLevel?: "EASY" | "MEDIUM" | "HARD";
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
  totalQuestions: number;
  startedAt?: string;
  startTime?: string;
  expiresAt: string;
  questions: BackendQuestion[];
  accessMode?: ExamAccessMode;
  accessState?: ExamAccessState;
  freeQuestionLimit?: number;
  resumeQuestionOrder?: number;
  finalizedQuestionIds?: number[];
}

interface SubmitAnswerResponse {
  correct?: boolean | null;
  correctOptionId?: number | null;
  accessState?: ExamAccessState;
}

interface PreviewAnswerFeedback {
  correct: boolean;
  correctOptionId: number;
}

export function normalizeExamData(backendData: BackendExamData): ExamData {
  return {
    id: backendData.examId,
    totalQuestions: backendData.totalQuestions,
    expiresAt: backendData.expiresAt,
    accessMode: backendData.accessMode,
    accessState: backendData.accessState,
    freeQuestionLimit: backendData.freeQuestionLimit,
    resumeQuestionOrder: backendData.resumeQuestionOrder,
    finalizedQuestionIds: backendData.finalizedQuestionIds ?? [],
    questions: [...(backendData.questions ?? [])]
      .sort((a, b) => (a.questionOrder ?? Number.MAX_SAFE_INTEGER) - (b.questionOrder ?? Number.MAX_SAFE_INTEGER))
      .map((q) => ({
      id: q.questionId,
      order: q.questionOrder ?? 1,
      questionTextEn: q.questionTextEn,
      questionTextAr: q.questionTextAr,
      questionTextNl: q.questionTextNl,
      questionTextFr: q.questionTextFr,
      imageUrl: q.imageUrl,
      difficultyLevel: q.difficultyLevel,
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
  const router = useLocalizedRouter();
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
  const [showPaywall, setShowPaywall] = useState(false);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [finalizedQuestionIds, setFinalizedQuestionIds] = useState<Set<number>>(
    () => new Set(),
  );

  const [previewFeedbackByQuestionId, setPreviewFeedbackByQuestionId] =
    useState<Record<number, PreviewAnswerFeedback>>({});

  // ── Per-question countdown ──────────────────────────────
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(QUESTION_TIME);
  const [timerRestartKey, setTimerRestartKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartedAtRef = useRef(Date.now());

  const isExamActive = useRef(true);
  const pendingNavigation = useRef<string | null>(null);
  const continuousInactivitySecondsRef = useRef(0);
  const finalizedQuestionIdsRef = useRef<Set<number>>(new Set());
  const transitionInFlightRef = useRef(false);
  const lastAdvancedQuestionIdRef = useRef<number | null>(null);
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

        const response = await apiClient.get<{
          hasActiveExam: boolean;
          activeExam: BackendExamData;
        }>(`/exams/simulations/active`);

        if (response.data.hasActiveExam && response.data.activeExam) {
          const normalized = normalizeExamData(response.data.activeExam);

          if (normalized.id !== examId) {
            router.replace(`/exam/${normalized.id}`);
          }

          const hydratedFinalizedIds =
            new Set(normalized.finalizedQuestionIds);

          finalizedQuestionIdsRef.current =
            hydratedFinalizedIds;

          setFinalizedQuestionIds(
            new Set(hydratedFinalizedIds),
          );

          setCurrentQuestionIndex(
            resolveVisibleResumeIndex(
              normalized.resumeQuestionOrder,
              normalized.questions.length,
            ),
          );

          setShowPaywall(
            normalized.accessState ===
              "FREE_LIMIT_REACHED",
          );

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

  const presentedQuestionId =
    examData?.questions[currentQuestionIndex]?.id;

  const freeLimitReached =
    examData?.accessState === "FREE_LIMIT_REACHED";

  const previewFeedbackVisible =
    presentedQuestionId !== undefined &&
    Boolean(
      previewFeedbackByQuestionId[presentedQuestionId],
    );

  useExamQuestionPresentation(
    examId,
    presentedQuestionId,
    Boolean(examData) &&
      !isSubmitting &&
      !sessionEnded &&
      !freeLimitReached,
  );

  // ── Save answer ─────────────────────────────────────────
  const handleAnswerSelect = useCallback(
    async (optionNumber: number) => {
      if (!examData) return;
      const currentQuestion = examData.questions[currentQuestionIndex];
      if (!currentQuestion) return;

      const questionId = currentQuestion.id;

      if (previewFeedbackByQuestionId[questionId]) {
        return;
      }
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

      const previousAnswer = answers[questionId];
      // Optimistic local update — user can still change during the 15s window.
      setAnswers((prev) => ({ ...prev, [questionId]: optionNumber }));
      const timeTakenSeconds = Math.min(
        QUESTION_TIME,
        Math.max(
          0,
          Math.round((Date.now() - questionStartedAtRef.current) / 1000),
        ),
      );

      try {
        const response =
          await apiClient.post<SubmitAnswerResponse>(
            `/exams/simulations/${safeExamId}/questions/${questionId}/answer`,
            {
              selectedOptionId,
              timeTakenSeconds,
            },
          );

        if (response.data.accessState) {
          setExamData((current) =>
            current
              ? {
                  ...current,
                  accessState: response.data.accessState,
                }
              : current,
          );
        }

        const previewCorrect = response.data.correct;
        const previewCorrectOptionId =
          response.data.correctOptionId;

        if (
          examData.accessMode === "PREVIEW" &&
          typeof previewCorrect === "boolean" &&
          typeof previewCorrectOptionId === "number"
        ) {
          const previewFeedback: PreviewAnswerFeedback = {
            correct: previewCorrect,
            correctOptionId: previewCorrectOptionId,
          };

          setPreviewFeedbackByQuestionId((current) => ({
            ...current,
            [questionId]: previewFeedback,
          }));
        }

        continuousInactivitySecondsRef.current = 0;
        finalizedQuestionIdsRef.current.add(questionId);
        setFinalizedQuestionIds(new Set(finalizedQuestionIdsRef.current));
      } catch (err) {
        setAnswers((prev) => {
          const next = { ...prev };
          if (previousAnswer === undefined) delete next[questionId];
          else next[questionId] = previousAnswer;
          return next;
        });
        logApiError("Failed to save answer", err);
        if (!isServiceUnavailable(err)) {
          toast.error(t("exam.answer_save_failed"));
        }
      }
    },
    [
      answers,
      currentQuestionIndex,
      examData,
      examId,
      previewFeedbackByQuestionId,
      t,
    ],
  );

  // ── Submit exam ─────────────────────────────────────────
  const submitExam = useCallback(async () => {
    if (!examData) return;
    if (
      !canSubmitTheoryExam({
        finalizedCount:
          finalizedQuestionIdsRef.current.size,
        totalQuestions: examData.totalQuestions,
        accessState: examData.accessState,
      })
    ) {
      return;
    }
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

  const abandonExam = useCallback(
    async (target: string | null) => {
      if (!examData) return;
      try {
        setIsSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);
        await apiClient.post(API_ENDPOINTS.EXAMS.ABANDON(examId));
        isExamActive.current = false;
        localStorage.removeItem("current_exam");
        if (target) {
          router.push(target);
        } else {
          router.back();
        }
      } catch (err) {
        logApiError("Failed to abandon exam", err);
        isExamActive.current = true;
        setIsSubmitting(false);
        setQuestionTimeLeft(QUESTION_TIME);
        if (!isServiceUnavailable(err)) {
          toast.error(t("common.error"));
        }
      }
    },
    [examData, examId, router, t],
  );

  const terminateForInactivity = useCallback(async () => {
    if (!examData) return;
    try {
      setIsSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);
      await apiClient.post(API_ENDPOINTS.EXAMS.ABANDON(examId));
      isExamActive.current = false;
      localStorage.removeItem("current_exam");
      setSessionEnded(true);
      setIsSubmitting(false);
    } catch (err) {
      logApiError("Failed to terminate inactive exam", err);
      isExamActive.current = true;
      setIsSubmitting(false);
      setQuestionTimeLeft(QUESTION_TIME);
      if (!isServiceUnavailable(err)) toast.error(t("common.error"));
    }
  }, [examData, examId, t]);

  // Keep ref in sync so timer callbacks always fire the latest version
  useEffect(() => {
    submitExamRef.current = submitExam;
  }, [submitExam]);

  // ── Advance to next question (or submit on last) ────────
  const handleNextOrSubmit = useCallback(
    async (reason: "answered" | "timeout") => {
      if (!examData || transitionInFlightRef.current) return;
      const currentQuestion = examData.questions[currentQuestionIndex];
      if (!currentQuestion) return;
      if (lastAdvancedQuestionIdRef.current === currentQuestion.id) return;

      transitionInFlightRef.current = true;
      try {
        let resolvedReason = reason;
        if (reason === "timeout") {
          if (finalizedQuestionIdsRef.current.has(currentQuestion.id)) {
            resolvedReason = "answered";
          } else {
            await apiClient.post(
              `/exams/simulations/${examId}/questions/${currentQuestion.id}/timeout`,
            );
            finalizedQuestionIdsRef.current.add(currentQuestion.id);
            setFinalizedQuestionIds(
              new Set(finalizedQuestionIdsRef.current),
            );
          }
        } else if (!finalizedQuestionIdsRef.current.has(currentQuestion.id)) {
          return;
        }

        if (
          isPreviewBoundary({
            accessMode: examData.accessMode,
            freeQuestionLimit: examData.freeQuestionLimit,
            questionOrder: currentQuestion.order,
          })
        ) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }

          setExamData((current) =>
            current
              ? {
                  ...current,
                  accessState: "FREE_LIMIT_REACHED",
                }
              : current,
          );

          setShowPaywall(true);
          return;
        }

        const decision = resolveTheoryTimedAttemptStep({
          reason: resolvedReason,
          isLastQuestion:
            currentQuestion.order >= examData.totalQuestions,
          finalizedCount: finalizedQuestionIdsRef.current.size,
          totalQuestions: examData.totalQuestions,
          continuousInactivitySeconds:
            continuousInactivitySecondsRef.current,
        });
        continuousInactivitySecondsRef.current =
          decision.continuousInactivitySeconds;

        if (decision.action === "submit") {
          await submitExamRef.current?.();
        } else if (decision.action === "abandon") {
          await terminateForInactivity();
        } else {
          lastAdvancedQuestionIdRef.current = currentQuestion.id;
          setCurrentQuestionIndex((previousIndex) =>
            resolveNextTheoryQuestionIndex({
              currentIndex: previousIndex,
              transitionFromIndex: currentQuestionIndex,
              totalQuestions: examData.totalQuestions,
            }),
          );
          setQuestionTimeLeft(QUESTION_TIME);
        }
      } catch (err) {
        logApiError("Failed to finalize timed exam question", err);
        setQuestionTimeLeft(QUESTION_TIME);
        setTimerRestartKey((current) => current + 1);
        if (!isServiceUnavailable(err)) {
          toast.error(t("exam.answer_save_failed"));
        }
      } finally {
        transitionInFlightRef.current = false;
      }
    },
    [currentQuestionIndex, examData, examId, t, terminateForInactivity],
  );

  // Ref so the timer interval closure always sees the latest handler
  const handleNextOrSubmitRef = useRef(handleNextOrSubmit);
  useEffect(() => {
    handleNextOrSubmitRef.current = handleNextOrSubmit;
  }, [handleNextOrSubmit]);

  // Start only when a question is available. Keep transitions outside a state
  // updater: React may replay updater functions, while navigation must run once.
  useEffect(() => {
    if (
      isLoading ||
      !presentedQuestionId ||
      isSubmitting ||
      sessionEnded ||
      freeLimitReached ||
      previewFeedbackVisible
    ) {
      return;
    }
    setQuestionTimeLeft(QUESTION_TIME);
    questionStartedAtRef.current = Date.now();
    const deadline = questionStartedAtRef.current + QUESTION_TIME * 1000;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setQuestionTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(timer);
        void handleNextOrSubmitRef.current("timeout");
      }
    }, 250);
    timerRef.current = timer;
    return () => clearInterval(timer);
  }, [
    isLoading,
    presentedQuestionId,
    isSubmitting,
    sessionEnded,
    freeLimitReached,
    previewFeedbackVisible,
    timerRestartKey,
  ]);

  const nextImageUrl = convertToPublicImageUrl(
    examData?.questions[currentQuestionIndex + 1]?.imageUrl,
  );
  useEffect(() => {
    if (!nextImageUrl || isSubmitting || sessionEnded) return;
    const { props } = getImageProps({
      src: nextImageUrl,
      alt: "",
      fill: true,
      sizes: QUESTION_IMAGE_SIZES,
    });
    const image = new window.Image();
    image.fetchPriority = "low";
    image.decoding = "async";
    image.sizes = props.sizes ?? "";
    image.srcset = props.srcSet ?? "";
    image.src = props.src;
  }, [nextImageUrl, isSubmitting, sessionEnded]);

  const handleExitStay = useCallback(() => {
    pendingNavigation.current = null;
  }, []);
  const handleExitLeave = useCallback(() => {
    const target = pendingNavigation.current;
    pendingNavigation.current = null;
    void abandonExam(target);
  }, [abandonExam]);

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

  if (sessionEnded) {
    return (
      <StatusScreen
        dir={isRTL ? "rtl" : "ltr"}
        badge={t("exam.session_ended_badge")}
        title={t("exam.session_ended_title")}
        description={t("exam.session_ended_description")}
        icon={<TimerOff className="h-10 w-10" />}
        primaryAction={{
          label: t("exam.session_ended_action"),
          href: "/exam",
        }}
        brandCaption="RijVia"
      />
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
  const isLastQuestion = currentQuestion.order >= examData.totalQuestions;
  const progressPercent = Math.round(
    (currentQuestion.order / examData.totalQuestions) * 100,
  );
  const questionCounter = `${currentQuestion.order} / ${examData.totalQuestions}`;
  const timerToneClass =
    questionTimeLeft >= 10
      ? "text-green-700"
      : questionTimeLeft >= 5
        ? "text-orange-600"
        : "text-red-600 animate-pulse";
  const questionText = localizeText(
    language,
    currentQuestion.questionTextEn,
    currentQuestion.questionTextAr,
    currentQuestion.questionTextNl,
    currentQuestion.questionTextFr,
  );
  const questionImageUrl = currentQuestion.imageUrl
    ? (convertToPublicImageUrl(currentQuestion.imageUrl) ?? null)
    : null;
  const difficultyLabel = currentQuestion.difficultyLevel
    ? t(`practice_exam.difficulty_${currentQuestion.difficultyLevel.toLowerCase()}`)
    : null;

  const currentPreviewFeedback =
    previewFeedbackByQuestionId[currentQuestion.id];

  const selectedOptionNumber =
    answers[currentQuestion.id];

  const selectedOption =
    currentQuestion.options.find(
      (option) =>
        option.number === selectedOptionNumber,
    );

  const correctOption =
    currentPreviewFeedback
      ? currentQuestion.options.find(
          (option) =>
            option.id === currentPreviewFeedback.correctOptionId,
        )
      : undefined;

  const correctOptionText =
    correctOption
      ? localizeText(
          language,
          correctOption.textEn,
          correctOption.textAr,
          correctOption.textNl,
          correctOption.textFr,
        )
      : "";

  return (
    <FocusedExamShell
      dir={isRTL ? "rtl" : "ltr"}
      counter={questionCounter}
      difficultyLabel={difficultyLabel ?? undefined}
      difficultyClassName="bg-primary/10 text-primary"
      timerPill={
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[13px] font-black tabular-nums sm:text-sm",
            timerToneClass,
          )}
        >
          <Clock className="h-4 w-4" />
          {questionTimeLeft}s
        </span>
      }
      progressPercent={progressPercent}
      compactInformationBar
      afterCard={
        <>
          <div
            data-testid="exam-actions"
            className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5 pb-3"
          >
          <Button
            variant="destructive"
            size="lg"
            className="w-full whitespace-normal px-3"
            onClick={() => {
              pendingNavigation.current = "/exam";
              setShowExitDialog(true);
            }}
          >
            {t("practice_exam.end_exam")}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full whitespace-normal px-3"
            asChild
          >
            <Link href="/contact">
              <Flag className="h-4 w-4" />
              {t("practice_exam.report_question")}
            </Link>
          </Button>

          </div>
          <ExitConfirmDialog
            open={showExitDialog}
            onOpenChange={setShowExitDialog}
            onStay={handleExitStay}
            onLeave={handleExitLeave}
          />

          <FreeExamPaywall
            open={showPaywall}
            examId={examId}
            totalQuestions={examData.totalQuestions}
            completedQuestions={finalizedQuestionIds.size}
            onOpenChange={setShowPaywall}
          />
        </>
      }
    >
      <FocusedQuestionCard
        compactOptionGap
        compactMobile
        feedback={
          currentPreviewFeedback ? (
            <div
              role="status"
              aria-live="polite"
              className={[
                "rounded-xl border px-4 py-3 text-sm font-semibold",
                currentPreviewFeedback.correct
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-red-300 bg-red-50 text-red-900",
              ].join(" ")}
            >
              <p className="font-black">
                {t(
                  currentPreviewFeedback.correct
                    ? "practice_exam.score_correct"
                    : "practice_exam.score_wrong",
                )}
              </p>

              {correctOptionText ? (
                <p className="mt-1">
                  {t("exam.correct_answer")} {correctOptionText}
                </p>
              ) : null}
            </div>
          ) : null
        }
        footer={
          <Button
            data-testid="exam-next"
            size="lg"
            onClick={() => void handleNextOrSubmit("answered")}
            disabled={
              isSubmitting ||
              !finalizedQuestionIds.has(currentQuestion.id)
            }
            className="w-full shadow-md shadow-primary/20"
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
        }
        difficultyBadge={
          difficultyLabel ? (
            <span className="inline-flex min-h-8 items-center rounded-full border border-primary/20 bg-primary/10 px-3 text-xs font-black text-primary">
              {difficultyLabel}
            </span>
          ) : null
        }
        media={
          questionImageUrl ? (
            <ExamQuestionImageFrame variant="theory" className="max-lg:max-h-[28svh] max-lg:p-1.5">
              {failedImageUrl === questionImageUrl ? (
                <div
                  role="status"
                  className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-[8px] bg-muted/40 p-4 text-center text-sm text-muted-foreground"
                >
                  <ImageOff className="h-6 w-6" />
                  <span>{t("practice.question_image_error")}</span>
                </div>
              ) : (
                <Image
                  src={questionImageUrl}
                  alt={t("practice.question_image_alt")}
                  fill
                  sizes={QUESTION_IMAGE_SIZES}
                  className="object-contain"
                  loading="eager"
                  fetchPriority="high"
                  onError={() => {
                    console.error(
                      "Failed to load theoretical question image",
                      questionImageUrl,
                    );
                    setFailedImageUrl(questionImageUrl);
                  }}
                />
              )}
            </ExamQuestionImageFrame>
          ) : null
        }
        title={questionText}
        options={currentQuestion.options.map((option) => ({
          key: option.id,
          text: localizeText(
            language,
            option.textEn,
            option.textAr,
            option.textNl,
            option.textFr,
          ),
          selected:
            answers[currentQuestion.id] === option.number,
          state: resolvePreviewOptionState({
            optionId: option.id,
            selectedOptionId: selectedOption?.id,
            correctOptionId:
              currentPreviewFeedback?.correctOptionId,
            hasFeedback:
              Boolean(currentPreviewFeedback),
          }),
          disabled:
            Boolean(currentPreviewFeedback),
          onSelect: () =>
            handleAnswerSelect(option.number),
        }))}
      />
    </FocusedExamShell>
  );
}
