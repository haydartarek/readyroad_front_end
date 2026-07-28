"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "@/components/localized-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  PageHeroDescription,
  PageHeroTitle,
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
          <section className="border-y border-primary/15 bg-primary/[0.04] px-1 py-8 sm:px-6">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                <ClipboardList className="h-4 w-4" aria-hidden />
                {t("practice_exam.badge")}
              </div>

              <div className="space-y-3">
                <PageHeroTitle>
                  {t("practice_exam.intro_title")}
                </PageHeroTitle>
                <PageHeroDescription className="max-w-2xl">
                  {t("practice_exam.intro_subtitle")}
                </PageHeroDescription>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <ExamFact
                  icon={<ClipboardList className="h-5 w-5" />}
                  value={String(EXAM_RULES.TOTAL_QUESTIONS)}
                  label={t("exam.total_questions")}
                />
                <ExamFact
                  icon={<Clock3 className="h-5 w-5" />}
                  value={`${EXAM_RULES.DURATION_MINUTES} min`}
                  label={t("exam.duration")}
                />
                <ExamFact
                  icon={<Trophy className="h-5 w-5" />}
                  value={`${EXAM_RULES.PASSING_SCORE}/${EXAM_RULES.TOTAL_QUESTIONS}`}
                  label={t("exam.pass_score")}
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
                  size="lg"
                  className="h-12 flex-1 gap-2"
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
                  {isChecking || isStarting
                    ? t("exam.starting")
                    : activeExam
                      ? t("exam.back_to_exam_start")
                      : t("practice_exam.start_btn")}
                </Button>
                <Button variant="outline" size="lg" className="h-12" asChild>
                  <Link href="/practice">
                    {t("practice_exam.back_practice")}
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <aside className="border-l border-border/70 px-0 py-2 lg:px-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-foreground">
                  {t("exam.rules.title")}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t("exam.rules.subtitle")}
                </p>
              </div>

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
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ExamFact({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="border-l-2 border-primary px-4 py-2">
      <div className="flex items-center gap-2 text-primary">{icon}</div>
      <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-muted-foreground">{label}</p>
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
