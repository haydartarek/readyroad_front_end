"use client";

import { TrafficSignsGrid } from "@/components/traffic-signs/traffic-signs-grid";
import { TrafficSignsFilters } from "@/components/traffic-signs/traffic-signs-filters";
import { TrafficSign } from "@/lib/types";
import { apiClient, isServiceUnavailable, logApiError } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import {
  type LangKey,
  GROUP_INFO,
  GROUP_LETTER_ORDER,
} from "@/lib/sign-category-data";

// ─── Constants ──────────────────────────────────────────

const CODE_TO_KEY: Record<string, string> = {
  A: "DANGER",
  B: "PRIORITY",
  C: "PROHIBITION",
  D: "MANDATORY",
  E: "PARKING",
  F: "INFORMATION",
  G: "ADDITIONAL",
  H: "TEMPORARY",
  M: "DELINEATION",
  Z: "ZONE",
};

const CATEGORY_KEY_SUFFIX: Record<string, string> = {
  DANGER: "danger",
  PRIORITY: "priority",
  PROHIBITION: "prohibition",
  MANDATORY: "mandatory",
  PARKING: "parking",
  INFORMATION: "information",
  ADDITIONAL: "supplementary",
  TEMPORARY: "temporary",
  ZONE: "zone",
  DELINEATION: "delineation",
};

const KEY_TO_CODES: Record<string, string[]> = {};
for (const [code, key] of Object.entries(CODE_TO_KEY)) {
  (KEY_TO_CODES[key] ??= []).push(code);
}

// ─── Fetch helper ────────────────────────────────────────

async function getAllTrafficSigns(): Promise<TrafficSign[]> {
  try {
    const res = await apiClient.get<TrafficSign[] | { signs: TrafficSign[] }>(
      API_ENDPOINTS.TRAFFIC_SIGNS.LIST,
    );
    const data = res.data;
    const signs = Array.isArray(data) ? data : (data.signs ?? []);
    return signs.map((sign) => ({
      ...sign,
      category:
        (sign.categoryCode ? CODE_TO_KEY[sign.categoryCode] : undefined) ??
        sign.category ??
        "UNKNOWN",
    }));
  } catch (error) {
    if (isServiceUnavailable(error)) throw error;
    logApiError("Error fetching traffic signs", error);
    return [];
  }
}

// ─── Suspense wrapper ────────────────────────────────────

export default function TrafficSignsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TrafficSignsContent />
    </Suspense>
  );
}

// ─── Shared states ───────────────────────────────────────

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

// ─── Content ─────────────────────────────────────────────

