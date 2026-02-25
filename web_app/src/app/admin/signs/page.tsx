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

// ─── Types ─────────────────────────────────────────────

interface TrafficSign {
    id: number;
    signCode: string;
    categoryCode: string;
    nameAr: string;
    nameEn: string;
    nameNl: string;
    nameFr: string;
    descriptionAr: string;
    descriptionEn: string;
    descriptionNl: string;
    descriptionFr: string;
    imageUrl: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface PageResponse {
    items: TrafficSign[];
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
}

interface CategoryOption {
    code: string;
    nameEn: string;
    nameAr: string;
    nameNl: string;
    nameFr: string;
}

// ─── Constants ─────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
    A: { en: 'Danger Signs', ar: 'علامات الخطر', nl: 'Gevaarsborden', fr: 'Panneaux de danger' },
    B: { en: 'Priority Signs', ar: 'علامات الأولوية', nl: 'Voorrangsborden', fr: 'Panneaux de priorité' },
    C: { en: 'Prohibition Signs', ar: 'علامات المنع', nl: 'Verbodsborden', fr: "Panneaux d'interdiction" },
    D: { en: 'Mandatory Signs', ar: 'علامات الإلزام', nl: 'Gebodsborden', fr: "Panneaux d'obligation" },
    E: { en: 'Parking Signs', ar: 'علامات الوقوف', nl: 'Stilstaan en parkeren', fr: 'Stationnement' },
    F: { en: 'Information Signs', ar: 'علامات المعلومات', nl: 'Aanwijzingsborden', fr: "Panneaux d'indication" },
    G: { en: 'Zone Signs', ar: 'علامات المناطق', nl: 'Zoneborden', fr: 'Panneaux de zone' },
    M: { en: 'Additional Signs', ar: 'لوحات إضافية', nl: 'Onderborden', fr: 'Panneaux additionnels' },
    Z: { en: 'Delineation Signs', ar: 'علامات التحديد', nl: 'Afbakeningsborden', fr: 'Panneaux de délimitation' },
};

type SortField = 'signCode' | 'nameEn' | 'nameAr' | 'nameNl' | 'nameFr' | 'categoryCode';
type SortDir = 'asc' | 'desc';

const NAME_SORT_FIELD: Record<string, SortField> = {
    en: 'nameEn', ar: 'nameAr', nl: 'nameNl', fr: 'nameFr',
};

// ─── Component ─────────────────────────────────────────

