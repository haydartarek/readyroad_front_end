"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";
import { SignImage } from "@/components/traffic-signs/sign-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrafficSign } from "@/lib/types";
import { resolveTrafficSignImage } from "@/lib/sign-image-resolver";
import { apiClient, logApiError } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";
import { getTrafficSignName } from "@/lib/traffic-sign-presentation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Lock,
} from "lucide-react";
import {
  getExamQuestions,
  submitExam,
  type SignExamQuestions,
  type SignQuizQuestion,
  type SignChoice,
  type SignExamResult,
} from "@/services";

// ─── Types ──────────────────────────────────────────────

type Lang = "en" | "ar" | "nl" | "fr";

// ─── Helpers ────────────────────────────────────────────

function qText(q: SignQuizQuestion, lang: Lang) {
  return (
    (q[
      `question${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof SignQuizQuestion
    ] as string) ||
    q.questionEn ||
    ""
  );
}

function cText(c: SignChoice, lang: Lang) {
  const key =
    `text${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof SignChoice;
  return (c[key] as string) || c.textEn || "";
}

const DIFF_COLORS: Record<string, string> = {
  EASY: "bg-green-100 text-green-800 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HARD: "bg-red-100 text-red-800 border-red-200",
};

const QUESTION_TIME = 10; // seconds per question

// ─── Page ───────────────────────────────────────────────

export default function ExamPage() {
  const { signCode, examNumber } = useParams<{
    signCode: string;
    examNumber: string;
  }>();
  const examNum = Number(examNumber) as 1 | 2;
  const { t, language, isRTL } = useLanguage();
  const lang = language as Lang;

  const [sign, setSign] = useState<TrafficSign | null>(null);
  const [examData, setExamData] = useState<SignExamQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  // answers: questionId → choiceId
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SignExamResult | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reviewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLocked(false);

    Promise.all([
      apiClient.get<TrafficSign>(API_ENDPOINTS.TRAFFIC_SIGNS.DETAIL(signCode)),
      getExamQuestions(signCode, examNum),
    ])
      .then(([signRes, exam]) => {
        if (!cancelled) {
          setSign(signRes.data);
          setExamData(exam);
        }
      })
      .catch((err) => {
        logApiError("Exam load error", err);
        if (!cancelled) {
          if (err?.response?.status === 423) setLocked(true);
          else setError(t("sign_quiz.error_load"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [signCode, examNum]); // eslint-disable-line react-hooks/exhaustive-deps

  const questions = useMemo(() => examData?.questions ?? [], [examData]);
  const total = questions.length;
  const current = questions[currentIdx];
  const answeredCnt = answers.size;
  const routeCode = sign?.routeCode ?? signCode;
  const signName = sign ? getTrafficSignName(sign, lang) : signCode;
  const breadcrumbItems = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.traffic_signs"), href: "/traffic-signs" },
    { label: signName, href: `/traffic-signs/${routeCode}` },
    {
      label: t("sign_quiz.exam.title").replace("{n}", String(examNum)),
      href: `/traffic-signs/${routeCode}/exam/${examNum}`,
    },
  ];

  const handleSelect = useCallback((questionId: number, choiceId: number) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(questionId, choiceId);
      return next;
    });
  }, []);

  const handleForceSubmit = useCallback(async () => {
    if (!examData || submitting) return;
    setSubmitting(true);
    const payload = questions
      .map((q) => ({
        questionId: q.id,
        choiceId: answers.get(q.id) ?? -1,
      }))
      .filter((a) => a.choiceId !== -1);
    try {
      const res = await submitExam(signCode, examNum, payload);
      setResult(res);
    } catch (err) {
      logApiError("Submit exam error", err);
    } finally {
      setSubmitting(false);
    }
  }, [examData, submitting, questions, answers, signCode, examNum]);

  // ── Per-question countdown timer ─────────────────────────────────────────
  useEffect(() => {
    if (!examData || result) return;
    setTimeLeft(QUESTION_TIME);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentIdx, examData, result]);

  useEffect(() => {
    if (timeLeft !== 0) return;
    if (currentIdx < total - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      handleForceSubmit();
    }
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">
          {t("sign_quiz.loading")}
        </p>
      </div>
    );
  }

  // ── Locked ──
  if (locked) {
    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="min-h-screen flex flex-col items-center justify-center gap-6 p-6"
      >
        <Lock className="w-16 h-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black">{t("sign_quiz.locked")}</h2>
          <p className="text-muted-foreground">
            {t("sign_quiz.exam_locked_desc")}
          </p>
        </div>
        {sign && (
          <div className="relative w-24 h-24 rounded-xl bg-white border border-border/40 p-2 shadow-md flex items-center justify-center">
            <SignImage src={resolveTrafficSignImage(sign)} alt={sign.nameEn} />
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl" asChild>
            <Link href={`/traffic-signs/${signCode}`}>
              {isRTL ? (
                <ArrowRight className="w-4 h-4 mr-2" />
              ) : (
                <ArrowLeft className="w-4 h-4 mr-2" />
              )}
              {t("sign_quiz.exam.back_to_sign")}
            </Link>
          </Button>
          <Button className="rounded-xl" asChild>
            <Link href={`/traffic-signs/${signCode}/exam/1`}>
              {t("sign_quiz.start_exam")} 1
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !sign || !examData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground text-center">
          {error || t("sign_quiz.error_load")}
        </p>
        <Button variant="outline" asChild>
          <Link href={`/traffic-signs/${signCode}`}>
            {isRTL ? (
              <ArrowRight className="w-4 h-4 mr-2" />
            ) : (
              <ArrowLeft className="w-4 h-4 mr-2" />
            )}
            {t("sign_quiz.exam.back_to_sign")}
          </Link>
        </Button>
      </div>
    );
  }

  // ── Result Screen ──
  if (result) {
    const scorePct = Math.round(result.scorePercentage);
    const reqPct =
      result.totalLinked > 0
        ? Math.round((result.passingThreshold / result.totalLinked) * 100)
        : 80;

    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="min-h-screen bg-gradient-to-b from-background via-background to-muted/35"
      >
        <div className="container mx-auto max-w-5xl px-4 py-4 md:py-6 space-y-4">
          <Breadcrumb items={breadcrumbItems} />

          <Card
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

            <CardContent className="px-5 py-5 md:px-6 md:py-6">
              <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-border/60 bg-background/85 p-4 shadow-sm">
                    <div className="relative mx-auto aspect-square w-full max-w-[132px]">
                      <SignImage
                        src={resolveTrafficSignImage(sign)}
                        alt={sign.nameEn}
                        className="object-contain"
                      />
                    </div>
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
                        ? t("sign_quiz.exam.passed")
                        : t("sign_quiz.exam.failed")}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{signName}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {t("sign_quiz.exam.title").replace("{n}", String(examNum))}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {t("sign_quiz.exam.correct_of")
                          .replace("{n}", String(result.correctAnswers))
                          .replace("{total}", String(result.totalLinked))}
                      </p>
                      <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
                        {result.passed
                          ? t("sign_quiz.exam.passed")
                          : t("sign_quiz.exam.failed")}
                      </h2>
                    </div>

                    <div className="flex items-center gap-3 rounded-[1.25rem] border border-border/60 bg-background/80 px-4 py-3 shadow-sm">
                      {result.passed ? (
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                      ) : (
                        <XCircle className="h-8 w-8 text-red-400" />
                      )}
                      <div className="text-end">
                        <div
                          className={cn(
                            "text-4xl font-black tabular-nums leading-none md:text-5xl",
                            result.passed
                              ? "text-green-600"
                              : "text-foreground",
                          )}
                        >
                          {scorePct}%
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("sign_quiz.exam.required_to_pass")}: {reqPct}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-[1.5rem] border border-border/60 bg-background/80 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-foreground">
                        {t("sign_quiz.exam.correct_of")
                          .replace("{n}", String(result.correctAnswers))
                          .replace("{total}", String(result.totalLinked))}
                      </span>
                      <span className="font-semibold text-primary">
                        {scorePct}%
                      </span>
                    </div>
                    <Progress
                      value={scorePct}
                      className={cn(
                        "h-2.5 rounded-full bg-muted/50",
                        result.passed
                          ? "[&>div]:bg-green-500 [&>div]:transition-all [&>div]:duration-700"
                          : "[&>div]:bg-red-400 [&>div]:transition-all [&>div]:duration-700",
                      )}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {result.correctAnswers}/{result.totalLinked}
                      </span>
                      <span>{reqPct}%</span>
                    </div>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-3">
                    <Button
                      className="rounded-xl h-10 font-semibold"
                      asChild
                    >
                      <Link href={`/traffic-signs/${signCode}/exam/${examNum}`}>
                        {t("sign_quiz.exam.retake")}
                      </Link>
                    </Button>
                    <Button
                      variant="secondary"
                      className="rounded-xl h-10 font-medium"
                      onClick={() => {
                        setShowReview((r) => !r);
                        setTimeout(
                          () =>
                            reviewRef.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            }),
                          50,
                        );
                      }}
                    >
                      {t("sign_quiz.exam.review_answers")}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl h-10 font-medium"
                      asChild
                    >
                      <Link href={`/traffic-signs/${signCode}`}>
                        {isRTL ? (
                          <ArrowRight className="mr-2 h-4 w-4" />
                        ) : (
                          <ArrowLeft className="mr-2 h-4 w-4" />
                        )}
                        {t("sign_quiz.exam.back_to_sign")}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {showReview && (
            <div
              ref={reviewRef}
              className="grid gap-4 pb-6 xl:grid-cols-2 xl:items-start"
            >
              {result.questionResults.map((qRes, idx) => {
                const q = questions.find((q) => q.id === qRes.questionId);
                const correctText =
                  (qRes[
                    `correctText${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof typeof qRes
                  ] as string) ||
                  qRes.correctTextEn ||
                  "";
                const expl =
                  (qRes[
                    `explanation${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof typeof qRes
                  ] as string) ||
                  qRes.explanationEn ||
                  "";

                return (
                  <Card
                    key={qRes.questionId}
                    className={cn(
                      "rounded-[1.35rem] border shadow-sm",
                      !qRes.answered
                        ? "border-muted"
                        : qRes.isCorrect
                          ? "border-green-300"
                        : "border-red-300",
                    )}
                  >
                    <CardContent className="space-y-3 px-5 py-5">
                      <div className="flex items-start gap-3">
                        <div className="relative h-11 w-11 rounded-xl bg-white border border-border/40 p-1.5 flex items-center justify-center flex-shrink-0">
                          <SignImage
                            src={resolveTrafficSignImage(sign)}
                            alt={sign.nameEn}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs text-muted-foreground font-semibold">
                              {t("sign_quiz.exam.question_x").replace(
                                "{n}",
                                String(idx + 1),
                              )}
                            </span>
                            {q && (
                              <Badge
                                className={cn(
                                  "border text-xs",
                                  DIFF_COLORS[q.difficulty] ||
                                    "bg-muted text-foreground border-border",
                                )}
                              >
                                {t(`sign_quiz.${q.difficulty.toLowerCase()}`)}
                              </Badge>
                            )}
                            {!qRes.answered ? (
                              <Badge variant="outline" className="text-xs">
                                {t("sign_quiz.exam.not_answered")}
                              </Badge>
                            ) : qRes.isCorrect ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200 border text-xs">
                                {t("sign_quiz.exam.correct_label")}
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 border-red-200 border text-xs">
                                {t("sign_quiz.exam.wrong_label")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-semibold leading-6">
                            {q ? qText(q, lang) : `Question ${idx + 1}`}
                          </p>
                        </div>
                      </div>

                      {correctText && (
                        <p className="text-sm text-green-700 font-medium">
                          ✓ {t("sign_quiz.exam.correct_answer")}: {correctText}
                        </p>
                      )}
                      {expl && (
                        <p className="text-xs text-muted-foreground">{expl}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Exam Screen ──
  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-gradient-to-b from-background via-background to-muted/35"
    >
      <div className="container mx-auto max-w-6xl px-4 py-4 md:py-6 space-y-3 md:space-y-4">
        <Breadcrumb items={breadcrumbItems} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" className="gap-2 rounded-xl px-0" asChild>
            <Link href={`/traffic-signs/${signCode}`}>
              {isRTL ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )}
              {t("sign_quiz.exam.back_to_sign")}
            </Link>
          </Button>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5 shadow-sm">
            <span className="text-sm font-semibold text-foreground">
              {t("sign_quiz.exam.title").replace("{n}", String(examNum))}
            </span>
            <Badge variant="outline" className="rounded-full text-xs">
              {answeredCnt}/{total}
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start">
          <Card className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/85 shadow-sm xl:sticky xl:top-20">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary/70 via-primary to-primary/75" />
            <CardContent className="space-y-4 px-4 py-4">
              <div className="rounded-[1.35rem] border border-border/60 bg-background/85 p-3 shadow-sm">
                <div className="relative mx-auto aspect-square w-full max-w-[112px]">
                  <SignImage
                    src={resolveTrafficSignImage(sign)}
                    alt={sign.nameEn}
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-[11px] font-semibold text-primary">
                    {t("sign_quiz.exam.title").replace("{n}", String(examNum))}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-border/60 bg-background px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                    {sign.signCode}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("nav.traffic_signs")}
                  </p>
                  <h1 className="text-[1.55rem] font-black tracking-tight text-foreground">
                    {signName}
                  </h1>
                </div>
              </div>

              <div className="space-y-3 rounded-[1.25rem] border border-border/60 bg-background/80 p-3.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-foreground">
                    {t("sign_quiz.exam.question_x").replace(
                      "{n}",
                      String(currentIdx + 1),
                    )}{" "}
                    / {total}
                  </span>
                  <span className="font-semibold text-primary">
                    {Math.round((answeredCnt / total) * 100)}%
                  </span>
                </div>
                <Progress
                  value={(answeredCnt / total) * 100}
                  className="h-2 rounded-full [&>div]:bg-primary [&>div]:transition-all [&>div]:duration-500"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {answeredCnt}/{total}
                  </span>
                  <span>{t("sign_quiz.exam.title").replace("{n}", String(examNum))}</span>
                </div>
              </div>

              <div className="space-y-2 rounded-[1.25rem] border border-border/60 bg-background/80 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {t("exam.time_remaining")}
                  </span>
                  <span
                    className={cn(
                      "text-base font-black tabular-nums",
                      timeLeft >= 7
                        ? "text-green-600"
                        : timeLeft >= 4
                          ? "text-yellow-600"
                          : "text-red-500",
                    )}
                  >
                    {timeLeft}s
                  </span>
                </div>
                <div
                  className={cn(
                    "h-2 rounded-full overflow-hidden",
                    timeLeft >= 7
                      ? "bg-green-100"
                      : timeLeft >= 4
                        ? "bg-yellow-100"
                        : "bg-red-100",
                  )}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-1000 ease-linear",
                      timeLeft >= 7
                        ? "bg-green-500"
                        : timeLeft >= 4
                          ? "bg-yellow-400"
                          : "bg-red-500",
                    )}
                    style={{
                      width: `${(timeLeft / QUESTION_TIME) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <Button variant="outline" className="w-full rounded-xl" asChild>
                <Link href={`/traffic-signs/${signCode}`}>
                  {isRTL ? (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  ) : (
                    <ArrowLeft className="mr-2 h-4 w-4" />
                  )}
                  {t("sign_quiz.exam.back_to_sign")}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5 justify-center xl:justify-start">
              {questions.map((q, i) => {
                const reachable = questions
                  .slice(0, i)
                  .every((prev) => answers.has(prev.id));
                return (
                  <button
                    key={q.id}
                    onClick={() => reachable && setCurrentIdx(i)}
                    disabled={!reachable}
                    className={cn(
                      "h-7 min-w-7 rounded-full px-2 text-[11px] font-bold transition-all border",
                      i === currentIdx
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : answers.has(q.id)
                          ? "bg-green-100 text-green-700 border-green-300"
                          : reachable
                            ? "bg-card text-muted-foreground border-border hover:border-primary/30"
                            : "bg-muted/40 text-muted-foreground/40 border-border/40 cursor-not-allowed",
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {current && (
              <Card className="flex overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm xl:min-h-[calc(100vh-14rem)] xl:flex-col">
                <CardHeader className="space-y-3 px-5 pb-3 pt-4 md:px-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      className={cn(
                        "border text-xs font-semibold",
                        DIFF_COLORS[current.difficulty] ||
                          "bg-muted text-foreground border-border",
                      )}
                    >
                      {t(`sign_quiz.${current.difficulty.toLowerCase()}`)}
                    </Badge>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {t("sign_quiz.exam.question_x").replace(
                        "{n}",
                        String(currentIdx + 1),
                      )}{" "}
                      / {total}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-black leading-snug text-foreground md:text-[1.55rem]">
                    {qText(current, lang)}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col space-y-3 px-5 pb-5 md:px-6 md:pb-6">
                  <div className="space-y-2.5">
                    {current.choices.map((choice) => {
                      const isSelected = answers.get(current.id) === choice.id;
                      return (
                        <button
                          key={choice.id}
                          onClick={() => handleSelect(current.id, choice.id)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-[1.15rem] border-2 px-4 py-3 text-start transition-all duration-150",
                            isSelected
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border/60 bg-background hover:border-primary/35 hover:bg-primary/5",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-1 h-4 w-4 flex-shrink-0 rounded-full border-2 transition-all duration-150",
                              isSelected
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/40",
                            )}
                          />
                          <span className="flex-1 text-base font-semibold leading-6 text-foreground">
                            {cText(choice, lang)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="sticky bottom-2 z-10 mt-auto -mx-2 bg-gradient-to-t from-card via-card to-transparent px-2 pt-3">
                    {currentIdx < total - 1 ? (
                      <div className="space-y-2">
                        <Button
                          className="h-12 w-full rounded-xl text-sm font-semibold shadow-sm"
                          disabled={!answers.has(current.id)}
                          onClick={() => setCurrentIdx((i) => i + 1)}
                        >
                          {t("sign_quiz.practice.next_question")}
                          {isRTL ? (
                            <ArrowLeft className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowRight className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                          {t("sign_quiz.exam.instructions")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          className="h-12 w-full rounded-xl text-sm font-semibold shadow-sm shadow-primary/20"
                          disabled={submitting}
                          onClick={handleForceSubmit}
                        >
                          {submitting
                            ? t("sign_quiz.exam.submitting")
                            : `${t("sign_quiz.exam.submit_exam")} (${answeredCnt}/${total})`}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                          {t("sign_quiz.exam.instructions")}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
