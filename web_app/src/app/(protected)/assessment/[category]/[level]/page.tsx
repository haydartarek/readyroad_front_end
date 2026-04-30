"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import {
  getAssessmentQuestions,
  checkAssessmentAnswer,
  type AssessmentQuestion,
  type AssessmentChoice,
  type DifficultyLevel,
} from "@/services/assessmentService";
import { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Home,
} from "lucide-react";

// ─── State types ──────────────────────────────────────────────────────────────

type AnswerState = "unanswered" | "correct" | "incorrect";

interface QuestionAttempt {
  question: AssessmentQuestion;
  selectedId: number | null;
  correctChoiceId: number | null;
  answerState: AnswerState;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChoiceButton({
  choice,
  state,
  disabled = false,
  onSelect,
}: {
  choice: AssessmentChoice;
  state: "idle" | "selected-correct" | "selected-incorrect" | "reveal-correct";
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled || state !== "idle"}
      className={cn(
        "w-full text-left rounded-xl border px-4 py-3 text-sm transition-all duration-150",
        "hover:border-primary/50 hover:bg-primary/5",
        state === "idle" && "bg-card border-border",
        state === "selected-correct" &&
          "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300",
        state === "selected-incorrect" &&
          "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300",
        state === "reveal-correct" && "bg-emerald-500/10 border-emerald-400/60",
        state !== "idle" && "cursor-default",
      )}
    >
      {choice.text}
    </button>
  );
}

