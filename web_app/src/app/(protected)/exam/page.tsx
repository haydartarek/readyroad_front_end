"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "@/components/localized-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  PageHeroDescription,
  PageHeroSurface,
  PageHeroTitle,
  PageMetricCard,
  PageSectionSurface,
} from "@/components/ui/page-surface";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { useLanguage } from "@/contexts/language-context";
import { useLocalizedRouter } from "@/hooks/use-localized-router";
import apiClient, { isServiceUnavailable, logApiError } from "@/lib/api";
import { API_ENDPOINTS, EXAM_RULES } from "@/lib/constants";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LoaderCircle,
  Play,
  RotateCcw,
  Timer,
  Trophy,
} from "lucide-react";

interface ExamQuestionResponse {
  questionId: number;
  questionOrder: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  imageUrl?: string | null;
  difficultyLevel: string;
  categoryName?: string | null;
  options: Array<{
    optionId: number;
    optionTextEn: string;
    optionTextAr: string;
    optionTextNl: string;
    optionTextFr: string;
  }>;
}

interface ExamStartResponse {
  examId: number;
  totalQuestions: number;
  timeLimitMinutes: number;
  timeLimitSeconds: number;
  status: "IN_PROGRESS";
  startedAt: string;
  expiresAt: string;
  questions: ExamQuestionResponse[];
}

interface ActiveExamResponse {
  hasActiveExam: boolean;
  activeExam: ExamStartResponse | null;
}

export default function TheoryExamPage() {
  const router = useLocalizedRouter();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const [activeExam, setActiveExam] = useState<ExamStartResponse | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const persistAndOpenExam = useCallback(
    (exam: ExamStartResponse) => {
      localStorage.setItem("current_exam", JSON.stringify(exam));
      router.push(`/exam/${exam.examId}`);
    },
    [router],
  );

  const loadActiveExam = useCallback(async () => {
    setIsChecking(true);
    setLoadError(false);
    setServiceUnavailable(false);

    try {
      const response = await apiClient.get<ActiveExamResponse>(
        API_ENDPOINTS.EXAMS.ACTIVE,
      );
      setActiveExam(
        response.data.hasActiveExam ? response.data.activeExam : null,
      );
    } catch (error) {
      logApiError("Failed to load active theory exam", error);
      if (isServiceUnavailable(error)) {
        setServiceUnavailable(true);
      } else {
        setLoadError(true);
      }
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    void loadActiveExam();
  }, [loadActiveExam]);

  const startOrResumeExam = async () => {
    if (activeExam) {
      persistAndOpenExam(activeExam);
      return;
    }

    setIsStarting(true);
    setLoadError(false);
    setServiceUnavailable(false);

    try {
      const response = await apiClient.post<ExamStartResponse>(
        API_ENDPOINTS.EXAMS.START,
      );
      persistAndOpenExam(response.data);
    } catch (error) {
      logApiError("Failed to start persistent theory exam", error);
      if (isServiceUnavailable(error)) {
        setServiceUnavailable(true);
      } else {
        setLoadError(true);
      }
    } finally {
      setIsStarting(false);
    }
  };

  if (serviceUnavailable) {
    return (
      <div className="flex min-h-[calc(100vh-74px)] items-center justify-center px-4">
        <ServiceUnavailableBanner
          onRetry={() => void loadActiveExam()}
          className="max-w-md"
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-[calc(100vh-74px)] bg-background"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
          <PageHeroSurface>
            <div className="max-w-3xl space-y-6">
              <div className="space-y-3">
                <PageHeroTitle>
                  {t("practice_exam.intro_title")}
                </PageHeroTitle>
                <PageHeroDescription className="max-w-2xl">
                  {t("practice_exam.intro_subtitle")}
                </PageHeroDescription>
              </div>

              <div
                data-testid="exam-summary-grid"
                className="grid gap-3 sm:grid-cols-3"
              >
                <PageMetricCard
                  icon={<ClipboardList className="h-5 w-5" />}
                  value={String(EXAM_RULES.TOTAL_QUESTIONS)}
                  label={t("exam.total_questions")}
                  tone="primary"
                  mobileStacked
                />
                <PageMetricCard
                  icon={<Clock3 className="h-5 w-5" />}
                  value={t("exam.duration_value", {
                    minutes: EXAM_RULES.DURATION_WHOLE_MINUTES,
                    seconds: EXAM_RULES.DURATION_REMAINING_SECONDS,
                  })}
                  label={t("exam.duration")}
                  tone="primary"
                  mobileStacked
                />
                <PageMetricCard
                  icon={<Trophy className="h-5 w-5" />}
                  value={`${EXAM_RULES.PASSING_SCORE}/${EXAM_RULES.TOTAL_QUESTIONS}`}
                  label={t("exam.pass_score")}
                  tone="primary"
                  mobileStacked
                />
              </div>

              {loadError ? (
                <Alert variant="destructive" role="alert">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{t("exam.load_failed")}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  data-testid="exam-start-button"
                  size="lg"
                  className="h-11 min-h-11 w-full flex-none gap-2 py-2.5 sm:w-auto sm:flex-1"
                  disabled={isChecking || isStarting}
                  onClick={() => void startOrResumeExam()}
                >
                  {isChecking || isStarting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : activeExam ? (
                    <RotateCcw className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span data-testid="exam-start-button-label">
                    {isChecking || isStarting
                      ? t("exam.starting")
                      : activeExam
                        ? t("exam.back_to_exam_start")
                        : t("practice_exam.start_btn")}
                  </span>
                </Button>
                <Button
                  data-testid="exam-back-button"
                  variant="outline"
                  size="lg"
                  asChild
                >
                  <Link href="/practice">
                    {t("practice_exam.back_practice")}
                  </Link>
                </Button>
              </div>
            </div>
          </PageHeroSurface>

          <PageSectionSurface
            title={t("exam.rules.title")}
            description={t("exam.rules.subtitle")}
          >
            <aside>
              <div className="space-y-4">
                <ExamRule
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  text={t("exam.rules.content.totalQuestions")}
                />
                <ExamRule
                  icon={<Timer className="h-5 w-5" />}
                  text={t("exam.rules.content.timeLimit")}
                />
                <ExamRule
                  icon={<Trophy className="h-5 w-5" />}
                  text={t("exam.rules.content.passScore")}
                />
                <ExamRule
                  icon={<ClipboardList className="h-5 w-5" />}
                  text={t("exam.rules.content.submission")}
                />
              </div>
            </aside>
          </PageSectionSurface>
        </div>
      </div>
    </div>
  );
}

function ExamRule({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border/70 pb-4 last:border-b-0">
      <div className="mt-0.5 text-primary" aria-hidden>
        {icon}
      </div>
      <p className="text-sm font-medium leading-6 text-foreground">{text}</p>
    </div>
  );
}
