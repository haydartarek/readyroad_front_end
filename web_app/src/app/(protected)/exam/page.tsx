"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/language-context";
import apiClient, { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { cn } from "@/lib/utils";
import {
  Timer,
  Trophy,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizOption {
  id: number;
  optionTextEn: string;
  optionTextAr: string;
  optionTextNl: string;
  optionTextFr: string;
  displayOrder: number;
}

interface QuizQuestion {
  id: number;
  questionEn: string;
  questionAr: string;
  questionNl: string;
  questionFr: string;
  difficultyLevel: "EASY" | "MEDIUM" | "HARD";
  categoryNameEn?: string;
  categoryNameAr?: string;
  categoryNameNl?: string;
  categoryNameFr?: string;
  contentImageUrl?: string;
  options: QuizOption[];
}

interface QuestionResult {
  questionId: number;
  questionEn: string;
  questionAr: string;
  questionNl: string;
  questionFr: string;
  selectedOptionId: number | null;
  correctOptionId: number | null;
  correctOptionEn: string | null;
  correctOptionAr: string | null;
  correctOptionNl: string | null;
  correctOptionFr: string | null;
  isCorrect: boolean;
  wasTimeout: boolean;
  categoryNameEn: string | null;
  categoryNameAr: string | null;
  categoryNameNl: string | null;
  categoryNameFr: string | null;
  difficultyLevel: string | null;
}

interface ExamResult {
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

// ─── Constants ────────────────────────────────────────────────────────────────
const SECONDS_PER_QUESTION = 15;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TheoryExamPage() {
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [serviceUnavailable, setSvcError] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "correct">(
    "all",
  );

  const answersRef = useRef<(number | null)[]>([]);
  const isAdvancingRef = useRef(false); // true only after Next pressed or timer expired

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

  const startExam = async () => {
    setSvcError(false);
    setPhase("loading");
    try {
      const res = await apiClient.get<QuizQuestion[]>("/quiz/theory-exam");
      if (res.data && res.data.length > 0) {
        answersRef.current = new Array(res.data.length).fill(null);
        setQuestions(res.data);
        setCurrentIndex(0);
        setSelectedOption(null);
        setTimeLeft(SECONDS_PER_QUESTION);
        isAdvancingRef.current = false;
        setPhase("exam");
      } else {
        setPhase("intro");
      }
    } catch (err: unknown) {
      logApiError("Failed to load theory exam questions", err);
      if (isServiceUnavailable(err)) setSvcError(true);
      setPhase("intro");
    }
  };

  // Just highlight an option — does NOT advance, user can change freely
  const selectOption = (optionId: number) => {
    if (isAdvancingRef.current) return;
    setSelectedOption(optionId);
  };

  // Lock and advance — called by Next button OR timer expiry
  const advanceToNext = useCallback(
    (answerToSave: number | null) => {
      if (isAdvancingRef.current) return;
      isAdvancingRef.current = true;

      answersRef.current[currentIndex] = answerToSave;

      const nextIndex = currentIndex + 1;
      if (nextIndex >= questions.length) {
        submitAll();
      } else {
        setCurrentIndex(nextIndex);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex, questions.length],
  );

  useEffect(() => {
    if (phase === "exam") {
      setSelectedOption(null);
      setTimeLeft(SECONDS_PER_QUESTION);
      isAdvancingRef.current = false;
    }
  }, [currentIndex, phase]);

  useEffect(() => {
    if (phase !== "exam") return;
    if (isAdvancingRef.current) return;

    if (timeLeft <= 0) {
      // Timer expired — advance with whatever is currently selected (may be null)
      advanceToNext(selectedOption);
      return;
    }

    const tick = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(tick);
  }, [phase, timeLeft, advanceToNext, selectedOption]);

  const submitAll = async () => {
    setPhase("submitting");
    const payload = questions.map((q, i) => ({
      questionId: q.id,
      selectedOptionId: answersRef.current[i] ?? null,
    }));
    try {
      const res = await apiClient.post<ExamResult>(
        "/quiz/theory-exam/check",
        payload,
      );
      setResult(res.data);
      setPhase("results");
    } catch (err) {
      logApiError("Failed to check theory exam answers", err);
      setPhase("intro");
    }
  };

  const handleRetry = () => {
    setResult(null);
    setShowReview(false);
    setReviewFilter("all");
    setPhase("intro");
  };

  // ─── Screens ──────────────────────────────────────────────────────────────

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

  // ── INTRO ────────────────────────────────────────────────────────────────
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
            <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/85 shadow-sm">
              <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/80 to-primary/20" />
              <div className="space-y-6 px-6 py-6 md:px-8 md:py-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-primary shadow-sm">
                    <ClipboardList className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      {t("practice_exam.badge")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-5">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-primary to-primary/70 shadow-xl shadow-primary/20">
                      <ClipboardList className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
                        {t("practice_exam.intro_title")}
                      </h1>
                      <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                        {t("practice_exam.intro_subtitle")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      value: "50",
                      label: t("practice_exam.rule_questions"),
                      color: "text-primary",
                    },
                    {
                      value: "15s",
                      label: t("practice_exam.rule_time"),
                      color: "text-orange-500",
                    },
                    {
                      value: "41",
                      label: t("practice_exam.rule_pass"),
                      color: "text-green-600",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.value}
                      className="rounded-[1.5rem] border border-border/60 bg-background/80 px-4 py-4 shadow-sm"
                    >
                      <p
                        className={`text-3xl font-black tabular-nums ${stat.color}`}
                      >
                        {stat.value}
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-foreground/80">
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
                      icon: (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      ),
                      text: t("practice_exam.rule_timer"),
                    },
                  ].map((item) => (
                    <div
                      key={item.text}
                      className="flex items-start gap-3 rounded-[1.4rem] border border-border/60 bg-background/80 px-4 py-4 shadow-sm"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/10">
                        {item.icon}
                      </div>
                      <p className="text-sm font-bold leading-6 text-foreground">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="h-13 flex-1 rounded-full text-base font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
                    onClick={startExam}
                  >
                    <Timer className="me-2 h-5 w-5" />
                    {t("practice_exam.start_btn")}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-13 rounded-full px-6 text-base font-semibold"
                    asChild
                  >
                    <Link href="/practice">
                      {isRTL ? (
                        <ArrowRight className="me-2 h-4 w-4" />
                      ) : (
                        <ArrowLeft className="me-2 h-4 w-4" />
                      )}
                      {t("practice_exam.back_practice")}
                    </Link>
                  </Button>
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-[2rem] border border-border/60 bg-card/85 p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground">
                      {t("practice_exam.overview_title")}
                    </h2>
                    <p className="text-sm font-semibold text-foreground/75">
                      {t("practice_exam.overview_desc")}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      icon: <ClipboardList className="h-4 w-4 text-primary" />,
                      text: t("practice_exam.rule_questions"),
                    },
                    {
                      icon: <Timer className="h-4 w-4 text-orange-500" />,
                      text: t("practice_exam.rule_time"),
                    },
                    {
                      icon: <Trophy className="h-4 w-4 text-yellow-500" />,
                      text: t("practice_exam.rule_pass"),
                    },
                  ].map((item) => (
                    <div
                      key={item.text}
                      className="flex items-start gap-3 rounded-[1.25rem] bg-background/80 px-3.5 py-3.5"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
                        {item.icon}
                      </div>
                      <p className="text-sm font-bold leading-6 text-foreground">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-border/60 bg-card/85 p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
                    <Timer className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground">
                      {t("practice_exam.rules_title")}
                    </h2>
                    <p className="text-sm font-semibold text-foreground/75">
                      {t("practice_exam.rules_desc")}
                    </p>
                  </div>
                </div>

                <div className="mb-4 rounded-[1.4rem] border border-border/60 bg-background/80 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      {t("practice_exam.difficulty_mix")}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      20 · 20 · 10
                    </span>
                  </div>
                  <div className="grid gap-2">
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
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className={item.tone}>{item.label}</span>
                          <span className="text-muted-foreground">
                            {item.value}/50
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/70">
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

                <div className="space-y-2.5">
                  {[
                    {
                      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
                      text: t("practice_exam.rule_choices"),
                    },
                    {
                      icon: (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      ),
                      text: t("practice_exam.rule_timer"),
                    },
                  ].map((item) => (
                    <div
                      key={item.text}
                      className="flex items-start gap-3 rounded-[1.25rem] bg-background/80 px-3.5 py-3.5"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
                        {item.icon}
                      </div>
                      <p className="text-sm font-bold leading-6 text-foreground">
                        {item.text}
                      </p>
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

  // ── LOADING / SUBMITTING ─────────────────────────────────────────────────
  if (phase === "loading" || phase === "submitting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              {phase === "loading"
                ? t("practice_exam.loading")
                : t("practice_exam.submitting")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("practice_exam.badge")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── EXAM ─────────────────────────────────────────────────────────────────
  if (phase === "exam" && questions.length > 0) {
    const question = questions[currentIndex];
    const progressPct =
      questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;
    const timerPct = (timeLeft / SECONDS_PER_QUESTION) * 100;
    const timerColor =
      timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f97316" : "#22c55e";
    const LABELS = ["A", "B", "C", "D"];

    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="relative min-h-screen bg-gradient-to-br from-background via-primary/5 to-background overflow-hidden"
      >
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-40 -right-40 w-[26rem] h-[26rem] rounded-full bg-primary/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 w-[20rem] h-[20rem] rounded-full bg-secondary/8 blur-3xl" />

        <div className="container mx-auto px-4 py-6 max-w-2xl relative">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 rounded-full text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/practice">
                {isRTL ? (
                  <ArrowRight className="w-4 h-4" />
                ) : (
                  <ArrowLeft className="w-4 h-4" />
                )}
                {t("practice_exam.back_practice")}
              </Link>
            </Button>
            <div
              className={cn(
                "flex items-center gap-1.5 text-sm font-bold tabular-nums px-3.5 py-1.5 rounded-full border transition-colors",
                timeLeft <= 5
                  ? "bg-destructive/10 border-destructive/30 text-destructive animate-pulse"
                  : timeLeft <= 10
                    ? "bg-orange-500/10 border-orange-400/30 text-orange-500"
                    : "bg-muted border-border text-muted-foreground",
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              {timeLeft}s
            </div>
          </div>

          {/* Progress section */}
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur px-4 py-3 mb-5 shadow-sm">
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
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {question && (
            <div className="rounded-3xl border border-border/40 bg-card/90 backdrop-blur shadow-md overflow-hidden">
              {/* Card header stripe */}
              <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/30" />

              <div className="px-5 pt-5 pb-4">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="inline-flex items-center justify-center text-xs font-black text-primary bg-primary/10 rounded-full w-7 h-7 flex-shrink-0">
                    {currentIndex + 1}
                  </span>
                  {(question.categoryNameEn || question.categoryNameAr) && (
                    <Badge
                      variant="outline"
                      className="text-xs rounded-full flex-shrink-0 text-muted-foreground"
                    >
                      {localize(
                        question.categoryNameEn,
                        question.categoryNameAr,
                        question.categoryNameNl,
                        question.categoryNameFr,
                      )}
                    </Badge>
                  )}
                  {/* Difficulty pill — solid colored, visually distinct */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0",
                      question.difficultyLevel === "EASY" &&
                        "bg-green-500 text-white",
                      question.difficultyLevel === "MEDIUM" &&
                        "bg-orange-500 text-white",
                      question.difficultyLevel === "HARD" &&
                        "bg-red-500 text-white",
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />
                    {getDifficultyLabel(question.difficultyLevel)}
                  </span>
                </div>

                {/* Image */}
                {question.contentImageUrl && (
                  <div className="flex justify-center mb-4">
                    <Image
                      src={question.contentImageUrl}
                      alt="Question illustration"
                      width={400}
                      height={176}
                      className="max-h-44 object-contain rounded-2xl border border-border/50"
                      unoptimized
                    />
                  </div>
                )}

                {/* Question text */}
                <p
                  className={`text-base font-bold leading-snug mb-4 ${isRTL ? "text-right" : ""}`}
                >
                  {localize(
                    question.questionEn,
                    question.questionAr,
                    question.questionNl,
                    question.questionFr,
                  )}
                </p>

                {/* Answer options */}
                <div className="space-y-2.5">
                  {question.options.map((option, idx) => {
                    const isSelected = selectedOption === option.id;
                    const isLocked = isAdvancingRef.current;
                    const label = LABELS[idx] ?? String(idx + 1);
                    return (
                      <button
                        key={option.id}
                        disabled={isLocked}
                        onClick={() => selectOption(option.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-sm font-medium text-start",
                          !isLocked &&
                            !isSelected &&
                            "border-border bg-background/60 hover:border-primary/60 hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-sm",
                          isSelected &&
                            "border-primary bg-primary/10 shadow-md shadow-primary/10",
                          isLocked &&
                            !isSelected &&
                            "border-border/40 bg-muted/30 opacity-50",
                        )}
                      >
                        <span
                          className={cn(
                            "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {label}
                        </span>
                        <span
                          className={
                            isRTL ? "block text-right flex-1" : "flex-1"
                          }
                        >
                          {localize(
                            option.optionTextEn,
                            option.optionTextAr,
                            option.optionTextNl,
                            option.optionTextFr,
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Timer bar — green > orange > red */}
                <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden mt-4">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${timerPct}%`,
                      transition: "width 1s linear, background-color 0.5s ease",
                      backgroundColor: timerColor,
                    }}
                  />
                </div>

                {/* Next / Submit button */}
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => advanceToNext(selectedOption)}
                    disabled={isAdvancingRef.current}
                    className={cn(
                      "gap-2 rounded-full px-6 h-11 font-semibold shadow-md transition-all",
                      selectedOption !== null
                        ? "shadow-primary/20 hover:-translate-y-0.5"
                        : "opacity-70",
                    )}
                  >
                    {currentIndex + 1 === questions.length
                      ? t("practice_exam.submit_btn")
                      : t("practice_exam.next_btn")}
                    {isRTL ? (
                      <ArrowLeft className="w-4 h-4" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── RESULTS ──────────────────────────────────────────────────────────────
  if (phase === "results" && result) {
    const filteredQs = result.questions.filter((q) => {
      if (reviewFilter === "correct") return q.isCorrect;
      if (reviewFilter === "wrong") return !q.isCorrect;
      return true;
    });
    const scorePct = Math.round(result.scorePercentage);

    return (
      <div
        className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/35 pb-8"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="pointer-events-none absolute -top-32 right-[-8rem] h-[24rem] w-[24rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-[-8rem] h-[20rem] w-[20rem] rounded-full bg-secondary/10 blur-3xl" />

        <div className="container relative mx-auto max-w-5xl px-4 py-6 space-y-4">
          <div
            className={cn(
              "overflow-hidden rounded-[2rem] border bg-card shadow-sm",
              result.passed ? "border-green-200" : "border-red-200/70",
            )}
          >
            <div
              className={cn(
                "h-1.5 w-full",
                result.passed ? "bg-green-400" : "bg-red-400",
              )}
            />

            <div className="grid gap-5 px-5 py-5 md:px-6 md:py-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
              <div className="space-y-4">
                <div
                  className={cn(
                    "flex aspect-square w-full max-w-[160px] items-center justify-center rounded-[1.7rem] border shadow-sm",
                    result.passed
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50",
                  )}
                >
                  {result.passed ? (
                    <CheckCircle2 className="h-14 w-14 text-green-600" />
                  ) : (
                    <XCircle className="h-14 w-14 text-red-500" />
                  )}
                </div>

                <div className="space-y-2 text-center lg:text-start">
                  <Badge
                    className={cn(
                      "border",
                      result.passed
                        ? "border-green-200 bg-green-100 text-green-800"
                        : "border-red-200 bg-red-100 text-red-700",
                    )}
                  >
                    {result.passed
                      ? t("practice_exam.score_passed")
                      : t("practice_exam.score_failed")}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {t("practice_exam.badge")}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {t("practice_exam.review_title")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {t("practice_exam.score_correct")} /{" "}
                      {result.totalQuestions}
                    </p>
                    <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
                      {result.passed
                        ? t("practice_exam.score_passed")
                        : t("practice_exam.score_failed")}
                    </h1>
                  </div>

                  <div className="flex items-center gap-3 rounded-[1.25rem] border border-border/60 bg-background/80 px-4 py-3 shadow-sm">
                    {result.passed ? (
                      <Trophy className="h-8 w-8 text-green-500" />
                    ) : (
                      <ClipboardList className="h-8 w-8 text-primary" />
                    )}
                    <div className="text-end">
                      <div
                        className={cn(
                          "text-4xl font-black tabular-nums leading-none md:text-5xl",
                          result.passed ? "text-green-600" : "text-foreground",
                        )}
                      >
                        {scorePct}%
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {result.correctAnswers}/{result.totalQuestions}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 rounded-[1.5rem] border border-border/60 bg-background/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-foreground">
                      {t("practice_exam.score_pass_threshold").replace(
                        "{n}",
                        String(result.passingScore),
                      )}
                    </span>
                    <span className="font-semibold text-primary">
                      {scorePct}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted/70">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-700",
                        result.passed ? "bg-green-500" : "bg-red-400",
                      )}
                      style={{ width: `${scorePct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {result.correctAnswers}/{result.totalQuestions}
                    </span>
                    <span>{result.passingScore}/50</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
                      label: t("practice_exam.score_correct"),
                      value: result.correctAnswers,
                      tone: "text-green-600",
                    },
                    {
                      icon: <XCircle className="h-5 w-5 text-destructive" />,
                      label: t("practice_exam.score_wrong"),
                      value: result.wrongAnswers,
                      tone: "text-red-500",
                    },
                    {
                      icon: <Clock className="h-5 w-5 text-orange-500" />,
                      label: t("practice_exam.score_timeout"),
                      value: result.unanswered,
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
                  <Button
                    className="h-10 rounded-xl font-semibold"
                    onClick={handleRetry}
                  >
                    <RotateCcw className="me-2 h-4 w-4" />
                    {t("practice_exam.retry_btn")}
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-10 rounded-xl font-medium"
                    onClick={() => setShowReview((v) => !v)}
                  >
                    {t("practice_exam.review_title")}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl font-medium"
                    asChild
                  >
                    <Link href="/practice">
                      {isRTL ? (
                        <ArrowRight className="me-2 h-4 w-4" />
                      ) : (
                        <ArrowLeft className="me-2 h-4 w-4" />
                      )}
                      {t("practice_exam.home_btn")}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/85 shadow-sm">
            <button
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/20"
              onClick={() => setShowReview((v) => !v)}
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
                  {(["all", "wrong", "correct"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setReviewFilter(f)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                        reviewFilter === f
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border/50 text-muted-foreground hover:bg-muted",
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
                      <TheoryReviewCard
                        key={qr.questionId}
                        qr={qr}
                        qNum={qNum}
                        localize={localize}
                        isRTL={isRTL}
                        t={t}
                        getDifficultyLabel={getDifficultyLabel}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Review sub-component ──────────────────────────────────────────────────

function TheoryReviewCard({
  qr,
  qNum,
  localize,
  isRTL,
  t,
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
    qr.correctOptionEn,
    qr.correctOptionAr,
    qr.correctOptionNl,
    qr.correctOptionFr,
  );
  const categoryText = localize(
    qr.categoryNameEn,
    qr.categoryNameAr,
    qr.categoryNameNl,
    qr.categoryNameFr,
  );

  // Status config
  const status = qr.isCorrect ? "correct" : qr.wasTimeout ? "timeout" : "wrong";
  const statusConfig = {
    correct: {
      icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
      accent: "#22c55e",
      cardBg: "bg-green-50/40 dark:bg-green-950/20",
      border: "border-green-200/60 dark:border-green-900/40",
    },
    timeout: {
      icon: <Clock className="w-4 h-4 text-orange-500" />,
      accent: "#f97316",
      cardBg: "bg-orange-50/40 dark:bg-orange-950/20",
      border: "border-orange-200/60 dark:border-orange-900/40",
    },
    wrong: {
      icon: <XCircle className="w-4 h-4 text-red-500" />,
      accent: "#ef4444",
      cardBg: "bg-red-50/40 dark:bg-red-950/20",
      border: "border-red-200/60 dark:border-red-900/40",
    },
  }[status];

  // Difficulty pill (solid, identical to exam question screen)
  const diffPill = qr.difficultyLevel
    ? ({
        EASY: "bg-green-500 text-white",
        MEDIUM: "bg-orange-500 text-white",
        HARD: "bg-red-500 text-white",
      }[qr.difficultyLevel] ?? "bg-muted text-muted-foreground")
    : null;

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden ${statusConfig.cardBg} ${statusConfig.border}`}
    >
      {/* Left accent stripe */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
        style={{ backgroundColor: statusConfig.accent }}
      />

      <div className="pl-4 pr-4 py-3.5">
        {/* Row 1: Status icon + Q number + category + difficulty */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <div className="flex-shrink-0">{statusConfig.icon}</div>
          <span className="text-xs font-black text-foreground/70">Q{qNum}</span>
          {categoryText && (
            <span className="text-xs font-medium text-muted-foreground bg-background/60 rounded-full px-2 py-0.5 border border-border/40">
              {categoryText}
            </span>
          )}
          {diffPill && qr.difficultyLevel && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${diffPill}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
              {getDifficultyLabel(qr.difficultyLevel)}
            </span>
          )}
        </div>

        {/* Row 2: Question text */}
        <p
          className={`text-sm font-semibold text-foreground leading-snug ${isRTL ? "text-right" : ""}`}
        >
          {questionText}
        </p>

        {/* Expand toggle — only for incorrect/timeout */}
        {!qr.isCorrect && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            {expanded
              ? t("practice_exam.review_hide")
              : t("practice_exam.review_show_answer")}
          </button>
        )}

        {/* Expanded: correct answer */}
        {expanded && !qr.isCorrect && (
          <div className="mt-3 space-y-2">
            {correctText && (
              <div className="flex items-start gap-2.5 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-0.5 uppercase tracking-wide">
                    {t("practice_exam.review_correct_answer")}
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                    {correctText}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
