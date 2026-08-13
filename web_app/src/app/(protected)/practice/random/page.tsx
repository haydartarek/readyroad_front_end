"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocalizedRouter } from "@/hooks/use-localized-router";
import Link from "@/components/localized-link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PageHeroEyebrow,
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
import { isServiceUnavailable, logApiError } from "@/lib/api";
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
      setPhase("results");
    } catch (err) {
      logApiError("Failed to check sign practice answers", err);
      if (isServiceUnavailable(err)) {
        setSvcError(true);
      } else {
        setStartError(t("sign_practice.submit_error"));
      }
      setPhase("intro");
    }
  }, [abandonSession, questions, sessionId, t]);

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
        className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/35"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="pointer-events-none absolute -top-32 right-[-8rem] h-[24rem] w-[24rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-[-8rem] h-[20rem] w-[20rem] rounded-full bg-secondary/10 blur-3xl" />

        <div className="container relative mx-auto max-w-6xl px-4 py-6 md:py-8">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-sm">
              <div className="pointer-events-none absolute top-0 right-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 translate-y-1/2 -translate-x-1/2 rounded-full bg-primary/5" />
              <div className="relative space-y-4 px-6 py-7">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-primary shadow-sm">
                    <Shuffle className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">
                      {t("sign_practice.badge")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.3rem] bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
                      <Shuffle className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="space-y-1.5">
                      <PageHeroTitle>
                        {t("sign_practice.intro_title")}
                      </PageHeroTitle>
                      <PageHeroDescription className="max-w-2xl">
                        {t("sign_practice.intro_subtitle")}
                      </PageHeroDescription>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      value: "50",
                      label: t("sign_practice.rule_questions"),
                      color: "text-primary",
                    },
                    {
                      value: "15s",
                      label: t("practice_exam.rule_time"),
                      color: "text-orange-500",
                    },
                    {
                      value: "41/50",
                      label: t("practice_exam.rule_pass"),
                      color: "text-green-600",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.value}
                      className="rounded-[1.2rem] border border-border/60 bg-background/80 px-3.5 py-3 shadow-sm"
                    >
                      <p
                        className={`text-2xl font-black tabular-nums ${stat.color}`}
                      >
                        {stat.value}
                      </p>
                      <p className="mt-1.5 text-xs font-semibold leading-5 text-foreground/80">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    {
                      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
                      text: t("practice_exam.rule_choices"),
                    },
                    {
                      icon: <RefreshCw className="h-5 w-5 text-sky-500" />,
                      text: t("sign_practice.rule_freshness"),
                    },
                  ].map((item) => (
                    <div
                      key={item.text}
                      className="flex items-start gap-2.5 rounded-[1.1rem] border border-border/60 bg-background/80 px-3.5 py-3 shadow-sm"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[0.95rem] bg-primary/10 ring-1 ring-primary/10">
                        {item.icon}
                      </div>
                      <p className="text-xs font-bold leading-5 text-foreground">
                        {item.text}
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

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25 sm:flex-1"
                    onClick={() => void startExam()}
                  >
                    <Timer className="h-4 w-4" />
                    {t("practice_exam.start_btn")}
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/practice">{backToPracticeContent}</Link>
                  </Button>
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-[1.75rem] border border-border/60 bg-card/85 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[1rem] bg-primary/10 text-primary ring-1 ring-primary/10">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground">
                      {t("practice_exam.overview_title")}
                    </h2>
                    <p className="text-xs font-semibold text-foreground/75">
                      {t("practice_exam.overview_desc")}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      icon: <ClipboardList className="h-4 w-4 text-primary" />,
                      text: t("sign_practice.rule_questions"),
                    },
                    {
                      icon: <Timer className="h-4 w-4 text-orange-500" />,
                      text: t("practice_exam.rule_time"),
                    },
                    {
                      icon: <Trophy className="h-4 w-4 text-green-500" />,
                      text: t("practice_exam.rule_pass"),
                    },
                  ].map((item) => (
                    <div
                      key={item.text}
                      className="flex items-start gap-2.5 rounded-[1.05rem] bg-background/80 px-3 py-2.5"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[0.9rem] bg-primary/10 ring-1 ring-primary/10">
                        {item.icon}
                      </div>
                      <p className="text-xs font-bold leading-5 text-foreground">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border/60 bg-card/85 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[1rem] bg-primary/10 text-primary ring-1 ring-primary/10">
                    <Shapes className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground">
                      {t("practice_exam.rules_title")}
                    </h2>
                    <p className="text-xs font-semibold text-foreground/75">
                      {t("practice_exam.rules_desc")}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.15rem] border border-border/60 bg-background/80 p-3 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      {t("practice_exam.difficulty_mix")}
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      20 · 20 · 10
                    </span>
                  </div>
                  <div className="grid gap-1.5">
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
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className={item.tone}>{item.label}</span>
                          <span className="text-muted-foreground">
                            {item.value}/50
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/70">
                          <div
                            className={`h-full rounded-full ${item.bar}`}
                            style={{
                              width: `${(item.value / item.total) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
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
    const difficultyClassName = cn(
      question.difficulty === "EASY" && "bg-green-100 text-green-800",
      question.difficulty === "MEDIUM" && "bg-orange-100 text-orange-800",
      question.difficulty === "HARD" && "bg-red-100 text-red-800",
    );

    return (
      <>
        <FocusedExamShell
          dir={isRTL ? "rtl" : "ltr"}
          counter={questionCounter}
          difficultyLabel={difficultyLabel}
          difficultyClassName={difficultyClassName}
          timerPill={
            <div
              className={cn(
                "flex items-center gap-1.5 text-sm font-bold tabular-nums transition-colors",
                timerPillClass,
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              {timeLeft}s
            </div>
          }
          progressPercent={progressPct}
          afterCard={
            <div
              data-testid="exam-actions"
              className="grid grid-cols-2 gap-2 pb-3 pt-1 sm:grid-cols-3"
            >
              <Button
                variant="destructive"
                size="lg"
                className="order-3 w-full sm:order-1"
                onClick={() => setShowExitDialog(true)}
              >
                {t("practice_exam.end_exam")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="order-2 w-full"
                asChild
              >
                <Link href="/contact">
                  <Flag className="h-4 w-4" />
                  {t("practice_exam.report_question")}
                </Link>
              </Button>
              <Button
                size="lg"
                onClick={() => advanceToNext(selectedOption, "manual")}
                disabled={isLockedUi}
                className={cn(
                  "order-1 col-span-2 w-full shadow-md transition-all sm:order-3 sm:col-span-1",
                  selectedOption !== null
                    ? "shadow-primary/20 hover:-translate-y-0.5"
                    : "opacity-80",
                )}
              >
                {currentIndex + 1 === questions.length
                  ? t("practice_exam.submit_btn")
                  : t("practice_exam.next_btn")}
                {isRTL ? (
                  <ArrowLeft className="h-4 w-4" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          }
        >
          <FocusedQuestionCard
            headerBadges={
              <span className="inline-flex items-center rounded-full border border-border/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {getRandomPracticeCategoryLabel(question.signCode, t)}
              </span>
            }
            difficultyBadge={
              <span
                className={cn(
                  "inline-flex min-h-8 items-center rounded-full px-3 text-xs font-bold",
                  difficultyClassName,
                )}
              >
                {difficultyLabel}
              </span>
            }
            media={
              question.showSign && question.signImagePath ? (
                <ExamQuestionImageFrame>
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
                  <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                    {t("sign_practice.badge")}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <PageHeroEyebrow>
                    {t("sign_practice.result_heading")}
                  </PageHeroEyebrow>
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
                  href={`/dashboard?section=exam-results&randomSignExamId=${result.sessionId}`}
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
