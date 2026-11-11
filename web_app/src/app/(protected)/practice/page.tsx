"use client";

import Image from "next/image";

import { useLocalizedRouter } from "@/hooks/use-localized-router";

import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LEARNING_CARD_ACCENT_CLASS,
  LEARNING_CARD_CLASS,
  LEARNING_CARD_TITLE_CLASS,
  LEARNING_PAGE_BACKGROUND_CLASS,
  LEARNING_PAGE_CONTAINER_CLASS,
  LEARNING_SECTION_CLASS,
  PageHeroDescription,
  PageHeroTitle,
  PageSectionSurface,
} from "@/components/ui/page-surface";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, isServiceUnavailable, logApiError } from "@/lib/api";
import { resolveTrafficSignImage } from "@/lib/sign-image-resolver";
import { API_ENDPOINTS } from "@/lib/constants";
import { buildLearningLoginHref } from "@/lib/auth-return-url";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { getAllSignProgress, type SignUserProgress } from "@/services";
import {
  getGroupInfo,
  getTrafficSignGroup,
  TRAFFIC_SIGN_GROUP_ORDER,
} from "@/lib/traffic-sign-presentation";
import type { TrafficSign } from "@/lib/types";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Shuffle,
  Trophy,
} from "lucide-react";

type Lang = "en" | "ar" | "nl" | "fr";

interface CategoryCardData {
  code: string;
  title: string;
  signCount: number;
  practiceCompleted: number;
  passedSigns: number;
  representativeImage: string | null;
}

function getRepresentativeSignImage(signs: TrafficSign[]): string | null {
  for (const sign of signs) {
    const imageUrl = resolveTrafficSignImage(sign);

    if (!imageUrl) {
      continue;
    }

    const signPathIndex = imageUrl.indexOf("/images/signs/");

    return signPathIndex >= 0
      ? imageUrl.slice(signPathIndex)
      : imageUrl;
  }

  return null;
}
function LoadingSpinner({ message }: { message?: string }) {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-60 items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            🚦
          </div>
        </div>
        <p className="text-base text-muted-foreground font-medium">
          {message ?? t("common.loading")}
        </p>
      </div>
    </div>
  );
}

