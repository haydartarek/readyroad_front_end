"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import apiClient, { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { SignImage } from "@/components/traffic-signs/sign-image";
import { cn } from "@/lib/utils";
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
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Zap,
  Target,
} from "lucide-react";

// --- Types ---

interface SignChoice {
  id: number;
  displayOrder: number;
  textNl: string;
  textEn: string;
  textFr: string;
  textAr: string;
}

interface SignPracticeQuestion {
  id: number;
  questionNl: string;
  questionEn: string;
  questionFr: string;
  questionAr: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  showSign: boolean;
  signCode: string | null;
  signImagePath: string | null;
  choices: SignChoice[];
}

interface QuestionResult {
  questionId: number;
  questionNl: string;
  questionEn: string;
  questionFr: string;
  questionAr: string;
  selectedChoiceId: number | null;
  correctChoiceId: number | null;
  correctChoiceNl: string | null;
  correctChoiceEn: string | null;
  correctChoiceFr: string | null;
  correctChoiceAr: string | null;
  isCorrect: boolean;
  wasTimeout: boolean;
  explanationNl: string | null;
  explanationEn: string | null;
  explanationFr: string | null;
  explanationAr: string | null;
  signCode: string | null;
  signImagePath: string | null;
  difficulty: string | null;
}

interface PracticeResult {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  scorePercentage: number;
  passed: boolean;
  passingScore: number;
  questions: QuestionResult[];
}

type Phase = "intro" | "loading" | "exam" | "submitting" | "results";

const SECONDS_PER_QUESTION = 15;

// --- Main Component ---

