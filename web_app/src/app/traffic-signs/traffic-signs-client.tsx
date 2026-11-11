"use client";

import { useLocalizedRouter } from "@/hooks/use-localized-router";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "@/components/localized-link";
import { usePathname, useSearchParams } from "next/navigation";
import { Heart, Shapes } from "lucide-react";
import { TrafficSignsGrid } from "@/components/traffic-signs/traffic-signs-grid";
import { TrafficSignsFilters } from "@/components/traffic-signs/traffic-signs-filters";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { LoadErrorState } from "@/components/ui/load-error-state";
import { PageLoading } from "@/components/ui/page-loading";
import Breadcrumb from "@/components/ui/breadcrumb";
import {
  LEARNING_PAGE_BACKGROUND_CLASS,
  LEARNING_PAGE_CONTAINER_CLASS,
  LEARNING_SECTION_CLASS,
  PageHeroDescription,
  PageHeroSurface,
  PageSectionSurface,
  PageHeroTitle,
} from "@/components/ui/page-surface";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { favoriteCopy, favoriteLocale } from "@/lib/road-sign-favorites";
import { apiClient, isServiceUnavailable, logApiError } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import {
  getGroupInfo,
  getTrafficSignDescription,
  getTrafficSignGroup,
  getTrafficSignName,
  TRAFFIC_SIGN_GROUP_ORDER,
} from "@/lib/traffic-sign-presentation";
import type { TrafficSign, TrafficSignCatalogItem } from "@/lib/types";

type Lang = "en" | "ar" | "nl" | "fr";

async function getAllTrafficSigns(): Promise<TrafficSignCatalogItem[]> {
  const response = await apiClient.get<
    TrafficSign[] | { signs: TrafficSign[] }
  >(API_ENDPOINTS.TRAFFIC_SIGNS.LIST, undefined, {
    skipAuthRedirect: true,
  });
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
  const { isAuthenticated } = useAuth();
  const favoriteLabels = favoriteCopy[favoriteLocale(language)];
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
      totalCount: groups[group].length,
    }));
  }, [filteredSigns]);

  const activeGroup = useMemo(
    () => (category !== "all" ? getGroupInfo(category) : null),
    [category],
  );

  const showingSingleGroup =
    category !== "all" && groupedFilteredSigns.length === 1;

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
    <div className={LEARNING_PAGE_BACKGROUND_CLASS}>
      <div className={LEARNING_PAGE_CONTAINER_CLASS}>
        <Breadcrumb />

        <header className="mt-8 max-w-3xl space-y-2">
          <div className="space-y-2">
            <PageHeroTitle className="max-w-3xl text-balance">
              {t("traffic_signs.page_title")}
            </PageHeroTitle>
            <PageHeroDescription className="max-w-3xl text-pretty">
              {t("traffic_signs.page_subtitle")}
            </PageHeroDescription>
          </div>
        </header>

        <PageHeroSurface
          className={`mt-6 mb-6 md:mb-8 ${LEARNING_SECTION_CLASS}`}
          contentClassName="space-y-3 border-s-0 p-0"
        >
          {isAuthenticated ? (
            <Link
              href="/traffic-signs/favorites"
              className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-primary/20 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              {favoriteLabels.collection}
            </Link>
          ) : null}

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
          <PageSectionSurface className={LEARNING_SECTION_CLASS}>
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
                className={`inline-flex items-center self-start rounded-full border px-2.5 py-1 text-sm font-semibold ${activeGroup.style.chip}`}
              >
                {t("traffic_signs.section_count", {
                  count: filteredSigns.length,
                })}
              </span>
            </div>
          </PageSectionSurface>
        )}

        {filteredSigns.length === 0 ? (
          <PageSectionSurface
            className={`${LEARNING_SECTION_CLASS} rounded-[2rem] border-dashed text-center`}
          >
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
          <TrafficSignsGrid signs={groupedFilteredSigns[0].signs} />
        ) : (
          <div className="space-y-6">
            {groupedFilteredSigns.map(
              ({ group, signs, totalCount, info, style }) => (
                <section key={group} className="space-y-3">
                  <div className="border-b border-border/60 pb-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-[1rem] bg-gradient-to-br ${style.accent} text-sm font-black text-white shadow-sm`}
                      >
                        {info.displayKey ?? group}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <h2 className="text-lg font-black tracking-tight text-foreground md:text-xl">
                          {info.title[lang]}
                          <span className="px-2 font-normal text-muted-foreground/70" aria-hidden="true">|</span>
                          <span className="whitespace-nowrap text-sm font-semibold text-muted-foreground md:text-base">
                            {t("traffic_signs.section_count", { count: totalCount })}
                          </span>
                        </h2>
                        <p className="max-w-3xl break-words text-sm leading-6 text-muted-foreground md:text-base md:leading-7">
                          {info.description[lang]}
                        </p>
                      </div>
                    </div>


                  </div>

                  <TrafficSignsGrid signs={signs} />
                </section>
              ),
            )}
          </div>
        )}

      </div>
    </div>
  );
}
