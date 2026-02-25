'use client';

import { TrafficSignsGrid } from '@/components/traffic-signs/traffic-signs-grid';
import { TrafficSignsFilters } from '@/components/traffic-signs/traffic-signs-filters';
import { TrafficSign } from '@/lib/types';
import { apiClient, isServiceUnavailable, logApiError } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

// ─── Category code → key mapping ────────────────────────
// Each sign from the API has categoryCode (A, B, C…).
// We map them to stable uppercase keys for filtering.

const CODE_TO_KEY: Record<string, string> = {
  A: 'DANGER',
  B: 'PRIORITY',
  C: 'PROHIBITION',
  D: 'MANDATORY',
  E: 'PARKING',
  F: 'INFORMATION',
  G: 'ADDITIONAL',
  H: 'TEMPORARY',
  M: 'DELINEATION',
  Z: 'ZONE',
};

const CATEGORY_LABELS: Record<string, string> = {
  DANGER: 'Danger Signs',
  PRIORITY: 'Priority Signs',
  PROHIBITION: 'Prohibition Signs',
  MANDATORY: 'Mandatory Signs',
  PARKING: 'Parking Signs',
  INFORMATION: 'Information Signs',
  ADDITIONAL: 'Supplementary Signs',
  TEMPORARY: 'Temporary Signs',
  ZONE: 'Zone Signs',
  DELINEATION: 'Delineation Signs',
};

// Build a reverse map  KEY → [codes]  (for filtering)
const KEY_TO_CODES: Record<string, string[]> = {};
for (const [code, key] of Object.entries(CODE_TO_KEY)) {
  if (!KEY_TO_CODES[key]) KEY_TO_CODES[key] = [];
  KEY_TO_CODES[key].push(code);
}

// ─── Fetch helper ────────────────────────────────────────

async function getAllTrafficSigns(): Promise<TrafficSign[]> {
  try {
    const response = await apiClient.get<TrafficSign[] | { signs: TrafficSign[] }>(API_ENDPOINTS.TRAFFIC_SIGNS.LIST);
    const data = response.data;
    const signs = Array.isArray(data) ? data : (data.signs || []);

    return signs.map((sign: TrafficSign) => ({
      ...sign,
      category: (sign.categoryCode ? CODE_TO_KEY[sign.categoryCode] : undefined) || sign.category || 'UNKNOWN',
    })) as TrafficSign[];
  } catch (error) {
    if (isServiceUnavailable(error)) throw error;
    logApiError('Error fetching traffic signs', error);
    return [];
  }
}

// ─── Page component ──────────────────────────────────────

/** Default export wraps in Suspense (required for useSearchParams in App Router) */
export default function TrafficSignsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-lg text-muted-foreground">Loading traffic signs...</p>
        </div>
      }
    >
      <TrafficSignsContent />
    </Suspense>
  );
}

function TrafficSignsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read filter state from URL so buttons & results stay in sync
  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('search') || '';

  const [allSigns, setAllSigns] = useState<TrafficSign[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    async function loadSigns() {
      try {
        const signs = await getAllTrafficSigns();
        setAllSigns(signs);
      } catch (error) {
        logApiError('Failed to load signs', error);
        if (isServiceUnavailable(error)) {
          setServiceUnavailable(true);
        }
      } finally {
        setLoading(false);
      }
    }
    loadSigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey]);

  // ─── URL helpers ─────────────────────────────────────
  const updateUrl = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([k, v]) => {
        if (!v || v === 'all') {
          sp.delete(k);
        } else {
          sp.set(k, v);
        }
      });
      const qs = sp.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  const handleCategoryChange = useCallback(
    (value: string) => updateUrl({ category: value }),
    [updateUrl],
  );

  const handleSearchChange = useCallback(
    (value: string) => updateUrl({ search: value }),
    [updateUrl],
  );

  const handleClearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  // ─── Filtering (client-side, code-based) ─────────────
  const filteredSigns = useMemo(() => {
    const q = search.trim().toLowerCase();

    return allSigns.filter((sign) => {
      // Category match: use the codes array for the selected key
      const matchesCategory =
        category === 'all' ||
        (KEY_TO_CODES[category]
          ? KEY_TO_CODES[category].includes(sign.categoryCode ?? '')
          : sign.category?.toLowerCase() === category.toLowerCase());

      // Text search across all name fields + description
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

  // ─── Build category options from actual data ─────────
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sign of allSigns) {
      const key = sign.category || 'UNKNOWN';
      counts[key] = (counts[key] || 0) + 1;
    }

    return [
      { value: 'all', label: 'All Signs', count: allSigns.length },
      ...Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => ({
          value: key,
          label: CATEGORY_LABELS[key] || key,
          count,
        })),
    ];
  }, [allSigns]);

  // ─── Render ──────────────────────────────────────────
  if (serviceUnavailable) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ServiceUnavailableBanner onRetry={() => { setServiceUnavailable(false); setFetchKey(k => k + 1); }} className="mb-4" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading traffic signs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            Belgian Traffic Signs
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Learn all Belgian traffic signs with detailed explanations in 4 languages.
            Essential for passing your driving license exam.
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
        <div className="mb-6 text-sm text-muted-foreground">
          Showing {filteredSigns.length} of {allSigns.length} signs
        </div>

        {/* Signs Grid */}
        <TrafficSignsGrid signs={filteredSigns} />

        {/* Empty state */}
        {filteredSigns.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">No signs found matching your criteria.</p>
            <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
