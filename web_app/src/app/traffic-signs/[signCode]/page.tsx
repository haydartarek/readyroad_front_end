"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Shapes,
  Trophy,
} from "lucide-react";
import Breadcrumb from "@/components/ui/breadcrumb";
import {
  PageHeroSurface,
  PageHeroTitle,
} from "@/components/ui/page-surface";
import { SignImage } from "@/components/traffic-signs/sign-image";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { apiClient, isServiceUnavailable, logApiError } from "@/lib/api";
import {
  API_ENDPOINTS,
  isRemovedLegacyTrafficSignCode,
  resolveLegacyTrafficSignCode,
} from "@/lib/constants";
import { getSignExamStatus, getSignExamStatusClasses } from "@/lib/sign-exam-status";
import { resolveTrafficSignImage } from "@/lib/sign-image-resolver";
import {
  getTrafficSignDescription,
  getTrafficSignGuidance,
  getTrafficSignGroupInfo,
  getTrafficSignLongDescription,
  getTrafficSignMeaning,
  getTrafficSignName,
  hasDistinctTrafficSignGuidance,
} from "@/lib/traffic-sign-presentation";
import type { TrafficSign } from "@/lib/types";
import { getSignStatus, type SignUserProgress } from "@/services";

type Lang = "en" | "ar" | "nl" | "fr";

const LANGUAGE_FIELD_SUFFIX: Record<Lang, "Nl" | "En" | "Ar" | "Fr"> = {
  nl: "Nl",
  en: "En",
  ar: "Ar",
  fr: "Fr",
};

