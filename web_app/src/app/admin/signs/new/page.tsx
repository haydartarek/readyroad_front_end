'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, isServiceUnavailable, logApiError } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useLanguage } from '@/contexts/language-context';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';

interface CreateSignForm {
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

const INITIAL_FORM: CreateSignForm = {
    signCode: '',
    categoryCode: '',
    nameEn: '',
    nameAr: '',
    nameNl: '',
    nameFr: '',
    descriptionEn: '',
    descriptionAr: '',
    descriptionNl: '',
    descriptionFr: '',
    imageUrl: '',
};

function isValidUrl(str: string): boolean {
    if (str.startsWith('assets/') || str.startsWith('/')) return true;
    try { new URL(str); return true; } catch { return false; }
}

export default function AdminAddSignPage() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const [form, setForm] = useState<CreateSignForm>(INITIAL_FORM);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [serviceUnavailable, setServiceUnavailable] = useState(false);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3500);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        apiClient.get<CategoryOption[]>('/categories')
            .then(res => setCategories(res.data))
            .catch(() => { });
    }, []);

    const isValid = useMemo(() => {
        return form.signCode.trim() !== '' &&
            form.categoryCode.trim() !== '' &&
            form.nameEn.trim() !== '';
    }, [form.signCode, form.categoryCode, form.nameEn]);

    const setField = (key: keyof CreateSignForm, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setFieldErrors(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
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
            await apiClient.post(API_ENDPOINTS.ADMIN.SIGNS.CREATE, {
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
            setToast({ message: t('admin.signs.form.create_success') || 'Sign created successfully', type: 'success' });
            setTimeout(() => router.push('/admin/signs'), 600);
        } catch (err: unknown) {
            logApiError('Failed to create sign', err);
            if (isServiceUnavailable(err)) {
                setServiceUnavailable(true);
            } else {
                const axiosErr = err as { response?: { status?: number; data?: { error?: string; message?: string } }; message?: string };
                const msg = axiosErr?.response?.data?.error ||
                    axiosErr?.response?.data?.message ||
                    axiosErr?.message ||
                    t('admin.signs.form.error_generic');
                if (axiosErr?.response?.status === 400 && msg?.includes('already exists')) {
                    setFieldErrors(prev => ({ ...prev, signCode: String(msg) }));
                } else {
                    setErrorMsg(String(msg));
                }
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {serviceUnavailable && <ServiceUnavailableBanner onRetry={() => setServiceUnavailable(false)} className="mb-4" />}

            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/admin/signs" className="text-muted-foreground hover:text-muted-foreground transition-colors text-xl">
                    ←
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('admin.signs.add_new')}</h1>
                    <p className="text-muted-foreground mt-1">{t('admin.signs.add_new_desc')}</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="bg-card rounded-lg shadow-sm border p-6 space-y-6">
                {errorMsg && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMsg}
                    </div>
                )}

                {/* Basic Info */}
                <div>
                    <h2 className="text-lg font-semibold text-foreground mb-4">{t('admin.signs.form.basic_info')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            label={t('admin.signs.form.sign_code') + ' *'}
                            placeholder="A1a"
                            value={form.signCode}
                            error={fieldErrors.signCode}
                            onChange={v => setField('signCode', v)}
                        />
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                {t('admin.signs.form.category')} *
                            </label>
                            <select
                                value={form.categoryCode}
                                onChange={e => setField('categoryCode', e.target.value)}
                                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card ${fieldErrors.categoryCode ? 'border-red-300' : 'border-border'}`}
                            >
                                <option value="">{t('admin.signs.form.select_category')}</option>
                                {categories.map(cat => (
                                    <option key={cat.code} value={cat.code}>
                                        {getCategoryName(cat)} ({cat.code})
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.categoryCode && (
                                <p className="mt-1 text-xs text-red-600">{fieldErrors.categoryCode}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Image URL */}
                <div>
                    <h2 className="text-lg font-semibold text-foreground mb-4">{t('admin.signs.form.image') || 'Image'}</h2>
                    <FormField
                        label={t('admin.signs.form.image_url') || 'Image URL'}
                        placeholder="https://example.com/sign.png or assets/traffic_signs/..."
                        value={form.imageUrl}
                        error={fieldErrors.imageUrl}
                        onChange={v => setField('imageUrl', v)}
                    />
                </div>

                {/* Names */}
                <div>
                    <h2 className="text-lg font-semibold text-foreground mb-4">{t('admin.signs.form.names')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            label={t('admin.signs.form.name_en') + ' *'}
                            placeholder="Dangerous curve to the left"
                            value={form.nameEn}
                            error={fieldErrors.nameEn}
                            onChange={v => setField('nameEn', v)}
                        />
                        <FormField
                            label={t('admin.signs.form.name_ar')}
                            placeholder="منحنى خطير إلى اليسار"
                            value={form.nameAr}
                            onChange={v => setField('nameAr', v)}
                            dir="rtl"
                        />
                        <FormField
                            label={t('admin.signs.form.name_nl')}
                            placeholder="Gevaarlijke bocht naar links"
                            value={form.nameNl}
                            onChange={v => setField('nameNl', v)}
                        />
                        <FormField
                            label={t('admin.signs.form.name_fr')}
                            placeholder="Virage dangereux à gauche"
                            value={form.nameFr}
                            onChange={v => setField('nameFr', v)}
                        />
                    </div>
                </div>

                {/* Descriptions */}
                <div>
                    <h2 className="text-lg font-semibold text-foreground mb-4">{t('admin.signs.form.descriptions')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormTextarea
                            label={t('admin.signs.form.desc_en')}
                            placeholder="Description in English..."
                            value={form.descriptionEn}
                            onChange={v => setField('descriptionEn', v)}
                        />
                        <FormTextarea
                            label={t('admin.signs.form.desc_ar')}
                            placeholder="الوصف بالعربية..."
                            value={form.descriptionAr}
                            onChange={v => setField('descriptionAr', v)}
                            dir="rtl"
                        />
                        <FormTextarea
                            label={t('admin.signs.form.desc_nl')}
                            placeholder="Beschrijving in het Nederlands..."
                            value={form.descriptionNl}
                            onChange={v => setField('descriptionNl', v)}
                        />
                        <FormTextarea
                            label={t('admin.signs.form.desc_fr')}
                            placeholder="Description en français..."
                            value={form.descriptionFr}
                            onChange={v => setField('descriptionFr', v)}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-xs text-muted-foreground">{t('admin.signs.form.required_note')}</p>
                    <div className="flex gap-3">
                        <Link
                            href="/admin/signs"
                            className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                        >
                            {t('admin.signs.cancel')}
                        </Link>
                        <button
                            type="submit"
                            disabled={!isValid || submitting}
                            className="px-6 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitting ? t('admin.signs.form.saving') : t('admin.signs.form.save')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

function FormField({ label, placeholder, value, error, onChange, dir }: {
    label: string;
    placeholder?: string;
    value: string;
    error?: string;
    onChange: (v: string) => void;
    dir?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
            <input
                value={value}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                dir={dir}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${error ? 'border-red-300' : 'border-border'}`}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function FormTextarea({ label, placeholder, value, onChange, dir }: {
    label: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    dir?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
            <textarea
                value={value}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                dir={dir}
                rows={3}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
        </div>
    );
}
