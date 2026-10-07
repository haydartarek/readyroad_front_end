"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocalizedRouter } from "@/hooks/use-localized-router";
import Link from "@/components/localized-link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PageHeroDescription,
  PageHeroSurface,
  PageHeroTitle,
  PageMetricCard,
  PageSectionSurface,
} from "@/components/ui/page-surface";
import { FocusedExamShell } from "@/components/exam/focused-exam-shell";
import { FocusedQuestionCard } from "@/components/exam/focused-question-card";
import { ExamQuestionImageFrame } from "@/components/exam/exam-question-image-frame";
import { ExitConfirmDialog } from "@/components/exam/exit-confirm-dialog";
import { getExamOptionLabel } from "@/components/exam/exam-option-card";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { isServiceUnavailable, logApiError } from "@/lib/api";
import { buildLearningLoginHref } from "@/lib/auth-return-url";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { SignImage } from "@/components/traffic-signs/sign-image";
import {
  ResultAnswerBlock,
  ResultDetailsToggle,
} from "@/components/results/result-review";
import { cn } from "@/lib/utils";
import { resolveTimedAttemptStep } from "@/lib/attempt-lifecycle";
import {
  startRandomPracticeSession,
  submitRandomPracticeSession,
  abandonRandomPracticeSession,
  type SignQuizQuestion,
  type SignRandomPracticeResult,
  type SignRandomPracticeQuestionResult,
} from "@/services/signQuizService";
import {
  Timer,
  Trophy,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Home,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Shuffle,
  Shapes,
  Info,
  Flag,
} from "lucide-react";

// --- Types ---

type QuestionResult = SignRandomPracticeQuestionResult;

type Phase = "intro" | "loading" | "exam" | "submitting" | "results";

const SECONDS_PER_QUESTION = 15;

