"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "@/components/localized-link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import {
  getAssessmentQuestions,
  checkAssessmentAnswer,
  type AssessmentQuestion,
  type DifficultyLevel,
} from "@/services/assessmentService";
import { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ExamOptionCard,
  getExamOptionLabel,
  type ExamOptionState,
} from "@/components/exam/exam-option-card";
import { ResultAnswerBlock } from "@/components/results/result-review";
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
        {attempts.map((a, i) => {
          const selectedIndex = a.question.choices.findIndex(
            (choice) => choice.id === a.selectedId,
          );
          const correctIndex = a.question.choices.findIndex(
            (choice) => choice.id === a.correctChoiceId,
          );
          const selectedText = a.question.choices[selectedIndex]?.text ?? "—";
          const correctText = a.question.choices[correctIndex]?.text ?? "—";

          return (
            <div
              key={a.question.id}
              className={cn(
                "space-y-4 rounded-2xl border p-4 shadow-sm",
                a.answerState === "correct"
                  ? "border-emerald-200 bg-emerald-50/35"
                  : "border-red-200 bg-red-50/35",
              )}
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background text-xs font-black">
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "ms-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                    a.answerState === "correct"
                      ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                      : "border-red-200 bg-red-100 text-red-800",
                  )}
                >
                  {a.answerState === "correct" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {a.answerState === "correct"
                    ? t("assessment.result.passed")
                    : t("assessment.result.failed")}
                </span>
              </div>

              <p className="break-words text-center text-base font-bold leading-7 text-foreground">
                {a.question.question}
              </p>

              <ResultAnswerBlock
                label={t("exam.your_answer")}
                tone={a.answerState === "correct" ? "correct" : "incorrect"}
                marker={
                  selectedIndex >= 0
                    ? getExamOptionLabel(selectedIndex)
                    : undefined
                }
              >
                {selectedText}
              </ResultAnswerBlock>

              {a.answerState !== "correct" ? (
                <ResultAnswerBlock
                  label={t("exam.correct_answer")}
                  tone="correct"
                  marker={
                    correctIndex >= 0
                      ? getExamOptionLabel(correctIndex)
                      : undefined
                  }
                >
                  {correctText}
                </ResultAnswerBlock>
              ) : null}

              {a.question.explanation ? (
                <ResultAnswerBlock
                  label={t("assessment.explanation")}
                  tone="neutral"
                >
                  {a.question.explanation}
                </ResultAnswerBlock>
              ) : null}
            </div>
          );
        })}
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
          <p className="mx-auto max-w-3xl break-words text-center text-lg font-black leading-8 text-foreground sm:text-xl">
            {q.question}
          </p>

          <div className="space-y-2.5">
            {q.choices.map((c, index) => {
              let state: ExamOptionState = "idle";
              if (answered) {
                if (c.id === attempt.selectedId) {
                  state =
                    attempt.answerState === "correct"
                      ? "correct"
                      : "incorrect";
                } else if (c.id === attempt.correctChoiceId) {
                  state = "correct";
                } else {
                  state = "neutral";
                }
              }
              return (
                <ExamOptionCard
                  key={c.id}
                  index={index}
                  text={c.text}
                  state={state}
                  disabled={checkingAnswer || answered}
                  onSelect={() => handleAnswer(c.id)}
                />
              );
            })}
          </div>

          {/* Explanation */}
          {answered && q.explanation && (
            <ResultAnswerBlock
              label={t("assessment.explanation")}
              tone="neutral"
            >
              {q.explanation}
            </ResultAnswerBlock>
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
