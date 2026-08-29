"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "@/components/localized-link";
import { apiClient, logApiError } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { useLanguage } from "@/contexts/language-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface QuestionExposure {
  questionId: number;
  categoryCode: string;
  difficulty: string;
  presentations: number;
}

interface ExposureHealth {
  rarelyExposedQuestions: QuestionExposure[];
  heavilyExposedQuestions: QuestionExposure[];
}

export function AdminQuestionExposure() {
  const { t } = useLanguage();
  const [health, setHealth] = useState<ExposureHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<ExposureHealth>(
        API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.BANK_HEALTH,
      );

      if (
        !Array.isArray(response.data?.rarelyExposedQuestions) ||
        !Array.isArray(response.data?.heavilyExposedQuestions)
      ) {
        throw new Error("Theory question exposure response is invalid");
      }

      setHealth(response.data);
    } catch (loadError) {
      logApiError("Failed to load theory question exposure", loadError);
      setError(t("admin.quizzes.health.load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !health) {
    return (
      <section
        className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm"
        data-testid="question-exposure-loading"
      >
        <div className="h-24 animate-pulse bg-primary/[0.05]" />
        <div className="grid gap-3 p-4 lg:grid-cols-2 sm:p-5">
          <div className="h-40 animate-pulse rounded-2xl bg-muted/40" />
          <div className="h-40 animate-pulse rounded-2xl bg-muted/40" />
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative min-w-0 overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm"
      data-testid="question-exposure-panel"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/[0.08] to-transparent" />

      <div className="relative space-y-4 p-4 sm:p-5">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </span>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                {t("admin.quizzes.health.presentations")}
              </p>
              <h2 className="mt-1 break-words text-base font-black text-foreground sm:text-lg">
                {t("admin.quizzes.health.rarely_exposed")} · {t("admin.quizzes.health.heavily_exposed")}
              </h2>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground sm:text-sm">
                {t("admin.quizzes.health.description")}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={loading}
              aria-label={t("admin.quizzes.health.refresh")}
              className="h-9 w-9 rounded-xl p-0"
            >
              <RefreshCw
                className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
              />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden gap-2 rounded-xl sm:inline-flex"
              asChild
            >
              <Link href="/admin/quizzes">
                {t("admin.quizzes.health.view_questions")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {error ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-destructive/25 bg-destructive/[0.04] p-3 text-sm text-destructive">
            <span className="flex min-w-0 items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="break-words">{error}</span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void load()}
              className="shrink-0"
            >
              {t("admin.quizzes.health.refresh")}
            </Button>
          </div>
        ) : null}

        {health ? (
          <div className="grid min-w-0 gap-3 lg:grid-cols-2">
            <ExposureCard
              title={t("admin.quizzes.health.rarely_exposed")}
              items={health.rarelyExposedQuestions}
              tone="rare"
              t={t}
            />
            <ExposureCard
              title={t("admin.quizzes.health.heavily_exposed")}
              items={health.heavilyExposedQuestions}
              tone="heavy"
              t={t}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ExposureCard({
  title,
  items,
  tone,
  t,
}: {
  title: string;
  items: QuestionExposure[];
  tone: "rare" | "heavy";
  t: (key: string) => string;
}) {
  const Icon = tone === "rare" ? TrendingDown : TrendingUp;

  return (
    <article
      className={
        tone === "rare"
          ? "min-w-0 rounded-2xl border border-primary/20 bg-primary/[0.035] p-3.5 sm:p-4"
          : "min-w-0 rounded-2xl border border-border/60 bg-background/70 p-3.5 sm:p-4"
      }
      data-testid={`question-exposure-${tone}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={
              tone === "rare"
                ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
                : "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground"
            }
          >
            <Icon className="h-4 w-4" />
          </span>
          <h3 className="min-w-0 break-words text-sm font-black text-foreground sm:text-base">
            {title}
          </h3>
        </div>

        <Badge
          variant="outline"
          className="h-7 min-w-7 justify-center rounded-full bg-background/80 px-2.5 font-black"
        >
          {items.length}
        </Badge>
      </div>

      {items.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-border/60 bg-background/50 px-3 py-5 text-center text-xs text-muted-foreground">
          {t("admin.quizzes.health.no_exposure_data")}
        </div>
      ) : (
        <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.questionId}
              href={`/admin/quizzes/${item.questionId}/edit`}
              className="group flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/90 px-3 py-2.5 shadow-[0_1px_0_rgb(0_0_0/0.02)] transition hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/[0.025] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="text-sm font-black text-foreground">
                    #{item.questionId}
                  </span>
                  <Badge variant="outline" className="rounded-lg px-1.5 py-0 text-[10px]">
                    {item.categoryCode}
                  </Badge>
                  <Badge variant="outline" className="rounded-lg px-1.5 py-0 text-[10px] font-semibold text-muted-foreground">
                    {item.difficulty}
                  </Badge>
                </div>
              </div>

              <div className="shrink-0 text-end">
                <p className="text-base font-black leading-none text-foreground">
                  {item.presentations}
                </p>
                <p className="mt-1 text-[10px] font-semibold text-muted-foreground">
                  {t("admin.quizzes.health.presentations")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
