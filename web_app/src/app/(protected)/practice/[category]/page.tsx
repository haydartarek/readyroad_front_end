"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SignImage } from "@/components/traffic-signs/sign-image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PageHeroDescription,
  PageHeroSurface,
  PageHeroTitle,
  PageMetricCard,
  PageSectionSurface,
} from "@/components/ui/page-surface";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import apiClient, { isServiceUnavailable, logApiError } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { getAllSignProgress, type SignUserProgress } from "@/services";
import type { TrafficSign } from "@/lib/types";
import { getSignExamStatus, getSignExamStatusClasses } from "@/lib/sign-exam-status";
import { resolveTrafficSignImage } from "@/lib/sign-image-resolver";
import { getGroupInfo, getTrafficSignGroup } from "@/lib/traffic-sign-presentation";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

type Lang = "en" | "ar" | "nl" | "fr";

function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export default function PracticeSignsPage() {
  const params = useParams();
  const router = useRouter();
  const categoryCode = ((params.category as string) || "").toUpperCase();
  const { language, t } = useLanguage();
  const { isAuthenticated } = useAuth();

  const [signs, setSigns] = useState<TrafficSign[]>([]);
  const [progress, setProgress] = useState<Record<string, SignUserProgress>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const lang = (["nl", "en", "ar", "fr"] as Lang[]).includes(language as Lang)
    ? (language as Lang)
    : "en";
  const isRtl = language === "ar";
  const groupInfo = useMemo(() => getGroupInfo(categoryCode), [categoryCode]);

  const getSignName = (sign: TrafficSign): string => {
    const map: Record<Lang, string> = {
      en: sign.nameEn,
      ar: sign.nameAr,
      nl: sign.nameNl,
      fr: sign.nameFr,
    };
    return map[lang] || sign.nameEn || sign.signCode;
  };

  const getSignDescription = (sign: TrafficSign): string => {
    const map: Record<Lang, string> = {
      en: sign.descriptionEn,
      ar: sign.descriptionAr,
      nl: sign.descriptionNl,
      fr: sign.descriptionFr,
    };
    return map[lang] || sign.descriptionEn || "";
  };

  const fetchData = async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      setIsLoading(true);
      setError(null);
      setNotFound(false);

      const [signsResp, progressList] = await Promise.all([
        apiClient.get<TrafficSign[]>(API_ENDPOINTS.TRAFFIC_SIGNS.LIST, {
          signal: ctrl.signal,
        }),
        isAuthenticated
          ? getAllSignProgress()
          : Promise.resolve<SignUserProgress[]>([]),
      ]);

      if (ctrl.signal.aborted) return;

      const filteredSigns = signsResp.data.filter(
        (sign) => getTrafficSignGroup(sign) === categoryCode,
      );

      if (filteredSigns.length === 0) {
        setNotFound(true);
        setSigns([]);
        setProgress({});
        return;
      }

      setSigns(
        [...filteredSigns].sort((left, right) =>
          (left.routeCode ?? left.signCode).localeCompare(
            right.routeCode ?? right.signCode,
            undefined,
            {
              numeric: true,
              sensitivity: "base",
            },
          ),
        ),
      );

      const map: Record<string, SignUserProgress> = {};
      progressList.forEach((item) => {
        map[item.routeCode ?? item.signCode] = item;
      });
      setProgress(map);
    } catch (err: unknown) {
      if (ctrl.signal.aborted) return;

      if (isServiceUnavailable(err)) {
        setServiceUnavailable(true);
      } else {
        const status =
          typeof err === "object" && err !== null && "response" in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;

        if (status === 404) {
          setNotFound(true);
        } else {
          logApiError("Failed to load sign category page", err);
          setError(t("common.load_error"));
        }
      }
    } finally {
      if (!ctrl.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryCode, isAuthenticated, language]);

  const localizedCategoryName = groupInfo.info.title[lang] || categoryCode;
  const localizedCategoryDescription = groupInfo.info.description[lang];
  const completedCount = signs.filter((sign) => {
    const routeCode = sign.routeCode ?? sign.signCode;
    return progress[routeCode]?.practiceCompleted;
  }).length;
  const passedSignsCount = signs.filter((sign) => {
    const routeCode = sign.routeCode ?? sign.signCode;
    return progress[routeCode]?.exam1Passed;
  }).length;

  if (isLoading) {
    return <LoadingSpinner message={t("practice.loading")} />;
  }

  if (serviceUnavailable) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center px-4">
        <ServiceUnavailableBanner
          onRetry={() => {
            setServiceUnavailable(false);
            fetchData();
          }}
          className="max-w-md"
        />
      </div>
    );
  }

  if (notFound) {
    return (
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className="min-h-[55vh] bg-gradient-to-b from-background via-background to-muted/35"
      >
        <div className="container mx-auto max-w-4xl px-4 py-6 md:py-8">
          <div className="rounded-[2rem] border border-dashed border-border bg-card px-6 py-14 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Target className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black text-foreground">
              {t("practice.category_not_found_title")}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
              {t("practice.category_not_found_hint", { code: categoryCode })}
            </p>
            <Button
              className="mt-6 rounded-full px-6 font-semibold"
              onClick={() => router.push("/practice")}
            >
              {isRtl ? (
                <ArrowRight className="me-2 h-4 w-4" />
              ) : (
                <ArrowLeft className="me-2 h-4 w-4" />
              )}
              {t("practice.signs.none_back")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-[55vh] bg-gradient-to-b from-background via-background to-muted/35"
    >
      <div className="container mx-auto max-w-7xl px-4 pb-8 md:pb-10">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={fetchData}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t("common.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <PageHeroSurface>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-4 font-semibold"
              onClick={() => router.push("/practice")}
            >
              {isRtl ? (
                <ArrowRight className="me-2 h-4 w-4" />
              ) : (
                <ArrowLeft className="me-2 h-4 w-4" />
              )}
              {t("practice.signs.back")}
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                  groupInfo.style.chip,
                )}
              >
                {groupInfo.info.displayKey ?? categoryCode}
              </span>
              <Badge
                variant="secondary"
                className="rounded-full border-0 bg-primary/10 px-3 py-1 text-primary"
              >
                {t("practice.mode_badge")}
              </Badge>
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
            <div className="space-y-5">
              <div className="space-y-3">
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold",
                    groupInfo.style.chip,
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  {localizedCategoryName}
                </div>

                <PageHeroTitle className="max-w-3xl text-balance">
                  {localizedCategoryName}
                </PageHeroTitle>
                <PageHeroDescription className="max-w-3xl text-pretty">
                  {localizedCategoryDescription || t("practice.signs.choose")}
                </PageHeroDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="rounded-full border-0 bg-background/80 px-3 py-1.5 text-foreground shadow-sm"
                >
                  {t("practice.signs.count", { count: signs.length })}
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-full border-0 bg-primary/10 px-3 py-1.5 text-primary"
                >
                  {t("practice.hub.per_sign_questions")}
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-full border-0 bg-amber-500/10 px-3 py-1.5 text-amber-700"
                >
                  {t("practice.hub.three_levels")}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <PageMetricCard
                icon={<BookOpen className="h-4 w-4" />}
                label={t("practice.signs.total_signs")}
                value={String(signs.length)}
              />
              <PageMetricCard
                icon={<CheckCircle2 className="h-4 w-4" />}
                label={t("practice.signs.completed_practice")}
                value={String(completedCount)}
              />
              <PageMetricCard
                icon={<Trophy className="h-4 w-4" />}
                label={t("practice.signs.passed_signs")}
                value={String(passedSignsCount)}
              />
            </div>
          </div>
        </PageHeroSurface>

        {signs.length === 0 ? (
          <PageSectionSurface className="mt-8 rounded-[2rem] border-dashed text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-foreground">
              {t("practice.signs.none")}
            </h2>
            <Button
              variant="outline"
              className="mt-6 rounded-full px-6 font-semibold"
              onClick={() => router.push("/practice")}
            >
              {isRtl ? (
                <ArrowRight className="me-2 h-4 w-4" />
              ) : (
                <ArrowLeft className="me-2 h-4 w-4" />
              )}
              {t("practice.signs.none_back")}
            </Button>
          </PageSectionSurface>
        ) : (
          <PageSectionSurface
            className="mt-8"
            title={t("practice.signs.collection_title")}
            description={t("practice.signs.collection_desc")}
            actions={
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-2 text-sm font-semibold text-primary">
                <ClipboardList className="h-4 w-4" />
                {t("practice.signs.count", { count: signs.length })}
              </div>
            }
          >
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {signs.map((sign) => {
                const routeCode = sign.routeCode ?? sign.signCode;
                const signProgress = progress[routeCode];
                const practiceCompleted =
                  signProgress?.practiceCompleted ?? false;
                const practiceStarted = signProgress?.practiceStarted ?? false;
                const examStatus = getSignExamStatus(signProgress);

                return (
                  <article
                    key={routeCode}
                    className={cn(
                      "group overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
                      groupInfo.style.cardBorder,
                      groupInfo.style.cardGlow,
                    )}
                  >
                    <div
                      className={cn(
                        "h-1.5 w-full bg-gradient-to-r",
                        groupInfo.style.accent,
                      )}
                    />

                    <div className="space-y-4 p-4 md:p-5">
                      <div
                        className={cn(
                          "rounded-[1.5rem] border border-border/50 p-4 shadow-sm ring-1",
                          groupInfo.style.soft,
                          groupInfo.style.ring,
                        )}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <Badge
                            variant="outline"
                            className="rounded-full border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-mono shadow-sm"
                          >
                            {sign.signCode}
                          </Badge>

                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <StatusChip
                              tone={examStatus.tone}
                              icon={<Trophy className="h-3 w-3" />}
                              label={t(examStatus.labelKey)}
                            />

                            {practiceCompleted ? (
                              <StatusChip
                                tone="success"
                                icon={<CheckCircle2 className="h-3 w-3" />}
                                label={t("practice.hub.completed")}
                              />
                            ) : practiceStarted ? (
                              <StatusChip
                                tone="neutral"
                                icon={<Sparkles className="h-3 w-3" />}
                                label={t("practice.signs.in_progress")}
                              />
                            ) : null}
                          </div>
                        </div>

                        <div className="mx-auto flex h-40 max-w-[220px] items-center justify-center">
                          <div className="relative h-32 w-32 md:h-36 md:w-36">
                            <SignImage
                              src={resolveTrafficSignImage(sign)}
                              alt={getSignName(sign)}
                              className="object-contain drop-shadow-[0_14px_20px_rgba(15,23,42,0.08)]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="min-h-[3.2rem] text-base font-black leading-6 text-foreground">
                          {getSignName(sign)}
                        </h3>
                        <p className="line-clamp-2 min-h-[3rem] text-sm leading-6 text-muted-foreground">
                          {getSignDescription(sign) ||
                            localizedCategoryDescription}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="secondary"
                          className="rounded-full border-0 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                        >
                          {t("practice.signs.card_meta")}
                        </Badge>
                        {signProgress?.practiceBestScorePct !== undefined ? (
                          <Badge
                            variant="secondary"
                            className="rounded-full border-0 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700"
                          >
                            {t("practice.signs.best_score", {
                              score: Math.round(
                                signProgress.practiceBestScorePct,
                              ),
                            })}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <Button
                          asChild
                          className="h-10 w-full rounded-2xl font-semibold shadow-sm shadow-primary/15 transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <Link href={`/traffic-signs/${routeCode}/practice`}>
                            <BookOpen className="me-2 h-4 w-4" />
                            {t("practice.signs.practice_btn")}
                          </Link>
                        </Button>

                        <Button
                          asChild
                          variant={
                            examStatus.tone === "success" ? "outline" : "secondary"
                          }
                          className="h-10 w-full rounded-2xl font-semibold"
                        >
                          <Link href={`/traffic-signs/${routeCode}/exam/1`}>
                            {examStatus.tone === "success" ? (
                              <CheckCircle2 className="me-2 h-4 w-4 text-emerald-500" />
                            ) : (
                              <Trophy className="me-2 h-4 w-4" />
                            )}
                            {t("practice.signs.exam")}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </PageSectionSurface>
        )}
      </div>
    </div>
  );
}

function StatusChip({
  label,
  icon,
  tone,
}: {
  label: string;
  icon: ReactNode;
  tone: "success" | "neutral" | "danger" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm",
        tone === "neutral"
          ? "bg-slate-100 text-slate-600"
          : getSignExamStatusClasses(tone),
      )}
    >
      {icon}
      {label}
    </span>
  );
}
