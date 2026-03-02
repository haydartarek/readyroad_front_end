'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, isServiceUnavailable, logApiError } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useLanguage } from '@/contexts/language-context';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft, Save, CheckCircle2, AlertTriangle } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────

interface CreateSignForm {
  signCode: string; categoryCode: string;
  nameEn: string; nameAr: string; nameNl: string; nameFr: string;
  descriptionEn: string; descriptionAr: string; descriptionNl: string; descriptionFr: string;
  imageUrl: string;
}
interface CategoryOption {
  code: string; nameEn: string; nameAr: string; nameNl: string; nameFr: string;
}

const INITIAL_FORM: CreateSignForm = {
  signCode: '', categoryCode: '',
  nameEn: '', nameAr: '', nameNl: '', nameFr: '',
  descriptionEn: '', descriptionAr: '', descriptionNl: '', descriptionFr: '',
  imageUrl: '',
};

// ─── Helpers ────────────────────────────────────────────

function isValidUrl(str: string): boolean {
  if (str.startsWith('assets/') || str.startsWith('/')) return true;
  try { new URL(str); return true; } catch { return false; }
}

// ─── Reusable components ────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
      <h2 className="text-base font-black text-foreground">{title}</h2>
      {children}
    </div>
  );
}

function FormField({ label, placeholder, value, error, onChange, dir }: {
  label: string; placeholder?: string; value: string;
  error?: string; onChange: (v: string) => void; dir?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-foreground">{label}</label>
      <input
        value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)} dir={dir}
        className={cn(
          'w-full rounded-xl border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all',
          error ? 'border-destructive/50' : 'border-border/50'
        )}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FormTextarea({ label, placeholder, value, onChange, dir }: {
  label: string; placeholder?: string; value: string;
  onChange: (v: string) => void; dir?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-foreground">{label}</label>
      <textarea
        value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)} dir={dir} rows={3}
        className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all"
      />
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────

