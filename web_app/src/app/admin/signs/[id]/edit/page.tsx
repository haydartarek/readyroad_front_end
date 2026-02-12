'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useLanguage } from '@/contexts/language-context';
import { convertToPublicImageUrl, FALLBACK_IMAGE } from '@/lib/image-utils';

// ─── Types ─────────────────────────────────────────────

interface SignForm {
    signCode: string;
    categoryCode: string;
    nameEn: string;
    nameAr: string;
    nameNl: string;
    nameFr: string;
    descriptionEn: string;
    descriptionAr: string;
    descriptionNl: string;
    descriptionFr: string;
    imageUrl: string;
}

interface CategoryOption {
    code: string;
    nameEn: string;
    nameAr: string;
    nameNl: string;
    nameFr: string;
}

interface AdminSign {
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

// ─── Component ─────────────────────────────────────────

export default function AdminEditSignPage() {
    const router = useRouter();
    const params = useParams();
    const signId = params.id as string;
    const { t, language } = useLanguage();

    const [form, setForm] = useState<SignForm>({
        signCode: '', categoryCode: '',
        nameEn: '', nameAr: '', nameNl: '', nameFr: '',
        descriptionEn: '', descriptionAr: '', descriptionNl: '', descriptionFr: '',
        imageUrl: '',
    });
    const [originalCode, setOriginalCode] = useState('');
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // ─── Load data (single sign fetch via GET /api/admin/signs/{id}) ──
    useEffect(() => {
        Promise.all([
            apiClient.get<CategoryOption[]>('/categories').catch(() => ({ data: [] as CategoryOption[] })),
            apiClient.get<AdminSign>(API_ENDPOINTS.ADMIN.SIGNS.DETAIL(signId)),
        ]).then(([catRes, signRes]) => {
            setCategories(catRes.data);
            const sign = signRes.data;
            setOriginalCode(sign.signCode);
            setForm({
                signCode: sign.signCode || '',
                categoryCode: sign.categoryCode || '',
                nameEn: sign.nameEn || '',
                nameAr: sign.nameAr || '',
                nameNl: sign.nameNl || '',
                nameFr: sign.nameFr || '',
                descriptionEn: sign.descriptionEn || '',
                descriptionAr: sign.descriptionAr || '',
                descriptionNl: sign.descriptionNl || '',
                descriptionFr: sign.descriptionFr || '',
                imageUrl: sign.imageUrl || '',
            });
        }).catch((err) => {
            console.error('Failed to load sign:', err);
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 404) {
                setErrorMsg(t('admin.signs.edit_not_found') || 'Sign not found');
            } else {
                setErrorMsg(t('admin.signs.fetch_error') || 'Failed to load sign data');
            }
        }).finally(() => {
            setLoading(false);
        });
    }, [signId, t]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3500);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const isValid = useMemo(() => {
        return form.signCode.trim() !== '' &&
            form.categoryCode.trim() !== '' &&
            form.nameEn.trim() !== '';
    }, [form.signCode, form.categoryCode, form.nameEn]);

    const setField = (key: keyof SignForm, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setFieldErrors(prev => { const next = { ...prev }; delete next[key]; return next; });
        setErrorMsg(null);
    };

