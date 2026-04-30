"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChartNoAxesColumn,
  CheckCircle2,
  RotateCcw,
  Shapes,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import Breadcrumb from "@/components/ui/breadcrumb";
import { SignImage } from "@/components/traffic-signs/sign-image";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  PageHeroEyebrow,
  PageHeroDescription,
  PageHeroSurface,
  PageHeroTitle,
  PageMetricCard,
  PageSectionSurface,
} from "@/components/ui/page-surface";
import { useLanguage } from "@/contexts/language-context";
import { apiClient, isServiceUnavailable, logApiError } from "@/lib/api";
import {
  API_ENDPOINTS,
  isRemovedLegacyTrafficSignCode,
  resolveLegacyTrafficSignCode,
} from "@/lib/constants";
import { resolveTrafficSignImage } from "@/lib/sign-image-resolver";
import {
  getTrafficSignGroupInfo,
  getTrafficSignName,
} from "@/lib/traffic-sign-presentation";
import type { TrafficSign } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  getPracticeResults,
  startPracticeSession,
  submitPracticeAnswer,
  type SignChoice,
  type PracticeAnswerDetail,
  type SignPracticeAnswerResponse,
  type SignPracticeSession,
  type SignQuizQuestion,
} from "@/services";

type Lang = "en" | "ar" | "nl" | "fr";

type AnswerState = {
  response: SignPracticeAnswerResponse;
  selectedChoiceId: number;
  timeTaken: number;
};

type AnswerHistoryEntry = {
  question: SignQuizQuestion;
  selectedChoiceId: number;
  response: SignPracticeAnswerResponse;
};

function createHistoryEntryFromResult(
  detail: PracticeAnswerDetail,
  question: SignQuizQuestion,
  totalQuestions: number,
): AnswerHistoryEntry {
  return {
    question,
    selectedChoiceId: detail.selectedChoiceId ?? detail.correctChoiceId,
    response: {
      questionId: detail.questionId,
      isCorrect: detail.isCorrect,
      selectedChoiceId: detail.selectedChoiceId ?? detail.correctChoiceId,
      selectedTextNl: detail.selectedTextNl ?? detail.correctTextNl,
      selectedTextEn: detail.selectedTextEn ?? detail.correctTextEn,
      selectedTextFr: detail.selectedTextFr ?? detail.correctTextFr,
      selectedTextAr: detail.selectedTextAr ?? detail.correctTextAr,
      correctChoiceId: detail.correctChoiceId,
      correctTextNl: detail.correctTextNl,
      correctTextEn: detail.correctTextEn,
      correctTextFr: detail.correctTextFr,
      correctTextAr: detail.correctTextAr,
      explanationNl: detail.explanationNl,
      explanationEn: detail.explanationEn,
      explanationFr: detail.explanationFr,
      explanationAr: detail.explanationAr,
      questionsAnswered: 0,
      totalQuestions,
      sessionCompleted: false,
      signAccuracyPercentage: 0,
      signTotalAttempts: 0,
    },
  };
}

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: "border-green-200 bg-green-100 text-green-800",
  MEDIUM: "border-amber-200 bg-amber-100 text-amber-800",
  HARD: "border-red-200 bg-red-100 text-red-800",
};

