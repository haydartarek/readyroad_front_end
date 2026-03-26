"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Languages, ListFilter, RefreshCw, Shapes } from "lucide-react";
import { TrafficSignsGrid } from "@/components/traffic-signs/traffic-signs-grid";
import { TrafficSignsFilters } from "@/components/traffic-signs/traffic-signs-filters";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import Breadcrumb from "@/components/ui/breadcrumb";
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
import type { TrafficSign } from "@/lib/types";

type Lang = "en" | "ar" | "nl" | "fr";

async function getAllTrafficSigns(): Promise<TrafficSign[]> {
  try {
    const response = await apiClient.get<TrafficSign[] | { signs: TrafficSign[] }>(
      API_ENDPOINTS.TRAFFIC_SIGNS.LIST,
    );
    const data = response.data;
    return Array.isArray(data) ? data : (data.signs ?? []);
  } catch (error) {
    if (isServiceUnavailable(error)) {
      throw error;
    }
    logApiError("Error fetching traffic signs", error);
    return [];
  }
}

export default function TrafficSignsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TrafficSignsContent />
    </Suspense>
  );
}

function LoadingState() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("traffic_signs.loading")}
        </p>
      </div>
    </div>
  );
}

function TrafficSignsContent() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = (["nl", "en", "ar", "fr"] as Lang[]).includes(language as Lang)
    ? (language as Lang)
    : "en";

  const category = searchParams.get("category") || "all";
  const search = searchParams.get("search") || "";

  const [allSigns, setAllSigns] = useState<TrafficSign[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getAllTrafficSigns()
      .then((signs) => {
        if (!cancelled) {
          setAllSigns(
            [...signs].sort((left, right) =>
              left.signCode.localeCompare(right.signCode, undefined, {
                numeric: true,
                sensitivity: "base",
              }),
            ),
          );
        }
      })
      .catch((error) => {
        logApiError("Failed to load traffic signs", error);
        if (!cancelled && isServiceUnavailable(error)) {
          setServiceUnavailable(true);
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
  }, [fetchKey]);

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
      router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
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
      ...TRAFFIC_SIGN_GROUP_ORDER.filter((group) => groupedCounts[group] > 0).map(
        (group) => ({
          value: group,
          label: getGroupInfo(group).info.title[lang],
          count: groupedCounts[group],
        }),
      ),
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

  const groupedSigns = useMemo(() => {
    const groups: Record<string, TrafficSign[]> = {};
    for (const sign of filteredSigns) {
      const group = getTrafficSignGroup(sign);
      (groups[group] ??= []).push(sign);
    }

    return TRAFFIC_SIGN_GROUP_ORDER.filter((group) => groups[group]?.length).map(
      (group) => ({
        ...getGroupInfo(group),
        signs: groups[group],
      }),
    );
  }, [filteredSigns]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/35">
      <div className="container mx-auto px-4 py-8 md:py-10 space-y-6 md:space-y-8">
        <Breadcrumb />

        <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/70 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/65">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-28 end-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-28 start-0 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
          </div>

          <div className="relative space-y-6 px-6 py-7 md:px-8 md:py-8">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
                  <Shapes className="h-4 w-4" />
                  {t("traffic_signs.hero_badge")}
                </div>

                <div className="space-y-3">
                  <h1 className="max-w-3xl text-balance text-4xl font-extrabold tracking-tight text-secondary sm:text-5xl">
                    {t("traffic_signs.page_title")}
                  </h1>
                  <p className="max-w-3xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                    {t("traffic_signs.page_subtitle")}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <HeroMetric
                  icon={<Shapes className="h-4 w-4" />}
                  label={t("traffic_signs.hero_metric_signs")}
                  value={String(allSigns.length)}
                />
                <HeroMetric
                  icon={<ListFilter className="h-4 w-4" />}
                  label={t("traffic_signs.hero_metric_groups")}
                  value={String(categories.length - 1)}
                />
                <HeroMetric
                  icon={<Languages className="h-4 w-4" />}
                  label={t("traffic_signs.hero_metric_languages")}
                  value={String(LANGUAGES.length)}
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
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-2 text-sm font-semibold text-primary">
            <Shapes className="h-4 w-4" />
            {t("traffic_signs.results_count", { count: filteredSigns.length })}
          </span>

          {filteredSigns.length !== allSigns.length ? (
            <span className="text-sm text-muted-foreground">
              {t("traffic_signs.filtered_from")}{" "}
              <span className="font-semibold text-foreground">{allSigns.length}</span>{" "}
              {t("traffic_signs.total")}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              {t("traffic_signs.showing_all")}
            </span>
          )}
        </div>

        {activeGroup && (
          <section className="rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${activeGroup.style.accent} text-lg font-black text-white shadow-sm`}
                >
                  {activeGroup.info.displayKey ?? activeGroup.group}
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    {activeGroup.info.title[lang]}
                  </h2>
                  <p className="max-w-4xl text-sm leading-7 text-muted-foreground md:text-base">
                    {activeGroup.info.description[lang]}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center self-start rounded-full border px-3 py-1 text-xs font-semibold ${activeGroup.style.chip}`}
              >
                {t("traffic_signs.section_count", { count: filteredSigns.length })}
              </span>
            </div>
          </section>
        )}

        {filteredSigns.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-border bg-card px-6 py-14 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Shapes className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-foreground">
              {t("traffic_signs.no_results_title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              {t("traffic_signs.no_results_desc")}
            </p>
          </div>
        ) : showingSingleGroup ? (
          <TrafficSignsGrid signs={filteredSigns} />
        ) : (
          <div className="space-y-8">
            {groupedSigns.map(({ group, signs, info, style }) => (
              <section key={group} className="space-y-4">
                <div className="flex flex-col gap-3 border-b border-border/60 pb-4 md:flex-row md:items-end md:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${style.accent} text-base font-black text-white shadow-sm`}
                    >
                      {info.displayKey ?? group}
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-xl font-black tracking-tight text-foreground md:text-2xl">
                        {info.title[lang]}
                      </h2>
                      <p className="line-clamp-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                        {info.description[lang]}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center self-start rounded-full border px-3 py-1 text-xs font-semibold ${style.chip}`}
                  >
                    {t("traffic_signs.section_count", { count: signs.length })}
                  </span>
                </div>

                <TrafficSignsGrid signs={signs} />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HeroMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-background/80 px-4 py-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}
