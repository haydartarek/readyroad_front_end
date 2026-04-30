"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FocusedExamShell } from "@/components/exam/focused-exam-shell";
import { FocusedQuestionCard } from "@/components/exam/focused-question-card";
import { SignImage } from "@/components/traffic-signs/sign-image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PageHeroEyebrow,
  PageHeroDescription,
  PageHeroSurface,
  PageHeroTitle,
  PageMetricCard,
  PageSectionSurface,
} from "@/components/ui/page-surface";
import { TrafficSign } from "@/lib/types";
import { resolveTrafficSignImage } from "@/lib/sign-image-resolver";
import { apiClient, logApiError } from "@/lib/api";
import {
  API_ENDPOINTS,
  isRemovedLegacyTrafficSignCode,
  resolveLegacyTrafficSignCode,
} from "@/lib/constants";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";
import { getTrafficSignName } from "@/lib/traffic-sign-presentation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  XCircle,
  Lock,
  Shapes,
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

function timerColor(secondsLeft: number): string {
  if (secondsLeft >= 7) return "bg-green-500";
  if (secondsLeft >= 4) return "bg-orange-400";
  return "bg-red-500";
}

// ─── Page ───────────────────────────────────────────────

export default function ExamPage() {
  const { signCode, examNumber } = useParams<{
    signCode: string;
    examNumber: string;
  }>();
  const router = useRouter();
  const examNum = Number(examNumber) as 1 | 2;
  const { t, language, isRTL } = useLanguage();
  const lang = language as Lang;
  const requestedCode = resolveLegacyTrafficSignCode(signCode);
  const removedLegacyCode = isRemovedLegacyTrafficSignCode(signCode);

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
    if (removedLegacyCode) {
      router.replace("/traffic-signs");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLocked(false);

    Promise.all([
      apiClient.get<TrafficSign>(API_ENDPOINTS.TRAFFIC_SIGNS.DETAIL(requestedCode)),
      getExamQuestions(requestedCode, examNum),
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
  }, [removedLegacyCode, requestedCode, examNum, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const questions = useMemo(() => examData?.questions ?? [], [examData]);
  const total = questions.length;
  const current = questions[currentIdx];
  const routeCode = sign?.routeCode ?? signCode;
  const signName = sign ? getTrafficSignName(sign, lang) : signCode;

  useEffect(() => {
    if (!sign) {
      return;
    }

    const canonicalCode = sign.routeCode ?? sign.signCode;
    if (!canonicalCode || signCode === canonicalCode) {
      return;
    }

    router.replace(`/traffic-signs/${canonicalCode}/exam/${examNum}`);
  }, [examNum, router, sign, signCode]);

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
      const res = await submitExam(requestedCode, examNum, payload);
      setResult(res);
    } catch (err) {
      logApiError("Submit exam error", err);
    } finally {
      setSubmitting(false);
    }
  }, [examData, submitting, questions, answers, requestedCode, examNum]);

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

  const questionText = current ? qText(current, lang) : "";
  const questionImageUrl = sign ? resolveTrafficSignImage(sign) : null;
  const questionProgressLabel = t("practice_exam.question_of")
    .replace("{n}", String(currentIdx + 1))
    .replace("{m}", String(total));
  const questionProgressPercent = total > 0 ? (currentIdx / total) * 100 : 0;
  const timerPillClass =
    timeLeft >= 7
      ? "border-green-200 bg-green-50 text-green-700"
      : timeLeft >= 4
        ? "border-orange-200 bg-orange-50 text-orange-600"
        : "border-red-200 bg-red-50 text-red-600 animate-pulse";

  // ── Loading ──
  if (loading) {
    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="min-h-screen bg-gradient-to-b from-background via-background to-muted/35"
      >
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <PageHeroSurface>
            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
              <div className="mx-auto h-44 w-44 animate-pulse rounded-[1.75rem] bg-muted" />
              <div className="space-y-4">
                <div className="h-8 w-40 animate-pulse rounded-full bg-muted" />
                <div className="h-14 w-2/3 animate-pulse rounded-2xl bg-muted" />
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="h-28 animate-pulse rounded-[1.5rem] bg-muted" />
                  <div className="h-28 animate-pulse rounded-[1.5rem] bg-muted" />
                  <div className="h-28 animate-pulse rounded-[1.5rem] bg-muted" />
                </div>
              </div>
            </div>
          </PageHeroSurface>
        </div>
      </div>
    );
  }

  // ── Locked ──
  if (locked) {
    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="min-h-screen bg-gradient-to-b from-background via-background to-muted/35"
      >
        <div className="container mx-auto max-w-5xl px-4 py-6">
          <PageHeroSurface>
            <div className="mx-auto max-w-3xl space-y-6 text-center">
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Lock className="h-10 w-10" />
                </div>
              </div>
              <div className="space-y-2">
                <PageHeroTitle>{t("sign_quiz.locked")}</PageHeroTitle>
                <PageHeroDescription>
                  {t("sign_quiz.exam_locked_desc")}
                </PageHeroDescription>
              </div>
              {sign && (
                <div className="mx-auto w-fit rounded-[1.5rem] border border-border/60 bg-background/85 p-4 shadow-sm">
                  <div className="relative h-24 w-24">
                    <SignImage
                      src={resolveTrafficSignImage(sign)}
                      alt={sign.nameEn}
                    />
                  </div>
                </div>
              )}
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
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
                    {t("sign_quiz.start_exam")}
                  </Link>
                </Button>
              </div>
            </div>
          </PageHeroSurface>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !sign || !examData) {
    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="min-h-screen bg-gradient-to-b from-background via-background to-muted/35"
      >
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <PageHeroSurface>
            <div className="mx-auto max-w-2xl space-y-5 text-center">
              <div className="space-y-2">
                <PageHeroTitle>{t("sign_quiz.error_load")}</PageHeroTitle>
                <PageHeroDescription>
                  {error || t("sign_quiz.error_load")}
                </PageHeroDescription>
              </div>
              <div className="flex justify-center">
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
              </div>
            </div>
          </PageHeroSurface>
        </div>
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
          <PageHeroSurface
            className={cn(
              result.passed ? "border-green-200/80" : "border-red-200/80",
            )}
          >
            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
              <div className="space-y-4">
                <div className="rounded-[1.75rem] border border-border/60 bg-background/85 p-4 shadow-sm">
                  <div className="relative mx-auto aspect-square w-full max-w-[148px]">
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
                  <PageHeroDescription className="text-primary">{signName}</PageHeroDescription>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {t("sign_quiz.exam.title").replace("{n}", String(examNum))}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2.5">
                  <PageHeroEyebrow>
                    {t("sign_quiz.exam.result_heading")}
                  </PageHeroEyebrow>
                  <PageHeroTitle as="h2">{signName}</PageHeroTitle>
                  <PageHeroDescription className="text-base font-semibold text-foreground/80">
                    {result.passed
                      ? t("sign_quiz.exam.passed")
                      : t("sign_quiz.exam.failed")}
                  </PageHeroDescription>
                  <PageHeroDescription>
                    {t("sign_quiz.exam.result_description")}
                  </PageHeroDescription>
                  <PageHeroDescription className="font-semibold text-primary">
                    {t("sign_quiz.exam.correct_of")
                      .replace("{n}", String(result.correctAnswers))
                      .replace("{total}", String(result.totalLinked))}
                  </PageHeroDescription>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <PageMetricCard
                    icon={
                      result.passed ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )
                    }
                    label={t("sign_quiz.exam.score_label")}
                    value={`${scorePct}%`}
                    hint={t("sign_quiz.exam.correct_of")
                      .replace("{n}", String(result.correctAnswers))
                      .replace("{total}", String(result.totalLinked))}
                    tone={result.passed ? "success" : "danger"}
                  />
                  <PageMetricCard
                    icon={<BookOpen className="h-5 w-5" />}
                    label={t("sign_quiz.exam.correct_answers_label")}
                    value={`${result.correctAnswers}/${result.totalLinked}`}
                    hint={t("sign_quiz.exam.required_to_pass")}
                  />
                  <PageMetricCard
                    icon={<Shapes className="h-5 w-5" />}
                    label={t("sign_quiz.exam.pass_target_label")}
                    value={`${reqPct}%`}
                    hint={`${result.passingThreshold}/${result.totalLinked}`}
                    tone={result.passed ? "primary" : "warning"}
                  />
                </div>

                <div className="grid gap-2.5 sm:grid-cols-3">
                  <Button className="rounded-xl h-10 font-semibold" asChild>
                    <Link href={`/traffic-signs/${signCode}/exam/${examNum}`}>
                      {t("sign_quiz.exam.retake")}
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl h-10 border-primary/15 bg-background/80 font-medium text-foreground hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
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
          </PageHeroSurface>

          {showReview && (
            <div ref={reviewRef}>
              <PageSectionSurface
                title={t("sign_quiz.exam.review_answers")}
                description={t("sign_quiz.exam.correct_of")
                  .replace("{n}", String(result.correctAnswers))
                  .replace("{total}", String(result.totalLinked))}
                className="pb-6"
              >
                <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
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
              </PageSectionSurface>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Exam Screen ──
  return (
    <FocusedExamShell
      dir={isRTL ? "rtl" : "ltr"}
      backControl={
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 rounded-full px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          asChild
        >
          <Link href={`/traffic-signs/${routeCode}`}>
            {isRTL ? (
              <ArrowRight className="me-2 h-4 w-4" />
            ) : (
              <ArrowLeft className="me-2 h-4 w-4" />
            )}
            {t("sign_quiz.exam.back_to_sign")}
          </Link>
        </Button>
      }
      timerPill={
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold tabular-nums transition-colors",
            timerPillClass,
          )}
        >
          <Clock3 className="h-3.5 w-3.5" />
          {timeLeft}s
        </div>
      }
      progressLabel={questionProgressLabel}
      progressPercent={questionProgressPercent}
    >
      <FocusedQuestionCard
        headerBadges={
          <>
            <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
              {currentIdx + 1}
            </span>
            <span className="inline-flex items-center rounded-full border border-border/60 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {sign.signCode}
            </span>
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {t("sign_quiz.exam.title").replace("{n}", String(examNum))}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
                current.difficulty === "EASY" && "bg-green-500 text-white",
                current.difficulty === "MEDIUM" && "bg-orange-500 text-white",
                current.difficulty === "HARD" && "bg-red-500 text-white",
              )}
            >
              {t(`sign_quiz.${current.difficulty.toLowerCase()}`)}
            </span>
          </>
        }
        media={
          questionImageUrl ? (
            <div className="rounded-2xl border border-border/50 bg-background/70 p-2 shadow-sm">
              <div className="relative h-[6.5rem] w-[6.5rem] md:h-28 md:w-28">
                <SignImage
                  src={questionImageUrl}
                  alt={sign.nameEn}
                  className="object-contain"
                />
              </div>
            </div>
          ) : null
        }
        title={questionText}
        options={current.choices.map((choice, index) => ({
          key: choice.id,
          marker: index + 1,
          text: cText(choice, lang),
          selected: answers.get(current.id) === choice.id,
          onSelect: () => handleSelect(current.id, choice.id),
        }))}
        footer={
          <>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-linear",
                  timerColor(timeLeft),
                )}
                style={{
                  width: `${Math.round((timeLeft / QUESTION_TIME) * 100)}%`,
                }}
              />
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={
                  currentIdx < total - 1
                    ? () => setCurrentIdx((i) => i + 1)
                    : handleForceSubmit
                }
                disabled={submitting || !answers.has(current.id)}
                className="h-10 min-w-[112px] gap-2 rounded-full px-5 font-semibold shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25"
              >
                {currentIdx + 1 === total
                  ? submitting
                    ? t("sign_quiz.exam.submitting")
                    : t("sign_quiz.exam.submit_exam")
                  : t("sign_quiz.practice.next_question")}
                {currentIdx + 1 === total ? null : isRTL ? (
                  <ArrowLeft className="h-4 w-4" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        }
      />
    </FocusedExamShell>
  );
}
