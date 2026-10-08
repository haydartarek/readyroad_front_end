"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "@/components/localized-link";
import { SeoIntentLinks } from "@/components/seo/seo-intent-links";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  PageHeroDescription,
  PageHeroTitle,
  PageMetricCard,
  PageSectionSurface,
} from "@/components/ui/page-surface";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useLocalizedRouter } from "@/hooks/use-localized-router";
import apiClient, { isServiceUnavailable, logApiError } from "@/lib/api";
import { API_ENDPOINTS, EXAM_RULES } from "@/lib/constants";
import { buildLearningLoginHref } from "@/lib/auth-return-url";
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
  accessMode?: "PREVIEW" | "FULL";
  accessState?:
    | "PREVIEW_ACTIVE"
    | "FREE_LIMIT_REACHED"
    | "FULL_ACTIVE";
  freeQuestionLimit?: number;
  resumeQuestionOrder?: number;
  finalizedQuestionIds?: number[];
}

interface ActiveExamResponse {
  hasActiveExam: boolean;
  activeExam: ExamStartResponse | null;
}

export default function TheoryExamEntry() {
  const router = useLocalizedRouter();
  const { t, language } = useLanguage();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const isRTL = language === "ar";

  const [activeExam, setActiveExam] = useState<ExamStartResponse | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const openExam = useCallback(
    (exam: ExamStartResponse) => {
      // The backend /active endpoint is the source of truth.
      // Remove any stale cache left by older frontend versions.
      try {
        localStorage.removeItem("current_exam");
      } catch {
        // Storage availability must never block exam navigation.
      }

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
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      setActiveExam(null);
      setIsChecking(false);
      return;
    }
    void loadActiveExam();
  }, [isAuthenticated, isAuthLoading, loadActiveExam]);

  const startOrResumeExam = async () => {
    if (!isAuthenticated) {
      router.push(buildLearningLoginHref("/exam", language));
      return;
    }

    if (
      activeExam &&
      activeExam.accessState !== "FREE_LIMIT_REACHED"
    ) {
      openExam(activeExam);
      return;
    }

    setIsStarting(true);
    setLoadError(false);
    setServiceUnavailable(false);

    try {
      const response = await apiClient.post<ExamStartResponse>(
        API_ENDPOINTS.EXAMS.START,
      );
      openExam(response.data);
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
      className="min-h-[calc(100vh-74px)] bg-gradient-to-b from-primary/5 via-background to-background"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="space-y-6">
          <section
            data-testid="exam-intro-surface"
            className="rounded-2xl border border-primary/10 bg-card/95 px-4 py-6 shadow-sm ring-1 ring-primary/[0.03] sm:px-6 sm:py-7"
          >
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="space-y-3 text-center">
                <PageHeroTitle className="text-secondary sm:text-4xl">
                  {t("practice_exam.intro_title")}
                </PageHeroTitle>

                <PageHeroDescription className="mx-auto max-w-3xl text-pretty text-center">
                  {t("practice_exam.intro_subtitle")}
                </PageHeroDescription>
              </div>

              <div
                data-testid="exam-summary-grid"
                className="grid gap-3 sm:grid-cols-3"
              >
                <PageMetricCard
                  icon={<ClipboardList className="h-4 w-4" />}
                  label={t("exam.total_questions")}
                  value={String(EXAM_RULES.TOTAL_QUESTIONS)}
                  tone="primary"
                  mobileStacked
                  className="border-primary/10 bg-background/80"
                />

                <PageMetricCard
                  icon={<Clock3 className="h-4 w-4" />}
                  label={t("exam.duration")}
                  value={t("exam.duration_value", {
                    minutes: EXAM_RULES.DURATION_WHOLE_MINUTES,
                    seconds: EXAM_RULES.DURATION_REMAINING_SECONDS,
                  })}
                  tone="primary"
                  mobileStacked
                  className="border-primary/10 bg-background/80"
                />

                <PageMetricCard
                  icon={<Trophy className="h-4 w-4" />}
                  label={t("exam.pass_score")}
                  value={`${EXAM_RULES.PASSING_SCORE}/${EXAM_RULES.TOTAL_QUESTIONS}`}
                  tone="primary"
                  mobileStacked
                  className="border-primary/10 bg-background/80"
                />
              </div>

              {loadError ? (
                <Alert variant="destructive" role="alert">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{t("exam.load_failed")}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  data-testid="exam-start-button"
                  size="lg"
                  className="h-11 min-h-11 w-full min-w-0 flex-1 gap-2 rounded-full bg-primary px-8 font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md active:translate-y-0"
                  disabled={isAuthLoading || isChecking || isStarting}
                  onClick={() => void startOrResumeExam()}
                >
                  {isAuthLoading || isChecking || isStarting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : activeExam ? (
                    <RotateCcw className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}

                  <span data-testid="exam-start-button-label">
                    {isAuthLoading || isChecking || isStarting
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
                  className="h-11 min-h-11 w-full min-w-0 shrink-0 rounded-full border-primary/15 bg-background/85 px-7 font-semibold text-secondary shadow-sm ring-1 ring-primary/10 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-md active:translate-y-0 sm:w-auto"
                >
                  <Link href="/practice">
                    {t("practice_exam.back_practice")}
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <SeoIntentLinks
            page="theoryExam"
            excludeHrefs={["/practice"]}
          />

          <PageSectionSurface
            className="border-primary/10 bg-card/80 shadow-sm ring-1 ring-primary/[0.03]"
            title={t("exam.rules.title")}
            description={t("exam.rules.subtitle")}
          >
            <aside>
              <div className="grid gap-3 sm:grid-cols-2">
                <ExamRule
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  text={t("exam.rules.content.totalQuestions")}
                />

                <ExamRule
                  icon={<Timer className="h-4 w-4" />}
                  text={t("exam.rules.content.timeLimit")}
                />

                <ExamRule
                  icon={<Trophy className="h-4 w-4" />}
                  text={t("exam.rules.content.passScore")}
                />

                <ExamRule
                  icon={<ClipboardList className="h-4 w-4" />}
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
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-primary/10 bg-background/70 p-3.5 sm:p-4">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15"
        aria-hidden
      >
        {icon}
      </div>

      <p className="min-w-0 flex-1 break-words text-sm font-medium leading-6 text-secondary">
        {text}
      </p>
    </div>
  );
}
