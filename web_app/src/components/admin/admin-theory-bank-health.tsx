"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, RefreshCw } from "lucide-react";
import { apiClient, logApiError } from "@/lib/api";
import { API_ENDPOINTS, LANGUAGES } from "@/lib/constants";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type LocaleCode = "ar" | "nl" | "en" | "fr";

interface BankSummary {
  totalQuestions: number;
  activeQuestions: number;
  inactiveQuestions: number;
  publishedQuestions: number;
  eligibleAllLocales: number;
  translationGapQuestions: number;
  explanationGapQuestions: number;
  invalidQuestions: number;
  underrepresentedCategories: number;
  overrepresentedCategories: number;
}

interface LocaleHealth {
  locale: LocaleCode;
  eligibleQuestions: number;
  translationGapQuestions: number;
}

interface CategoryHealth {
  id: number;
  code: string;
  nameEn: string;
  nameNl: string;
  nameFr: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionNl: string | null;
  descriptionFr: string | null;
  descriptionAr: string | null;
  displayOrder: number;
  active: boolean;
  contentScope: "THEORETICAL_EXAM" | "BOTH";
  examTargetWeight: number | null;
  totalQuestions: number;
  activeQuestions: number;
  publishedQuestions: number;
  eligibleAllLocales: number;
  eligibleByLocale: Record<LocaleCode, number>;
  eligibleByDifficulty: Record<"EASY" | "MEDIUM" | "HARD", number>;
  translationGapQuestions: number;
  explanationGapQuestions: number;
  invalidQuestions: number;
  totalPresentations: number;
  inventoryShare: number;
  targetShare: number;
  representationStatus: string;
}

interface QuestionQuality {
  questionId: number;
  categoryCode: string;
  difficulty: string;
  presentations: number;
  answered: number;
  correctRate: number | null;
  incorrectRate: number | null;
  averageAnswerTimeSeconds: number | null;
  performanceByLocale: Record<LocaleCode, {
    answered: number;
    correct: number;
    correctRate: number | null;
    averageAnswerTimeSeconds: number | null;
  }>;
  flags: string[];
}

interface BankHealth {
  generatedAt: string;
  summary: BankSummary;
  locales: LocaleHealth[];
  categories: CategoryHealth[];
  questionsNeedingReview: QuestionQuality[];
}

