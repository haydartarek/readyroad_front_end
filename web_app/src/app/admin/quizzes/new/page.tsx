'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, isServiceUnavailable, logApiError } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useLanguage } from '@/contexts/language-context';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowLeft, Upload, X, Plus, Trash2, Save, CheckCircle2, AlertTriangle } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────

interface OptionForm {
  id?: number;
  textEn: string; textAr: string; textNl: string; textFr: string;
  isCorrect: boolean; displayOrder: number;
}
interface QuestionForm {
  categoryCode: string; difficultyLevel: string; questionType: string;
  questionEn: string; questionAr: string; questionNl: string; questionFr: string;
  explanationEn: string; explanationAr: string; explanationNl: string; explanationFr: string;
  contentImageUrl: string; isActive: boolean; options: OptionForm[];
}
interface CategoryOption {
  code: string; nameEn: string; nameAr: string; nameNl: string; nameFr: string;
}

const BLANK_OPTION: OptionForm = { textEn: '', textAr: '', textNl: '', textFr: '', isCorrect: false, displayOrder: 0 };

const INITIAL_FORM: QuestionForm = {
  categoryCode: '', difficultyLevel: 'EASY', questionType: 'MULTIPLE_CHOICE',
  questionEn: '', questionAr: '', questionNl: '', questionFr: '',
  explanationEn: '', explanationAr: '', explanationNl: '', explanationFr: '',
  contentImageUrl: '', isActive: true,
  options: [
    { ...BLANK_OPTION, displayOrder: 1 },
    { ...BLANK_OPTION, displayOrder: 2 },
  ],
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 5;

// ─── Reusable form components ───────────────────────────

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
          error ? 'border-destructive/50 focus:ring-destructive/20' : 'border-border/50'
        )}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FormTextarea({ label, placeholder, value, error, onChange, dir }: {
  label: string; placeholder?: string; value: string;
  error?: string; onChange: (v: string) => void; dir?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-foreground">{label}</label>
      <textarea
        value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)} dir={dir} rows={3}
        className={cn(
          'w-full rounded-xl border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all',
          error ? 'border-destructive/50 focus:ring-destructive/20' : 'border-border/50'
        )}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
      <h2 className="text-base font-black text-foreground">{title}</h2>
      {children}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────

export default function AdminAddQuizQuestionPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [form, setForm] = useState<QuestionForm>(INITIAL_FORM);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiClient.get<CategoryOption[]>('/categories')
      .then(res => setCategories(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (toast) { const id = setTimeout(() => setToast(null), 3500); return () => clearTimeout(id); }
  }, [toast]);

  const isValid = useMemo(() => (
    form.categoryCode.trim() !== '' &&
    form.questionEn.trim() !== '' &&
    form.options.length >= 2 && form.options.length <= 3 &&
    form.options.filter(o => o.isCorrect).length === 1 &&
    form.options.every(o => o.textEn.trim() !== '')
  ), [form]);

  const setField = <K extends keyof QuestionForm>(key: K, value: QuestionForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    setErrorMsg(null);
  };

  const setOptionField = (idx: number, key: keyof OptionForm, value: string | boolean | number) => {
    setForm(prev => {
      const opts = [...prev.options];
      opts[idx] = { ...opts[idx], [key]: value };
      return { ...prev, options: opts };
    });
  };

  const addOption = () => {
    if (form.options.length >= 3) return;
    setForm(prev => ({
      ...prev,
      options: [...prev.options, { ...BLANK_OPTION, displayOrder: prev.options.length + 1 }],
    }));
  };

  const removeOption = (idx: number) => {
    if (form.options.length <= 2) return;
    setForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx).map((o, i) => ({ ...o, displayOrder: i + 1 })),
    }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.categoryCode.trim()) errors.categoryCode = t('admin.quizzes.form.error_category') || 'Category is required';
    if (!form.questionEn.trim()) errors.questionEn = t('admin.quizzes.form.error_question') || 'English question text is required';
    if (form.options.length < 2) errors.options = 'At least 2 options are required';
    if (form.options.length > 3) errors.options = 'Maximum 3 options allowed';
    const correctCount = form.options.filter(o => o.isCorrect).length;
    if (correctCount === 0) errors.correct = 'Exactly one option must be marked as correct';
    if (correctCount > 1) errors.correct = 'Only one option can be marked as correct';
    form.options.forEach((o, i) => { if (!o.textEn.trim()) errors[`option_${i}`] = 'English option text is required'; });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getCategoryName = (cat: CategoryOption): string => {
    const map: Record<string, string> = { en: cat.nameEn, ar: cat.nameAr, nl: cat.nameNl, fr: cat.nameFr };
    return map[language] || cat.nameEn;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setToast({ message: t('admin.quizzes.upload.invalid_type') || 'Invalid file type', type: 'error' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setToast({ message: `File too large. Max ${MAX_FILE_SIZE_MB}MB`, type: 'error' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const resp = await apiClient.post<{ url: string }>(API_ENDPOINTS.ADMIN.UPLOAD_IMAGE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setField('contentImageUrl', resp.data.url);
      setToast({ message: 'Image uploaded successfully', type: 'success' });
    } catch (err: unknown) {
      logApiError('Failed to upload image', err);
      if (isServiceUnavailable(err)) setServiceUnavailable(true);
      else {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Upload failed';
        setToast({ message: String(msg), type: 'error' });
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resolveImageUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:8890${url}`;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!validate()) return;
    try {
      setSubmitting(true);
      await apiClient.post(API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.CREATE, {
        categoryCode: form.categoryCode.trim(),
        difficultyLevel: form.difficultyLevel,
        questionType: form.questionType,
        questionEn: form.questionEn.trim(),
        questionAr: form.questionAr.trim() || '',
        questionNl: form.questionNl.trim() || '',
        questionFr: form.questionFr.trim() || '',
        explanationEn: form.explanationEn.trim() || null,
        explanationAr: form.explanationAr.trim() || null,
        explanationNl: form.explanationNl.trim() || null,
        explanationFr: form.explanationFr.trim() || null,
        contentImageUrl: form.contentImageUrl.trim() || null,
        isActive: form.isActive,
        options: form.options.map(o => ({
          textEn: o.textEn.trim(), textAr: o.textAr.trim() || '',
          textNl: o.textNl.trim() || '', textFr: o.textFr.trim() || '',
          isCorrect: o.isCorrect, displayOrder: o.displayOrder,
        })),
      });
      setToast({ message: t('admin.quizzes.form.create_success') || 'Question created successfully', type: 'success' });
      setTimeout(() => router.push('/admin/quizzes'), 600);
    } catch (err: unknown) {
      logApiError('Failed to create quiz question', err);
      if (isServiceUnavailable(err)) setServiceUnavailable(true);
      else {
        const axiosErr = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
        const msg = axiosErr?.response?.data?.error || axiosErr?.response?.data?.message || axiosErr?.message;
        setErrorMsg(String(msg || 'Failed to create question'));
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
          href="/admin/quizzes"
          className="w-9 h-9 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            {t('admin.quizzes.add_new') || 'Add Question'}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {t('admin.quizzes.add_new_desc') || 'Create a new quiz question with answer options.'}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">

        {/* Error Banner */}
        {errorMsg && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Basic Info */}
        <SectionCard title={t('admin.quizzes.form.basic_info') || 'Basic Information'}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground">
                {t('admin.quizzes.form.category') || 'Category'} *
              </label>
              <select
                value={form.categoryCode}
                onChange={e => setField('categoryCode', e.target.value)}
                className={cn(
                  'w-full rounded-xl border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all',
                  fieldErrors.categoryCode ? 'border-destructive/50' : 'border-border/50'
                )}
              >
                <option value="">{t('admin.quizzes.form.select_category') || 'Select a category...'}</option>
                {categories.map(cat => (
                  <option key={cat.code} value={cat.code}>{getCategoryName(cat)} ({cat.code})</option>
                ))}
              </select>
              {fieldErrors.categoryCode && <p className="text-xs text-destructive">{fieldErrors.categoryCode}</p>}
            </div>

            {/* Difficulty */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground">
                {t('admin.quizzes.form.difficulty') || 'Difficulty'}
              </label>
              <select
                value={form.difficultyLevel}
                onChange={e => setField('difficultyLevel', e.target.value)}
                className="w-full rounded-xl border border-border/50 px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            {/* Question Type */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground">
                {t('admin.quizzes.form.question_type') || 'Question Type'}
              </label>
              <select
                value={form.questionType}
                onChange={e => setField('questionType', e.target.value)}
                className="w-full rounded-xl border border-border/50 px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="TRUE_FALSE">True / False</option>
                <option value="IMAGE_BASED">Image Based</option>
              </select>
            </div>
          </div>

          {/* Active Toggle */}
          <label className="flex items-center gap-3 cursor-pointer w-fit">
            <div
              onClick={() => setField('isActive', !form.isActive)}
              className={cn(
                'w-10 h-6 rounded-full transition-colors duration-200 flex items-center px-1 cursor-pointer',
                form.isActive ? 'bg-green-500' : 'bg-muted'
              )}
            >
              <div className={cn(
                'w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                form.isActive ? 'translate-x-4' : 'translate-x-0'
              )} />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {form.isActive ? 'Active' : 'Inactive'}
            </span>
          </label>
        </SectionCard>

        {/* Image Upload */}
        <SectionCard title={t('admin.quizzes.upload.title') || 'Content Image'}>
          {form.contentImageUrl && (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImageUrl(form.contentImageUrl)}
                alt="Question content"
                className="max-h-48 rounded-xl border border-border/50 object-contain bg-muted"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <button
                type="button"
                onClick={() => { setField('contentImageUrl', ''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <label className="block text-xs font-semibold text-foreground">
                {t('admin.quizzes.form.image_url') || 'Content Image URL'}
              </label>
              <input
                value={form.contentImageUrl}
                placeholder="https://example.com/image.png or /images/quiz/..."
                onChange={e => setField('contentImageUrl', e.target.value)}
                className="w-full rounded-xl border border-border/50 px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex items-end">
              <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageUpload} className="hidden" />
              <Button
                type="button" variant="outline" disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 border-primary/30 text-primary hover:bg-primary/5 whitespace-nowrap"
              >
                {uploading
                  ? <><span className="animate-spin">⏳</span> Uploading...</>
                  : <><Upload className="w-4 h-4" /> Upload Image</>}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('admin.quizzes.upload.hint') || 'Accepted: JPG, JPEG, PNG, WEBP. Max 5MB.'}
          </p>
        </SectionCard>

        {/* Question Text */}
        <SectionCard title={t('admin.quizzes.form.questions') || 'Question Text (Multilingual)'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormTextarea label={(t('admin.quizzes.form.question_en') || 'Question (English)') + ' *'} placeholder="What does this sign mean?" value={form.questionEn} error={fieldErrors.questionEn} onChange={v => setField('questionEn', v)} />
            <FormTextarea label={t('admin.quizzes.form.question_ar') || 'Question (Arabic)'} placeholder="ماذا تعني هذه العلامة؟" value={form.questionAr} onChange={v => setField('questionAr', v)} dir="rtl" />
            <FormTextarea label={t('admin.quizzes.form.question_nl') || 'Question (Dutch)'} placeholder="Wat betekent dit verkeersbord?" value={form.questionNl} onChange={v => setField('questionNl', v)} />
            <FormTextarea label={t('admin.quizzes.form.question_fr') || 'Question (French)'} placeholder="Que signifie ce panneau?" value={form.questionFr} onChange={v => setField('questionFr', v)} />
          </div>
        </SectionCard>

        {/* Explanations */}
        <SectionCard title={t('admin.quizzes.form.explanations') || 'Explanations (Multilingual)'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormTextarea label={t('admin.quizzes.form.explanation_en') || 'Explanation (English)'} placeholder="This sign indicates..." value={form.explanationEn} onChange={v => setField('explanationEn', v)} />
            <FormTextarea label={t('admin.quizzes.form.explanation_ar') || 'Explanation (Arabic)'} placeholder="تشير هذه العلامة إلى..." value={form.explanationAr} onChange={v => setField('explanationAr', v)} dir="rtl" />
            <FormTextarea label={t('admin.quizzes.form.explanation_nl') || 'Explanation (Dutch)'} placeholder="Dit bord geeft aan..." value={form.explanationNl} onChange={v => setField('explanationNl', v)} />
            <FormTextarea label={t('admin.quizzes.form.explanation_fr') || 'Explanation (French)'} placeholder="Ce panneau indique..." value={form.explanationFr} onChange={v => setField('explanationFr', v)} />
          </div>
        </SectionCard>

        {/* Answer Options */}
        <SectionCard title={`${t('admin.quizzes.form.options_title') || 'Answer Options'} *`}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Belgian standard: 2–3 options, exactly 1 correct</p>
            <Button
              type="button" variant="outline" size="sm"
              onClick={addOption}
              disabled={form.options.length >= 3}
              className="gap-1.5 text-xs h-8"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('admin.quizzes.form.add_option') || 'Add Option'}
              {form.options.length >= 3 && <span className="text-muted-foreground">(max 3)</span>}
            </Button>
          </div>

          {(fieldErrors.options || fieldErrors.correct) && (
            <p className="text-xs text-destructive">{fieldErrors.options || fieldErrors.correct}</p>
          )}

          <div className="space-y-4">
            {form.options.map((opt, idx) => (
              <div
                key={idx}
                className={cn(
                  'rounded-2xl border p-4 space-y-3 transition-colors',
                  opt.isCorrect
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-border/50 bg-muted/20'
                )}
              >
                {/* Option Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black',
                      opt.isCorrect ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                    )}>
                      {idx + 1}
                    </div>
                    <span className="text-sm font-bold text-foreground">Option {idx + 1}</span>
                    {opt.isCorrect && (
                      <Badge className="bg-green-500/10 text-green-600 border-0 text-xs">✓ Correct</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox" checked={opt.isCorrect}
                        onChange={e => setOptionField(idx, 'isCorrect', e.target.checked)}
                        className="rounded border-border"
                      />
                      <span className="text-xs text-muted-foreground font-medium">Mark Correct</span>
                    </label>
                    {form.options.length > 2 && (
                      <button
                        type="button" onClick={() => removeOption(idx)}
                        className="text-destructive hover:opacity-70 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField label="Option (English) *" placeholder="Answer option..." value={opt.textEn} error={fieldErrors[`option_${idx}`]} onChange={v => setOptionField(idx, 'textEn', v)} />
                  <FormField label="Option (Arabic)" placeholder="خيار الإجابة..." value={opt.textAr} onChange={v => setOptionField(idx, 'textAr', v)} dir="rtl" />
                  <FormField label="Option (Dutch)" placeholder="Antwoordmogelijkheid..." value={opt.textNl} onChange={v => setOptionField(idx, 'textNl', v)} />
                  <FormField label="Option (French)" placeholder="Option de réponse..." value={opt.textFr} onChange={v => setOptionField(idx, 'textFr', v)} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">* Required fields</p>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/admin/quizzes">{t('admin.quizzes.cancel') || 'Cancel'}</Link>
            </Button>
            <Button
              type="submit"
              disabled={!isValid || submitting}
              className="gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:scale-[1.01] transition-all disabled:shadow-none disabled:scale-100"
            >
              {submitting
                ? <><span className="animate-spin">⏳</span> Saving...</>
                : <><Save className="w-4 h-4" /> Save Question</>}
            </Button>
          </div>
        </div>

      </form>
    </div>
  );
}