export default function RandomPracticePage() {
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<SignPracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [serviceUnavailable, setSvcError] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "correct">(
    "all",
  );

  const answersRef = useRef<(number | null)[]>([]);
  const isAnsweringRef = useRef(false);

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
    setPhase("loading");
    try {
      const res = await apiClient.get<SignPracticeQuestion[]>(
        "/sign-quiz/random-practice",
      );
      if (res.data && res.data.length > 0) {
        answersRef.current = new Array(res.data.length).fill(null);
        setQuestions(res.data);
        setCurrentIndex(0);
        setSelectedOption(null);
        setTimeLeft(SECONDS_PER_QUESTION);
        isAnsweringRef.current = false;
        setPhase("exam");
      } else {
        setPhase("intro");
      }
    } catch (err) {
      logApiError("Failed to load sign practice questions", err);
      if (isServiceUnavailable(err)) setSvcError(true);
      setPhase("intro");
    }
  };

  const handleAnswer = useCallback(
    (choiceId: number | null) => {
      if (isAnsweringRef.current) return;
      isAnsweringRef.current = true;
      setSelectedOption(choiceId);
      answersRef.current[currentIndex] = choiceId;
      const nextIndex = currentIndex + 1;
      setTimeout(() => {
        if (nextIndex >= questions.length) {
          submitAll();
        } else {
          setCurrentIndex(nextIndex);
        }
      }, 280);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex, questions.length],
  );

  useEffect(() => {
    if (phase === "exam") {
      setSelectedOption(null);
      setTimeLeft(SECONDS_PER_QUESTION);
      isAnsweringRef.current = false;
    }
  }, [currentIndex, phase]);

  useEffect(() => {
    if (phase !== "exam") return;
    if (isAnsweringRef.current) return;
    if (timeLeft <= 0) {
      handleAnswer(null);
      return;
    }
    const tick = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(tick);
  }, [phase, timeLeft, handleAnswer]);

  const submitAll = async () => {
    setPhase("submitting");
    const payload = questions.map((q, i) => ({
      questionId: q.id,
      selectedChoiceId: answersRef.current[i] ?? null,
    }));
    try {
      const res = await apiClient.post<PracticeResult>(
        "/sign-quiz/random-practice/check",
        payload,
      );
      setResult(res.data);
      setPhase("results");
    } catch (err) {
      logApiError("Failed to check sign practice answers", err);
      setPhase("intro");
    }
  };

  const handleRetry = () => {
    setResult(null);
    setShowReview(false);
    setReviewFilter("all");
    setPhase("intro");
  };

  // --- Screens ---

  if (serviceUnavailable) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <ServiceUnavailableBanner
          onRetry={() => {
            setSvcError(false);
            startExam();
          }}
          className="max-w-md"
        />
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="container mx-auto max-w-xl px-4 py-10">
          {/* ── Hero header ── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15 px-6 py-8 shadow-sm mb-6 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(13_76%_53%/0.08),transparent_60%)] pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-primary border border-primary/20 mb-4">
                <ClipboardList className="w-3.5 h-3.5" />
                <span className="font-bold text-xs tracking-wide">
                  {t("sign_practice.badge")}
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-2">
                {t("sign_practice.intro_title")}
              </h1>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                {t("sign_practice.intro_subtitle")}
              </p>
            </div>
          </div>

          {/* ── Rules card ── */}
          <Card className="rounded-2xl border-border/50 shadow-sm mb-5">
            <CardContent className="pt-5 pb-5 space-y-3">
              {[
                {
                  icon: <ClipboardList className="w-4 h-4 text-primary" />,
                  bg: "bg-primary/10",
                  key: "sign_practice.rule_questions",
                },
                {
                  icon: <Timer className="w-4 h-4 text-orange-500" />,
                  bg: "bg-orange-500/10",
                  key: "practice_exam.rule_time",
                },
                {
                  icon: <Trophy className="w-4 h-4 text-yellow-500" />,
                  bg: "bg-yellow-500/10",
                  key: "practice_exam.rule_pass",
                },
                {
                  icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
                  bg: "bg-green-500/10",
                  key: "practice_exam.rule_choices",
                },
                {
                  icon: <AlertTriangle className="w-4 h-4 text-destructive" />,
                  bg: "bg-destructive/10",
                  key: "practice_exam.rule_timer",
                },
              ].map((rule) => (
                <div key={rule.key} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                      rule.bg,
                    )}
                  >
                    {rule.icon}
                  </div>
                  <p className="text-sm text-muted-foreground">{t(rule.key)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Start button ── */}
          <Button
            size="lg"
            className="w-full rounded-xl text-base font-bold shadow-md shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.01] transition-all"
            onClick={startExam}
          >
            <Zap className="w-4 h-4 mr-2" />
            {t("practice_exam.start_btn")}
          </Button>
          <div className="mt-4 text-center">
            <Link
              href="/practice"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isRTL ? <></> : null}
              &larr; {t("practice_exam.back_practice")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "loading" || phase === "submitting") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center shadow-sm">
              <RotateCcw className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div className="absolute -inset-1 rounded-3xl border-2 border-primary/10 animate-pulse" />
          </div>
          <div>
            <p className="font-bold text-foreground mb-1">
              {phase === "loading"
                ? t("practice_exam.loading")
                : t("practice_exam.submitting")}
            </p>
            <p className="text-sm text-muted-foreground">
              {phase === "loading" ? "..." : "..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "exam" && questions.length > 0) {
    const question = questions[currentIndex];
    const progressPct = (currentIndex / questions.length) * 100;
    const timerPct = (timeLeft / SECONDS_PER_QUESTION) * 100;
    const timerUrgent = timeLeft <= 5;
    const timerWarn = timeLeft <= 10;
    const timerBarCls = timerUrgent
      ? "bg-red-500"
      : timerWarn
        ? "bg-orange-400"
        : "bg-primary";
    const letters = ["A", "B", "C", "D"];

    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background"
      >
        <div className="container mx-auto px-4 py-6 max-w-xl">
          {/* ── Top bar ── */}
          <div className="flex items-center justify-between mb-5">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 rounded-xl"
              onClick={handleRetry}
            >
              {isRTL ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )}
              <span className="text-sm">
                {t("practice_exam.back_practice")}
              </span>
            </Button>
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold tabular-nums transition-colors",
                timerUrgent
                  ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 animate-pulse"
                  : timerWarn
                    ? "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-950/30 dark:border-orange-900/50 dark:text-orange-400"
                    : "bg-muted/60 border-border/50 text-muted-foreground",
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              {timeLeft}s
            </div>
          </div>

          {/* ── Progress ── */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("practice_exam.question_of")
                  .replace("{n}", String(currentIndex + 1))
                  .replace("{m}", String(questions.length))}
              </span>
              <span className="text-xs font-bold text-primary">
                {Math.round(progressPct)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* ── Question card ── */}
          {question && (
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <div className="h-[3px] bg-gradient-to-r from-primary via-primary/60 to-primary/20" />
              <CardContent className="pt-5 pb-5 space-y-5">
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {question.signCode && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-muted/70 border border-border/50 text-muted-foreground font-medium">
                      {question.signCode}
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border font-semibold",
                      getDifficultyColor(question.difficulty),
                    )}
                  >
                    {getDifficultyLabel(question.difficulty)}
                  </span>
                </div>

                {/* Sign image */}
                {question.showSign && question.signImagePath && (
                  <div className="flex justify-center">
                    <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 border border-border/40 p-3 shadow-sm">
                      <SignImage
                        src={question.signImagePath}
                        alt={question.signCode ?? "traffic sign"}
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Question text */}
                <p
                  className={cn(
                    "text-base font-bold leading-snug",
                    isRTL && "text-right",
                  )}
                >
                  {localize(
                    question.questionEn,
                    question.questionAr,
                    question.questionNl,
                    question.questionFr,
                  )}
                </p>

                {/* Choices */}
                <div className="space-y-2.5">
                  {question.choices.map((choice, idx) => {
                      const isSelected = selectedOption === choice.id;
                      const locked =
                        isAnsweringRef.current || selectedOption !== null;
                      return (
                        <button
                          key={choice.id}
                          disabled={locked}
                          onClick={() => handleAnswer(choice.id)}
                          className={cn(
                            "w-full text-start px-4 py-3 rounded-xl border-2 transition-all duration-150 text-sm font-medium flex items-center gap-3",
                            !locked &&
                              !isSelected &&
                              "border-border/60 hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm",
                            isSelected &&
                              "border-primary bg-primary/8 shadow-sm shadow-primary/15",
                            locked &&
                              !isSelected &&
                              "border-border/40 opacity-50",
                          )}
                        >
                          <span
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/80 text-muted-foreground",
                            )}
                          >
                            {letters[idx] ?? idx + 1}
                          </span>
                          <span className={cn("flex-1", isRTL && "text-right")}>
                            {localize(
                              choice.textEn,
                              choice.textAr,
                              choice.textNl,
                              choice.textFr,
                            )}
                          </span>
                        </button>
                      );
                    })}
                </div>

                {/* Timer bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-1000",
                      timerBarCls,
                    )}
                    style={{ width: `${timerPct}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
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
        className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background pb-12"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="container mx-auto max-w-xl px-4 py-8 space-y-5">
          {/* ── Result hero header ── */}
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border px-6 py-8 shadow-sm text-center",
              result.passed
                ? "bg-gradient-to-br from-green-500/10 via-green-500/5 to-background border-green-500/15"
                : "bg-gradient-to-br from-red-500/10 via-red-500/5 to-background border-red-500/15",
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none" />
            <div className="relative">
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold mb-4",
                  result.passed
                    ? "bg-green-500/10 text-green-600 border-green-200 dark:border-green-800"
                    : "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800",
                )}
              >
                {result.passed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {t("practice_exam.score_passed")}
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    {t("practice_exam.score_failed")}
                  </>
                )}
              </div>
              <p className="text-6xl font-black tabular-nums leading-none mb-1">
                {result.correctAnswers}
                <span className="text-3xl font-semibold text-muted-foreground">
                  {" "}
                  / {result.totalQuestions}
                </span>
              </p>
              <p
                className={cn(
                  "text-2xl font-black tabular-nums mb-1",
                  result.passed ? "text-green-500" : "text-red-500",
                )}
              >
                {result.scorePercentage.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {t("practice_exam.score_pass_threshold").replace(
                  "{n}",
                  String(result.passingScore),
                )}
              </p>
            </div>
          </div>

          {/* ── Stats cards ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: <CheckCircle2 className="w-4 h-4" />,
                label: t("practice_exam.score_correct"),
                value: result.correctAnswers,
                color: "text-green-600",
                bg: "bg-green-500/10",
                bar: "#22c55e",
              },
              {
                icon: <XCircle className="w-4 h-4" />,
                label: t("practice_exam.score_wrong"),
                value: result.wrongAnswers,
                color: "text-red-600",
                bg: "bg-red-500/10",
                bar: "#ef4444",
              },
              {
                icon: <Clock className="w-4 h-4" />,
                label: t("practice_exam.score_timeout"),
                value: result.unanswered,
                color: "text-orange-600",
                bg: "bg-orange-500/10",
                bar: "#fb923c",
              },
            ].map((stat) => (
              <Card
                key={stat.label}
                className="rounded-xl border-border/50 overflow-hidden"
              >
                <div className="h-[3px]" style={{ background: stat.bar }} />
                <div className="flex flex-col items-center gap-1.5 py-4 px-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      stat.bg,
                      stat.color,
                    )}
                  >
                    {stat.icon}
                  </div>
                  <p
                    className={cn(
                      "text-2xl font-black tabular-nums",
                      stat.color,
                    )}
                  >
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground text-center leading-tight px-1">
                    {stat.label}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* ── Action buttons ── */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleRetry}
              variant="outline"
              className="gap-2 rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5"
            >
              <RotateCcw className="w-4 h-4" />
              {t("practice_exam.retry_btn")}
            </Button>
            <Button
              asChild
              className="gap-2 rounded-xl shadow-sm shadow-primary/20"
            >
              <Link href="/practice">
                <Home className="w-4 h-4" />
                {t("practice_exam.home_btn")}
              </Link>
            </Button>
          </div>

          {/* ── Review accordion ── */}
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
              onClick={() => setShowReview((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm">
                  {t("practice_exam.review_title")}
                </span>
              </div>
              {showReview ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {showReview && (
              <div className="border-t border-border/50 px-4 pb-5 pt-4 space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {(["all", "wrong", "correct"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setReviewFilter(f)}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors",
                        reviewFilter === f
                          ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                          : "border-border/50 text-muted-foreground hover:bg-muted hover:border-border",
                      )}
                    >
                      {t(`practice_exam.filter_${f}`)}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {filteredQs.map((qr) => {
                    const qNum =
                      result.questions.findIndex(
                        (q) => q.questionId === qr.questionId,
                      ) + 1;
                    return (
                      <SignReviewCard
                        key={qr.questionId}
                        qr={qr}
                        qNum={qNum}
                        localize={localize}
                        isRTL={isRTL}
                        t={t}
                        getDifficultyColor={getDifficultyColor}
                        getDifficultyLabel={getDifficultyLabel}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
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
  isRTL,
  t,
  getDifficultyColor,
  getDifficultyLabel,
}: {
  qr: QuestionResult;
  qNum: number;
  localize: (
    en?: string | null,
    ar?: string | null,
    nl?: string | null,
    fr?: string | null,
  ) => string;
  isRTL: boolean;
  t: (key: string) => string;
  getDifficultyColor: (level: string) => string;
  getDifficultyLabel: (level: string) => string;
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
    <div className={`rounded-xl border p-4 space-y-3 ${borderCls}`}>
      <div className="flex items-start gap-2">
        {statusIcon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground">
              Q{qNum}
            </span>
            {qr.signCode && (
              <span className="text-xs text-muted-foreground">
                {qr.signCode}
              </span>
            )}
            {qr.difficulty && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${getDifficultyColor(qr.difficulty)}`}
              >
                {getDifficultyLabel(qr.difficulty)}
              </span>
            )}
          </div>
          {qr.signImagePath && (
            <div className="flex items-center gap-3 mb-2">
              <div className="relative w-12 h-12 flex-shrink-0">
                <SignImage
                  src={qr.signImagePath}
                  alt={qr.signCode ?? "sign"}
                  className="object-contain"
                />
              </div>
            </div>
          )}
          <p className={`text-sm font-medium ${isRTL ? "text-right" : ""}`}>
            {questionText}
          </p>
        </div>
      </div>
      {!qr.isCorrect && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-primary flex items-center gap-1 hover:underline"
        >
          {expanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
          {expanded
            ? t("practice_exam.review_hide")
            : t("practice_exam.review_show_answer")}
        </button>
      )}
      {expanded && !qr.isCorrect && (
        <div className="space-y-2 text-sm">
          {correctText && (
            <div className="flex items-start gap-2 bg-green-100/60 dark:bg-green-900/20 rounded-lg p-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-0.5">
                  {t("practice_exam.review_correct_answer")}
                </p>
                <p className="text-green-800 dark:text-green-300">
                  {correctText}
                </p>
              </div>
            </div>
          )}
          {explanationText && (
            <div className="bg-muted/50 rounded-lg p-2.5">
              <p className="text-xs font-semibold text-muted-foreground mb-0.5">
                {t("practice_exam.review_explanation")}
              </p>
              <p>{explanationText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