export function AdminTheoryBankHealth() {
  const { t, language } = useLanguage();
  const [health, setHealth] = useState<BankHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<BankHealth>(
        API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.BANK_HEALTH,
      );
      if (!response.data?.summary || !Array.isArray(response.data.categories)) {
        throw new Error("Theory bank health response is invalid");
      }
      setHealth(response.data);
    } catch (loadError) {
      logApiError("Failed to load theory bank health", loadError);
      setError(t("admin.quizzes.health.load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !health) {
    return <div className="h-36 animate-pulse rounded-2xl border border-border/50 bg-muted/30" />;
  }

  return (
    <section className="min-w-0 space-y-4 rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:p-5" data-testid="theory-bank-health">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-black text-foreground">{t("admin.quizzes.health.title")}</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("admin.quizzes.health.description")}</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading} aria-label={t("admin.quizzes.health.refresh")}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {health ? (
        <>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
            <HealthMetric label={t("admin.quizzes.health.total")} value={health.summary.totalQuestions} />
            <HealthMetric label={t("admin.quizzes.health.active")} value={health.summary.activeQuestions} />
            <HealthMetric label={t("admin.quizzes.health.inactive")} value={health.summary.inactiveQuestions} />
            <HealthMetric label={t("admin.quizzes.health.published")} value={health.summary.publishedQuestions} />
            <HealthMetric label={t("admin.quizzes.health.eligible")} value={health.summary.eligibleAllLocales} />
            <HealthMetric label={t("admin.quizzes.health.translation_gaps")} value={health.summary.translationGapQuestions} tone={health.summary.translationGapQuestions > 0 ? "danger" : "default"} />
            <HealthMetric label={t("admin.quizzes.health.explanation_gaps")} value={health.summary.explanationGapQuestions} tone={health.summary.explanationGapQuestions > 0 ? "danger" : "default"} />
            <HealthMetric label={t("admin.quizzes.health.invalid")} value={health.summary.invalidQuestions} tone={health.summary.invalidQuestions > 0 ? "danger" : "default"} />
            <HealthMetric label={t("admin.quizzes.health.underrepresented")} value={health.summary.underrepresentedCategories} tone={health.summary.underrepresentedCategories > 0 ? "danger" : "default"} />
            <HealthMetric label={t("admin.quizzes.health.overrepresented")} value={health.summary.overrepresentedCategories} tone={health.summary.overrepresentedCategories > 0 ? "danger" : "default"} />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {health.locales.map((locale) => (
              <div key={locale.locale} className="rounded-xl border border-border/40 bg-muted/20 p-3 text-center">
                <p className="text-xs font-bold text-muted-foreground">{languageName(locale.locale)}</p>
                <p className="mt-1 text-lg font-black text-foreground">{locale.eligibleQuestions}</p>
                <p className="text-xs text-muted-foreground">{t("admin.quizzes.health.gaps")}: {locale.translationGapQuestions}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
            <h3 className="text-sm font-black text-foreground">{t("admin.quizzes.health.quality_title")}</h3>
            {health.questionsNeedingReview.length === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">{t("admin.quizzes.health.no_quality_flags")}</p>
            ) : (
              <div className="mt-2 grid min-w-0 gap-2 lg:grid-cols-2">
                {health.questionsNeedingReview.map((question) => (
                  <div key={question.questionId} className="min-w-0 rounded-lg border border-border/40 bg-background/60 p-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>
                        {t("admin.learning.question")} {question.questionId} · {categoryNameByCode(question.categoryCode, health.categories, language, t)} · {t(`difficulty.${question.difficulty.toLowerCase()}`)}
                      </strong>
                      {question.flags.map((flag) => (
                        <Badge key={flag} variant="outline">{t(`admin.quizzes.health.flag_${flag.toLowerCase()}`)}</Badge>
                      ))}
                    </div>
                    <p className="mt-2 break-words text-muted-foreground">
                      {t("admin.quizzes.health.presentations")}: {question.presentations} · {t("admin.quizzes.health.answers")}: {question.answered} · {t("admin.quizzes.health.correct_rate")}: {formatPercent(question.correctRate)} · {t("admin.quizzes.health.incorrect_rate")}: {formatPercent(question.incorrectRate)} · {t("admin.quizzes.health.answer_time")}: {formatSeconds(question.averageAnswerTimeSeconds, t)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(question.performanceByLocale)
                        .filter(([, performance]) => performance.answered > 0)
                        .map(([locale, performance]) => (
                          <Badge key={locale} variant="outline">{languageName(locale as LocaleCode)} · {performance.answered} · {formatPercent(performance.correctRate)}</Badge>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

function categoryName(category: CategoryHealth, language: string): string {
  if (language === "ar") return category.nameAr;
  if (language === "nl") return category.nameNl;
  if (language === "fr") return category.nameFr;
  return category.nameEn;
}

function categoryNameByCode(
  code: string,
  categories: CategoryHealth[],
  language: string,
  t: (key: string) => string,
): string {
  const category = categories.find((item) => item.code === code);
  return category ? categoryName(category, language) : t("common.not_available");
}

function languageName(locale: LocaleCode): string {
  return LANGUAGES.find((language) => language.code === locale)?.nativeName ?? locale;
}

function HealthMetric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "danger" }) {
  return (
    <div className="min-w-0 rounded-xl border border-border/40 bg-background/60 p-3 text-center">
      <p className="break-words text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={tone === "danger" ? "mt-1 text-xl font-black text-destructive" : "mt-1 text-xl font-black text-foreground"}>{value}</p>
    </div>
  );
}

function formatPercent(value: number | null): string {
  return value == null ? "—" : `${Math.round(value)}%`;
}

function formatSeconds(value: number | null, t: (key: string) => string): string {
  return value == null ? "—" : `${Math.round(value)} ${t("admin.quizzes.health.seconds")}`;
}
