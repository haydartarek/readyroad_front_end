"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { QuestionCard } from "@/components/exam/question-card";
import { QuestionNavigator } from "@/components/exam/question-navigator";
import { ExitConfirmDialog } from "@/components/exam/exit-confirm-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import apiClient, { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { toast } from "sonner";
import { RefreshCw, CheckCircle2, Circle, LayoutGrid } from "lucide-react";

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

function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
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
          setError("Invalid exam ID");
          toast.error("Invalid exam ID. Please start a new exam.");
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
          toast.info("No active exam found. Please start a new exam.");
          router.replace("/exam");
        }
      } catch (err) {
        logApiError("Failed to fetch exam data", err);
        if (isServiceUnavailable(err)) setServiceUnavailable(true);
        else {
          setError("Failed to load exam. Please try again.");
          toast.error("Failed to load exam");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchExamData();
  }, [examId, router, fetchKey]);

  // ── Save answer ─────────────────────────────────────────
  const handleAnswerSelect = useCallback(
    async (optionNumber: number) => {
      if (!examData) return;
      const currentQuestion = examData.questions[currentQuestionIndex];
      if (!currentQuestion) return;

      const questionId = currentQuestion.id;
      if (!Number.isFinite(questionId)) {
        toast.error("Invalid question ID");
        return;
      }

      const safeExamId = Number(examId);
      if (!Number.isFinite(safeExamId)) {
        toast.error("Invalid exam ID");
        return;
      }

      const selectedOption = currentQuestion.options.find(
        (opt) => opt.number === optionNumber,
      );
      if (!selectedOption) {
        toast.error("Invalid option");
        return;
      }

      const selectedOptionId = selectedOption.id;
      if (!selectedOptionId) {
        toast.error("Option ID not found");
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
        if (!isServiceUnavailable(err)) toast.error("Failed to save answer");
      }
    },
    [examData, currentQuestionIndex, examId],
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
      toast.success("Exam submitted successfully!");
      router.push(`/exam/results/${examId}`);
    } catch (err) {
      logApiError("Failed to submit exam", err);
      isExamActive.current = true;
      if (!isServiceUnavailable(err))
        toast.error("Failed to submit exam. Please try again.");
      setIsSubmitting(false);
    }
  }, [examData, examId, router]);

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
    router.back();
  }, [router]);

  if (isLoading) return <LoadingSpinner message="Loading your exam..." />;

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
            <AlertDescription>{error || "Exam not found"}</AlertDescription>
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
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = examData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === examData.questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = examData.questions.length - answeredCount;
  const progressPercent = Math.round(
    (answeredCount / examData.questions.length) * 100,
  );
  const timerWidthPct = Math.round((questionTimeLeft / QUESTION_TIME) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="space-y-5">
          {/* Top Bar — question counter + small countdown badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-2xl bg-card border border-border/50 px-5 py-2 shadow-sm">
              <span className="text-sm text-muted-foreground">Question</span>
              <span className="text-lg font-black text-primary">
                {currentQuestionIndex + 1}
              </span>
              <span className="text-sm text-muted-foreground">of</span>
              <span className="text-lg font-black">
                {examData.questions.length}
              </span>
            </div>

            {/* Countdown badge */}
            <div
              className={`flex items-center gap-1 rounded-2xl border px-4 py-2 shadow-sm font-black text-lg tabular-nums
              ${
                questionTimeLeft >= 10
                  ? "bg-green-50 border-green-200 text-green-700"
                  : questionTimeLeft >= 5
                    ? "bg-orange-50 border-orange-200 text-orange-600"
                    : "bg-red-50 border-red-200 text-red-600 animate-pulse"
              }`}
            >
              {questionTimeLeft}s
            </div>
          </div>

          {/* Stats Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-card border border-border/40 px-4 py-2.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Answered</p>
                <p className="text-base font-black text-green-600">
                  {answeredCount}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-card border border-border/40 px-4 py-2.5 shadow-sm">
              <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="text-base font-black text-muted-foreground">
                  {unansweredCount}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-card border border-border/40 px-4 py-2.5 shadow-sm">
              <LayoutGrid className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-base font-black text-primary">
                  {progressPercent}%
                </p>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={answers[currentQuestion.id]}
            onAnswerSelect={handleAnswerSelect}
          />

          {/* ── Countdown timer bar — below the question card ── */}
          <div className="rounded-2xl border bg-card px-5 py-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-muted-foreground">Time remaining</span>
              <span
                className={
                  questionTimeLeft >= 10
                    ? "text-green-600"
                    : questionTimeLeft >= 5
                      ? "text-orange-500"
                      : "text-red-600 animate-pulse"
                }
              >
                {questionTimeLeft}s
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${timerColor(questionTimeLeft)}`}
                style={{ width: `${timerWidthPct}%` }}
              />
            </div>
          </div>

          {/* Navigation — Next only */}
          <QuestionNavigator
            onNext={handleNextOrSubmit}
            isLastQuestion={isLastQuestion}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      <ExitConfirmDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onStay={handleExitStay}
        onLeave={handleExitLeave}
      />
    </div>
  );
}