function getRandomPracticeCategoryLabel(
  signCode: string | null | undefined,
  t: (key: string) => string,
) {
  const prefix = (signCode ?? "").trim().toUpperCase();
  if (prefix.startsWith("A")) return t("traffic_signs.category_danger");
  if (prefix.startsWith("B")) return t("traffic_signs.category_priority");
  if (prefix.startsWith("C")) return t("traffic_signs.category_prohibition");
  if (prefix.startsWith("D")) return t("traffic_signs.category_mandatory");
  if (prefix.startsWith("E")) return t("traffic_signs.category_parking");
  return t("nav.traffic_signs");
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/35">
      <div className="container mx-auto max-w-5xl px-4 py-8 md:py-10">
        <div className="flex min-h-[55vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.6rem] border border-primary/15 bg-primary/10 text-primary shadow-sm">
              <RotateCcw className="h-6 w-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {message}
              </p>
              <p className="text-sm text-muted-foreground">...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function RandomPracticePage() {
  const { t, language } = useLanguage();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useLocalizedRouter();
  const isRTL = language === "ar";

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<SignQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [result, setResult] = useState<SignRandomPracticeResult | null>(null);
  const [serviceUnavailable, setSvcError] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "correct">(
    "all",
  );
  const [startError, setStartError] = useState<string | null>(null);
  const [isLockedUi, setIsLockedUi] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const answersRef = useRef<(number | null)[]>([]);
  const isAdvancingRef = useRef(false);
  const consecutiveUnansweredRef = useRef(0);

  useEffect(() => {
    if (phase === "exam") window.scrollTo({ top: 0, behavior: "instant" });
  }, [phase]);

  const localize = useCallback(
    (
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
    },
    [language],
  );

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case "EASY":
        return t("practice_exam.difficulty_easy");
      case "MEDIUM":
        return t("practice_exam.difficulty_medium");
      case "HARD":
        return t("practice_exam.difficulty_hard");
      default:
        return level;
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "EASY":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "HARD":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // --- Lifecycle ---

  const startExam = async () => {
    if (!isAuthenticated) {
      router.push(buildLearningLoginHref("/practice/random", language));
      return;
    }

    setSvcError(false);
    setStartError(null);
    setPhase("loading");
    try {
      const session = await startRandomPracticeSession();
      if (session.questions && session.questions.length > 0) {
        answersRef.current = new Array(session.questions.length).fill(null);
        setSessionId(session.sessionId);
        setQuestions(session.questions);
        setCurrentIndex(0);
        setSelectedOption(null);
        setTimeLeft(SECONDS_PER_QUESTION);
        setIsLockedUi(false);
        isAdvancingRef.current = false;
        consecutiveUnansweredRef.current = 0;
        setPhase("exam");
      } else {
        setPhase("intro");
      }
    } catch (err) {
      logApiError("Failed to load sign practice questions", err);
      if (isServiceUnavailable(err)) setSvcError(true);
      else setStartError(t("sign_practice.cooldown_error"));
      setPhase("intro");
    }
  };

  const abandonSession = useCallback(
    async (target?: string) => {
      if (!sessionId) return;
      try {
        await abandonRandomPracticeSession(sessionId);
        answersRef.current = [];
        consecutiveUnansweredRef.current = 0;
        isAdvancingRef.current = false;
        setSessionId(null);
        setQuestions([]);
        setSelectedOption(null);
        setIsLockedUi(false);
        setPhase("intro");
        if (target) router.push(target);
      } catch (err) {
        logApiError("Failed to abandon sign practice", err);
        setStartError(t("sign_practice.submit_error"));
        setTimeLeft(SECONDS_PER_QUESTION);
        setIsLockedUi(false);
        isAdvancingRef.current = false;
      }
    },
    [router, sessionId, t],
  );

  const submitAll = useCallback(async () => {
    if (!sessionId) {
      setPhase("intro");
      return;
    }

    if (answersRef.current.some((answer) => answer === null)) {
      await abandonSession();
      return;
    }

    setPhase("submitting");
    const payload = questions.map((q, i) => ({
      questionId: q.id,
      selectedChoiceId: answersRef.current[i] ?? null,
    }));
    try {
      const res = await submitRandomPracticeSession(sessionId, payload);
      setResult(res);
      router.push(`/exam/results?randomSignExamId=${res.sessionId}`);
    } catch (err) {
      logApiError("Failed to check sign practice answers", err);
      if (isServiceUnavailable(err)) {
        setSvcError(true);
      } else {
        setStartError(t("sign_practice.submit_error"));
      }
      setPhase("intro");
    }
  }, [abandonSession, questions, router, sessionId, t]);

  const selectOption = useCallback((choiceId: number) => {
    if (isAdvancingRef.current) return;
    setSelectedOption(choiceId);
  }, []);

  const advanceToNext = useCallback(
    (answerToSave: number | null, reason: "manual" | "timeout") => {
      if (isAdvancingRef.current) return;
      isAdvancingRef.current = true;
      setIsLockedUi(true);

      const answeredCount =
        answersRef.current.filter((answer) => answer !== null).length +
        (answersRef.current[currentIndex] === null && answerToSave !== null
          ? 1
          : 0);
      const decision = resolveTimedAttemptStep({
        reason,
        isCurrentAnswered: answerToSave !== null,
        isLastQuestion: currentIndex + 1 >= questions.length,
        answeredCount,
        totalQuestions: questions.length,
        consecutiveUnanswered: consecutiveUnansweredRef.current,
      });
      consecutiveUnansweredRef.current = decision.consecutiveUnanswered;
      if (decision.action === "abandon") {
        void abandonSession();
        return;
      }

      answersRef.current[currentIndex] = answerToSave;

      const nextIndex = currentIndex + 1;
      if (decision.action === "submit") {
        void submitAll();
      } else {
        setSelectedOption(null);
        setTimeLeft(SECONDS_PER_QUESTION);
        setIsLockedUi(false);
        isAdvancingRef.current = false;
        setCurrentIndex(nextIndex);
      }
    },
    [abandonSession, currentIndex, questions.length, submitAll],
  );

  useEffect(() => {
    if (phase !== "exam") return;
    if (isAdvancingRef.current) return;

    if (timeLeft <= 0) {
      const autoAdvance = setTimeout(() => {
        advanceToNext(selectedOption, "timeout");
      }, 0);
      return () => clearTimeout(autoAdvance);
    }

    const tick = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(tick);
  }, [phase, timeLeft, advanceToNext, selectedOption]);

  const handleRetry = () => {
    setSessionId(null);
    setResult(null);
    setShowReview(false);
    setReviewFilter("all");
    setStartError(null);
    setPhase("intro");
  };

  const backToPracticeContent = isRTL ? (
    <>
      <span>{t("practice_exam.back_practice")}</span>
      <ArrowRight className="h-4 w-4" />
    </>
  ) : (
    <>
      <ArrowLeft className="h-4 w-4" />
      <span>{t("practice_exam.back_practice")}</span>
    </>
  );

  // --- Screens ---

  if (serviceUnavailable) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/35">
        <div className="container mx-auto max-w-4xl px-4 py-8 md:py-10">
          <ServiceUnavailableBanner
            onRetry={() => {
              setSvcError(false);
              void startExam();
            }}
            className="mx-auto max-w-xl"
          />
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div
        className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/25"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="pointer-events-none absolute -top-24 right-[-6rem] h-72 w-72 rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-[-5rem] h-56 w-56 rounded-full bg-secondary/[0.05] blur-3xl" />

        <div className="container relative mx-auto max-w-5xl px-4 py-5 sm:py-6 lg:py-8">
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
            <section className="relative overflow-hidden rounded-[1.75rem] border border-primary/15 bg-gradient-to-br from-primary/[0.09] via-primary/[0.035] to-background shadow-sm">
              <div className="pointer-events-none absolute top-0 end-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/[0.05]" />

              <div className="relative space-y-5 p-5 sm:p-6 lg:p-7">
                <div className="flex items-start gap-3.5 sm:items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/15">
                    <Shuffle className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <PageHeroTitle>
                      {t("sign_practice.intro_title")}
                    </PageHeroTitle>

                    <PageHeroDescription className="max-w-2xl">
                      {t("sign_practice.intro_subtitle")}
                    </PageHeroDescription>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {[
                    {
                      icon: <ClipboardList className="h-4 w-4" />,
                      value: "50",
                      label: t("sign_practice.stat_questions"),
                      tone: "text-primary",
                      iconTone: "bg-primary/10 text-primary",
                    },
                    {
                      icon: <Timer className="h-4 w-4" />,
                      value: "15s",
                      label: t("sign_practice.stat_time"),
                      tone: "text-primary",
                      iconTone: "bg-primary/10 text-primary",
                    },
                    {
                      icon: <Trophy className="h-4 w-4" />,
                      value: "41/50",
                      label: t("sign_practice.stat_pass"),
                      tone: "text-green-600",
                      iconTone: "bg-green-500/10 text-green-600",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-[1.15rem] border border-border/60 bg-background/85 p-3 shadow-sm sm:p-3.5"
                    >
                      <div className="flex min-w-0 items-center gap-2">                         <div                           className={cn(                             "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",                             stat.iconTone,                           )}                         >                           {stat.icon}                         </div>                          <p className="min-w-0 text-[11px] font-semibold leading-4 text-muted-foreground sm:text-xs">                           {stat.label}                         </p>                       </div>
                      <p
                        className={cn(
                          "mt-2 text-xl font-black tabular-nums sm:text-2xl",
                          stat.tone,
                        )}
                      >
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {startError ? (
                  <Alert className="rounded-2xl border-amber-200 bg-amber-50/70 text-amber-900">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="font-medium">
                      {startError}
                    </AlertDescription>
                  </Alert>
                ) : null}

                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <Button
                    data-testid="sign-exam-start-button"
                    size="lg"
                    className="h-11 shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/20 sm:flex-1"
                    disabled={isAuthLoading}
                    onClick={() => void startExam()}
                  >
                    <Timer className="h-4 w-4" />
                    {t("practice_exam.start_btn")}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="h-11 bg-background/75"
                    asChild
                  >
                    <Link href="/practice">{backToPracticeContent}</Link>
                  </Button>
                </div>
              </div>
            </section>

            <aside className="rounded-[1.75rem] border border-border/60 bg-card/90 p-4 shadow-sm sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-primary/10 text-primary ring-1 ring-primary/10">
                  <ClipboardList className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-black text-foreground">
                    {t("practice_exam.rules_title")}
                  </h2>
                  <p className="mt-0.5 text-xs font-semibold leading-5 text-muted-foreground">
                    {t("practice_exam.rules_desc")}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {[
                  {
                    icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
                    text: t("practice_exam.rule_choices"),
                  },
                  {
                    icon: <RefreshCw className="h-4 w-4 text-secondary" />,
                    text: t("sign_practice.rule_freshness"),
                  },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-start gap-2.5 rounded-[1rem] bg-background/80 px-3 py-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.85rem] bg-muted/60">
                      {item.icon}
                    </div>

                    <p className="pt-1 text-xs font-semibold leading-5 text-foreground/85">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="my-4 h-px bg-border/60" />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[0.85rem] bg-primary/10 text-primary">
                      <Shapes className="h-4 w-4" />
                    </div>

                    <span className="text-sm font-black text-foreground">
                      {t("practice_exam.difficulty_mix")}
                    </span>
                  </div>

                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    20 · 20 · 10
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      value: 20,
                      total: 50,
                      label: t("practice_exam.difficulty_easy"),
                      bar: "bg-green-500",
                      tone: "text-green-700",
                    },
                    {
                      value: 20,
                      total: 50,
                      label: t("practice_exam.difficulty_medium"),
                      bar: "bg-orange-500",
                      tone: "text-orange-600",
                    },
                    {
                      value: 10,
                      total: 50,
                      label: t("practice_exam.difficulty_hard"),
                      bar: "bg-red-500",
                      tone: "text-red-600",
                    },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                        <span className={item.tone}>{item.label}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {item.value}/50
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-muted/70">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            item.bar,
                          )}
                          style={{
                            width: `${(item.value / item.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }
  if (phase === "loading" || phase === "submitting") {
    return (
      <LoadingState
        message={
          phase === "loading"
            ? t("practice_exam.loading")
            : t("practice_exam.submitting")
        }
      />
    );
  }

  if (phase === "exam" && questions.length > 0) {
    const question = questions[currentIndex];
    const progressPct =
      questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
    const timerPillClass =
      timeLeft <= 5
        ? "text-destructive animate-pulse"
        : timeLeft <= 10
          ? "text-orange-500"
          : "text-muted-foreground";
    const questionCounter = `${currentIndex + 1} / ${questions.length}`;
    const difficultyLabel = getDifficultyLabel(question.difficulty);

    return (
      <>
        <FocusedExamShell
          dir={isRTL ? "rtl" : "ltr"}
          counter={questionCounter}
          difficultyLabel={difficultyLabel}
          difficultyClassName="bg-primary/10 text-primary"
          timerPill={
            <div
              className={cn(
                "inline-flex items-center gap-1.5 text-[13px] font-black tabular-nums transition-colors sm:text-sm",
                timerPillClass,
              )}
            >
              <Clock className="h-4 w-4" />
              {timeLeft}s
            </div>
          }
          progressPercent={progressPct}
          compactInformationBar
          afterCard={
            <div
              data-testid="exam-actions"
              className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5 pb-3"
            >
              <Button
                variant="destructive"
                size="lg"
                className="w-full whitespace-normal px-3"
                onClick={() => setShowExitDialog(true)}
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
          }
        >
          <FocusedQuestionCard
            compactOptionGap
            compactMobile
            footer={
              <Button
                data-testid="exam-next"
                size="lg"
                onClick={() => advanceToNext(selectedOption, "manual")}
                disabled={isLockedUi}
                className="w-full shadow-md shadow-primary/20"
              >
                {currentIndex + 1 === questions.length ? t("practice_exam.submit_btn") : t("practice_exam.next_btn")}
                {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </Button>
            }
            headerBadges={
              <span className="inline-flex items-center rounded-full border border-border/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {getRandomPracticeCategoryLabel(question.signCode, t)}
              </span>
            }
            difficultyBadge={
              <span
                className="inline-flex min-h-8 items-center rounded-full border border-primary/20 bg-primary/10 px-3 text-xs font-black text-primary"
              >
                {difficultyLabel}
              </span>
            }
            media={
          question.signImagePath ? (
                <ExamQuestionImageFrame variant="theory" className="max-lg:max-h-[28svh] max-lg:p-1.5">
                  <SignImage
                    src={question.signImagePath}
                    alt={question.signCode ?? "traffic sign"}
                    className="object-contain"
                  />
                </ExamQuestionImageFrame>
              ) : null
            }
            title={localize(
              question.questionEn,
              question.questionAr,
              question.questionNl,
              question.questionFr,
            )}
            options={question.choices.map((choice) => ({
              key: choice.id,
              text: localize(
                choice.textEn,
                choice.textAr,
                choice.textNl,
                choice.textFr,
              ),
              selected: selectedOption === choice.id,
              disabled: isLockedUi,
              onSelect: () => selectOption(choice.id),
            }))}
          />
        </FocusedExamShell>
        <ExitConfirmDialog
          open={showExitDialog}
          onOpenChange={setShowExitDialog}
          onStay={() => undefined}
          onLeave={() => void abandonSession("/practice")}
          context="practice"
        />
      </>
    );
  }

  if (phase === "results" && result) {
    const filteredQs = result.questions.filter((q) => {
      if (reviewFilter === "correct") return q.isCorrect;
      if (reviewFilter === "wrong") return !q.isCorrect;
      return true;
    });

    return (
      <div
        className="min-h-screen bg-gradient-to-b from-background via-background to-muted/35 pb-12"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-10 space-y-6">
          <PageHeroSurface
            className={cn(
              "border",
              result.passed ? "border-green-200/70" : "border-red-200/70",
            )}
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
                      result.passed
                        ? "border-green-200 bg-green-100 text-green-700"
                        : "border-red-200 bg-red-100 text-red-700",
                    )}
                  >
                    {result.passed
                      ? t("practice_exam.score_passed")
                      : t("practice_exam.score_failed")}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <PageHeroTitle>
                    {t("sign_quiz.practice.session_complete")}
                  </PageHeroTitle>
                  <PageHeroDescription className="max-w-2xl">
                    {t("sign_practice.result_description")}
                  </PageHeroDescription>
                </div>

                <div className="space-y-2 rounded-[1.35rem] border border-border/60 bg-background/80 px-4 py-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-foreground">
                      {t("practice_exam.score_correct")}
                    </span>
                    <span className="font-semibold text-primary">
                      {result.correctAnswers}/{result.totalQuestions}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        result.passed ? "bg-green-500" : "bg-primary",
                      )}
                      style={{ width: `${result.scorePercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <PageMetricCard
                  icon={
                    result.passed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )
                  }
                  label={t("practice.progress")}
                  value={`${result.scorePercentage.toFixed(1)}%`}
                  tone={result.passed ? "success" : "danger"}
                  hint={`${result.correctAnswers}/${result.totalQuestions}`}
                  mobileStacked
                />
                <PageMetricCard
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label={t("practice_exam.score_correct")}
                  value={String(result.correctAnswers)}
                  tone="success"
                  mobileStacked
                />
                <PageMetricCard
                  icon={<XCircle className="h-4 w-4" />}
                  label={t("practice_exam.score_wrong")}
                  value={String(result.wrongAnswers + result.unanswered)}
                  tone={
                    result.wrongAnswers + result.unanswered > 0
                      ? "danger"
                      : "default"
                  }
                  mobileStacked
                />
              </div>
            </div>
          </PageHeroSurface>

          <PageSectionSurface
            title={t("practice_exam.review_title")}
            description={t("practice_exam.score_pass_threshold").replace(
              "{n}",
              String(result.passingScore),
            )}
            actions={
              <div className="flex flex-wrap gap-2">
                {(["all", "wrong", "correct"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setReviewFilter(filter)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                      reviewFilter === filter
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border/60 bg-background text-muted-foreground hover:border-primary/25 hover:text-foreground",
                    )}
                  >
                    {t(`practice_exam.filter_${filter}`)}
                  </button>
                ))}
              </div>
            }
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: <CheckCircle2 className="h-4 w-4" />,
                  label: t("practice_exam.score_correct"),
                  value: result.correctAnswers,
                  tone: "success" as const,
                },
                {
                  icon: <XCircle className="h-4 w-4" />,
                  label: t("practice_exam.score_wrong"),
                  value: result.wrongAnswers,
                  tone: "danger" as const,
                },
                {
                  icon: <Clock className="h-4 w-4" />,
                  label: t("practice_exam.score_timeout"),
                  value: result.unanswered,
                  tone: "warning" as const,
                },
              ].map((stat) => (
                <PageMetricCard
                  key={stat.label}
                  icon={stat.icon}
                  label={stat.label}
                  value={String(stat.value)}
                  tone={stat.tone}
                  mobileStacked
                />
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={handleRetry} className="h-12 rounded-[1.15rem]">
                <RotateCcw className="me-2 h-4 w-4" />
                {t("practice_exam.retry_btn")}
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-[1.15rem]"
                asChild
              >
                <Link
                  href={`/exam/results?randomSignExamId=${result.sessionId}`}
                >
                  <Trophy className="me-2 h-4 w-4" />
                  {t("sign_practice.result_cta")}
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-[1.15rem]"
                asChild
              >
                <Link href="/practice">
                  <Home className="me-2 h-4 w-4" />
                  {t("practice_exam.home_btn")}
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="h-12 rounded-[1.15rem]"
                onClick={() => setShowReview((value) => !value)}
              >
                {showReview ? (
                  <ChevronUp className="me-2 h-4 w-4" />
                ) : (
                  <ChevronDown className="me-2 h-4 w-4" />
                )}
                {t("practice_exam.review_title")}
              </Button>
            </div>

            {showReview ? (
              <div className="space-y-3">
                {filteredQs.map((qr) => {
                  const qNum =
                    result.questions.findIndex(
                      (q) => q.questionId === qr.questionId,
                    ) + 1;
                  const sourceQuestion = questions.find(
                    (question) => question.id === qr.questionId,
                  );
                  const selectedChoice = sourceQuestion?.choices.find(
                    (choice) => choice.id === qr.selectedChoiceId,
                  );
                  const selectedText = selectedChoice
                    ? localize(
                        selectedChoice.textEn,
                        selectedChoice.textAr,
                        selectedChoice.textNl,
                        selectedChoice.textFr,
                      )
                    : "";
                  const selectedIndex = sourceQuestion?.choices.findIndex(
                    (choice) => choice.id === qr.selectedChoiceId,
                  );
                  const correctIndex = sourceQuestion?.choices.findIndex(
                    (choice) => choice.id === qr.correctChoiceId,
                  );
                  return (
                    <SignReviewCard
                      key={qr.questionId}
                      qr={qr}
                      qNum={qNum}
                      localize={localize}
                      t={t}
                      getDifficultyColor={getDifficultyColor}
                      getDifficultyLabel={getDifficultyLabel}
                      selectedText={selectedText}
                      selectedMarker={
                        selectedIndex !== undefined && selectedIndex >= 0
                          ? getExamOptionLabel(selectedIndex)
                          : undefined
                      }
                      correctMarker={
                        correctIndex !== undefined && correctIndex >= 0
                          ? getExamOptionLabel(correctIndex)
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            ) : null}
          </PageSectionSurface>
        </div>
      </div>
    );
  }

  return null;
}

// --- Review sub-component ---

function SignReviewCard({
  qr,
  qNum,
  localize,
  t,
  getDifficultyColor,
  getDifficultyLabel,
  selectedText,
  selectedMarker,
  correctMarker,
}: {
  qr: QuestionResult;
  qNum: number;
  localize: (
    en?: string | null,
    ar?: string | null,
    nl?: string | null,
    fr?: string | null,
  ) => string;
  t: (key: string) => string;
  getDifficultyColor: (level: string) => string;
  getDifficultyLabel: (level: string) => string;
  selectedText: string;
  selectedMarker?: string;
  correctMarker?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const questionText = localize(
    qr.questionEn,
    qr.questionAr,
    qr.questionNl,
    qr.questionFr,
  );
  const correctText = localize(
    qr.correctChoiceEn,
    qr.correctChoiceAr,
    qr.correctChoiceNl,
    qr.correctChoiceFr,
  );
  const explanationText = localize(
    qr.explanationEn,
    qr.explanationAr,
    qr.explanationNl,
    qr.explanationFr,
  );

  const statusIcon = qr.wasTimeout ? (
    <Clock className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
  ) : qr.isCorrect ? (
    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
  ) : (
    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
  );

  const borderCls = qr.isCorrect
    ? "border-green-200 bg-green-50/30 dark:border-green-900/50 dark:bg-green-900/10"
    : qr.wasTimeout
      ? "border-orange-200 bg-orange-50/30 dark:border-orange-900/50 dark:bg-orange-900/10"
      : "border-red-200 bg-red-50/30 dark:border-red-900/50 dark:bg-red-900/10";

  return (
    <div className={`space-y-4 rounded-2xl border p-4 ${borderCls}`}>
      <div className="min-w-0 space-y-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="shrink-0">{statusIcon}</span>
          <span className="text-xs font-semibold text-muted-foreground">
            Q{qNum}
          </span>
          {qr.signCode && (
            <span className="text-xs text-muted-foreground">{qr.signCode}</span>
          )}
          {qr.difficulty && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${getDifficultyColor(qr.difficulty)}`}
            >
              {getDifficultyLabel(qr.difficulty)}
            </span>
          )}
          <span
            className={cn(
              "ms-auto rounded-full border px-2.5 py-1 text-xs font-semibold",
              qr.wasTimeout
                ? "border-orange-200 bg-orange-100 text-orange-700"
                : qr.isCorrect
                  ? "border-green-200 bg-green-100 text-green-700"
                  : "border-red-200 bg-red-100 text-red-700",
            )}
          >
            {qr.wasTimeout
              ? t("practice_exam.score_timeout")
              : qr.isCorrect
                ? t("practice_exam.filter_correct")
                : t("practice_exam.filter_wrong")}
          </span>
        </div>
        {qr.signImagePath && (
          <ExamQuestionImageFrame variant="review">
            <SignImage
              src={qr.signImagePath}
              alt={qr.signCode ?? "sign"}
              className="object-contain"
            />
          </ExamQuestionImageFrame>
        )}
        <p
          className={cn(
            "mx-auto max-w-3xl break-words text-center text-[15px] font-semibold leading-7 text-foreground",
          )}
        >
          {questionText}
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-2.5">
        <ResultAnswerBlock
          label={t("exam.your_answer")}
          tone={qr.isCorrect ? "correct" : "incorrect"}
          marker={selectedMarker}
        >
          {selectedText || "—"}
        </ResultAnswerBlock>

        {expanded && !qr.isCorrect && correctText && (
          <ResultAnswerBlock
            label={t("practice_exam.review_correct_answer")}
            tone="correct"
            marker={correctMarker}
          >
            {correctText}
          </ResultAnswerBlock>
        )}

        {expanded && !qr.isCorrect && explanationText && (
          <ResultAnswerBlock
            label={t("practice_exam.review_explanation")}
            tone="neutral"
          >
            {explanationText}
          </ResultAnswerBlock>
        )}
      </div>

      {!qr.isCorrect && (
        <ResultDetailsToggle
          expanded={expanded}
          onToggle={() => setExpanded((value) => !value)}
          showLabel={t("practice_exam.review_show_details")}
          hideLabel={t("practice_exam.review_hide_details")}
        />
      )}
    </div>
  );
}
