"use client";

import { useLocalizedRouter } from "@/hooks/use-localized-router";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/localized-link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChartNoAxesColumn,
  CheckCircle2,
  Flag,
  RotateCcw,
  Shapes,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import Breadcrumb from "@/components/ui/breadcrumb";
import { SignImage } from "@/components/traffic-signs/sign-image";
import { getExamOptionLabel } from "@/components/exam/exam-option-card";
import { ExamQuestionImageFrame } from "@/components/exam/exam-question-image-frame";
import { FocusedExamShell } from "@/components/exam/focused-exam-shell";
import { FocusedQuestionCard } from "@/components/exam/focused-question-card";
import { ExitConfirmDialog } from "@/components/exam/exit-confirm-dialog";
import { ResultAnswerBlock } from "@/components/results/result-review";
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
import { API_ENDPOINTS } from "@/lib/constants";
import { resolveTrafficSignImage } from "@/lib/sign-image-resolver";
import {
  getTrafficSignGroupInfo,
  getTrafficSignName,
} from "@/lib/traffic-sign-presentation";
import type { TrafficSign } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  getPracticeResults,
  abandonPracticeSession,
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
  const key =
    `question${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof SignQuizQuestion;
  return (question[key] as string) || question.questionEn || "";
}

function getChoiceText(choice: SignChoice, language: Lang) {
  const key =
    `text${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof SignChoice;
  return (choice[key] as string) || choice.textEn || "";
}