function localizedValue(
  sign: TrafficSign,
  field: "name" | "description" | "longDescription" | "meaning" | "guidance",
  language: Lang,
): string {
  const suffix = LANGUAGE_FIELD_SUFFIX[language];
  const key = `${field}${suffix}` as keyof TrafficSign;
  const value = sign[key];
  return typeof value === "string" ? value.trim() : "";
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.10),_transparent_36%),linear-gradient(to_bottom,_hsl(var(--muted)/0.45),_transparent_24rem)]">
      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="space-y-6">
          <div className="h-5 w-56 animate-pulse rounded-full bg-muted" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_380px]">
            <div className="rounded-[2rem] border border-border/60 bg-card p-8 shadow-sm">
              <div className="space-y-4">
                <div className="h-7 w-32 animate-pulse rounded-full bg-muted" />
                <div className="h-12 w-2/3 animate-pulse rounded-2xl bg-muted" />
                <div className="h-24 w-full animate-pulse rounded-2xl bg-muted" />
              </div>
            </div>
            <div className="rounded-[2rem] border border-border/60 bg-card p-8 shadow-sm">
              <div className="mx-auto h-64 w-64 animate-pulse rounded-[2rem] bg-muted" />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_360px]">
            <div className="space-y-6">
              <div className="h-72 animate-pulse rounded-[2rem] bg-card" />
              <div className="h-72 animate-pulse rounded-[2rem] bg-card" />
            </div>
            <div className="space-y-6">
              <div className="h-56 animate-pulse rounded-[2rem] bg-card" />
              <div className="h-80 animate-pulse rounded-[2rem] bg-card" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrafficSignDetailPage() {
  const params = useParams<{ signCode: string }>();
  const routeParam = params.signCode;
  const router = useRouter();
  const { t, language, isRTL } = useLanguage();
  const currentLanguage = (["nl", "en", "ar", "fr"] as Lang[]).includes(
    language as Lang,
  )
    ? (language as Lang)
    : "en";

  const [sign, setSign] = useState<TrafficSign | null>(null);
  const [signProgress, setSignProgress] = useState<SignUserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [error, setError] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const requestedCode = resolveLegacyTrafficSignCode(routeParam);
  const removedLegacyCode = isRemovedLegacyTrafficSignCode(routeParam);

  useEffect(() => {
    if (!removedLegacyCode) {
      return;
    }

    router.replace("/traffic-signs");
  }, [removedLegacyCode, router]);

  useEffect(() => {
    if (removedLegacyCode) {
      return;
    }

    let cancelled = false;

    apiClient
      .get<TrafficSign>(API_ENDPOINTS.TRAFFIC_SIGNS.DETAIL(requestedCode))
      .then((response) => {
        if (!cancelled) {
          setSignProgress(null);
          setProgressLoading(true);
          setSign(response.data);
        }
      })
      .catch((apiError) => {
        logApiError("Failed to load traffic sign detail", apiError);
        if (!cancelled) {
          if (isServiceUnavailable(apiError)) {
            setServiceUnavailable(true);
          } else {
            setError(true);
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
  }, [fetchKey, removedLegacyCode, requestedCode]);

  useEffect(() => {
    if (!sign) {
      return;
    }

    let cancelled = false;

    const progressIdentifier = sign.routeCode ?? sign.signCode ?? routeParam;

    getSignStatus(progressIdentifier)
      .then((progress) => {
        if (!cancelled) {
          setSignProgress(progress);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSignProgress(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setProgressLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [routeParam, sign]);

  useEffect(() => {
    if (!sign) {
      return;
    }

    const canonicalCode = sign.routeCode ?? sign.signCode;
    if (!canonicalCode || routeParam === canonicalCode) {
      return;
    }

    router.replace(`/traffic-signs/${canonicalCode}`);
  }, [routeParam, router, sign]);

  const routeCode = sign?.routeCode ?? sign?.signCode ?? routeParam;
  const isCurrentSignLoaded = !!sign &&
    (resolveLegacyTrafficSignCode(routeParam) === routeCode ||
      resolveLegacyTrafficSignCode(routeParam) === sign.signCode);
  const { info, style } = sign ? getTrafficSignGroupInfo(sign) : getTrafficSignGroupInfo({
    signCode: routeParam,
    imageUrl: "",
  } as TrafficSign);

  if (serviceUnavailable) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ServiceUnavailableBanner
          onRetry={() => {
            setServiceUnavailable(false);
            setLoading(true);
            setError(false);
            setFetchKey((current) => current + 1);
          }}
          className="max-w-xl"
        />
      </div>
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !sign || !isCurrentSignLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md rounded-[2rem] border border-border/60 bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Shapes className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-foreground">
            {t("sign_detail.not_found")}
          </h1>
          <div className="mt-6">
            <Button asChild className="rounded-xl">
              <Link href="/traffic-signs">
                {isRTL ? (
                  <ArrowRight className="mr-2 h-4 w-4" />
                ) : (
                  <ArrowLeft className="mr-2 h-4 w-4" />
                )}
                {t("sign_detail.back_to_all")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentName = getTrafficSignName(sign, currentLanguage);
  const currentMeaning =
    localizedValue(sign, "meaning", currentLanguage) ||
    localizedValue(sign, "description", currentLanguage) ||
    getTrafficSignMeaning(sign, currentLanguage) ||
    getTrafficSignDescription(sign, currentLanguage);
  const currentGuidance =
    localizedValue(sign, "guidance", currentLanguage) ||
    localizedValue(sign, "longDescription", currentLanguage) ||
    getTrafficSignGuidance(sign, currentLanguage) ||
    getTrafficSignLongDescription(sign, currentLanguage);
  const showGuidance = hasDistinctTrafficSignGuidance(
    currentMeaning,
    currentGuidance,
  );
  const breadcrumbItems = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.traffic_signs"), href: "/traffic-signs" },
    { label: currentName, href: `/traffic-signs/${routeCode}` },
  ];
  const examStatus = getSignExamStatus(signProgress);
  const examQuestionsCount =
    sign.exam1TotalQuestions ?? signProgress?.exam1TotalQuestions ?? null;
  const examPassingScore =
    sign.exam1PassingScore ?? signProgress?.exam1PassingScore ?? null;
  const examPassingPercentage =
    examQuestionsCount && examPassingScore != null
      ? Math.round((examPassingScore / examQuestionsCount) * 100)
      : null;
  const examSummaryText = examQuestionsCount && examPassingPercentage != null
      ? `${currentLanguage === "ar"
          ? `${examQuestionsCount} اسئلة والنجاح من ${examPassingPercentage}%`
          : `${t("sign_quiz.questions_count").replace("{n}", examQuestionsCount.toString())} • ${t("sign_quiz.pass_score").replace("{score}", examPassingPercentage.toString())}`}${signProgress?.exam1BestScorePct != null ? ` • ${t("sign_quiz.best_score").replace("{score}", Math.round(signProgress.exam1BestScorePct).toString())}` : ""}`
      : progressLoading
        ? t("common.loading")
        : t("sign_quiz.exam_config_pending");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/35">
      <div className="container mx-auto px-4 py-8 md:py-10 space-y-6 md:space-y-8">
        <Breadcrumb items={breadcrumbItems} />

        <PageHeroSurface>
          <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-center">
            <div className="rounded-[1.9rem] border border-border/60 bg-background/80 p-5 shadow-sm">
              <div className="rounded-[1.5rem] border border-border/60 bg-muted/20 p-5">
                <div className="relative mx-auto aspect-square w-full max-w-[280px]">
                  <SignImage
                    src={resolveTrafficSignImage(sign)}
                    alt={currentName}
                    className="object-contain p-4"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${style.chip}`}
              >
                {info.title[currentLanguage]}
              </span>

              <div className="space-y-3">
                <PageHeroTitle className="max-w-4xl text-balance">
                  {currentName}
                </PageHeroTitle>
              </div>
            </div>
          </div>
        </PageHeroSurface>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
          <div className="space-y-6">
            <Card className="rounded-[1.75rem] border border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-black">
                  {t("sign_detail.overview")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-[1.5rem] border border-border/60 bg-muted/20 p-5 md:p-6">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                    {t("sign_detail.meaning")}
                  </p>
                  {currentMeaning ? (
                    <p
                      dir={currentLanguage === "ar" ? "rtl" : "ltr"}
                      className="mt-3 text-lg font-semibold leading-9 text-foreground md:text-xl"
                    >
                      {currentMeaning}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      {t("sign_detail.no_meaning")}
                    </p>
                  )}
                </div>

                {showGuidance ? (
                  <div className="space-y-3 border-t border-border/60 pt-6">
                    <h2 className="text-lg font-black text-foreground">
                      {t("sign_detail.guidance")}
                    </h2>
                    <p
                      dir={currentLanguage === "ar" ? "rtl" : "ltr"}
                      className="whitespace-pre-line text-base leading-8 text-foreground"
                    >
                      {currentGuidance}
                    </p>
                  </div>
                ) : null}

                <div className="rounded-[1.5rem] border border-border/60 bg-background/70 p-5 md:p-6">
                  <div className="flex items-center gap-2">
                    <Shapes className="h-4 w-4 text-primary" />
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      {t("sign_detail.sign_family")}
                    </p>
                  </div>
                  <h2 className="mt-3 text-lg font-black text-foreground">
                    {info.title[currentLanguage]}
                  </h2>
                  <p className="mt-3 text-base leading-8 text-muted-foreground">
                    {info.description[currentLanguage]}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <Card className="rounded-[1.75rem] border border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-black">
                  <Trophy className="h-5 w-5 text-primary" />
                  {t("sign_quiz.quiz_section_title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <p className="font-semibold text-foreground">
                          {t("sign_quiz.practice_mode")}
                        </p>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {t("sign_quiz.practice_desc")}
                      </p>
                    </div>
                    {!progressLoading && signProgress?.practiceCompleted && (
                      <Badge className="border border-green-200 bg-green-100 text-green-800">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {t("sign_quiz.practice_done")}
                      </Badge>
                    )}
                  </div>

                  <Button className="mt-4 w-full rounded-xl" asChild>
                    <Link href={`/traffic-signs/${routeCode}/practice`}>
                      {signProgress?.practiceStarted &&
                      !signProgress.practiceCompleted
                        ? t("sign_quiz.continue_practice")
                        : signProgress?.practiceCompleted
                          ? t("sign_quiz.practice_again")
                          : t("sign_quiz.start_practice")}
                    </Link>
                  </Button>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">
                        {t("sign_quiz.exam_label")}
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {examSummaryText}
                      </p>
                    </div>

                    {!progressLoading ? (
                      <Badge
                        className={`border ${getSignExamStatusClasses(examStatus.tone)}`}
                      >
                        {t(examStatus.labelKey)}
                      </Badge>
                    ) : null}
                  </div>

                  <Button variant="outline" className="mt-4 w-full rounded-xl" asChild>
                    <Link href={`/traffic-signs/${routeCode}/exam/1`}>
                      {signProgress?.exam1Attempted
                        ? t("sign_quiz.retake_exam")
                        : t("sign_quiz.start_exam")}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
