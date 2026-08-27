"use client";

import { useLocalizedRouter } from "@/hooks/use-localized-router";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WeakAreaSummary } from "@/components/analytics/weak-area-summary";
import { WeakAreaDetails } from "@/components/analytics/weak-area-details";
import { getWeakAreas, type WeakAreasData } from "@/services";
import { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import {
  PageHeroDescription,
  PageHeroSurface,
  PageHeroTitle,
} from "@/components/ui/page-surface";
import { toast } from "sonner";
import Link from "@/components/localized-link";
import {
  PenLine,
  BookOpen,
  Target,
  RefreshCw,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function WeakAreasPageContent() {
  const { t, language } = useLanguage();
  const [data, setData] = useState<WeakAreasData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    const fetchWeakAreas = async () => {
      try {
        setIsLoading(true);
        const weakAreasData = await getWeakAreas(language);
        setData(weakAreasData);
        setError(null);
      } catch (err) {
        logApiError("Failed to fetch weak areas", err);
        if (isServiceUnavailable(err)) {
          setServiceUnavailable(true);
        } else {
          setError(t("common.load_error"));
          toast.error(t("common.load_error"));
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchWeakAreas();
  }, [fetchKey, t, language]);

  // ── Loading ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("weak_areas.loading")}
        </p>
      </div>
    );
  }

  // ── Service unavailable ──────────────────────────
  if (serviceUnavailable) {
    return (
      <div className="flex justify-center py-24">
        <ServiceUnavailableBanner
          onRetry={() => {
            setServiceUnavailable(false);
            setFetchKey((k) => k + 1);
          }}
          className="max-w-md"
        />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 max-w-md mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-destructive" />
        </div>
        <Alert variant="destructive" className="text-left">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => {
            setError(null);
            setFetchKey((k) => k + 1);
          }}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  // ── Shared page header ───────────────────────────
  const pageHeader = (
    <PageHeroSurface>
      <div className="space-y-1">
        <PageHeroTitle>{t("weak_areas.title")}</PageHeroTitle>
        <PageHeroDescription className="max-w-xl">
          {t("weak_areas.subtitle")}
        </PageHeroDescription>
      </div>
    </PageHeroSurface>
  );

  // ── Empty state ──────────────────────────────────
  if (!data || !data.weakAreas || data.weakAreas.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 py-4">
        {pageHeader}

        {/* Success card */}
        <Card className="overflow-hidden border-green-200/80 bg-card/90 dark:border-green-900/50">
          <CardContent className="flex flex-col items-center space-y-6 pb-10 pt-12 text-center">
            {/* Icon */}
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-green-100 text-green-700 ring-1 ring-green-200 dark:bg-green-950/40 dark:text-green-300 dark:ring-green-900/60">
                <Trophy className="h-10 w-10" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary shadow-sm">
                <span className="text-white text-xs font-black leading-none">
                  ✓
                </span>
              </div>
            </div>

            {/* Text */}
            <div className="space-y-2 max-w-sm">
              <h2 className="break-words text-xl font-black tracking-normal sm:text-2xl">
                {t("weak_areas.no_weak_areas_title")}
              </h2>
              <p className="text-muted-foreground">
                {t("weak_areas.no_weak_areas_desc")}
              </p>
            </div>

            {/* Actions */}
            <div className="flex w-full flex-col justify-center gap-3 pt-1 sm:w-auto sm:flex-row sm:flex-wrap">
              <Button
                size="lg"
                asChild
                className="w-full gap-2 shadow-sm shadow-primary/20 sm:w-auto"
              >
                <Link href="/exam">
                  <Target className="w-4 h-4" />
                  {t("weak_areas.take_exam")}
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full gap-2 sm:w-auto"
              >
                <Link href="/practice">
                  <PenLine className="w-4 h-4" />
                  {t("weak_areas.practice_mode")}
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full gap-2 sm:w-auto"
              >
                <Link href="/lessons">
                  <BookOpen className="w-4 h-4" />
                  {t("weak_areas.study_lessons")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Data state ───────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl space-y-6 py-4">
      {pageHeader}

      {/* Summary Cards */}
      <WeakAreaSummary
        weakAreas={data.weakAreas}
        totalCategories={data.totalCategories}
        overallAccuracy={data.overallAccuracy}
      />

      {/* Info Alert */}
      <Alert className="border border-primary/20 bg-primary/5">
        <AlertDescription className="space-y-1">
          <p className="font-semibold text-foreground">
            🎯 {t("weak_areas.strategy_title")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("weak_areas.strategy_desc")}
          </p>
        </AlertDescription>
      </Alert>

      {/* Weak Areas Details */}
      <WeakAreaDetails weakAreas={data.weakAreas} />

      {/* Actions Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              🚀
            </div>
            <div>
              <CardTitle className="text-xl font-black">
                {t("weak_areas.start_improving_title")}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("weak_areas.start_improving_desc")}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              asChild
              className="gap-2 shadow-sm shadow-primary/20"
            >
              <Link href="/practice">
                <PenLine className="w-4 h-4" />
                {t("weak_areas.practice_mode")}
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href="/lessons">
                <BookOpen className="w-4 h-4" />
                {t("weak_areas.study_lessons")}
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href="/exam">
                <Target className="w-4 h-4" />
                {t("weak_areas.take_full_exam")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function WeakAreasPage() {
  const router = useLocalizedRouter();

  useEffect(() => {
    router.replace("/dashboard?section=weak-areas");
  }, [router]);

  return null;
}
