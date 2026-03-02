'use client';

import { TrafficSignsGrid } from '@/components/traffic-signs/traffic-signs-grid';
import { TrafficSignsFilters } from '@/components/traffic-signs/traffic-signs-filters';
import { TrafficSign } from '@/lib/types';
import { apiClient, isServiceUnavailable, logApiError } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

// ─── Constants ──────────────────────────────────────────

const CODE_TO_KEY: Record<string, string> = {
  A: 'DANGER',      B: 'PRIORITY',    C: 'PROHIBITION',
  D: 'MANDATORY',   E: 'PARKING',     F: 'INFORMATION',
  G: 'ADDITIONAL',  H: 'TEMPORARY',   M: 'DELINEATION',
  Z: 'ZONE',
};

const CATEGORY_LABELS: Record<string, string> = {
  DANGER:      'Danger Signs',        PRIORITY:    'Priority Signs',
  PROHIBITION: 'Prohibition Signs',   MANDATORY:   'Mandatory Signs',
  PARKING:     'Parking Signs',       INFORMATION: 'Information Signs',
  ADDITIONAL:  'Supplementary Signs', TEMPORARY:   'Temporary Signs',
  ZONE:        'Zone Signs',          DELINEATION: 'Delineation Signs',
};

const KEY_TO_CODES: Record<string, string[]> = {};
for (const [code, key] of Object.entries(CODE_TO_KEY)) {
  (KEY_TO_CODES[key] ??= []).push(code);
}

// ─── Fetch helper ────────────────────────────────────────

async function getAllTrafficSigns(): Promise<TrafficSign[]> {
  try {
    const res  = await apiClient.get<TrafficSign[] | { signs: TrafficSign[] }>(API_ENDPOINTS.TRAFFIC_SIGNS.LIST);
    const data = res.data;
    const signs = Array.isArray(data) ? data : (data.signs ?? []);
    return signs.map(sign => ({
      ...sign,
      category: (sign.categoryCode ? CODE_TO_KEY[sign.categoryCode] : undefined)
        ?? sign.category
        ?? 'UNKNOWN',
    }));
  } catch (error) {
    if (isServiceUnavailable(error)) throw error;
    logApiError('Error fetching traffic signs', error);
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
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Loading traffic signs...</p>
      </div>
    </div>
  );
}

// ─── Content ─────────────────────────────────────────────

function TrafficSignsContent() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const category = searchParams.get('category') || 'all';
  const search   = searchParams.get('search')   || '';

  const [allSigns, setAllSigns]         = useState<TrafficSign[]>([]);
  const [loading, setLoading]           = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey]         = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getAllTrafficSigns()
      .then(signs => { if (!cancelled) setAllSigns(signs); })
      .catch(err  => {
        logApiError('Failed to load signs', err);
        if (!cancelled && isServiceUnavailable(err)) setServiceUnavailable(true);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetchKey]);

  // ── URL helpers ──
  const updateUrl = useCallback((params: Record<string, string>) => {
    const sp = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (!v || v === 'all') sp.delete(k); else sp.set(k, v);
    });
    const qs = sp.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const handleCategoryChange = useCallback((v: string) => updateUrl({ category: v }), [updateUrl]);
  const handleSearchChange   = useCallback((v: string) => updateUrl({ search: v }),   [updateUrl]);
  const handleClearFilters   = useCallback(() => router.replace(pathname, { scroll: false }), [router, pathname]);

  // ── Filtering ──
  const filteredSigns = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allSigns.filter(sign => {
      const matchesCategory =
        category === 'all' ||
        (KEY_TO_CODES[category]
          ? KEY_TO_CODES[category].includes(sign.categoryCode ?? '')
          : sign.category?.toLowerCase() === category.toLowerCase());

      const matchesSearch =
        !q ||
        sign.signCode?.toLowerCase().includes(q)   ||
        sign.nameEn?.toLowerCase().includes(q)     ||
        sign.nameAr?.includes(q)                   ||
        sign.nameNl?.toLowerCase().includes(q)     ||
        sign.nameFr?.toLowerCase().includes(q)     ||
        sign.descriptionEn?.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [allSigns, category, search]);

  // ── Category options ──
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
        .map(([key, count]) => ({ value: key, label: CATEGORY_LABELS[key] || key, count })),
    ];
  }, [allSigns]);

  // ── States ──
  if (serviceUnavailable) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ServiceUnavailableBanner
          onRetry={() => { setServiceUnavailable(false); setFetchKey(k => k + 1); }}
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
        <div className="mb-6 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {filteredSigns.length} signs
          </span>
          {filteredSigns.length !== allSigns.length && (
            <span className="text-sm text-muted-foreground">
              filtered from <span className="font-medium text-foreground">{allSigns.length}</span> total
            </span>
          )}
          {filteredSigns.length === allSigns.length && (
            <span className="text-sm text-muted-foreground">showing all signs</span>
          )}
        </div>

        {/* Signs Grid */}
        <TrafficSignsGrid signs={filteredSigns} />

        {/* Empty state */}
        {filteredSigns.length === 0 && (
          <div className="py-20 text-center space-y-2">
            <div className="text-5xl mb-4">🚧</div>
            <p className="text-lg font-semibold text-foreground">No signs found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