function TrafficSignsContent() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") || "all";
  const search = searchParams.get("search") || "";

  const [allSigns, setAllSigns] = useState<TrafficSign[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getAllTrafficSigns()
      .then((signs) => {
        if (!cancelled) setAllSigns(signs);
      })
      .catch((err) => {
        logApiError("Failed to load signs", err);
        if (!cancelled && isServiceUnavailable(err))
          setServiceUnavailable(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  // ── URL helpers ──
  const updateUrl = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([k, v]) => {
        if (!v || v === "all") sp.delete(k);
        else sp.set(k, v);
      });
      const qs = sp.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  const handleCategoryChange = useCallback(
    (v: string) => updateUrl({ category: v }),
    [updateUrl],
  );
  const handleSearchChange = useCallback(
    (v: string) => updateUrl({ search: v }),
    [updateUrl],
  );
  const handleClearFilters = useCallback(
    () => router.replace(pathname, { scroll: false }),
    [router, pathname],
  );

  // ── Filtering ──
  const filteredSigns = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allSigns.filter((sign) => {
      const matchesCategory =
        category === "all" ||
        (KEY_TO_CODES[category]
          ? KEY_TO_CODES[category].includes(sign.categoryCode ?? "")
          : sign.category?.toLowerCase() === category.toLowerCase());

      const matchesSearch =
        !q ||
        sign.signCode?.toLowerCase().includes(q) ||
        sign.nameEn?.toLowerCase().includes(q) ||
        sign.nameAr?.includes(q) ||
        sign.nameNl?.toLowerCase().includes(q) ||
        sign.nameFr?.toLowerCase().includes(q) ||
        sign.descriptionEn?.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [allSigns, category, search]);

  // ── Alphabetical groups ──
  const groupedSigns = useMemo(() => {
    const groups: Record<string, TrafficSign[]> = {};
    for (const sign of filteredSigns) {
      const letter = sign.signCode?.[0]?.toUpperCase() ?? "?";
      (groups[letter] ??= []).push(sign);
    }
    const ordered = [
      ...GROUP_LETTER_ORDER,
      ...Object.keys(groups)
        .filter((l) => !GROUP_LETTER_ORDER.includes(l))
        .sort(),
    ];
    return ordered
      .filter((l) => groups[l]?.length)
      .map((l) => ({ letter: l, signs: groups[l], info: GROUP_INFO[l] }));
  }, [filteredSigns]);

  // ── Category options ──
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sign of allSigns) {
      const key = sign.category || "UNKNOWN";
      counts[key] = (counts[key] || 0) + 1;
    }
    return [
      {
        value: "all",
        label: t("traffic_signs.category_all_signs"),
        count: allSigns.length,
      },
      ...Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => ({
          value: key,
          label: CATEGORY_KEY_SUFFIX[key]
            ? t(`traffic_signs.category_${CATEGORY_KEY_SUFFIX[key]}`)
            : key,
          count,
        })),
    ];
  }, [allSigns, t]);

  // ── States ──
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

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            {t("traffic_signs.page_title")}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t("traffic_signs.page_subtitle")}
          </p>
        </div>

        {/* Filters */}
        <TrafficSignsFilters
          categories={categories}
          selectedCategory={category}
          searchQuery={search}
          onCategoryChange={handleCategoryChange}
          onSearchChange={handleSearchChange}
          onClearFilters={handleClearFilters}
        />

        {/* Results count */}
        <div className="mb-6 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t("traffic_signs.results_count", { count: filteredSigns.length })}
          </span>
          {filteredSigns.length !== allSigns.length && (
            <span className="text-sm text-muted-foreground">
              {t("traffic_signs.filtered_from")}{" "}
              <span className="font-medium text-foreground">
                {allSigns.length}
              </span>{" "}
              {t("traffic_signs.total")}
            </span>
          )}
          {filteredSigns.length === allSigns.length && (
            <span className="text-sm text-muted-foreground">
              {t("traffic_signs.showing_all")}
            </span>
          )}
        </div>

        {/* Empty state */}
        {filteredSigns.length === 0 && (
          <div className="py-20 text-center space-y-2">
            <div className="text-5xl mb-4">🚧</div>
            <p className="text-lg font-semibold text-foreground">
              {t("traffic_signs.no_results_title")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("traffic_signs.no_results_desc")}
            </p>
          </div>
        )}

        {/* Alphabetical grouped sections */}
        <div className="space-y-16">
          {groupedSigns.map(({ letter, signs: groupSigns, info }) => {
            const lang: LangKey = (
              ["nl", "en", "ar", "fr"] as LangKey[]
            ).includes(language as LangKey)
              ? (language as LangKey)
              : "en";
            const title = info?.title[lang] ?? `${letter}-serie`;
            const description = info?.description[lang] ?? "";
            return (
              <section key={letter} id={`group-${letter}`}>
                {/* Full-width group banner */}
                <div className="relative w-full mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  {/* Decorative gradient bar on the left */}
                  <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-primary via-primary/70 to-primary/30 rounded-l-2xl" />

                  <div className="flex items-center gap-6 px-8 py-6">
                    {/* Letter badge */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary shadow-lg flex items-center justify-center">
                      <span className="text-3xl font-black text-primary-foreground leading-none select-none">
                        {letter}
                      </span>
                    </div>

                    {/* Text block */}
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-black text-foreground mb-1.5 tracking-tight">
                        {title}
                      </h2>
                      <p className="text-sm font-medium text-foreground/75 leading-relaxed">
                        {description}
                      </p>
                    </div>

                    {/* Sign count pill */}
                    <div className="flex-shrink-0 hidden sm:flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex-col gap-0.5">
                      <span className="text-lg font-black text-primary leading-none">
                        {groupSigns.length}
                      </span>
                      <span className="text-[10px] font-medium text-primary/70 uppercase tracking-wide leading-none">
                        signs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Signs grid */}
                <TrafficSignsGrid signs={groupSigns} />
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
