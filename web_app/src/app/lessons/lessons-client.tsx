"use client";

import { useEffect, useState } from "react";
import { LessonsGrid } from "@/components/lessons/lessons-grid";
import { getAllLessons } from "@/services/lessonService";
import { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { LoadErrorState } from "@/components/ui/load-error-state";
import { PageLoading } from "@/components/ui/page-loading";
import { useLanguage } from "@/contexts/language-context";
import { SeoIntentLinks } from "@/components/seo/seo-intent-links";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  PageHeroDescription,
  PageHeroTitle,
  PageSectionSurface,
} from "@/components/ui/page-surface";
import { Search } from "lucide-react";
import type { Lesson } from "@/lib/types";
import type { HomeLessonOverviewItem } from "@/lib/home-lessons-overview";
import { useLessonTheoryOverview } from "@/hooks/use-lesson-theory-overview";

export default function LessonsClient({
  initialLessons,
  initialOverview = [],
}: Readonly<{ initialLessons: Lesson[]; initialOverview?: HomeLessonOverviewItem[] }>) {
  const { t } = useLanguage();
  const overview = useLessonTheoryOverview(initialOverview);
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [loading, setLoading] = useState(initialLessons.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (fetchKey === 0 && initialLessons.length > 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      const loader = getAllLessons();

      loader
        .then((data) => {
          if (!cancelled) {
            setLessons(data);
          }
        })
        .catch((err) => {
          logApiError("Failed to load lessons", err);
          if (!cancelled) {
            if (isServiceUnavailable(err)) {
              setServiceUnavailable(true);
            } else {
              setError(err?.message ?? t("common.load_error"));
            }
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [fetchKey, initialLessons, t]);

  if (serviceUnavailable) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ServiceUnavailableBanner
          onRetry={() => {
            setServiceUnavailable(false);
            setFetchKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <LoadErrorState
        message={error}
        onRetry={() => {
          setError(null);
          setFetchKey((current) => current + 1);
        }}
      />
    );
  }


  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--brand-orange)/0.10),_transparent_35%),linear-gradient(to_bottom,_hsl(var(--muted))_0%,_hsl(var(--background))_22%)]">
      <div className="container mx-auto px-4 pt-8 pb-8 md:pt-8 md:pb-12">
        <Breadcrumb
          items={[
            { label: t("nav.home"), href: "/" },
            { label: t("nav.lessons"), isCurrentPage: true },
          ]}
        />


        <header className="mt-8 max-w-3xl space-y-2">
          <PageHeroTitle className="text-balance">
            {t("lessons.page_title")}
          </PageHeroTitle>
          <PageHeroDescription className="text-pretty">
            {t("lessons.page_subtitle")}
          </PageHeroDescription>
        </header>

        <SeoIntentLinks page="lessons" />

        <PageSectionSurface
          className="mt-8 rounded-[30px] border-border/50 bg-card/80 p-6"
          title={t("lessons.collection_title")}
          description={t("lessons.results_label", { count: lessons.length })}
        >
          {lessons.length > 0 ? (
            <LessonsGrid lessons={lessons} theoryOverview={overview} />
          ) : (
            <div className="rounded-[24px] border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-foreground">
                {t("lessons.empty_title")}
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                {t("lessons.empty_desc")}
              </p>
            </div>
          )}
        </PageSectionSurface>
      </div>
    </div>
  );
}