export default function AdminSignsPage() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // ─── State from URL params ─────────────────────────
    const [signs, setSigns] = useState<TrafficSign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<CategoryOption[]>([]);

    // Pagination / filter state (synced with URL)
    const [page, setPage] = useState(Number(searchParams.get('page')) || 0);
    const [size, setSize] = useState(Number(searchParams.get('size')) || 20);
    const [sortField, setSortField] = useState<SortField>(
        (searchParams.get('sortField') as SortField) || 'signCode'
    );
    const [sortDir, setSortDir] = useState<SortDir>(
        (searchParams.get('sortDir') as SortDir) || 'asc'
    );
    const [categoryFilter, setCategoryFilter] = useState(searchParams.get('categoryCode') || '');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

    // Totals from server
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // UI state
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [serviceUnavailable, setServiceUnavailable] = useState(false);

    // ─── Load categories once ──────────────────────────
    useEffect(() => {
        apiClient.get<CategoryOption[]>('/categories')
            .then(res => setCategories(res.data))
            .catch(() => { });
    }, []);

    // ─── Sync URL ──────────────────────────────────────
    const updateUrl = useCallback((params: Record<string, string | number>) => {
        const sp = new URLSearchParams();
        const merged = { page, size, sortField, sortDir, categoryCode: categoryFilter, q: searchQuery, ...params };
        Object.entries(merged).forEach(([k, v]) => {
            const val = String(v);
            if (k === 'page') {
                sp.set(k, val);
            } else if (val !== '' && val !== '0' && val !== 'undefined' && val !== 'null') {
                sp.set(k, val);
            }
        });
        if (!sp.has('page')) sp.set('page', '0');
        router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    }, [page, size, sortField, sortDir, categoryFilter, searchQuery, pathname, router]);

    // ─── Fetch signs from server ───────────────────────
    const fetchSigns = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params: Record<string, string | number> = {
                page,
                size,
                sort: `${sortField},${sortDir}`,
            };
            if (categoryFilter) params.categoryCode = categoryFilter;
            if (searchQuery) params.q = searchQuery;

            const res = await apiClient.get<PageResponse>(API_ENDPOINTS.ADMIN.SIGNS.LIST, params);
            setSigns(res.data.items);
            setTotalItems(res.data.totalItems);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            logApiError('Failed to fetch admin signs', err);
            if (isServiceUnavailable(err)) {
                setServiceUnavailable(true);
            } else {
                setError(t('admin.signs.fetch_error') || 'Failed to load signs');
            }
        } finally {
            setLoading(false);
        }
    }, [page, size, sortField, sortDir, categoryFilter, searchQuery, t]);

    useEffect(() => {
        fetchSigns();
    }, [fetchSigns]);

    // ─── Debounced search ──────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== searchQuery) {
                setSearchQuery(searchInput);
                setPage(0);
                updateUrl({ q: searchInput, page: 0 });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Toast auto-dismiss ────────────────────────────
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3500);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // ─── Handlers ──────────────────────────────────────

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        updateUrl({ page: newPage });
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(0);
        updateUrl({ size: newSize, page: 0 });
    };

    const handleCategoryChange = (code: string) => {
        setCategoryFilter(code);
        setPage(0);
        updateUrl({ categoryCode: code, page: 0 });
    };

    const handleSort = (field: SortField) => {
        let newDir: SortDir = 'asc';
        // Treat all name fields as the same column for toggle logic
        const isSameColumn = sortField === field || (isNameSortField(field) && isNameSortField(sortField));
        if (isSameColumn) {
            newDir = sortDir === 'asc' ? 'desc' : 'asc';
        }
        setSortField(field);
        setSortDir(newDir);
        setPage(0);
        updateUrl({ sortField: field, sortDir: newDir, page: 0 });
    };

    const handleDelete = async (id: number) => {
        try {
            setDeleting(true);
            await apiClient.delete(API_ENDPOINTS.ADMIN.SIGNS.DELETE(id));
            setDeleteId(null);
            setToast({ message: t('admin.signs.delete_success') || 'Sign deleted successfully', type: 'success' });
            // Re-fetch current page (go back if last item on page)
            if (signs.length === 1 && page > 0) {
                handlePageChange(page - 1);
            } else {
                fetchSigns();
            }
        } catch (err: unknown) {
            logApiError('Failed to delete sign', err);
            if (isServiceUnavailable(err)) {
                setServiceUnavailable(true);
            } else {
                const axiosErr = err as { response?: { status?: number; data?: { error?: string } } };
                const status = axiosErr?.response?.status;
                if (status === 409) {
                    setToast({ message: axiosErr?.response?.data?.error || 'Cannot delete — sign is referenced by other records', type: 'error' });
                } else if (status === 404) {
                    setToast({ message: 'Sign not found — it may have been already deleted', type: 'error' });
                } else {
                    setToast({ message: 'Failed to delete sign', type: 'error' });
                }
            }
            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    };

    const getSignName = (sign: TrafficSign): string => {
        const map: Record<string, string> = { en: sign.nameEn, ar: sign.nameAr, nl: sign.nameNl, fr: sign.nameFr };
        return map[language] || sign.nameEn || sign.signCode;
    };

    const getCategoryLabel = (code: string): string => {
        const cat = categories.find(c => c.code === code);
        if (cat) {
            const map: Record<string, string> = { en: cat.nameEn, ar: cat.nameAr, nl: cat.nameNl, fr: cat.nameFr };
            return map[language] || cat.nameEn;
        }
        return CATEGORY_LABELS[code]?.[language] || CATEGORY_LABELS[code]?.en || code;
    };

    const isNameSortField = (f: SortField) => ['nameEn', 'nameAr', 'nameNl', 'nameFr'].includes(f);

    const SortIcon = ({ field }: { field: SortField }) => {
        const isActive = sortField === field || (isNameSortField(field) && isNameSortField(sortField));
        if (!isActive) return <span className="text-muted-foreground ml-1">↕</span>;
        return <span className="text-blue-600 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
    };

    const startIdx = totalItems > 0 ? page * size + 1 : 0;
    const endIdx = Math.min((page + 1) * size, totalItems);

    // ─── Render ────────────────────────────────────────

    if (loading && signs.length === 0) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-muted rounded w-64 animate-pulse" />
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-card rounded-lg border p-4 h-16 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error && signs.length === 0) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-700 font-medium mb-3">{error}</p>
                <button onClick={fetchSigns} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">
                    {t('admin.signs.retry') || 'Retry'}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {serviceUnavailable && <ServiceUnavailableBanner onRetry={fetchSigns} className="mb-4" />}

            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('admin.signs.title') || 'Traffic Signs'}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t('admin.signs.total_count') || 'Total'}: <span className="font-semibold text-foreground">{totalItems}</span>
                    </p>
                </div>
                <Link
                    href="/admin/signs/new"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    + {t('admin.add_sign') || 'Add Sign'}
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <input
                    type="text"
                    placeholder={t('admin.signs.search_placeholder') || 'Search signs...'}
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    className="flex-1 min-w-[200px] max-w-sm rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                />
                <select
                    value={categoryFilter}
                    onChange={e => handleCategoryChange(e.target.value)}
                    className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-card"
                >
                    <option value="">{t('admin.signs.all_categories') || 'All Categories'}</option>
                    {categories.map(cat => (
                        <option key={cat.code} value={cat.code}>{getCategoryLabel(cat.code)} ({cat.code})</option>
                    ))}
                </select>
                <select
                    value={size}
                    onChange={e => handleSizeChange(Number(e.target.value))}
                    className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-card"
                >
                    {PAGE_SIZE_OPTIONS.map(s => (
                        <option key={s} value={s}>{s} {t('admin.signs.per_page') || 'per page'}</option>
                    ))}
                </select>

                {loading && (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
            </div>

            {/* Results Count */}
            {totalItems > 0 && (
                <p className="text-sm text-muted-foreground">
                    {t('admin.signs.showing') || 'Showing'} {startIdx}–{endIdx} / {totalItems}
                </p>
            )}

            {/* Table */}
            <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted border-b">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-16">
                                    {t('admin.signs.col_image') || 'Image'}
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('signCode')}>
                                    {t('admin.signs.col_code') || 'Code'}<SortIcon field="signCode" />
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort(NAME_SORT_FIELD[language] || 'nameEn')}>
                                    {t('admin.signs.col_name') || 'Name'}<SortIcon field={NAME_SORT_FIELD[language] || 'nameEn'} />
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('categoryCode')}>
                                    {t('admin.signs.col_category') || 'Category'}<SortIcon field="categoryCode" />
                                </th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                    {t('admin.signs.col_actions') || 'Actions'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {signs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                                        {t('admin.signs.no_results') || 'No signs found'}
                                    </td>
                                </tr>
                            ) : (
                                signs.map(sign => (
                                    <React.Fragment key={sign.id}>
                                        <tr className="hover:bg-muted transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="w-12 h-12 relative rounded overflow-hidden bg-muted flex-shrink-0">
                                                    <Image
                                                        src={convertToPublicImageUrl(sign.imageUrl) || FALLBACK_IMAGE}
                                                        alt={sign.signCode}
                                                        fill
                                                        unoptimized
                                                        className="object-contain p-1"
                                                        sizes="48px"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                                    {sign.signCode}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-foreground">{getSignName(sign)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                                                    {getCategoryLabel(sign.categoryCode)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        onClick={() => setExpandedId(expandedId === sign.id ? null : sign.id)}
                                                        className="text-xs text-muted-foreground hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                                        title={t('admin.signs.view') || 'View'}
                                                    >
                                                        {expandedId === sign.id ? '▲' : '▼'}
                                                    </button>
                                                    <Link
                                                        href={`/admin/signs/${sign.id}/edit`}
                                                        className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                                    >
                                                        {t('admin.signs.edit') || 'Edit'}
                                                    </Link>
                                                    {deleteId === sign.id ? (
                                                        <div className="inline-flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleDelete(sign.id)}
                                                                disabled={deleting}
                                                                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                                                            >
                                                                {deleting ? '...' : (t('admin.signs.confirm_delete') || 'Confirm')}
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteId(null)}
                                                                className="text-xs bg-muted text-foreground px-2 py-1 rounded hover:bg-accent"
                                                            >
                                                                {t('admin.signs.cancel') || 'Cancel'}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setDeleteId(sign.id)}
                                                            className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                                        >
                                                            {t('admin.signs.delete') || 'Delete'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === sign.id && (
                                            <tr className="bg-blue-50/50">
                                                <td colSpan={5} className="px-6 py-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        <DetailLang label="English" name={sign.nameEn} desc={sign.descriptionEn} />
                                                        <DetailLang label="العربية" name={sign.nameAr} desc={sign.descriptionAr} dir="rtl" />
                                                        <DetailLang label="Nederlands" name={sign.nameNl} desc={sign.descriptionNl} />
                                                        <DetailLang label="Français" name={sign.nameFr} desc={sign.descriptionFr} />
                                                    </div>
                                                    {sign.imageUrl && (
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground">URL:</span>
                                                            <code className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground break-all">{sign.imageUrl}</code>
                                                        </div>
                                                    )}
                                                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span>ID: {sign.id}</span>
                                                        <span>Active: {sign.isActive ? '✓' : '✗'}</span>
                                                        {sign.createdAt && <span>Created: {new Date(sign.createdAt).toLocaleDateString()}</span>}
                                                        {sign.updatedAt && <span>Updated: {new Date(sign.updatedAt).toLocaleDateString()}</span>}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted">
                        <p className="text-xs text-muted-foreground">
                            Page {page + 1} of {totalPages}
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => handlePageChange(0)} disabled={page <= 0}
                                className="px-2 py-1 text-xs rounded border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
                                ««
                            </button>
                            <button onClick={() => handlePageChange(page - 1)} disabled={page <= 0}
                                className="px-2 py-1 text-xs rounded border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
                                «
                            </button>
                            {generatePageNumbers(page, totalPages).map((p, idx, arr) => (
                                <span key={`${p}-${idx}`}>
                                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                                        <span className="px-1 text-muted-foreground text-xs">…</span>
                                    )}
                                    <button
                                        onClick={() => handlePageChange(p)}
                                        className={`px-2.5 py-1 text-xs rounded border ${p === page
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'border-border bg-card hover:bg-muted text-foreground'
                                            }`}
                                    >
                                        {p + 1}
                                    </button>
                                </span>
                            ))}
                            <button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages - 1}
                                className="px-2 py-1 text-xs rounded border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
                                »
                            </button>
                            <button onClick={() => handlePageChange(totalPages - 1)} disabled={page >= totalPages - 1}
                                className="px-2 py-1 text-xs rounded border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
                                »»
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Helpers ───────────────────────────────────────────

function generatePageNumbers(current: number, total: number): number[] {
    const pages: number[] = [];
    for (let i = 0; i < total; i++) {
        if (i === 0 || i === total - 1 || Math.abs(i - current) <= 2) {
            pages.push(i);
        }
    }
    return pages;
}

function DetailLang({ label, name, desc, dir }: { label: string; name: string; desc: string; dir?: string }) {
    return (
        <div className="rounded-lg border border-border bg-card p-3" dir={dir}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
            <p className="text-sm font-medium text-foreground">{name || '—'}</p>
            {desc && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{desc}</p>}
        </div>
    );
}
