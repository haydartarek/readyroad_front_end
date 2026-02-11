'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { useLanguage } from '@/contexts/language-context';
import { convertToPublicImageUrl, FALLBACK_IMAGE } from '@/lib/image-utils';

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
}

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
    A: { en: 'Danger Signs', ar: 'علامات الخطر', nl: 'Gevaarsborden', fr: 'Panneaux de danger' },
    B: { en: 'Priority Signs', ar: 'علامات الأولوية', nl: 'Voorrangsborden', fr: 'Panneaux de priorité' },
    C: { en: 'Prohibition Signs', ar: 'علامات المنع', nl: 'Verbodsborden', fr: 'Panneaux d\'interdiction' },
    D: { en: 'Mandatory Signs', ar: 'علامات الإلزام', nl: 'Gebodsborden', fr: 'Panneaux d\'obligation' },
    F: { en: 'Information Signs', ar: 'علامات المعلومات', nl: 'Aanwijzingsborden', fr: 'Panneaux d\'indication' },
    G: { en: 'Zone Signs', ar: 'علامات المناطق', nl: 'Zoneborden', fr: 'Panneaux de zone' },
    M: { en: 'Additional Signs', ar: 'لوحات إضافية', nl: 'Onderborden', fr: 'Panneaux additionnels' },
    Z: { en: 'Delineation Signs', ar: 'علامات التحديد', nl: 'Afbakeningsborden', fr: 'Panneaux de délimitation' },
};

export default function AdminSignsPage() {
    const { t, language } = useLanguage();
    const [signs, setSigns] = useState<TrafficSign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchSigns();
    }, []);

    const fetchSigns = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get<TrafficSign[]>('/traffic-signs');
            setSigns(response.data);
        } catch (err) {
            console.error('Failed to fetch traffic signs:', err);
            setError(t('admin.signs.fetch_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            setDeleting(true);
            await apiClient.delete(`/admin/signs/${id}`);
            setSigns(prev => prev.filter(s => s.id !== id));
            setDeleteId(null);
        } catch (err) {
            console.error('Failed to delete sign:', err);
        } finally {
            setDeleting(false);
        }
    };

    const getSignName = (sign: TrafficSign): string => {
        const map: Record<string, string> = { en: sign.nameEn, ar: sign.nameAr, nl: sign.nameNl, fr: sign.nameFr };
        return map[language] || sign.nameEn || sign.signCode;
    };

    const categories = useMemo(() => {
        const cats = new Set(signs.map(s => s.categoryCode));
        return Array.from(cats).sort();
    }, [signs]);

    const filteredSigns = useMemo(() => {
        return signs.filter(sign => {
            const matchesCategory = categoryFilter === 'all' || sign.categoryCode === categoryFilter;
            if (!matchesCategory) return false;
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
                sign.signCode.toLowerCase().includes(q) ||
                sign.nameEn?.toLowerCase().includes(q) ||
                sign.nameAr?.toLowerCase().includes(q) ||
                sign.nameNl?.toLowerCase().includes(q) ||
                sign.nameFr?.toLowerCase().includes(q)
            );
        });
    }, [signs, search, categoryFilter]);

    const getCategoryLabel = (code: string): string => {
        return CATEGORY_LABELS[code]?.[language] || CATEGORY_LABELS[code]?.en || code;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-white rounded-lg border p-4 h-20 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-700 font-medium mb-3">{error}</p>
                <button onClick={fetchSigns} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">
                    {t('admin.signs.retry')}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('admin.signs.title')}</h1>
                    <p className="text-gray-600 mt-1">
                        {t('admin.signs.total_count')}: <span className="font-semibold text-gray-900">{signs.length}</span>
                    </p>
                </div>
                <Link
                    href="/admin/signs/new"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    + {t('admin.add_sign')}
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder={t('admin.signs.search_placeholder')}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px] max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                    <option value="all">{t('admin.signs.all_categories')}</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{getCategoryLabel(cat)} ({cat})</option>
                    ))}
                </select>
            </div>

            {/* Results Count */}
            {(search || categoryFilter !== 'all') && (
                <p className="text-sm text-gray-500">
                    {t('admin.signs.showing')} {filteredSigns.length} / {signs.length}
                </p>
            )}

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">{t('admin.signs.col_image')}</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">{t('admin.signs.col_code')}</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">{t('admin.signs.col_name')}</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">{t('admin.signs.col_category')}</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-600">{t('admin.signs.col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredSigns.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                                        {t('admin.signs.no_results')}
                                    </td>
                                </tr>
                            ) : (
                                filteredSigns.map(sign => (
                                    <tr key={sign.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="w-12 h-12 relative rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                                <Image
                                                    src={convertToPublicImageUrl(sign.imageUrl) || FALLBACK_IMAGE}
                                                    alt={sign.signCode}
                                                    fill
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
                                            <span className="text-gray-900">{getSignName(sign)}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                {getCategoryLabel(sign.categoryCode)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {deleteId === sign.id ? (
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleDelete(sign.id)}
                                                        disabled={deleting}
                                                        className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                                                    >
                                                        {deleting ? '...' : t('admin.signs.confirm_delete')}
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteId(null)}
                                                        className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                                                    >
                                                        {t('admin.signs.cancel')}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setDeleteId(sign.id)}
                                                    className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                                                >
                                                    {t('admin.signs.delete')}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