function getExplanation(
  response: SignPracticeAnswerResponse,
  language: Lang,
): string {
  const key =
    `explanation${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof SignPracticeAnswerResponse;
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
  const router = useLocalizedRouter();
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
  const [showExitDialog, setShowExitDialog] = useState(false);

  const reviewRef = useRef<HTMLDivElement | null>(null);
  const actionRef = useRef<HTMLDivElement | null>(null);
  const requestedCode = routeParam.trim();

  const routeCode = sign?.routeCode ?? routeParam;

  const showAnswerReview = () => {
    setShowReview(true);
    window.setTimeout(() => {
      const review = reviewRef.current;
      if (!review) return;
      review.scrollIntoView({ behavior: "smooth", block: "start" });
      review.focus({ preventScroll: true });
    }, 80);
  };

  const initializeSession = useCallback(async (identifier: string) => {
    const [signResponse, practiceSession] = await Promise.all([
      apiClient.get<TrafficSign>(
        API_ENDPOINTS.TRAFFIC_SIGNS.DETAIL(identifier),
      ),
      startPracticeSession(identifier),
    ]);

    let answeredResults: PracticeAnswerDetail[] = [];
    try {
      const practiceResults = await getPracticeResults(
        practiceSession.sessionId,
      );
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
  }, []);

  useEffect(() => {
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
  }, [initializeSession, requestedCode, t]);

  useEffect(() => {
    if (!sign) {
      return;
    }

    const canonicalCode = sign.routeCode;
    if (!canonicalCode || routeParam === canonicalCode) {
      return;
    }

    router.replace(`/traffic-signs/${canonicalCode}/practice`);
  }, [routeParam, router, sign]);

  const questions = session?.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const answeredCount =
    initialAnsweredCount + currentIndex + (answerState ? 1 : 0);
  const progressPercentage = session?.totalQuestions
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

  const handleAbandon = useCallback(async () => {
    if (!session || done) return;
    try {
      setSubmitting(true);
      await abandonPracticeSession(session.sessionId);
      router.push(`/traffic-signs/${routeCode}`);
    } catch (apiError) {
      logApiError("Failed to abandon sign practice", apiError);
      setSubmissionError(t("practice.submission_error"));
      setSubmitting(false);
    }
  }, [done, routeCode, router, session, t]);

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

  const signName = getTrafficSignName(sign, currentLanguage);
  const { info, style } = getTrafficSignGroupInfo(sign);
  const breadcrumbItems = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.traffic_signs"), href: "/traffic-signs" },
    { label: signName, href: `/traffic-signs/${routeCode}` },
    { label: t("nav.practice"), href: `/traffic-signs/${routeCode}/practice` },
  ];

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
                      preload
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
                    mobileStacked
                  />
                  <PageMetricCard
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    label={t("sign_quiz.exam.correct_answers_label")}
                    value={`${correctAnswers}/${session.totalQuestions}`}
                    hint={t("sign_quiz.practice.group_label")}
                    tone="primary"
                    className="p-2.5"
                    mobileStacked
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
                mobileStacked
              />
              <PageMetricCard
                icon={<CheckCircle2 className="h-4 w-4" />}
                label={t("sign_quiz.exam.correct_answers_label")}
                value={`${correctAnswers}/${session.totalQuestions}`}
                hint={t("sign_practice.metric_questions")}
                tone="success"
                className="p-2.5"
                mobileStacked
              />
              <PageMetricCard
                icon={<XCircle className="h-4 w-4" />}
                label={t("sign_quiz.exam.wrong_label")}
                value={wrongAnswers}
                hint={`${wrongAnswers}/${session.totalQuestions}`}
                tone={wrongAnswers === 0 ? "success" : "danger"}
                className="p-2.5"
                mobileStacked
              />
              <PageMetricCard
                icon={<BookOpen className="h-4 w-4" />}
                label={t("sign_quiz.practice.group_label")}
                value={info.title[currentLanguage]}
                hint={sign.signCode}
                tone="primary"
                className="p-2.5"
                mobileStacked
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
                data-testid="show-answer-review"
                variant="outline"
                className="h-11 rounded-xl border-primary/15 bg-background/80 font-semibold text-foreground hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
                onClick={showAnswerReview}
              >
                <ChartNoAxesColumn className="mr-2 h-4 w-4" />
                {t("sign_quiz.exam.review_answers")}
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
            <div id="answer-review" ref={reviewRef} tabIndex={-1}>
              <PageSectionSurface
                title={t("sign_quiz.exam.review_answers")}
                description={t("sign_quiz.practice.result_description")}
                contentClassName="space-y-3"
              >
                <div className="space-y-3">
                  {answerHistory.map((entry, index) => {
                    const selectedChoice = entry.question.choices.find(
                      (choice) => choice.id === entry.selectedChoiceId,
                    );
                    const correctChoice = entry.question.choices.find(
                      (choice) => choice.id === entry.response.correctChoiceId,
                    );
                    const selectedChoiceIndex =
                      entry.question.choices.findIndex(
                        (choice) => choice.id === entry.selectedChoiceId,
                      );
                    const correctChoiceIndex = entry.question.choices.findIndex(
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
                          <div className="space-y-4">
                            <ExamQuestionImageFrame variant="review">
                              <SignImage
                                src={resolveTrafficSignImage(sign)}
                                alt={signName}
                                className="object-contain"
                              />
                            </ExamQuestionImageFrame>

                            <div className="min-w-0 space-y-3">
                              <div className="flex flex-wrap items-center justify-center gap-2">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                  {t("sign_quiz.practice.question_of")
                                    .replace("{n}", String(index + 1))
                                    .replace(
                                      "{m}",
                                      String(session.totalQuestions),
                                    )}
                                </span>
                                <Badge
                                  className={`border ${DIFFICULTY_STYLES[entry.question.difficulty] || "border-border bg-muted text-foreground"}`}
                                >
                                  {t(
                                    `sign_quiz.${entry.question.difficulty.toLowerCase()}`,
                                  )}
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

                              <p className="mx-auto max-w-3xl break-words text-center text-[15px] font-semibold leading-7 text-foreground">
                                {getQuestionText(
                                  entry.question,
                                  currentLanguage,
                                )}
                              </p>

                              <div className="grid min-w-0 grid-cols-1 gap-2.5 md:grid-cols-2">
                                <ResultAnswerBlock
                                  label={t("sign_quiz.practice.your_answer")}
                                  marker={
                                    selectedChoiceIndex >= 0
                                      ? getExamOptionLabel(selectedChoiceIndex)
                                      : undefined
                                  }
                                  tone={
                                    entry.response.isCorrect
                                      ? "correct"
                                      : "incorrect"
                                  }
                                >
                                  {selectedChoice
                                    ? getChoiceText(
                                        selectedChoice,
                                        currentLanguage,
                                      )
                                    : "—"}
                                </ResultAnswerBlock>
                                {!entry.response.isCorrect && correctChoice && (
                                  <ResultAnswerBlock
                                    label={t(
                                      "sign_quiz.practice.correct_answer",
                                    )}
                                    marker={
                                      correctChoiceIndex >= 0
                                        ? getExamOptionLabel(correctChoiceIndex)
                                        : undefined
                                    }
                                    tone="correct"
                                  >
                                    {getChoiceText(
                                      correctChoice,
                                      currentLanguage,
                                    )}
                                  </ResultAnswerBlock>
                                )}
                              </div>

                              {getExplanation(
                                entry.response,
                                currentLanguage,
                              ) && (
                                <ResultAnswerBlock
                                  label={t("sign_quiz.practice.explanation")}
                                  tone="neutral"
                                >
                                  {getExplanation(
                                    entry.response,
                                    currentLanguage,
                                  )}
                                </ResultAnswerBlock>
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

  const difficultyLabel = currentQuestion
    ? t(`sign_quiz.${currentQuestion.difficulty.toLowerCase()}`)
    : undefined;

  return (
    <FocusedExamShell
      dir={isRTL ? "rtl" : "ltr"}
      counter={`${displayQuestionNumber} / ${session.totalQuestions}`}
      difficultyLabel={difficultyLabel}
      difficultyClassName={
        currentQuestion
          ? DIFFICULTY_STYLES[currentQuestion.difficulty]
          : undefined
      }
      progressPercent={progressPercentage}
      afterCard={
        <div
          ref={actionRef}
          data-testid="exam-actions"
          className="grid grid-cols-1 gap-2 pb-3 pt-1 sm:grid-cols-3"
        >
          {!answerState ? (
            <Button
              data-testid="submit-practice-answer"
              size="lg"
              className="order-1 w-full shadow-md shadow-primary/20 sm:order-3"
              disabled={selectedChoice === null || submitting}
              onClick={handleSubmit}
            >
              {submitting
                ? t("practice.submitting")
                : t("sign_quiz.practice.select_answer")}
            </Button>
          ) : (
            <Button
              size="lg"
              className="order-1 w-full shadow-md shadow-primary/20 sm:order-3"
              onClick={handleNext}
            >
              {currentIndex + 1 < questions.length
                ? t("sign_quiz.practice.next_question")
                : t("sign_quiz.practice.session_complete")}
              {isRTL ? (
                <ArrowLeft className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button variant="outline" size="lg" className="order-2 w-full" asChild>
            <Link href="/contact">
              <Flag className="h-4 w-4" />
              {t("practice_exam.report_question")}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="order-3 w-full border-destructive/25 text-destructive hover:bg-destructive/5 hover:text-destructive sm:order-1"
            onClick={() => setShowExitDialog(true)}
          >
            {isRTL ? (
              <ArrowRight className="h-4 w-4" />
            ) : (
              <ArrowLeft className="h-4 w-4" />
            )}
            {t("sign_quiz.practice.back_to_sign")}
          </Button>
        </div>
      }
    >
      {currentQuestion ? (
        <FocusedQuestionCard
          headerBadges={
            <>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${style.chip}`}
              >
                {info.title[currentLanguage]}
              </span>
              <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary">
                {t("sign_quiz.practice_mode")}
              </span>
            </>
          }
          difficultyBadge={
            difficultyLabel ? (
              <span
                className={`inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-bold ${DIFFICULTY_STYLES[currentQuestion.difficulty] || "border-border bg-muted text-foreground"}`}
              >
                {difficultyLabel}
              </span>
            ) : null
          }
          media={
            <ExamQuestionImageFrame>
              <SignImage
                src={resolveTrafficSignImage(sign)}
                alt={signName}
                className="object-contain"
              />
            </ExamQuestionImageFrame>
          }
          title={getQuestionText(currentQuestion, currentLanguage)}
          options={currentQuestion.choices.map((choice) => {
            const isSelected = selectedChoice === choice.id;
            const isCorrect = answerState?.response.correctChoiceId === choice.id;
            const isWrong =
              !!answerState && isSelected && !answerState.response.isCorrect;

            return {
              key: choice.id,
              text: getChoiceText(choice, currentLanguage),
              disabled: !!answerState,
              state: !answerState
                ? isSelected
                  ? "selected"
                  : "idle"
                : isCorrect
                  ? "correct"
                  : isWrong
                    ? "incorrect"
                    : "neutral",
              selected: isSelected,
              onSelect: () => {
                setSelectedChoice(choice.id);
                setSubmissionError(null);
              },
            };
          })}
          feedback={
            <>
              {submissionError && !answerState ? (
                <div className="rounded-[1rem] border border-red-200 bg-red-50 px-3.5 py-3">
                  <p className="text-sm font-medium text-red-700">
                    {submissionError}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("practice.submission_error_hint")}
                  </p>
                </div>
              ) : null}
              {answerState ? (
                <ResultAnswerBlock
                  label={
                    answerState.response.isCorrect
                      ? t("practice.answer_correct")
                      : t("practice.answer_incorrect")
                  }
                  tone={answerState.response.isCorrect ? "correct" : "incorrect"}
                >
                  {getExplanation(answerState.response, currentLanguage) || null}
                </ResultAnswerBlock>
              ) : null}
            </>
          }
        />
      ) : null}
      <ExitConfirmDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onStay={() => undefined}
        onLeave={() => void handleAbandon()}
        context="practice"
      />
    </FocusedExamShell>
  );
}