export default function PracticePage() {
  const router = useLocalizedRouter();
  const { language, t } = useLanguage();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const lang = (["en", "ar", "nl", "fr"] as Lang[]).includes(language as Lang)
    ? (language as Lang)
    : "en";

  const [signs, setSigns] = useState<TrafficSign[]>([]);
  const [progressList, setProgressList] = useState<SignUserProgress[]>([]);
  const [isProgressLoading, setIsProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState(false);
  const [progressRetryKey, setProgressRetryKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const requestIdRef = useRef(0);

  const fetchData = async () => {
    const requestId = ++requestIdRef.current;

    try {
      setIsLoading(true);
      setError(null);

      const signsResp = await apiClient.get<TrafficSign[]>(
        API_ENDPOINTS.TRAFFIC_SIGNS.LIST,
        undefined,
        { skipAuthRedirect: true },
      );
      if (requestId !== requestIdRef.current) return;
      setSigns(Array.isArray(signsResp.data) ? signsResp.data : []);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      logApiError("Failed to load sign practice hub", err);
      if (isServiceUnavailable(err)) {
        setServiceUnavailable(true);
      } else {
        setError(t("practice.load_error"));
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      requestIdRef.current += 1;
    };
    // Public catalog data does not change with authentication or UI language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (isAuthLoading) return;
    setProgressList([]);
    setProgressError(false);
    setIsProgressLoading(isAuthenticated);
    if (isAuthenticated) {
      getAllSignProgress()
        .then((progress) => { if (!cancelled) setProgressList(progress); })
        .catch((err) => {
          if (cancelled) return;
          logApiError("Failed to load practice progress", err);
          setProgressError(true);
        })
        .finally(() => { if (!cancelled) setIsProgressLoading(false); });
    }
    return () => { cancelled = true; };
  }, [isAuthLoading, isAuthenticated, progressRetryKey]);

  const categories = useMemo<CategoryCardData[]>(() => {
      const progressMap = new Map(
        progressList.map((item) => [item.routeCode ?? item.signCode, item]),
      );

      const groupedSigns = new Map<string, TrafficSign[]>();
      signs.forEach((sign) => {
        const group = getTrafficSignGroup(sign);
        const current = groupedSigns.get(group) ?? [];
        current.push(sign);
        groupedSigns.set(group, current);
      });

      return TRAFFIC_SIGN_GROUP_ORDER.map(
        (group) => {
          const signs = groupedSigns.get(group) ?? [];
          if (signs.length === 0) {
            return null;
          }

          let practiceCompleted = 0;
          let passedSigns = 0;

          signs.forEach((sign) => {
            const progressKey = sign.routeCode ?? sign.signCode;
            const signProgress = progressMap.get(progressKey);
            if (signProgress?.practiceCompleted) practiceCompleted += 1;
            if (signProgress?.exam1Passed) passedSigns += 1;
          });

          const info = getGroupInfo(group).info;
          return {
            code: group,
            title: info.title[lang],
            signCount: signs.length,
            practiceCompleted,
            passedSigns,
            representativeImage: getRepresentativeSignImage(signs),
          };
        },
      ).filter((card): card is CategoryCardData => card !== null);


  }, [signs, progressList, lang]);
  const totalSigns = signs.length;
  const progressUnavailable = isAuthLoading || isProgressLoading || progressError;

  const isRtl = language === "ar";
  const ChevDir = isRtl ? ChevronLeft : ChevronRight;
  const openProtectedPractice = (path: string) => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.push(buildLearningLoginHref(path, language));
      return;
    }
    router.push(path);
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className={LEARNING_PAGE_BACKGROUND_CLASS}
    >
      <div className={LEARNING_PAGE_CONTAINER_CLASS}>
        <Breadcrumb items={[{ label: t("nav.home"), href: "/" }, { label: t("practice.breadcrumb_title"), isCurrentPage: true }]} />
        <header className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl space-y-2">
          <PageHeroTitle className="text-balance">
            {t("practice.breadcrumb_title")}
          </PageHeroTitle>
          <PageHeroDescription className="text-pretty">
            {t("practice.hub.subtitle")}
          </PageHeroDescription>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {!isLoading ? (
                <Badge
                  variant="secondary"
                  className="rounded-full border border-primary/10 bg-background/80 px-3 py-1 font-semibold text-secondary"
                >
                  {t("practice.signs.count", { count: totalSigns })}
                </Badge>
              ) : null}
              <Badge
                variant="secondary"
                className="rounded-full border border-primary/10 bg-background/80 px-3 py-1 font-semibold text-secondary"
              >
                {t("practice.hub.per_sign_questions")}
              </Badge>
              <Badge
                variant="secondary"
                className="rounded-full border border-primary/10 bg-background/80 px-3 py-1 font-semibold text-secondary"
              >
                {t("practice.hub.three_levels")}
              </Badge>
            </div>
          </div>
            <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row lg:me-6 lg:w-[260px] lg:flex-col">
              <Button
                onClick={() => router.push("/traffic-signs")}
                className="w-full min-w-0 flex-shrink-0 gap-2 whitespace-normal rounded-full bg-primary text-center font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md active:translate-y-0"
                size="lg"
              >
                <BookOpen className="w-4 h-4" />
                {t("practice.hub.browse_all")}
              </Button>
              <Button
                onClick={() => router.push("/practice/random")}
                variant="outline"
                className="w-full min-w-0 flex-shrink-0 gap-2 whitespace-normal rounded-full border-primary/15 bg-background/85 text-center font-semibold text-secondary shadow-sm ring-1 ring-primary/10 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-md active:translate-y-0"
                size="lg"
              >
                <Shuffle className="w-4 h-4" />
                {t("practice.start_random")}
              </Button>
            </div>
        </header>

        {serviceUnavailable && (
          <ServiceUnavailableBanner
            onRetry={() => {
              setServiceUnavailable(false);
              setError(null);
              fetchData();
            }}
          />
        )}

        {(error || progressError) && (
          <Alert
            variant="destructive"
            className="mt-8 animate-in fade-in-50 duration-300"
          >
            <AlertDescription className="flex items-center justify-between">
              <span>⚠️ {error || t("practice.load_error")}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (error) void fetchData();
                  if (progressError) setProgressRetryKey((key) => key + 1);
                }}
                className="ms-4 gap-1"
              >
                <RefreshCw className="w-3 h-3" /> {t("practice.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        )}


        <PageSectionSurface
          title={t("practice.hub.categories_section_title")}
          description={t("practice.subtitle")}
          className={`mt-8 ${LEARNING_SECTION_CLASS}`}
        >
          {isLoading ? (
            <LoadingSpinner message={t("practice.loading")} />
          ) : categories.length === 0 ? (
            <Card className="rounded-2xl border border-primary/10 bg-background/80 shadow-sm ring-1 ring-primary/[0.03]">
              <CardContent className="py-14 text-center space-y-3">
                <div className="text-5xl">🔍</div>
                <p className="text-muted-foreground font-medium">
                  {t("practice.signs.none")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((cat) => {
                const practicePct =
                  cat.signCount > 0
                    ? Math.round((cat.practiceCompleted / cat.signCount) * 100)
                    : 0;

                return (
                  <Card
                    key={cat.code}
                    data-testid="practice-category-card"
                    className={`${LEARNING_CARD_CLASS} cursor-pointer`}
                    onClick={() =>
                      openProtectedPractice(`/practice/${cat.code}`)
                    }
                  >
                    <div className={LEARNING_CARD_ACCENT_CLASS} />
                    <CardHeader className="min-w-0 p-4 pb-2 sm:p-5 sm:pb-2">
                      <div
                        data-testid="practice-category-header"
                        className="flex min-w-0 items-center gap-3"
                      >
                        <div
                          data-testid="practice-category-icon"
                          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-background p-2 shadow-sm sm:h-[72px] sm:w-[72px]"
                        >
                          {cat.representativeImage ? (
                            <Image
                              src={cat.representativeImage}
                              alt=""
                              width={88}
                              height={88}
                              unoptimized
                              className="h-9 w-9 object-contain sm:h-11 sm:w-11"
                            />
                          ) : (
                            <span className="text-xl font-extrabold tracking-tight text-primary">
                              {cat.code}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 text-start">

                          <CardTitle
                            data-testid="practice-category-title"
                            className={LEARNING_CARD_TITLE_CLASS}
                          >
                            {cat.title}
                          </CardTitle>

                        </div>

                      </div>
                    </CardHeader>

                    <CardContent className="flex min-w-0 flex-1 flex-col gap-4 px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
                      {isAuthenticated && (
                        <div className="grid grid-cols-2 gap-2">
                          <div
                            data-testid="practice-category-stat"
                            className="flex min-w-0 flex-col justify-center rounded-xl border border-border/50 bg-muted/50 px-3 py-2"
                          >
                            <div className="flex min-w-0 items-center justify-center gap-1 text-start text-emerald-700">
                              <CheckCircle2
                                data-testid="practice-category-stat-icon"
                                className="h-4 w-4 shrink-0"
                              />
                              <span
                                data-testid="practice-category-stat-label"
                                className="min-w-0 break-words text-xs font-semibold leading-4"
                              >
                                {t("practice.hub.completed")}
                              </span>
                            </div>
                            <p
                              data-testid="practice-category-stat-value"
                              className="mt-1 text-sm font-bold text-foreground"
                            >
                              {progressUnavailable ? "…" : cat.practiceCompleted}
                            </p>
                          </div>

                          <div
                            data-testid="practice-category-stat"
                            className="flex min-w-0 flex-col justify-center rounded-xl border border-border/50 bg-muted/50 px-3 py-2"
                          >
                            <div className="flex min-w-0 items-center justify-center gap-1 text-start text-amber-700">
                              <Trophy
                                data-testid="practice-category-stat-icon"
                                className="h-4 w-4 shrink-0"
                              />
                              <span
                                data-testid="practice-category-stat-label"
                                className="min-w-0 break-words text-xs font-semibold leading-4"
                              >
                                {t("practice.hub.passed_signs")}
                              </span>
                            </div>
                            <p
                              data-testid="practice-category-stat-value"
                              className="mt-1 text-sm font-bold text-foreground"
                            >
                              {progressUnavailable ? "…" : cat.passedSigns}
                            </p>
                          </div>
                        </div>
                      )}

                      <div
                        data-testid="practice-category-progress"
                        className="mt-auto space-y-2"
                      >
                        <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                          <span className="text-muted-foreground">
                            {t("practice.progress")}
                          </span>
                          <span
                            data-testid="practice-category-progress-value"
                            className="shrink-0 text-primary"
                          >
                            {progressUnavailable ? "…" : `${practicePct}%`}
                          </span>
                        </div>

                        <div
                          data-testid="practice-category-progress-bar"
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={
                            progressUnavailable ? undefined : practicePct
                          }
                          aria-busy={progressUnavailable}
                          className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10"
                        >
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${practicePct}%` }}
                          />
                        </div>

                        <Button
                          data-testid="practice-category-action"
                          type="button"
                          size="lg"
                          className="h-11 min-h-11 w-full gap-2 rounded-full bg-primary font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
                          disabled={isAuthLoading}
                          onClick={(event) => {
                            event.stopPropagation();
                            openProtectedPractice(`/practice/${cat.code}`);
                          }}
                        >
                          {t("practice.start_practice")}
                          <ChevDir className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>

                    <span className="pointer-events-none absolute -bottom-16 end-0 h-36 w-36 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
                  </Card>
                );
              })}
            </div>
          )}
        </PageSectionSurface>
      </div>
    </div>
  );
}
