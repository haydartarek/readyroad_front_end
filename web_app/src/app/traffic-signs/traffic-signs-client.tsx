"use client";

import { useLocalizedRouter } from "@/hooks/use-localized-router";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "@/components/localized-link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Languages, ListFilter, Shapes } from "lucide-react";
import { TrafficSignsGrid } from "@/components/traffic-signs/traffic-signs-grid";
import { TrafficSignsFilters } from "@/components/traffic-signs/traffic-signs-filters";
import { Button } from "@/components/ui/button";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { LoadErrorState } from "@/components/ui/load-error-state";
import { PageLoading } from "@/components/ui/page-loading";
import Breadcrumb from "@/components/ui/breadcrumb";
import {
  PageHeroDescription,
  PageHeroSurface,
  PageMetricCard,
  PageSectionSurface,
  PageHeroTitle,
} from "@/components/ui/page-surface";
import { useLanguage } from "@/contexts/language-context";
import { apiClient, isServiceUnavailable, logApiError } from "@/lib/api";
import { API_ENDPOINTS, LANGUAGES } from "@/lib/constants";
import {
  getGroupInfo,
  getTrafficSignDescription,
  getTrafficSignGroup,
  getTrafficSignName,
  TRAFFIC_SIGN_GROUP_ORDER,
} from "@/lib/traffic-sign-presentation";
import type { TrafficSign, TrafficSignCatalogItem } from "@/lib/types";

type Lang = "en" | "ar" | "nl" | "fr";

const DEFAULT_SIGNS_PER_GROUP = 4;
const FILTERED_SIGNS_PER_BATCH = 24;

async function getAllTrafficSigns(): Promise<TrafficSignCatalogItem[]> {
  const response = await apiClient.get<
    TrafficSign[] | { signs: TrafficSign[] }
  >(API_ENDPOINTS.TRAFFIC_SIGNS.LIST);
  const data = response.data;
  return Array.isArray(data) ? data : (data.signs ?? []);
}

