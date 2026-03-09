'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { apiClient, isServiceUnavailable, logApiError } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useLanguage } from '@/contexts/language-context';
import { convertToPublicImageUrl, FALLBACK_IMAGE } from '@/lib/image-utils';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Plus, Search, ChevronDown, ChevronUp, Pencil, Trash2,
  CheckCircle2, AlertTriangle,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────

interface TrafficSign {
  id: number; signCode: string; categoryCode: string;
  nameAr: string; nameEn: string; nameNl: string; nameFr: string;
  descriptionAr: string; descriptionEn: string; descriptionNl: string; descriptionFr: string;
  imageUrl: string; isActive: boolean; createdAt: string; updatedAt: string;
}
interface PageResponse {
  items: TrafficSign[]; page: number; size: number;
  totalItems: number; totalPages: number;
}
interface CategoryOption {
  code: string; nameEn: string; nameAr: string; nameNl: string; nameFr: string;
}

// ─── Constants ─────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  A: { en: 'Danger Signs',      ar: 'علامات الخطر',      nl: 'Gevaarsborden',          fr: 'Panneaux de danger'       },
  B: { en: 'Priority Signs',    ar: 'علامات الأولوية',   nl: 'Voorrangsborden',         fr: 'Panneaux de priorité'     },
  C: { en: 'Prohibition Signs', ar: 'علامات المنع',       nl: 'Verbodsborden',           fr: "Panneaux d'interdiction"  },
  D: { en: 'Mandatory Signs',   ar: 'علامات الإلزام',    nl: 'Gebodsborden',            fr: "Panneaux d'obligation"    },
  E: { en: 'Parking Signs',     ar: 'علامات الوقوف',     nl: 'Stilstaan en parkeren',   fr: 'Stationnement'            },
  F: { en: 'Information Signs', ar: 'علامات المعلومات',  nl: 'Aanwijzingsborden',       fr: "Panneaux d'indication"    },
  G: { en: 'Zone Signs',        ar: 'علامات المناطق',    nl: 'Zoneborden',              fr: 'Panneaux de zone'         },
  M: { en: 'Additional Signs',  ar: 'لوحات إضافية',      nl: 'Onderborden',             fr: 'Panneaux additionnels'    },
  Z: { en: 'Delineation Signs', ar: 'علامات التحديد',    nl: 'Afbakeningsborden',       fr: 'Panneaux de délimitation' },
};

const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  A: 'bg-red-500/10 text-red-600 border-red-200',
  B: 'bg-amber-500/10 text-amber-600 border-amber-200',
  C: 'bg-orange-500/10 text-orange-600 border-orange-200',
  D: 'bg-blue-500/10 text-blue-600 border-blue-200',
  E: 'bg-slate-500/10 text-slate-600 border-slate-200',
  F: 'bg-green-500/10 text-green-600 border-green-200',
  G: 'bg-purple-500/10 text-purple-600 border-purple-200',
  M: 'bg-gray-500/10 text-gray-600 border-gray-200',
  Z: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
};

type SortField = 'signCode' | 'nameEn' | 'nameAr' | 'nameNl' | 'nameFr' | 'categoryCode';
type SortDir   = 'asc' | 'desc';

const NAME_SORT_FIELD: Record<string, SortField> = {
  en: 'nameEn', ar: 'nameAr', nl: 'nameNl', fr: 'nameFr',
};

// ─── Helpers ────────────────────────────────────────────

function generatePageNumbers(current: number, total: number): number[] {
  const pages: number[] = [];
  for (let i = 0; i < total; i++) {
    if (i === 0 || i === total - 1 || Math.abs(i - current) <= 2) pages.push(i);
  }
  return pages;
}