// ─── Results screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  attempts,
  passPercent,
  slug,
  onRetry,
  t,
}: {
  attempts: QuestionAttempt[];
  passPercent: number;
  slug: string;
  onRetry: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const correct = attempts.filter((a) => a.answerState === "correct").length;
  const total = attempts.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = pct >= passPercent;

  return (
    <div className="space-y-6">
      {/* Score card */}
      <div
        className={cn(
          "rounded-2xl border p-8 text-center",
          passed
            ? "bg-emerald-500/10 border-emerald-500/40"
            : "bg-rose-500/10 border-rose-500/40",
        )}
      >
        <div className="flex justify-center mb-3">
          {passed ? (
            <Trophy className="w-12 h-12 text-emerald-500" />
          ) : (
            <XCircle className="w-12 h-12 text-rose-500" />
          )}
        </div>
        <h2 className="text-3xl font-bold mb-1">{pct}%</h2>
        <p className="text-muted-foreground text-sm">
          {correct}/{total} {t("assessment.result.correct")}
        </p>
        <Badge
          className={cn(
            "mt-3",
            passed ? "bg-emerald-500 text-white" : "bg-rose-500 text-white",
          )}
        >
          {passed
            ? t("assessment.result.passed")
            : t("assessment.result.failed")}
        </Badge>
      </div>

      {/* Per-question review */}
      <div className="space-y-4">
        {attempts.map((a, i) => (
          <div
            key={a.question.id}
            className={cn(
              "rounded-xl border p-4",
              a.answerState === "correct"
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-rose-500/30 bg-rose-500/5",
            )}
          >
            <div className="flex items-start gap-2">
              {a.answerState === "correct" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {t("assessment.result.question_number", { number: i + 1 })}.{" "}
                  {a.question.question}
                </p>
                {a.answerState !== "correct" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {a.question.choices.find((c) => c.id === a.correctChoiceId)
                        ?.text}
                    </span>
                  </p>
                )}
                {a.question.explanation && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    {a.question.explanation}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          {t("assessment.result.retry")}
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/assessment/${slug}`} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t("assessment.back_to_levels")}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/assessment" className="gap-2">
            <Home className="w-4 h-4" />
            {t("assessment.back_to_categories")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Main quiz page ───────────────────────────────────────────────────────────

type AssessmentQuizLanguage = Parameters<typeof getAssessmentQuestions>[2];

function AssessmentQuizSession({
  slug,
  level,
  language,
  t,
  isRTL,
}: {
  slug: string;
  level: DifficultyLevel;
  language: AssessmentQuizLanguage;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}) {

  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [attempts, setAttempts] = useState<QuestionAttempt[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [checkingAnswer, setCheckingAnswer] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const PASS_PERCENT = 70;

  const handleRetry = useCallback(() => {
    setLoading(true);
    setShowResults(false);
    setCurrent(0);
    setQuestions([]);
    setAttempts([]);
    setUnavailable(false);
    setReloadKey((currentKey) => currentKey + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    getAssessmentQuestions(slug, level, language, 9)
      .then((qs) => {
        if (cancelled) {
          return;
        }
        setQuestions(qs);
        setAttempts(
          qs.map((q) => ({
            question: q,
            selectedId: null,
            correctChoiceId: null,
            answerState: "unanswered",
          })),
        );
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        logApiError("assessment questions", err);
        if (isServiceUnavailable(err)) setUnavailable(true);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, level, language, reloadKey]);

  const handleAnswer = async (choiceId: number) => {
    if (attempts[current]?.answerState !== "unanswered" || checkingAnswer) {
      return;
    }
    const q = questions[current];
    setCheckingAnswer(true);
    try {
      const check = await checkAssessmentAnswer(q.id, choiceId);
      setAttempts((prev) =>
        prev.map((a, i) =>
          i === current
            ? {
                ...a,
                selectedId: choiceId,
                correctChoiceId: check.correctChoiceId,
                answerState: check.correct ? "correct" : "incorrect",
              }
            : a,
        ),
      );
    } catch (err) {
      logApiError("assessment answer check", err);
      if (isServiceUnavailable(err)) {
        setUnavailable(true);
      }
    } finally {
      setCheckingAnswer(false);
    }
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setShowResults(true);
    } else {
      setCurrent((c) => c + 1);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        <div className="h-2 w-full rounded-full bg-muted/60 animate-pulse" />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl bg-muted/60 animate-pulse border border-border/30",
              i === 0 ? "h-24" : "h-12",
            )}
          />
        ))}
      </div>
    );
  }

  if (showResults) {
    return (
      <div
        className={cn("p-4 md:p-6 max-w-2xl mx-auto", isRTL && "rtl")}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {unavailable && <ServiceUnavailableBanner />}
        <ResultsScreen
          attempts={attempts}
          passPercent={PASS_PERCENT}
          slug={slug}
          onRetry={handleRetry}
          t={t}
        />
      </div>
    );
  }

  const attempt = attempts[current];
  const q = attempt?.question;
  const answered = attempt?.answerState !== "unanswered";
  const progress =
    questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;

  return (
    <div
      className={cn("space-y-5 p-4 md:p-6 max-w-2xl mx-auto", isRTL && "rtl")}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {unavailable && <ServiceUnavailableBanner />}

      {/* Progress bar + header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Link
            href={`/assessment/${slug}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-sm text-muted-foreground">
            {current + 1} / {questions.length}
          </span>
          <Badge variant="outline" className="capitalize">
            {t(`assessment.level.${level.toLowerCase()}`)}
          </Badge>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Question */}
      {q && (
        <div className="space-y-4">
          <p className="font-medium leading-snug">{q.question}</p>

          <div className="space-y-2">
            {q.choices.map((c) => {
              let state:
                | "idle"
                | "selected-correct"
                | "selected-incorrect"
                | "reveal-correct" = "idle";
              if (answered) {
                if (c.id === attempt.selectedId) {
                  state =
                    attempt.answerState === "correct"
                      ? "selected-correct"
                      : "selected-incorrect";
                } else if (c.id === attempt.correctChoiceId) {
                  state = "reveal-correct";
                }
              }
              return (
                <ChoiceButton
                  key={c.id}
                  choice={c}
                  state={state}
                  disabled={checkingAnswer}
                  onSelect={() => handleAnswer(c.id)}
                />
              );
            })}
          </div>

          {/* Explanation */}
          {answered && q.explanation && (
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {t("assessment.explanation")}:{" "}
              </span>
              {q.explanation}
            </div>
          )}

          {/* Next */}
          {answered && (
            <Button onClick={handleNext} className="w-full">
              {current + 1 < questions.length
                ? t("assessment.next_question")
                : t("assessment.see_results")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AssessmentQuizPage() {
  const { language, t, isRTL } = useLanguage();
  const params = useParams<{ category: string; level: string }>();
  const slug = params.category;
  const level = (params.level?.toUpperCase() ?? "BEGINNER") as DifficultyLevel;

  return (
    <AssessmentQuizSession
      key={`${slug}:${level}:${language}`}
      slug={slug}
      level={level}
      language={language}
      t={t}
      isRTL={isRTL}
    />
  );
}