    const validate = (): boolean => {
        const errors: Record<string, string> = {};
        if (!form.signCode.trim()) errors.signCode = t('admin.signs.form.error_code') || 'Sign code is required';
        if (!form.categoryCode.trim()) errors.categoryCode = t('admin.signs.form.error_category') || 'Category is required';
        if (!form.nameEn.trim()) errors.nameEn = t('admin.signs.form.error_name') || 'English name is required';
        if (form.imageUrl.trim() && !isValidUrl(form.imageUrl.trim())) {
            errors.imageUrl = t('admin.signs.form.error_url') || 'Invalid URL format';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const getCategoryName = (cat: CategoryOption): string => {
        const map: Record<string, string> = { en: cat.nameEn, ar: cat.nameAr, nl: cat.nameNl, fr: cat.nameFr };
        return map[language] || cat.nameEn;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        if (!validate()) return;

        try {
            setSubmitting(true);
            await apiClient.put(API_ENDPOINTS.ADMIN.SIGNS.UPDATE(signId), {
                signCode: form.signCode.trim(),
                categoryCode: form.categoryCode.trim(),
                nameEn: form.nameEn.trim(),
                nameAr: form.nameAr.trim() || '',
                nameNl: form.nameNl.trim() || '',
                nameFr: form.nameFr.trim() || '',
                descriptionEn: form.descriptionEn.trim() || '',
                descriptionAr: form.descriptionAr.trim() || '',
                descriptionNl: form.descriptionNl.trim() || '',
                descriptionFr: form.descriptionFr.trim() || '',
                imageUrl: form.imageUrl.trim() || null,
            });
            setToast({ message: t('admin.signs.form.update_success') || 'Sign updated successfully', type: 'success' });
            setTimeout(() => router.push('/admin/signs'), 600);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { status?: number; data?: { error?: string; message?: string } }; message?: string };
            const msg = axiosErr?.response?.data?.error || axiosErr?.response?.data?.message || axiosErr?.message;
            if (axiosErr?.response?.status === 400 && msg?.includes('already exists')) {
                setFieldErrors(prev => ({ ...prev, signCode: msg || 'Sign code already exists' }));
            } else {
                setErrorMsg(String(msg || t('admin.signs.form.update_error') || 'Failed to update sign'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
                <div className="bg-white rounded-lg border p-6 space-y-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.message}
                </div>
            )}

            <div className="flex items-center gap-3">
                <Link href="/admin/signs" className="text-gray-400 hover:text-gray-600 transition-colors text-xl">←</Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {t('admin.signs.edit_title') || 'Edit Sign'}{originalCode ? `: ${originalCode}` : ''}
                    </h1>
                    <p className="text-gray-600 mt-1">{t('admin.signs.edit_desc') || 'Update traffic sign details'}</p>
                </div>
            </div>

            {form.imageUrl && (
                <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center gap-4">
                    <div className="w-20 h-20 relative rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image src={convertToPublicImageUrl(form.imageUrl) || FALLBACK_IMAGE} alt={form.signCode} fill unoptimized className="object-contain p-1" sizes="80px"
                            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700">{t('admin.signs.form.current_image') || 'Current Image'}</p>
                        <p className="text-xs text-gray-400 break-all">{form.imageUrl}</p>
                    </div>
                </div>
            )}

            <form onSubmit={onSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                {errorMsg && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>
                )}

                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.signs.form.basic_info') || 'Basic Information'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label={(t('admin.signs.form.sign_code') || 'Sign Code') + ' *'} placeholder="A1a" value={form.signCode} error={fieldErrors.signCode} onChange={v => setField('signCode', v)} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.signs.form.category') || 'Category'} *</label>
                            <select value={form.categoryCode} onChange={e => setField('categoryCode', e.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${fieldErrors.categoryCode ? 'border-red-300' : 'border-gray-300'}`}>
                                <option value="">{t('admin.signs.form.select_category') || 'Select category'}</option>
                                {categories.map(cat => <option key={cat.code} value={cat.code}>{getCategoryName(cat)} ({cat.code})</option>)}
                            </select>
                            {fieldErrors.categoryCode && <p className="mt-1 text-xs text-red-600">{fieldErrors.categoryCode}</p>}
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.signs.form.image') || 'Image'}</h2>
                    <FormField label={t('admin.signs.form.image_url') || 'Image URL'} placeholder="https://example.com/sign.png or assets/traffic_signs/..." value={form.imageUrl} error={fieldErrors.imageUrl} onChange={v => setField('imageUrl', v)} />
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.signs.form.names') || 'Names'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label={(t('admin.signs.form.name_en') || 'English Name') + ' *'} placeholder="Dangerous curve" value={form.nameEn} error={fieldErrors.nameEn} onChange={v => setField('nameEn', v)} />
                        <FormField label={t('admin.signs.form.name_ar') || 'Arabic Name'} placeholder="منحنى خطير" value={form.nameAr} onChange={v => setField('nameAr', v)} dir="rtl" />
                        <FormField label={t('admin.signs.form.name_nl') || 'Dutch Name'} placeholder="Gevaarlijke bocht" value={form.nameNl} onChange={v => setField('nameNl', v)} />
                        <FormField label={t('admin.signs.form.name_fr') || 'French Name'} placeholder="Virage dangereux" value={form.nameFr} onChange={v => setField('nameFr', v)} />
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.signs.form.descriptions') || 'Descriptions'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormTextarea label={t('admin.signs.form.desc_en') || 'English Description'} placeholder="Description in English..." value={form.descriptionEn} onChange={v => setField('descriptionEn', v)} />
                        <FormTextarea label={t('admin.signs.form.desc_ar') || 'Arabic Description'} placeholder="الوصف بالعربية..." value={form.descriptionAr} onChange={v => setField('descriptionAr', v)} dir="rtl" />
                        <FormTextarea label={t('admin.signs.form.desc_nl') || 'Dutch Description'} placeholder="Beschrijving..." value={form.descriptionNl} onChange={v => setField('descriptionNl', v)} />
                        <FormTextarea label={t('admin.signs.form.desc_fr') || 'French Description'} placeholder="Description en français..." value={form.descriptionFr} onChange={v => setField('descriptionFr', v)} />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-xs text-gray-400">{t('admin.signs.form.required_note') || '* Required fields'}</p>
                    <div className="flex gap-3">
                        <Link href="/admin/signs" className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                            {t('admin.signs.cancel') || 'Cancel'}
                        </Link>
                        <button type="submit" disabled={!isValid || submitting}
                            className="px-6 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            {submitting ? (t('admin.signs.form.updating') || 'Updating...') : (t('admin.signs.form.update') || 'Update Sign')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

function isValidUrl(str: string): boolean {
    if (str.startsWith('assets/') || str.startsWith('/')) return true;
    try { new URL(str); return true; } catch { return false; }
}

function FormField({ label, placeholder, value, error, onChange, dir }: {
    label: string; placeholder?: string; value: string; error?: string; onChange: (v: string) => void; dir?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} dir={dir}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-300' : 'border-gray-300'}`} />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function FormTextarea({ label, placeholder, value, onChange, dir }: {
    label: string; placeholder?: string; value: string; onChange: (v: string) => void; dir?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <textarea value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} dir={dir} rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
    );
}