function getQuestionText(question: SignQuizQuestion, language: Lang) {
  const key = `question${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof SignQuizQuestion;
  return (question[key] as string) || question.questionEn || "";
}

function getChoiceText(choice: SignChoice, language: Lang) {
  const key = `text${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof SignChoice;
  return (choice[key] as string) || choice.textEn || "";
}

function getExplanation(
  response: SignPracticeAnswerResponse,
  language: Lang,
): string {
  const key = `explanation${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof SignPracticeAnswerResponse;
  return (response[key] as string) || response.explanationEn || "";
}

function getApiErrorStatusAndMessage(error: unknown): {
  status?: number;
  message?: string;
} {
  if (!axios.isAxiosError(error)) {
    return {};
  }

  const data = error.response?.data;
  const message =
    data && typeof data === "object" && "message" in data
      ? (data as { message?: unknown }).message
      : undefined;

  return {
    status: error.response?.status,
    message: typeof message === "string" ? message : undefined,
  };
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/35">
      <div className="container mx-auto max-w-7xl px-4 py-5 md:py-6 space-y-4">
        <div className="h-5 w-56 animate-pulse rounded-full bg-muted" />
        <div className="rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-sm md:p-6">
          <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-center">
            <div className="mx-auto h-40 w-40 animate-pulse rounded-[1.5rem] bg-muted" />
            <div className="space-y-4">
              <div className="h-8 w-40 animate-pulse rounded-full bg-muted" />
              <div className="h-12 w-2/3 animate-pulse rounded-2xl bg-muted" />
              <div className="h-6 w-1/2 animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
        </div>
        <div className="h-80 animate-pulse rounded-[1.75rem] bg-card" />
      </div>
    </div>
  );
}

export default function TrafficSignPracticePage() {
  const params = useParams<{ signCode: string }>();
  const routeParam = params.signCode;
  const router = useRouter();
  const { t, language, isRTL } = useLanguage();
  const currentLanguage = (["nl", "en", "ar", "fr"] as Lang[]).includes(
    language as Lang,
  )
    ? (language as Lang)
    : "en";

  const [sign, setSign] = useState<TrafficSign | null>(null);
  const [session, setSession] = useState<SignPracticeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [initialAnsweredCount, setInitialAnsweredCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [startedAt, setStartedAt] = useState<number>(Date.now());
  const [done, setDone] = useState(false);
  const [answerHistory, setAnswerHistory] = useState<AnswerHistoryEntry[]>([]);
  const [showReview, setShowReview] = useState(false);

  const reviewRef = useRef<HTMLDivElement | null>(null);
  const actionRef = useRef<HTMLDivElement | null>(null);
  const requestedCode = resolveLegacyTrafficSignCode(routeParam);
  const removedLegacyCode = isRemovedLegacyTrafficSignCode(routeParam);

  const routeCode = sign?.routeCode ?? sign?.signCode ?? routeParam;
  const signName = sign ? getTrafficSignName(sign, currentLanguage) : routeParam;
  const { info, style } = sign
    ? getTrafficSignGroupInfo(sign)
    : getTrafficSignGroupInfo({ signCode: routeParam, imageUrl: "" } as TrafficSign);
  const breadcrumbItems = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.traffic_signs"), href: "/traffic-signs" },
    { label: signName, href: `/traffic-signs/${routeCode}` },
    { label: t("nav.practice"), href: `/traffic-signs/${routeCode}/practice` },
  ];

  const initializeSession = useCallback(
    async (identifier: string) => {
      const [signResponse, practiceSession] = await Promise.all([
        apiClient.get<TrafficSign>(API_ENDPOINTS.TRAFFIC_SIGNS.DETAIL(identifier)),
        startPracticeSession(identifier),
      ]);

      let answeredResults: PracticeAnswerDetail[] = [];
      try {
        const practiceResults = await getPracticeResults(practiceSession.sessionId);
        answeredResults = practiceResults.questionResults;
      } catch (apiError) {
        logApiError("Failed to load existing sign practice results", apiError);
      }

      const answeredQuestionIds = new Set(
        answeredResults.map((detail) => detail.questionId),
      );
      const questionById = new Map(
        practiceSession.questions.map((question) => [question.id, question]),
      );
      const restoredHistory = answeredResults
        .map((detail) => {
          const question = questionById.get(detail.questionId);
          if (!question) {
            return null;
          }
          return createHistoryEntryFromResult(
            detail,
            question,
            practiceSession.totalQuestions,
          );
        })
        .filter((entry): entry is AnswerHistoryEntry => entry !== null);
      const remainingQuestions = practiceSession.questions.filter(
        (question) => !answeredQuestionIds.has(question.id),
      );

      setSign(signResponse.data);
      setSession({
        ...practiceSession,
        questions: remainingQuestions,
      });
      setInitialAnsweredCount(restoredHistory.length);
      setCurrentIndex(0);
      setSelectedChoice(null);
      setAnswerState(null);
      setDone(remainingQuestions.length === 0);
      setAnswerHistory(restoredHistory);
      setShowReview(false);
      setStartedAt(Date.now());
    },
    [],
  );

  useEffect(() => {
    if (removedLegacyCode) {
      router.replace("/traffic-signs");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setSubmissionError(null);
    setServiceUnavailable(false);

    initializeSession(requestedCode)
      .catch((apiError) => {
        logApiError("Failed to initialize sign practice session", apiError);
        if (!cancelled) {
          if (isServiceUnavailable(apiError)) {
            setServiceUnavailable(true);
          } else {
            setLoadError(t("sign_quiz.error_load"));
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initializeSession, removedLegacyCode, requestedCode, router, t]);

  useEffect(() => {
    if (!sign) {
      return;
    }

    const canonicalCode = sign.routeCode ?? sign.signCode;
    if (!canonicalCode || routeParam === canonicalCode) {
      return;
    }

    router.replace(`/traffic-signs/${canonicalCode}/practice`);
  }, [routeParam, router, sign]);

  const questions = session?.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const answeredCount = initialAnsweredCount + currentIndex + (answerState ? 1 : 0);
  const progressPercentage =
    session?.totalQuestions
      ? (answeredCount / session.totalQuestions) * 100
      : 0;
  const displayQuestionNumber = Math.min(
    initialAnsweredCount + currentIndex + 1,
    session?.totalQuestions ?? 0,
  );

  const handleSubmit = useCallback(async () => {
    if (!session || !currentQuestion || selectedChoice === null || submitting) {
      return;
    }

    const elapsedSeconds = Math.max(
      1,
      Math.round((Date.now() - startedAt) / 1000),
    );

    setSubmissionError(null);
    setSubmitting(true);
    try {
      const response = await submitPracticeAnswer(
        session.sessionId,
        currentQuestion.id,
        selectedChoice,
        elapsedSeconds,
      );

      setAnswerState({
        response,
        selectedChoiceId: selectedChoice,
        timeTaken: elapsedSeconds,
      });

      setAnswerHistory((previous) => [
        ...previous,
        {
          question: currentQuestion,
          selectedChoiceId: selectedChoice,
          response,
        },
      ]);

      if (response.sessionCompleted) {
        setDone(true);
      }

      setTimeout(() => {
        actionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 120);
    } catch (apiError) {
      logApiError("Failed to submit practice answer", apiError);
      const { status, message } = getApiErrorStatusAndMessage(apiError);

      if (
        status === 409 &&
        message?.toLowerCase().includes("already answered")
      ) {
        try {
          await initializeSession(routeCode);
          return;
        } catch (reloadError) {
          logApiError(
            "Failed to resync sign practice session after duplicate answer",
            reloadError,
          );
        }
      }

      setSubmissionError(t("practice.submission_error"));
    } finally {
      setSubmitting(false);
    }
  }, [
    currentQuestion,
    initializeSession,
    routeCode,
    selectedChoice,
    session,
    startedAt,
    submitting,
    t,
  ]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setDone(true);
      return;
    }

    setCurrentIndex((value) => value + 1);
    setSelectedChoice(null);
    setAnswerState(null);
    setStartedAt(Date.now());
  }, [currentIndex, questions.length]);

  const handleRestart = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setSubmissionError(null);

    try {
      await initializeSession(routeCode);
    } catch (apiError) {
      logApiError("Failed to restart sign practice session", apiError);
      if (isServiceUnavailable(apiError)) {
        setServiceUnavailable(true);
      } else {
        setLoadError(t("sign_quiz.error_load"));
      }
    } finally {
      setLoading(false);
    }
  }, [initializeSession, routeCode, t]);

  if (serviceUnavailable) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ServiceUnavailableBanner
          onRetry={() => {
            setServiceUnavailable(false);
            setLoadError(null);
            setSubmissionError(null);
            setLoading(true);
            initializeSession(requestedCode)
              .catch((apiError) => {
                logApiError("Retry failed for sign practice", apiError);
                if (isServiceUnavailable(apiError)) {
                  setServiceUnavailable(true);
                } else {
                  setLoadError(t("sign_quiz.error_load"));
                }
              })
              .finally(() => setLoading(false));
          }}
          className="max-w-xl"
        />
      </div>
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  if (loadError || !sign || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md rounded-[2rem] border border-border/60 bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Shapes className="h-8 w-8" />
          </div>
          <p className="text-base text-muted-foreground">
            {loadError || t("sign_quiz.error_load")}
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild className="rounded-xl">
              <Link href={`/traffic-signs/${routeCode}`}>
                {isRTL ? (
                  <ArrowRight className="mr-2 h-4 w-4" />
                ) : (
                  <ArrowLeft className="mr-2 h-4 w-4" />
                )}
                {t("sign_quiz.practice.back_to_sign")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    const correctAnswers = answerHistory.filter(
      (entry) => entry.response.isCorrect,
    ).length;
    const wrongAnswers = Math.max(0, session.totalQuestions - correctAnswers);
    const scorePercentage =
      session.totalQuestions > 0
        ? Math.round((correctAnswers / session.totalQuestions) * 100)
        : 0;
    const scoreTone =
      scorePercentage >= 85
        ? "success"
        : scorePercentage >= 60
          ? "warning"
          : "danger";

    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="min-h-screen bg-gradient-to-b from-background via-background to-muted/35"
      >
        <div className="container mx-auto max-w-7xl px-4 py-5 md:py-6 space-y-4">
          <Breadcrumb items={breadcrumbItems} />

          <PageHeroSurface
            className={cn(
              scorePercentage === 100
                ? "border-green-200/80"
                : scorePercentage >= 70
                  ? "border-primary/20"
                  : "border-amber-200/80",
            )}
            contentClassName="space-y-0 p-5 md:p-6"
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_280px] xl:items-center">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border border-primary/15 bg-primary/10 text-primary">
                    {t("sign_quiz.practice_done")}
                  </Badge>
                  <Badge className={`border ${style.chip}`}>
                    {info.title[currentLanguage]}
                  </Badge>
                  <Badge className="border border-border/60 bg-background/80 text-foreground/80">
                    {sign.signCode}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <PageHeroEyebrow>
                    {t("sign_quiz.practice.result_heading")}
                  </PageHeroEyebrow>
                  <PageHeroTitle>{signName}</PageHeroTitle>
                  <PageHeroDescription className="max-w-2xl text-sm leading-6 md:text-[15px]">
                    {t("sign_quiz.practice.result_description")}
                  </PageHeroDescription>
                  <PageHeroDescription className="max-w-2xl text-sm font-semibold text-foreground/80 md:text-[15px]">
                    {t("sign_quiz.practice.session_score")
                      .replace("{n}", String(correctAnswers))
                      .replace("{m}", String(session.totalQuestions))}
                  </PageHeroDescription>
                </div>

                <div className="grid gap-2.5 md:grid-cols-2">
                  <div className="rounded-[1.2rem] border border-border/60 bg-background/80 p-3.5 shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {t("sign_quiz.exam.score_label")}
                      </p>
                      <p
                        className={cn(
                          "text-lg font-black",
                          scorePercentage >= 85
                            ? "text-green-600"
                            : scorePercentage >= 60
                              ? "text-amber-600"
                              : "text-destructive",
                        )}
                      >
                        {scorePercentage}%
                      </p>
                    </div>
                    <Progress
                      value={scorePercentage}
                      className="h-2.5 bg-muted/70"
                    />
                    <p className="mt-2 text-xs font-medium text-foreground/75">
                      {t("sign_quiz.exam.correct_of")
                        .replace("{n}", String(correctAnswers))
                        .replace("{total}", String(session.totalQuestions))}
                    </p>
                  </div>

                  <div className="rounded-[1.2rem] border border-border/60 bg-background/80 p-3.5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {t("sign_quiz.exam.review_answers")}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
                      {t("sign_quiz.practice.session_complete")}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {t("sign_quiz.practice.result_description")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-border/60 bg-background/82 p-3.5 shadow-sm">
                <div className="rounded-[1.25rem] border border-border/50 bg-card/90 p-3 shadow-sm">
                  <div className="relative mx-auto aspect-square w-full max-w-[144px]">
                    <SignImage
                      src={resolveTrafficSignImage(sign)}
                      alt={signName}
                      className="object-contain"
                    />
                  </div>
                </div>

                <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
                  <PageMetricCard
                    icon={<Trophy className="h-4 w-4" />}
                    label={t("sign_quiz.exam.score_label")}
                    value={`${scorePercentage}%`}
                    hint={t("sign_quiz.exam.correct_of")
                      .replace("{n}", String(correctAnswers))
                      .replace("{total}", String(session.totalQuestions))}
                    tone={scoreTone}
                    className="p-2.5"
                  />
                  <PageMetricCard
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    label={t("sign_quiz.exam.correct_answers_label")}
                    value={`${correctAnswers}/${session.totalQuestions}`}
                    hint={t("sign_quiz.practice.group_label")}
                    tone="primary"
                    className="p-2.5"
                  />
                </div>
              </div>
            </div>
          </PageHeroSurface>

          <PageSectionSurface contentClassName="space-y-3">
            <div className="grid gap-2.5 md:grid-cols-4">
              <PageMetricCard
                icon={<Target className="h-4 w-4" />}
                label={t("sign_quiz.exam.score_label")}
                value={`${scorePercentage}%`}
                hint={t("sign_quiz.exam.correct_of")
                  .replace("{n}", String(correctAnswers))
                  .replace("{total}", String(session.totalQuestions))}
                tone={scoreTone}
                className="p-2.5"
              />
              <PageMetricCard
                icon={<CheckCircle2 className="h-4 w-4" />}
                label={t("sign_quiz.exam.correct_answers_label")}
                value={`${correctAnswers}/${session.totalQuestions}`}
                hint={t("sign_practice.metric_questions")}
                tone="success"
                className="p-2.5"
              />
              <PageMetricCard
                icon={<XCircle className="h-4 w-4" />}
                label={t("sign_quiz.exam.wrong_label")}
                value={wrongAnswers}
                hint={`${wrongAnswers}/${session.totalQuestions}`}
                tone={wrongAnswers === 0 ? "success" : "danger"}
                className="p-2.5"
              />
              <PageMetricCard
                icon={<BookOpen className="h-4 w-4" />}
                label={t("sign_quiz.practice.group_label")}
                value={info.title[currentLanguage]}
                hint={sign.signCode}
                tone="primary"
                className="p-2.5"
              />
            </div>

            <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_240px]">
              <Button
                className="h-11 rounded-xl font-semibold shadow-sm shadow-primary/20"
                onClick={handleRestart}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {t("sign_quiz.practice.try_again")}
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-xl border-primary/15 bg-background/80 font-semibold text-foreground hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
                onClick={() => {
                  setShowReview((value) => !value);
                  setTimeout(() => {
                    reviewRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }, 80);
                }}
              >
                <ChartNoAxesColumn className="mr-2 h-4 w-4" />
                {showReview
                  ? t("common.close")
                  : t("sign_quiz.exam.review_answers")}
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-xl border-border/60 bg-background/80 font-semibold"
                asChild
              >
                <Link href={`/traffic-signs/${routeCode}`}>
                  {isRTL ? (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  ) : (
                    <ArrowLeft className="mr-2 h-4 w-4" />
                  )}
                  {t("sign_quiz.practice.back_to_sign")}
                </Link>
              </Button>
            </div>
          </PageSectionSurface>

          {showReview && (
            <div ref={reviewRef}>
              <PageSectionSurface
                title={t("sign_quiz.exam.review_answers")}
                description={t("sign_quiz.practice.result_description")}
                contentClassName="space-y-3"
              >
                <div className="space-y-3">
                  {answerHistory.map((entry, index) => {
                    const correctChoice = entry.question.choices.find(
                      (choice) => choice.id === entry.response.correctChoiceId,
                    );

                    return (
                      <Card
                        key={entry.question.id}
                        className={cn(
                          "rounded-[1.3rem] border border-border/60 bg-card/90 shadow-sm",
                          entry.response.isCorrect
                            ? "shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]"
                            : "shadow-[inset_0_0_0_1px_rgba(239,68,68,0.18)]",
                        )}
                      >
                        <CardContent className="px-4 py-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start">
                            <div className="rounded-xl border border-border/60 bg-background/80 p-2 shadow-sm md:w-fit">
                              <div className="relative h-12 w-12">
                                <SignImage
                                  src={resolveTrafficSignImage(sign)}
                                  alt={signName}
                                  className="object-contain"
                                />
                              </div>
                            </div>

                            <div className="min-w-0 flex-1 space-y-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                  {t("sign_quiz.practice.question_of")
                                    .replace("{n}", String(index + 1))
                                    .replace("{m}", String(session.totalQuestions))}
                                </span>
                                <Badge
                                  className={`border ${DIFFICULTY_STYLES[entry.question.difficulty] || "border-border bg-muted text-foreground"}`}
                                >
                                  {t(`sign_quiz.${entry.question.difficulty.toLowerCase()}`)}
                                </Badge>
                                {entry.response.isCorrect ? (
                                  <Badge className="border border-green-200 bg-green-100 text-green-800">
                                    {t("sign_quiz.exam.correct_label")}
                                  </Badge>
                                ) : (
                                  <Badge className="border border-red-200 bg-red-100 text-red-800">
                                    {t("sign_quiz.exam.wrong_label")}
                                  </Badge>
                                )}
                              </div>

                              <p className="text-sm font-semibold leading-6 text-foreground md:text-[15px]">
                                {getQuestionText(entry.question, currentLanguage)}
                              </p>

                              <div className="grid gap-2 md:grid-cols-2">
                                <div className="rounded-[0.95rem] border border-border/60 bg-background/80 px-3 py-2.5">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                    {t("sign_quiz.practice.your_answer")}
                                  </p>
                                  <p
                                    className={cn(
                                      "mt-1 text-sm font-semibold leading-6",
                                      entry.response.isCorrect ? "text-green-700" : "text-red-700",
                                    )}
                                  >
                                    {getChoiceText(
                                      entry.question.choices.find(
                                        (choice) => choice.id === entry.selectedChoiceId,
                                      ) ?? entry.question.choices[0],
                                      currentLanguage,
                                    )}
                                  </p>
                                </div>
                                {correctChoice && (
                                  <div className="rounded-[0.95rem] border border-green-200 bg-green-50 px-3 py-2.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-green-700/80">
                                      {t("sign_quiz.practice.correct_answer")}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold leading-6 text-green-700">
                                      {getChoiceText(correctChoice, currentLanguage)}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {getExplanation(entry.response, currentLanguage) && (
                                <div className="rounded-[0.95rem] border border-border/60 bg-muted/30 px-3 py-2.5">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                    {t("sign_quiz.practice.explanation")}
                                  </p>
                                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    {getExplanation(entry.response, currentLanguage)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
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

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-gradient-to-b from-background via-background to-muted/35"
    >
      <div className="container mx-auto max-w-7xl px-4 py-3 md:py-4 space-y-3">
        <Breadcrumb items={breadcrumbItems} />

        <PageHeroSurface contentClassName="p-5 md:p-6">
          <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-center">
            <div className="space-y-3">
              <div className="rounded-[1.4rem] border border-border/60 bg-background/85 p-3 shadow-sm">
                <div className="relative mx-auto aspect-square w-full max-w-[128px]">
                  <SignImage
                    src={resolveTrafficSignImage(sign)}
                    alt={signName}
                    className="object-contain"
                  />
                </div>
              </div>

              <Button variant="outline" className="h-11 w-full rounded-xl" asChild>
                <Link href={`/traffic-signs/${routeCode}`}>
                  {isRTL ? (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  ) : (
                    <ArrowLeft className="mr-2 h-4 w-4" />
                  )}
                  {t("sign_quiz.practice.back_to_sign")}
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${style.chip}`}
                  >
                    {info.title[currentLanguage]}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-[11px] font-semibold text-primary">
                    {t("sign_quiz.practice_mode")}
                  </span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-[1.85rem] font-black tracking-tight text-foreground md:text-[2.35rem]">
                    {signName}
                  </h1>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t("sign_quiz.practice.question_of")
                      .replace("{n}", String(displayQuestionNumber))
                      .replace("{m}", String(session.totalQuestions))}
                  </p>
                </div>
              </div>

              <div className="grid gap-2.5 md:grid-cols-3">
                <PageMetricCard
                  icon={<Shapes className="h-5 w-5" />}
                  label={t("sign_quiz.practice.group_label")}
                  value={info.title[currentLanguage]}
                  hint={sign.signCode}
                  className="p-3"
                />
                <PageMetricCard
                  icon={<BookOpen className="h-5 w-5" />}
                  label={t("sign_practice.metric_questions")}
                  value={`${displayQuestionNumber}/${session.totalQuestions}`}
                  hint={`${answeredCount}/${session.totalQuestions}`}
                  className="p-3"
                />
                <PageMetricCard
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  label={t("sign_quiz.practice.progress_label")}
                  value={`${Math.round(progressPercentage)}%`}
                  hint={t("sign_quiz.practice.question_of")
                    .replace("{n}", String(displayQuestionNumber))
                    .replace("{m}", String(session.totalQuestions))}
                  tone={progressPercentage >= 80 ? "success" : "primary"}
                  className="p-3"
                />
              </div>
            </div>
          </div>
        </PageHeroSurface>

        {currentQuestion && (
          <PageSectionSurface
            title={getQuestionText(currentQuestion, currentLanguage)}
            description={t("sign_quiz.practice.question_of")
              .replace("{n}", String(displayQuestionNumber))
              .replace("{m}", String(session.totalQuestions))}
            actions={
              <Badge
                className={`border ${DIFFICULTY_STYLES[currentQuestion.difficulty] || "border-border bg-muted text-foreground"}`}
              >
                {t(`sign_quiz.${currentQuestion.difficulty.toLowerCase()}`)}
              </Badge>
            }
            className="xl:min-h-[calc(100vh-17.5rem)]"
            contentClassName="flex flex-col gap-2.5"
          >
                <div className="space-y-2">
                {currentQuestion.choices.map((choice) => {
                  const isSelected = selectedChoice === choice.id;
                  const isCorrect =
                    answerState?.response.correctChoiceId === choice.id;
                  const isWrong =
                    !!answerState &&
                    isSelected &&
                    !answerState.response.isCorrect;

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={!!answerState}
                      onClick={() => {
                        setSelectedChoice(choice.id);
                        setSubmissionError(null);
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-[1rem] border-2 px-3.5 py-2.5 text-start transition-all duration-150",
                        !answerState &&
                          !isSelected &&
                          "border-border/60 bg-background hover:border-primary/35 hover:bg-primary/5",
                        !answerState &&
                          isSelected &&
                          "border-primary bg-primary/10 shadow-sm",
                        answerState &&
                          isCorrect &&
                          "border-green-300 bg-green-50",
                        answerState &&
                          isWrong &&
                          "border-red-300 bg-red-50",
                        answerState &&
                          !isCorrect &&
                          !isWrong &&
                          "border-border/60 bg-background/70 opacity-70",
                      )}
                    >
                      {!answerState ? (
                        <span
                          className={cn(
                            "mt-1 h-4 w-4 flex-shrink-0 rounded-full border-2",
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40",
                          )}
                        />
                      ) : isCorrect ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                      ) : isWrong ? (
                        <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                      ) : (
                        <span className="mt-1 h-4 w-4 flex-shrink-0 rounded-full border-2 border-border/50" />
                      )}

                      <span
                        className={cn(
                          "flex-1 text-sm font-semibold leading-6 text-foreground md:text-[15px]",
                          answerState && isCorrect && "text-green-800",
                          answerState && isWrong && "text-red-800",
                        )}
                      >
                        {getChoiceText(choice, currentLanguage)}
                      </span>
                    </button>
                  );
                })}
                </div>

                {submissionError && !answerState && (
                  <div className="rounded-[1rem] border border-red-200 bg-red-50 px-3.5 py-3">
                    <p className="text-sm font-medium text-red-700">
                      {submissionError}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("practice.submission_error_hint")}
                    </p>
                  </div>
                )}

                {answerState && (
                  <div
                    className={cn(
                      "rounded-[1rem] border px-3.5 py-3",
                      answerState.response.isCorrect
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50",
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        answerState.response.isCorrect
                          ? "text-green-700"
                          : "text-red-700",
                      )}
                    >
                      {answerState.response.isCorrect
                        ? t("practice.answer_correct")
                        : t("practice.answer_incorrect")}
                    </p>

                    {getExplanation(answerState.response, currentLanguage) && (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {getExplanation(answerState.response, currentLanguage)}
                      </p>
                    )}
                  </div>
                )}

                <div
                  ref={actionRef}
                  className="sticky bottom-1 z-10 mt-auto -mx-2 bg-gradient-to-t from-card via-card to-transparent px-2 pt-2.5"
                >
                  {!answerState ? (
                    <Button
                      className="h-11 w-full rounded-xl text-sm font-semibold shadow-sm"
                      disabled={selectedChoice === null || submitting}
                      onClick={handleSubmit}
                    >
                      {submitting
                        ? t("practice.submitting")
                        : t("sign_quiz.practice.select_answer")}
                    </Button>
                  ) : (
                    <Button
                      className="h-11 w-full rounded-xl text-sm font-semibold shadow-sm"
                      onClick={handleNext}
                    >
                      {currentIndex + 1 < questions.length
                        ? t("sign_quiz.practice.next_question")
                        : t("sign_quiz.practice.session_complete")}
                      {isRTL ? (
                        <ArrowLeft className="ml-2 h-4 w-4" />
                      ) : (
                        <ArrowRight className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
          </PageSectionSurface>
        )}
      </div>
    </div>
  );
}