export default function AdminAddSignPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [form, setForm]             = useState<CreateSignForm>(INITIAL_FORM);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toast, setToast]           = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  useEffect(() => {
    apiClient.get<CategoryOption[]>('/categories')
      .then(res => setCategories(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (toast) { const id = setTimeout(() => setToast(null), 3500); return () => clearTimeout(id); }
  }, [toast]);

  const isValid = useMemo(() => (
    form.signCode.trim() !== '' &&
    form.categoryCode.trim() !== '' &&
    form.nameEn.trim() !== ''
  ), [form.signCode, form.categoryCode, form.nameEn]);

  const setField = (key: keyof CreateSignForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    setErrorMsg(null);
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.signCode.trim())    errors.signCode     = t('admin.signs.form.error_code')     || 'Sign code is required';
    if (!form.categoryCode.trim()) errors.categoryCode = t('admin.signs.form.error_category') || 'Category is required';
    if (!form.nameEn.trim())      errors.nameEn       = t('admin.signs.form.error_name')     || 'English name is required';
    if (form.imageUrl.trim() && !isValidUrl(form.imageUrl.trim())) {
      errors.imageUrl = t('admin.signs.form.error_url') || 'Invalid URL format';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getCategoryName = (cat: CategoryOption) =>
    ({ en: cat.nameEn, ar: cat.nameAr, nl: cat.nameNl, fr: cat.nameFr })[language] || cat.nameEn;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!validate()) return;
    try {
      setSubmitting(true);
      await apiClient.post(API_ENDPOINTS.ADMIN.SIGNS.CREATE, {
        signCode: form.signCode.trim(), categoryCode: form.categoryCode.trim(),
        nameEn: form.nameEn.trim(), nameAr: form.nameAr.trim() || '',
        nameNl: form.nameNl.trim() || '', nameFr: form.nameFr.trim() || '',
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
        const msg = axiosErr?.response?.data?.error || axiosErr?.response?.data?.message || axiosErr?.message;
        if (axiosErr?.response?.status === 400 && msg?.includes('already exists')) {
          setFieldErrors(prev => ({ ...prev, signCode: String(msg) }));
        } else {
          setErrorMsg(String(msg || t('admin.signs.form.error_generic') || 'Failed to create sign'));
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {serviceUnavailable && <ServiceUnavailableBanner onRetry={() => setServiceUnavailable(false)} />}

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
      <div className="flex items-center gap-3">
        <Link
          href="/admin/signs"
          className="w-9 h-9 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t('admin.signs.add_new')}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t('admin.signs.add_new_desc')}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Error banner */}
        {errorMsg && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Basic Info */}
        <SectionCard title={t('admin.signs.form.basic_info')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t('admin.signs.form.sign_code') + ' *'}
              placeholder="A1a"
              value={form.signCode}
              error={fieldErrors.signCode}
              onChange={v => setField('signCode', v)}
            />
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground">
                {t('admin.signs.form.category')} *
              </label>
              <select
                value={form.categoryCode}
                onChange={e => setField('categoryCode', e.target.value)}
                className={cn(
                  'w-full rounded-xl border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all',
                  fieldErrors.categoryCode ? 'border-destructive/50' : 'border-border/50'
                )}
              >
                <option value="">{t('admin.signs.form.select_category')}</option>
                {categories.map(cat => (
                  <option key={cat.code} value={cat.code}>{getCategoryName(cat)} ({cat.code})</option>
                ))}
              </select>
              {fieldErrors.categoryCode && <p className="text-xs text-destructive">{fieldErrors.categoryCode}</p>}
            </div>
          </div>
        </SectionCard>

        {/* Image URL */}
        <SectionCard title={t('admin.signs.form.image') || 'Image'}>
          <FormField
            label={t('admin.signs.form.image_url') || 'Image URL'}
            placeholder="https://example.com/sign.png or assets/traffic_signs/..."
            value={form.imageUrl}
            error={fieldErrors.imageUrl}
            onChange={v => setField('imageUrl', v)}
          />
        </SectionCard>

        {/* Names */}
        <SectionCard title={t('admin.signs.form.names')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('admin.signs.form.name_en') + ' *'} placeholder="Dangerous curve to the left" value={form.nameEn} error={fieldErrors.nameEn} onChange={v => setField('nameEn', v)} />
            <FormField label={t('admin.signs.form.name_ar')} placeholder="منحنى خطير إلى اليسار" value={form.nameAr} onChange={v => setField('nameAr', v)} dir="rtl" />
            <FormField label={t('admin.signs.form.name_nl')} placeholder="Gevaarlijke bocht naar links" value={form.nameNl} onChange={v => setField('nameNl', v)} />
            <FormField label={t('admin.signs.form.name_fr')} placeholder="Virage dangereux à gauche" value={form.nameFr} onChange={v => setField('nameFr', v)} />
          </div>
        </SectionCard>

        {/* Descriptions */}
        <SectionCard title={t('admin.signs.form.descriptions')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormTextarea label={t('admin.signs.form.desc_en')} placeholder="Description in English..."       value={form.descriptionEn} onChange={v => setField('descriptionEn', v)} />
            <FormTextarea label={t('admin.signs.form.desc_ar')} placeholder="الوصف بالعربية..."              value={form.descriptionAr} onChange={v => setField('descriptionAr', v)} dir="rtl" />
            <FormTextarea label={t('admin.signs.form.desc_nl')} placeholder="Beschrijving in het Nederlands..." value={form.descriptionNl} onChange={v => setField('descriptionNl', v)} />
            <FormTextarea label={t('admin.signs.form.desc_fr')} placeholder="Description en français..."      value={form.descriptionFr} onChange={v => setField('descriptionFr', v)} />
          </div>
        </SectionCard>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">{t('admin.signs.form.required_note')}</p>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/admin/signs">{t('admin.signs.cancel')}</Link>
            </Button>
            <Button
              type="submit"
              disabled={!isValid || submitting}
              className="gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:scale-[1.01] transition-all disabled:shadow-none disabled:scale-100"
            >
              {submitting
                ? <><span className="animate-spin">⏳</span> {t('admin.signs.form.saving')}</>
                : <><Save className="w-4 h-4" /> {t('admin.signs.form.save')}</>}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
