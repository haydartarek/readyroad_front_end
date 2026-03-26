"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Shapes,
  XCircle,
} from "lucide-react";
import Breadcrumb from "@/components/ui/breadcrumb";
import { SignImage } from "@/components/traffic-signs/sign-image";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
      <div className="container mx-auto px-4 py-8 md:py-10 space-y-6">
        <div className="h-5 w-56 animate-pulse rounded-full bg-muted" />
        <div className="rounded-[2rem] border border-border/60 bg-card p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
            <div className="mx-auto h-52 w-52 animate-pulse rounded-[2rem] bg-muted" />
            <div className="space-y-4">
              <div className="h-8 w-40 animate-pulse rounded-full bg-muted" />
              <div className="h-12 w-2/3 animate-pulse rounded-2xl bg-muted" />
              <div className="h-6 w-1/2 animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
        </div>
        <div className="h-96 animate-pulse rounded-[2rem] bg-card" />
      </div>
    </div>
  );
}

export default function TrafficSignPracticePage() {
  const params = useParams<{ signCode: string }>();
  const routeParam = params.signCode;
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
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setSubmissionError(null);

    initializeSession(routeParam)
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
  }, [initializeSession, routeParam, t]);

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
            initializeSession(routeParam)
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
    const scorePercentage =
      session.totalQuestions > 0
        ? Math.round((correctAnswers / session.totalQuestions) * 100)
        : 0;

    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/35">
        <div className="container mx-auto px-4 py-8 md:py-10 space-y-6">
          <Breadcrumb items={breadcrumbItems} />

          <Card className="overflow-hidden rounded-[2rem] border border-border/60 shadow-sm">
            <div className={`h-1.5 w-full bg-gradient-to-r ${style.accent}`} />
            <CardContent className="px-6 py-8 md:px-8">
              <div className="mx-auto max-w-xl text-center space-y-6">
                <div className="flex justify-center">
                  <div className="rounded-[1.5rem] border border-border/60 bg-background/80 p-5 shadow-sm">
                    <div className="relative h-28 w-28">
                      <SignImage
                        src={resolveTrafficSignImage(sign)}
                        alt={signName}
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Badge className={`border ${style.chip}`}>
                    {t("sign_quiz.practice_mode")}
                  </Badge>
                  <h1 className="text-3xl font-black tracking-tight text-foreground">
                    {t("sign_quiz.practice.session_complete")}
                  </h1>
                  <p className="text-sm leading-6 text-muted-foreground md:text-base">
                    {signName}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-6xl font-black tracking-tight text-primary">
                    {scorePercentage}%
                  </p>
                  <Progress
                    value={scorePercentage}
                    className="mx-auto h-2.5 max-w-md rounded-full [&>div]:bg-primary"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("sign_quiz.practice.session_score")
                      .replace("{n}", String(correctAnswers))
                      .replace("{m}", String(session.totalQuestions))}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button className="rounded-xl" onClick={handleRestart}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    {t("sign_quiz.practice.try_again")}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
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
                    {t("sign_quiz.exam.review_answers")}
                  </Button>
                </div>

                <Button variant="ghost" className="rounded-xl" asChild>
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
            </CardContent>
          </Card>

          {showReview && (
            <div ref={reviewRef} className="space-y-4">
              {answerHistory.map((entry, index) => {
                const correctChoice = entry.question.choices.find(
                  (choice) => choice.id === entry.response.correctChoiceId,
                );

                return (
                  <Card
                    key={entry.question.id}
                    className={cn(
                      "rounded-[1.5rem] border shadow-sm",
                      entry.response.isCorrect
                        ? "border-green-200"
                        : "border-red-200",
                    )}
                  >
                    <CardContent className="px-5 py-5">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl border border-border/60 bg-background/80 p-2 shadow-sm">
                          <div className="relative h-14 w-14">
                            <SignImage
                              src={resolveTrafficSignImage(sign)}
                              alt={signName}
                              className="object-contain"
                            />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
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

                          <p className="text-base font-semibold leading-7 text-foreground">
                            {getQuestionText(entry.question, currentLanguage)}
                          </p>

                          {correctChoice && (
                            <p className="text-sm font-medium text-green-700">
                              {t("sign_quiz.practice.correct_answer")}:{" "}
                              {getChoiceText(correctChoice, currentLanguage)}
                            </p>
                          )}

                          {getExplanation(entry.response, currentLanguage) && (
                            <p className="text-sm leading-6 text-muted-foreground">
                              {getExplanation(entry.response, currentLanguage)}
                            </p>
                          )}
                        </div>
                      </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/35">
      <div className="container mx-auto max-w-6xl px-4 py-4 md:py-6 space-y-3 md:space-y-4">
        <Breadcrumb items={breadcrumbItems} />

        <div className="grid gap-3 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start">
          <Card className="overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/80 shadow-sm xl:sticky xl:top-20">
            <div className={`h-1.5 w-full bg-gradient-to-r ${style.accent}`} />
            <CardContent className="space-y-4 px-4 py-4">
              <div className="rounded-[1.35rem] border border-border/60 bg-background/85 p-3 shadow-sm">
                <div className="relative mx-auto aspect-square w-full max-w-[112px]">
                  <SignImage
                    src={resolveTrafficSignImage(sign)}
                    alt={signName}
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="space-y-3">
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

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("nav.traffic_signs")}
                  </p>
                  <h1 className="text-[1.7rem] font-black tracking-tight text-foreground">
                    {signName}
                  </h1>
                </div>
              </div>

              <div className="space-y-2.5 rounded-[1.25rem] border border-border/60 bg-background/80 p-3.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-foreground">
                    {t("sign_quiz.practice.question_of")
                      .replace("{n}", String(displayQuestionNumber))
                      .replace("{m}", String(session.totalQuestions))}
                  </span>
                  <span className="font-semibold text-primary">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <Progress
                  value={progressPercentage}
                  className="h-2 rounded-full [&>div]:bg-primary"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{answeredCount}/{session.totalQuestions}</span>
                  <span>{sign.signCode}</span>
                </div>
              </div>

              <Button variant="outline" className="w-full rounded-xl" asChild>
                <Link href={`/traffic-signs/${routeCode}`}>
                  {isRTL ? (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  ) : (
                    <ArrowLeft className="mr-2 h-4 w-4" />
                  )}
                  {t("sign_quiz.practice.back_to_sign")}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {currentQuestion && (
            <Card className="flex overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm xl:min-h-[calc(100vh-14rem)] xl:flex-col">
              <CardHeader className="space-y-3 px-5 pb-3 pt-4 md:px-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    className={`border ${DIFFICULTY_STYLES[currentQuestion.difficulty] || "border-border bg-muted text-foreground"}`}
                  >
                    {t(`sign_quiz.${currentQuestion.difficulty.toLowerCase()}`)}
                  </Badge>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {t("sign_quiz.practice.question_of")
                      .replace("{n}", String(displayQuestionNumber))
                      .replace("{m}", String(session.totalQuestions))}
                    </span>
                </div>
                <CardTitle className="text-xl font-black leading-snug text-foreground md:text-[1.55rem]">
                  {getQuestionText(currentQuestion, currentLanguage)}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col space-y-3 px-5 pb-5 md:px-6 md:pb-6">
                <div className="space-y-2.5">
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
                        "flex w-full items-start gap-3 rounded-[1.15rem] border-2 px-4 py-3 text-start transition-all duration-150",
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
                          "flex-1 text-base font-semibold leading-6 text-foreground",
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
                  <div className="rounded-[1.15rem] border border-red-200 bg-red-50 px-4 py-3.5">
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
                      "rounded-[1.15rem] border px-4 py-3.5",
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
                  className="sticky bottom-2 z-10 mt-auto -mx-2 bg-gradient-to-t from-card via-card to-transparent px-2 pt-3"
                >
                  {!answerState ? (
                    <Button
                      className="h-12 w-full rounded-xl text-sm font-semibold shadow-sm"
                      disabled={selectedChoice === null || submitting}
                      onClick={handleSubmit}
                    >
                      {submitting
                        ? t("practice.submitting")
                        : t("sign_quiz.practice.select_answer")}
                    </Button>
                  ) : (
                    <Button
                      className="h-12 w-full rounded-xl text-sm font-semibold shadow-sm"
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