function DetailLang({ label, name, desc, dir }: {
  label: string; name: string; desc: string; dir?: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/30 p-3" dir={dir}>
      <p className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-semibold text-foreground">{name || '—'}</p>
      {desc && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{desc}</p>}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────

export default function AdminSignsPage() {
  const { t, language } = useLanguage();
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();

  const [signs, setSigns]           = useState<TrafficSign[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [page, setPage]               = useState(Number(searchParams.get('page')) || 0);
  const [size, setSize]               = useState(Number(searchParams.get('size')) || 20);
  const [sortField, setSortField]     = useState<SortField>((searchParams.get('sortField') as SortField) || 'signCode');
  const [sortDir, setSortDir]         = useState<SortDir>((searchParams.get('sortDir') as SortDir) || 'asc');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('categoryCode') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [totalItems, setTotalItems]   = useState(0);
  const [totalPages, setTotalPages]   = useState(0);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteId, setDeleteId]     = useState<number | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [toast, setToast]           = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  useEffect(() => {
    apiClient.get<CategoryOption[]>('/categories')
      .then(res => setCategories(res.data))
      .catch(() => {});
  }, []);

  const updateUrl = useCallback((params: Record<string, string | number>) => {
    const sp = new URLSearchParams();
    const merged = { page, size, sortField, sortDir, categoryCode: categoryFilter, q: searchQuery, ...params };
    Object.entries(merged).forEach(([k, v]) => {
      const val = String(v);
      if (k === 'page') sp.set(k, val);
      else if (val !== '' && val !== '0' && val !== 'undefined' && val !== 'null') sp.set(k, val);
    });
    if (!sp.has('page')) sp.set('page', '0');
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }, [page, size, sortField, sortDir, categoryFilter, searchQuery, pathname, router]);

  const fetchSigns = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const params: Record<string, string | number> = { page, size, sort: `${sortField},${sortDir}` };
      if (categoryFilter) params.categoryCode = categoryFilter;
      if (searchQuery)    params.q            = searchQuery;
      const res = await apiClient.get<PageResponse>(API_ENDPOINTS.ADMIN.SIGNS.LIST, params);
      setSigns(res.data.items);
      setTotalItems(res.data.totalItems);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      logApiError('Failed to fetch admin signs', err);
      if (isServiceUnavailable(err)) setServiceUnavailable(true);
      else setError(t('admin.signs.fetch_error') || 'Failed to load signs');
    } finally {
      setLoading(false);
    }
  }, [page, size, sortField, sortDir, categoryFilter, searchQuery, t]);

  useEffect(() => { fetchSigns(); }, [fetchSigns]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        setSearchQuery(searchInput); setPage(0); updateUrl({ q: searchInput, page: 0 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line

  useEffect(() => {
    if (toast) { const id = setTimeout(() => setToast(null), 3500); return () => clearTimeout(id); }
  }, [toast]);

  const handlePageChange       = (p: number) => { setPage(p); updateUrl({ page: p }); };
  const handleSizeChange       = (s: number) => { setSize(s); setPage(0); updateUrl({ size: s, page: 0 }); };
  const handleCategoryChange   = (c: string) => { setCategoryFilter(c); setPage(0); updateUrl({ categoryCode: c, page: 0 }); };

  const isNameSortField = (f: SortField) => ['nameEn', 'nameAr', 'nameNl', 'nameFr'].includes(f);

  const handleSort = (field: SortField) => {
    const isSame = sortField === field || (isNameSortField(field) && isNameSortField(sortField));
    const newDir: SortDir = isSame && sortDir === 'asc' ? 'desc' : 'asc';
    setSortField(field); setSortDir(newDir); setPage(0);
    updateUrl({ sortField: field, sortDir: newDir, page: 0 });
  };

  const handleDelete = async (id: number) => {
    try {
      setDeleting(true);
      await apiClient.delete(API_ENDPOINTS.ADMIN.SIGNS.DELETE(id));
      setDeleteId(null);
      setToast({ message: t('admin.signs.delete_success') || 'Sign deleted successfully', type: 'success' });
      if (signs.length === 1 && page > 0) handlePageChange(page - 1);
      else fetchSigns();
    } catch (err: unknown) {
      logApiError('Failed to delete sign', err);
      if (isServiceUnavailable(err)) {
        setServiceUnavailable(true);
      } else {
        const axiosErr = err as { response?: { status?: number; data?: { error?: string } } };
        const status = axiosErr?.response?.status;
        const msg = status === 409
          ? (axiosErr?.response?.data?.error || 'Cannot delete — sign is referenced by other records')
          : status === 404 ? 'Sign not found — already deleted'
          : 'Failed to delete sign';
        setToast({ message: msg, type: 'error' });
      }
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const getSignName    = (sign: TrafficSign) => ({ en: sign.nameEn, ar: sign.nameAr, nl: sign.nameNl, fr: sign.nameFr })[language] || sign.nameEn || sign.signCode;
  const getCategoryLabel = (code: string) => {
    const cat = categories.find(c => c.code === code);
    if (cat) return ({ en: cat.nameEn, ar: cat.nameAr, nl: cat.nameNl, fr: cat.nameFr })[language] || cat.nameEn;
    return CATEGORY_LABELS[code]?.[language] || CATEGORY_LABELS[code]?.en || code;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    const active = sortField === field || (isNameSortField(field) && isNameSortField(sortField));
    return active
      ? <span className="text-primary ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
      : <span className="text-muted-foreground/40 ml-1">↕</span>;
  };

  const startIdx = totalItems > 0 ? page * size + 1 : 0;
  const endIdx   = Math.min((page + 1) * size, totalItems);

  // ── Loading skeleton ──
  if (loading && signs.length === 0) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 bg-muted rounded-xl w-64" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-card rounded-2xl border border-border/50 h-16" />
          ))}
        </div>
      </div>
    );
  }

  // ── Full error state ──
  if (error && signs.length === 0) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
        <p className="text-destructive font-semibold">{error}</p>
        <Button variant="outline" onClick={fetchSigns}>
          {t('admin.signs.retry') || 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {serviceUnavailable && <ServiceUnavailableBanner onRetry={fetchSigns} />}

      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-300',
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-destructive text-white'
        )}>
          {toast.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('admin.signs.title') || 'Traffic Signs'}</h1>
          <p className="text-muted-foreground mt-1">
            {t('admin.signs.total_count') || 'Total'}:{' '}
            <span className="font-bold text-foreground">{totalItems}</span>
          </p>
        </div>
        <Button asChild className="gap-2 shadow-md shadow-primary/20">
          <Link href="/admin/signs/new">
            <Plus className="w-4 h-4" />
            {t('admin.add_sign') || 'Add Sign'}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('admin.signs.search_placeholder') || 'Search signs...'}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <select
          value={categoryFilter} onChange={e => handleCategoryChange(e.target.value)}
          className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">{t('admin.signs.all_categories') || 'All Categories'}</option>
          {categories.map(cat => (
            <option key={cat.code} value={cat.code}>{getCategoryLabel(cat.code)} ({cat.code})</option>
          ))}
        </select>
        <select
          value={size} onChange={e => handleSizeChange(Number(e.target.value))}
          className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {PAGE_SIZE_OPTIONS.map(s => (
            <option key={s} value={s}>{s} {t('admin.signs.per_page')}</option>
          ))}
        </select>
        {loading && (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {totalItems > 0 && (
        <p className="text-sm text-muted-foreground">
          {t('admin.signs.showing')} <span className="font-semibold text-foreground">{startIdx}–{endIdx}</span> {t('admin.signs.of')}{' '}
          <span className="font-semibold text-foreground">{totalItems}</span>
        </p>
      )}

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border/40">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 text-left font-semibold w-16">
                  {t('admin.signs.col_image') || 'Image'}
                </th>
                <th className="px-4 py-3 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('signCode')}>
                  {t('admin.signs.col_code') || 'Code'}<SortIcon field="signCode" />
                </th>
                <th className="px-4 py-3 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort(NAME_SORT_FIELD[language] || 'nameEn')}>
                  {t('admin.signs.col_name') || 'Name'}<SortIcon field={NAME_SORT_FIELD[language] || 'nameEn'} />
                </th>
                <th className="px-4 py-3 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('categoryCode')}>
                  {t('admin.signs.col_category') || 'Category'}<SortIcon field="categoryCode" />
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  {t('admin.signs.col_actions') || 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {signs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="space-y-2">
                      <div className="text-4xl">🚦</div>
                      <p className="text-muted-foreground">{t('admin.signs.no_results') || 'No signs found'}</p>
                    </div>
                  </td>
                </tr>
              ) : signs.map(sign => (
                <React.Fragment key={sign.id}>
                  <tr className="hover:bg-muted/30 transition-colors">
                    {/* Image */}
                    <td className="px-4 py-3">
                      <div className="w-11 h-11 relative rounded-xl overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={convertToPublicImageUrl(sign.imageUrl) || FALLBACK_IMAGE}
                          alt={sign.signCode} fill unoptimized
                          className="object-contain p-1" sizes="44px"
                          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                        />
                      </div>
                    </td>
                    {/* Code */}
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg text-xs">
                        {sign.signCode}
                      </span>
                    </td>
                    {/* Name */}
                    <td className="px-4 py-3">
                      <span className="text-foreground text-sm">{getSignName(sign)}</span>
                    </td>
                    {/* Category */}
                    <td className="px-4 py-3">
                      <Badge className={cn(
                        'text-xs font-semibold border',
                        CATEGORY_BADGE_CLASSES[sign.categoryCode?.charAt(0)?.toUpperCase()] ||
                        'bg-muted text-muted-foreground border-border'
                      )}>
                        {getCategoryLabel(sign.categoryCode)}
                      </Badge>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setExpandedId(expandedId === sign.id ? null : sign.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                        >
                          {expandedId === sign.id
                            ? <ChevronUp className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <Link
                          href={`/admin/signs/${sign.id}/edit`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        {deleteId === sign.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(sign.id)} disabled={deleting}
                              className="px-2 py-1 text-xs rounded-lg bg-destructive text-white hover:opacity-90 disabled:opacity-50 font-semibold transition-opacity"
                            >
                              {deleting ? '...' : t('admin.signs.confirm_delete')}
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="px-2 py-1 text-xs rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                            >
                              {t('admin.signs.cancel')}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(sign.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {expandedId === sign.id && (
                    <tr className="bg-primary/5">
                      <td colSpan={5} className="px-6 py-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <DetailLang label="English"    name={sign.nameEn} desc={sign.descriptionEn} />
                          <DetailLang label="العربية"   name={sign.nameAr} desc={sign.descriptionAr} dir="rtl" />
                          <DetailLang label="Nederlands" name={sign.nameNl} desc={sign.descriptionNl} />
                          <DetailLang label="Français"   name={sign.nameFr} desc={sign.descriptionFr} />
                        </div>
                        {sign.imageUrl && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-semibold">URL:</span>
                            <code className="text-xs bg-muted px-2 py-0.5 rounded-lg text-muted-foreground break-all">
                              {sign.imageUrl}
                            </code>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/40">
                          <span>ID: <strong>{sign.id}</strong></span>
                          <span>Active: <strong>{sign.isActive ? '✓' : '✗'}</strong></span>
                          {sign.createdAt && <span>Created: {new Date(sign.createdAt).toLocaleDateString()}</span>}
                          {sign.updatedAt && <span>Updated: {new Date(sign.updatedAt).toLocaleDateString()}</span>}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/30">
            <p className="text-xs text-muted-foreground font-medium">
              Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong>
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => handlePageChange(0)} disabled={page <= 0}
                className="w-7 h-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handlePageChange(page - 1)} disabled={page <= 0}
                className="w-7 h-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {generatePageNumbers(page, totalPages).map((p, idx, arr) => (
                <span key={`${p}-${idx}`} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-muted-foreground text-xs">…</span>
                  )}
                  <button
                    onClick={() => handlePageChange(p)}
                    className={cn(
                      'w-7 h-7 rounded-lg text-xs font-semibold transition-all',
                      p === page
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'border border-border/50 text-foreground hover:bg-muted'
                    )}
                  >
                    {p + 1}
                  </button>
                </span>
              ))}
              <button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages - 1}
                className="w-7 h-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handlePageChange(totalPages - 1)} disabled={page >= totalPages - 1}
                className="w-7 h-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