function sortTrafficSigns(
  signs: TrafficSignCatalogItem[],
): TrafficSignCatalogItem[] {
  return [...signs].sort((left, right) =>
    left.signCode.localeCompare(right.signCode, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

export default function TrafficSignsClient({
  initialSigns,
}: Readonly<{ initialSigns: TrafficSignCatalogItem[] }>) {
  return (
    <Suspense fallback={<LoadingState />}>
      <TrafficSignsContent initialSigns={initialSigns} />
    </Suspense>
  );
}

function LoadingState() {
  const { t } = useLanguage();
  return <PageLoading message={t("traffic_signs.loading")} />;
}

function TrafficSignsContent({
  initialSigns,
}: {
  initialSigns: TrafficSignCatalogItem[];
}) {
  const { t, language } = useLanguage();
  const router = useLocalizedRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = (["nl", "en", "ar", "fr"] as Lang[]).includes(language as Lang)
    ? (language as Lang)
    : "en";

  const category = searchParams.get("category") || "all";
  const search = searchParams.get("search") || "";

  const [allSigns, setAllSigns] = useState<TrafficSignCatalogItem[]>(() =>
    sortTrafficSigns(initialSigns),
  );
  const [loading, setLoading] = useState(initialSigns.length === 0);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const [visibleBatch, setVisibleBatch] = useState(1);

  useEffect(() => {
    setVisibleBatch(1);
  }, [category, search]);

  useEffect(() => {
    if (fetchKey === 0 && initialSigns.length > 0) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    getAllTrafficSigns()
      .then((signs) => {
        if (!cancelled) {
          setAllSigns(sortTrafficSigns(signs));
        }
      })
      .catch((error) => {
        logApiError("Failed to load traffic signs", error);
        if (!cancelled) {
          if (isServiceUnavailable(error)) {
            setServiceUnavailable(true);
          } else {
            setLoadError(true);
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
  }, [fetchKey, initialSigns.length]);

  const updateUrl = useCallback(
    (params: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (!value || value === "all") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });

      const query = next.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const groupedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sign of allSigns) {
      const key = getTrafficSignGroup(sign);
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [allSigns]);

  const categories = useMemo(
    () => [
      {
        value: "all",
        label: t("traffic_signs.category_all_signs"),
        count: allSigns.length,
      },
      ...TRAFFIC_SIGN_GROUP_ORDER.filter(
        (group) => groupedCounts[group] > 0,
      ).map((group) => ({
        value: group,
        label: getGroupInfo(group).info.title[lang],
        count: groupedCounts[group],
      })),
    ],
    [allSigns.length, groupedCounts, lang, t],
  );

  const filteredSigns = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allSigns.filter((sign) => {
      const group = getTrafficSignGroup(sign);
      const matchesCategory = category === "all" || group === category;
      if (!matchesCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        sign.signCode,
        getTrafficSignName(sign, "nl"),
        getTrafficSignName(sign, "en"),
        getTrafficSignName(sign, "fr"),
        getTrafficSignName(sign, "ar"),
        getTrafficSignDescription(sign, "nl"),
        getTrafficSignDescription(sign, "en"),
        getTrafficSignDescription(sign, "fr"),
        getTrafficSignDescription(sign, "ar"),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [allSigns, category, search]);

  const groupedFilteredSigns = useMemo(() => {
    const groups: Record<string, TrafficSignCatalogItem[]> = {};
    for (const sign of filteredSigns) {
      const group = getTrafficSignGroup(sign);
      (groups[group] ??= []).push(sign);
    }

    return TRAFFIC_SIGN_GROUP_ORDER.filter(
      (group) => groups[group]?.length,
    ).map((group) => ({
      ...getGroupInfo(group),
      signs: groups[group],
    }));
  }, [filteredSigns]);

  const groupedSigns = useMemo(() => {
    const perGroupLimit =
      category === "all"
        ? DEFAULT_SIGNS_PER_GROUP * visibleBatch
        : FILTERED_SIGNS_PER_BATCH * visibleBatch;

    return groupedFilteredSigns.map((group) => ({
      ...group,
      totalCount: group.signs.length,
      signs: group.signs.slice(0, perGroupLimit),
    }));
  }, [category, groupedFilteredSigns, visibleBatch]);

  const visibleSignsCount = useMemo(
    () => groupedSigns.reduce((total, group) => total + group.signs.length, 0),
    [groupedSigns],
  );
  const hasMoreSigns = visibleSignsCount < filteredSigns.length;

  const activeGroup = useMemo(
    () => (category !== "all" ? getGroupInfo(category) : null),
    [category],
  );

  const showingSingleGroup = category !== "all" && groupedSigns.length === 1;

  const handleCategoryChange = useCallback(
    (value: string) => updateUrl({ category: value }),
    [updateUrl],
  );

  const handleSearchChange = useCallback(
    (value: string) => updateUrl({ search: value }),
    [updateUrl],
  );

  const handleClearFilters = useCallback(
    () => router.replace(pathname, { scroll: false }),
    [pathname, router],
  );

  if (serviceUnavailable) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ServiceUnavailableBanner
          onRetry={() => {
            setServiceUnavailable(false);
            setFetchKey((current) => current + 1);
          }}
        />
      </div>
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  if (loadError) {
    return (
      <LoadErrorState
        onRetry={() => {
          setLoadError(false);
          setFetchKey((current) => current + 1);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/35">
      <div className="container mx-auto px-4 py-6 md:py-7 space-y-5 md:space-y-6">
        <Breadcrumb />

        <PageHeroSurface contentClassName="space-y-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Shapes className="h-4 w-4" />
                {t("traffic_signs.hero_badge")}
              </div>

              <div className="space-y-1">
                <PageHeroTitle className="max-w-3xl text-balance">
                  {t("traffic_signs.page_title")}
                </PageHeroTitle>
                <PageHeroDescription className="max-w-3xl text-pretty">
                  {t("traffic_signs.page_subtitle")}
                </PageHeroDescription>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <PageMetricCard
                icon={<Shapes className="h-3.5 w-3.5" />}
                label={t("traffic_signs.hero_metric_signs")}
                value={String(allSigns.length)}
                className="rounded-[1.05rem] p-2.5"
              />
              <PageMetricCard
                icon={<ListFilter className="h-3.5 w-3.5" />}
                label={t("traffic_signs.hero_metric_categories")}
                value={String(categories.length - 1)}
                className="rounded-[1.05rem] p-2.5"
              />
              <PageMetricCard
                icon={<Languages className="h-3.5 w-3.5" />}
                label={t("traffic_signs.hero_metric_languages")}
                value={String(LANGUAGES.length)}
                className="rounded-[1.05rem] p-2.5"
              />
            </div>
          </div>

          <TrafficSignsFilters
            categories={categories}
            selectedCategory={category}
            searchQuery={search}
            onCategoryChange={handleCategoryChange}
            onSearchChange={handleSearchChange}
            onClearFilters={handleClearFilters}
          />
        </PageHeroSurface>

        {activeGroup && (
          <PageSectionSurface>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`grid h-12 w-12 flex-shrink-0 place-items-center rounded-[1.15rem] bg-gradient-to-br ${activeGroup.style.accent} text-base font-black text-white shadow-sm`}
                >
                  {activeGroup.info.displayKey ?? activeGroup.group}
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-black tracking-tight text-foreground">
                    {activeGroup.info.title[lang]}
                  </h2>
                  <p className="max-w-4xl text-xs leading-6 text-muted-foreground md:text-sm">
                    {activeGroup.info.description[lang]}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center self-start rounded-full border px-2.5 py-1 text-[11px] font-semibold ${activeGroup.style.chip}`}
              >
                {t("traffic_signs.section_count", {
                  count: filteredSigns.length,
                })}
              </span>
            </div>
          </PageSectionSurface>
        )}

        {filteredSigns.length === 0 ? (
          <PageSectionSurface className="rounded-[2rem] border-dashed text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Shapes className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-foreground">
              {t("traffic_signs.no_results_title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              {t("traffic_signs.no_results_desc")}
            </p>
          </PageSectionSurface>
        ) : showingSingleGroup ? (
          <TrafficSignsGrid signs={groupedSigns[0].signs} />
        ) : (
          <div className="space-y-6">
            {groupedSigns.map(({ group, signs, totalCount, info, style }) => (
              <section key={group} className="space-y-3">
                <div className="flex flex-col gap-2.5 border-b border-border/60 pb-3 md:flex-row md:items-end md:justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-[1rem] bg-gradient-to-br ${style.accent} text-sm font-black text-white shadow-sm`}
                    >
                      {info.displayKey ?? group}
                    </div>

                    <div className="space-y-0.5">
                      <h2 className="text-lg font-black tracking-tight text-foreground md:text-xl">
                        {info.title[lang]}
                      </h2>
                      <p className="line-clamp-2 max-w-3xl text-xs leading-5 text-muted-foreground md:text-sm">
                        {info.description[lang]}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center self-start rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.chip}`}
                  >
                    {t("traffic_signs.section_count", { count: totalCount })}
                  </span>
                </div>

                <TrafficSignsGrid signs={signs} />
              </section>
            ))}
          </div>
        )}

        {filteredSigns.length > 0 && (
          <div className="space-y-4">
            {hasMoreSigns && (
              <div className="flex flex-col items-center gap-2 border-t border-border/60 pt-5">
                <p className="text-sm text-muted-foreground">
                  {t("traffic_signs.showing_count", {
                    visible: visibleSignsCount,
                    total: filteredSigns.length,
                  })}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 gap-2 rounded-full px-5"
                  onClick={() => setVisibleBatch((current) => current + 1)}
                >
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  {t("traffic_signs.load_more")}
                </Button>
              </div>
            )}

            <details className="rounded-lg border border-border/60 bg-card/70 p-4">
              <summary className="cursor-pointer text-sm font-bold text-foreground marker:text-primary">
                {t("traffic_signs.all_sign_links", {
                  count: filteredSigns.length,
                })}
              </summary>
              <nav
                aria-label={t("traffic_signs.all_sign_links", {
                  count: filteredSigns.length,
                })}
                className="mt-4 grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {filteredSigns.map((sign) => {
                  const routeCode = sign.routeCode ?? sign.signCode;
                  return (
                    <Link
                      key={routeCode}
                      href={`/traffic-signs/${routeCode}`}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {sign.signCode}: {getTrafficSignName(sign, lang)}
                    </Link>
                  );
                })}
              </nav>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
