'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, isServiceUnavailable, logApiError } from '@/lib/api';
import { getCsrfToken } from '@/lib/auth-token';
import { API_ENDPOINTS } from '@/lib/constants';
import { useLanguage } from '@/contexts/language-context';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowLeft, Upload, X, Plus, Trash2, Save, CheckCircle2, AlertTriangle, BookOpen, FileQuestion } from 'lucide-react';

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

// ─── Exam Question Types ─────────────────────────────────────────────
interface ExamOptionForm { textEn: string; textAr: string; textNl: string; textFr: string; isCorrect: boolean; }
interface ExamForm {
  categoryCode: string; difficulty: string;
  questionEn: string; questionAr: string; questionNl: string; questionFr: string;
  explanationEn: string; explanationAr: string; explanationNl: string; explanationFr: string;
  imageUrl: string; isActive: boolean; isImportant: boolean;
  options: ExamOptionForm[]; // 2 or 3 options — Belgian standard
}
const BLANK_EXAM_OPTION: ExamOptionForm = { textEn: '', textAr: '', textNl: '', textFr: '', isCorrect: false };
const INITIAL_EXAM_FORM: ExamForm = {
  categoryCode: '', difficulty: 'MEDIUM',
  questionEn: '', questionAr: '', questionNl: '', questionFr: '',
  explanationEn: '', explanationAr: '', explanationNl: '', explanationFr: '',
  imageUrl: '', isActive: true, isImportant: false,
  options: [{ ...BLANK_EXAM_OPTION }, { ...BLANK_EXAM_OPTION }],
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

  // ─── Question Bank selector ────────────────────────────────────────
  const [bank, setBank] = useState<'quiz' | 'exam'>('quiz');

  // ─── Quiz question state ────────────────────────────────────────
  const [form, setForm] = useState<QuestionForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ─── Exam question state ────────────────────────────────────────
  const [examForm, setExamForm] = useState<ExamForm>(INITIAL_EXAM_FORM);
  const [examSubmitting, setExamSubmitting] = useState(false);
  const [examErrorMsg, setExamErrorMsg] = useState<string | null>(null);
  const [examFieldErrors, setExamFieldErrors] = useState<Record<string, string>>({});

  // ─── Shared state ────────────────────────────────────────────────
  const [categories, setCategories] = useState<CategoryOption[]>([]);
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

  // ─── Exam form helpers ────────────────────────────────────────────
  const setExamField = <K extends keyof ExamForm>(key: K, value: ExamForm[K]) => {
    setExamForm(prev => ({ ...prev, [key]: value }));
    setExamFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    setExamErrorMsg(null);
  };

  const setExamOptionField = (idx: number, key: keyof ExamOptionForm, value: string | boolean) => {
    setExamForm(prev => {
      const opts = [...prev.options];
      opts[idx] = { ...opts[idx], [key]: value };
      return { ...prev, options: opts };
    });
  };

  const addExamOption = () => {
    if (examForm.options.length >= 3) return;
    setExamForm(prev => ({ ...prev, options: [...prev.options, { ...BLANK_EXAM_OPTION }] }));
  };

  const removeExamOption = (idx: number) => {
    if (examForm.options.length <= 2) return;
    setExamForm(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }));
  };

  const examIsValid = useMemo(() => (
    examForm.categoryCode.trim() !== '' &&
    examForm.questionEn.trim() !== '' &&
    examForm.options.length >= 2 && examForm.options.length <= 3 &&
    examForm.options.filter(o => o.isCorrect).length === 1 &&
    examForm.options.every(o => o.textEn.trim() !== '')
  ), [examForm]);

  const examValidate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!examForm.categoryCode.trim()) errors.categoryCode = 'Category is required';
    if (!examForm.questionEn.trim())   errors.questionEn   = 'English question text is required';
    if (examForm.options.length < 2) errors.options = 'At least 2 options are required';
    if (examForm.options.length > 3) errors.options = 'Maximum 3 options allowed';
    const correctCount = examForm.options.filter(o => o.isCorrect).length;
    if (correctCount === 0) errors.correct = 'Exactly one option must be marked as correct';
    if (correctCount > 1)  errors.correct = 'Only one option can be marked as correct';
    examForm.options.forEach((o, i) => {
      if (!o.textEn.trim()) errors[`examOption_${i}`] = `Option ${i + 1} English text is required`;
    });
    setExamFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const examOnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExamErrorMsg(null);
    if (!examValidate()) return;
    const correctAnswer = examForm.options.findIndex(o => o.isCorrect) + 1; // 1-based
    const opt = examForm.options;
    try {
      setExamSubmitting(true);
      await apiClient.post(API_ENDPOINTS.ADMIN.EXAM_QUESTIONS.CREATE, {
        categoryCode:  examForm.categoryCode.trim(),
        difficulty:    examForm.difficulty,
        questionEn:    examForm.questionEn.trim(),
        questionAr:    examForm.questionAr.trim() || '',
        questionNl:    examForm.questionNl.trim() || '',
        questionFr:    examForm.questionFr.trim() || '',
        option1En: opt[0].textEn.trim(), option1Ar: opt[0].textAr.trim() || '', option1Nl: opt[0].textNl.trim() || '', option1Fr: opt[0].textFr.trim() || '',
        option2En: opt[1].textEn.trim(), option2Ar: opt[1].textAr.trim() || '', option2Nl: opt[1].textNl.trim() || '', option2Fr: opt[1].textFr.trim() || '',
        // option3 only sent when a third option exists
        ...(opt[2] ? { option3En: opt[2].textEn.trim(), option3Ar: opt[2].textAr.trim() || '', option3Nl: opt[2].textNl.trim() || '', option3Fr: opt[2].textFr.trim() || '' } : {}),
        correctAnswer,
        explanationEn: examForm.explanationEn.trim() || null,
        explanationAr: examForm.explanationAr.trim() || null,
        explanationNl: examForm.explanationNl.trim() || null,
        explanationFr: examForm.explanationFr.trim() || null,
        imageUrl:      examForm.imageUrl.trim() || null,
        isImportant:   examForm.isImportant,
        isActive:      examForm.isActive,
      });
      setToast({ message: 'Exam question created successfully', type: 'success' });
      setTimeout(() => router.push('/admin/quizzes'), 600);
    } catch (err: unknown) {
      logApiError('Failed to create exam question', err);
      if (isServiceUnavailable(err)) setServiceUnavailable(true);
      else {
        const axErr = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
        setExamErrorMsg(String(axErr?.response?.data?.error || axErr?.response?.data?.message || axErr?.message || 'Failed to create exam question'));
      }
    } finally {
      setExamSubmitting(false);
    }
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
      // Use native fetch so the browser sets the correct multipart boundary automatically.
      const headers: Record<string, string> = {};
      const csrf = getCsrfToken();
      if (csrf) headers['x-csrf-token'] = csrf;
      const res = await fetch('/api/proxy/admin/upload/image', { method: 'POST', headers, body: formData });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(errData?.error || `Upload failed (${res.status})`);
      }
      const data = await res.json() as { url: string };
      if (bank === 'exam') setExamField('imageUrl', data.url);
      else setField('contentImageUrl', data.url);
      setToast({ message: 'Image uploaded successfully', type: 'success' });
    } catch (err: unknown) {
      logApiError('Failed to upload image', err);
      if (isServiceUnavailable(err)) setServiceUnavailable(true);
      else {
        const msg = (err as { message?: string })?.message || 'Upload failed';
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
            {bank === 'quiz'
              ? (t('admin.quizzes.add_new_desc') || 'Create a new quiz question with answer options.')
              : 'Create a new exam simulation question with 4 fixed options.'}
          </p>
        </div>
      </div>

      {/* Question Bank Tabs */}
      <div className="flex rounded-2xl border border-border/50 bg-muted/30 p-1 gap-1 w-fit">
        <button
          type="button"
          onClick={() => setBank('quiz')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
            bank === 'quiz'
              ? 'bg-card shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <BookOpen className="w-4 h-4" />
          Quiz → /quiz
        </button>
        <button
          type="button"
          onClick={() => setBank('exam')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
            bank === 'exam'
              ? 'bg-card shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <FileQuestion className="w-4 h-4" />
          Exam Simulation → /exam
        </button>
      </div>

      {/* Quiz Form */}
      {bank === 'quiz' && (
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
      )} {/* end bank === 'quiz' */}

      {/* Exam Form */}
      {bank === 'exam' && (
      <form onSubmit={examOnSubmit} className="space-y-5">

        {/* Error Banner */}
        {examErrorMsg && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{examErrorMsg}</span>
          </div>
        )}

        {/* Basic Info */}
        <SectionCard title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground">Category *</label>
              <select
                value={examForm.categoryCode}
                onChange={e => setExamField('categoryCode', e.target.value)}
                className={cn(
                  'w-full rounded-xl border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all',
                  examFieldErrors.categoryCode ? 'border-destructive/50' : 'border-border/50'
                )}
              >
                <option value="">Select a category...</option>
                {categories.map(cat => (
                  <option key={cat.code} value={cat.code}>{getCategoryName(cat)} ({cat.code})</option>
                ))}
              </select>
              {examFieldErrors.categoryCode && <p className="text-xs text-destructive">{examFieldErrors.categoryCode}</p>}
            </div>

            {/* Difficulty */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground">Difficulty</label>
              <select
                value={examForm.difficulty}
                onChange={e => setExamField('difficulty', e.target.value)}
                className="w-full rounded-xl border border-border/50 px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 flex-wrap">
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <div
                onClick={() => setExamField('isActive', !examForm.isActive)}
                className={cn('w-10 h-6 rounded-full transition-colors duration-200 flex items-center px-1 cursor-pointer', examForm.isActive ? 'bg-green-500' : 'bg-muted')}
              >
                <div className={cn('w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200', examForm.isActive ? 'translate-x-4' : 'translate-x-0')} />
              </div>
              <span className="text-sm font-semibold text-foreground">{examForm.isActive ? 'Active' : 'Inactive'}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <div
                onClick={() => setExamField('isImportant', !examForm.isImportant)}
                className={cn('w-10 h-6 rounded-full transition-colors duration-200 flex items-center px-1 cursor-pointer', examForm.isImportant ? 'bg-amber-500' : 'bg-muted')}
              >
                <div className={cn('w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200', examForm.isImportant ? 'translate-x-4' : 'translate-x-0')} />
              </div>
              <span className="text-sm font-semibold text-foreground">{examForm.isImportant ? '★ Important' : 'Not Important'}</span>
            </label>
          </div>
        </SectionCard>

        {/* Image Upload (exam) */}
        <SectionCard title="Content Image">
          {examForm.imageUrl && (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImageUrl(examForm.imageUrl)}
                alt="Question content"
                className="max-h-48 rounded-xl border border-border/50 object-contain bg-muted"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <button
                type="button"
                onClick={() => { setExamField('imageUrl', ''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <label className="block text-xs font-semibold text-foreground">Content Image URL</label>
              <input
                value={examForm.imageUrl}
                placeholder="https://example.com/image.png or /images/quiz/..."
                onChange={e => setExamField('imageUrl', e.target.value)}
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
                {uploading ? <><span className="animate-spin">⏳</span> Uploading...</> : <><Upload className="w-4 h-4" /> Upload Image</>}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Accepted: JPG, JPEG, PNG, WEBP. Max 5MB.</p>
        </SectionCard>

        {/* Question Text (exam) */}
        <SectionCard title="Question Text (Multilingual)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormTextarea label="Question (English) *" placeholder="What does this sign mean?" value={examForm.questionEn} error={examFieldErrors.questionEn} onChange={v => setExamField('questionEn', v)} />
            <FormTextarea label="Question (Arabic)" placeholder="ماذا تعني هذه العلامة؟" value={examForm.questionAr} onChange={v => setExamField('questionAr', v)} dir="rtl" />
            <FormTextarea label="Question (Dutch)" placeholder="Wat betekent dit verkeersbord?" value={examForm.questionNl} onChange={v => setExamField('questionNl', v)} />
            <FormTextarea label="Question (French)" placeholder="Que signifie ce panneau?" value={examForm.questionFr} onChange={v => setExamField('questionFr', v)} />
          </div>
        </SectionCard>

        {/* Explanations (exam) */}
        <SectionCard title="Explanations (Multilingual)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormTextarea label="Explanation (English)" placeholder="This sign indicates..." value={examForm.explanationEn} onChange={v => setExamField('explanationEn', v)} />
            <FormTextarea label="Explanation (Arabic)" placeholder="تشير هذه العلامة إلى..." value={examForm.explanationAr} onChange={v => setExamField('explanationAr', v)} dir="rtl" />
            <FormTextarea label="Explanation (Dutch)" placeholder="Dit bord geeft aan..." value={examForm.explanationNl} onChange={v => setExamField('explanationNl', v)} />
            <FormTextarea label="Explanation (French)" placeholder="Ce panneau indique..." value={examForm.explanationFr} onChange={v => setExamField('explanationFr', v)} />
          </div>
        </SectionCard>

        {/* Answer Options (exam) — 2 or 3, exactly 1 correct */}
        <SectionCard title={`Answer Options * (Belgian standard: 2–3 options)`}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">2–3 options, exactly 1 correct answer</p>
            <Button
              type="button" variant="outline" size="sm"
              onClick={addExamOption}
              disabled={examForm.options.length >= 3}
              className="gap-1.5 text-xs h-8"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Option
              {examForm.options.length >= 3 && <span className="text-muted-foreground ml-1">(max 3)</span>}
            </Button>
          </div>

          {(examFieldErrors.options || examFieldErrors.correct) && (
            <p className="text-xs text-destructive">{examFieldErrors.options || examFieldErrors.correct}</p>
          )}

          <div className="space-y-4">
            {examForm.options.map((opt, idx) => (
              <div
                key={idx}
                className={cn(
                  'rounded-2xl border p-4 space-y-3 transition-colors',
                  opt.isCorrect ? 'border-green-500/30 bg-green-500/5' : 'border-border/50 bg-muted/20'
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
                        onChange={e => setExamOptionField(idx, 'isCorrect', e.target.checked)}
                        className="rounded border-border"
                      />
                      <span className="text-xs text-muted-foreground font-medium">Mark Correct</span>
                    </label>
                    {examForm.options.length > 2 && (
                      <button
                        type="button" onClick={() => removeExamOption(idx)}
                        className="text-destructive hover:opacity-70 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField label="Option (English) *" placeholder="Answer option..." value={opt.textEn} error={examFieldErrors[`examOption_${idx}`]} onChange={v => setExamOptionField(idx, 'textEn', v)} />
                  <FormField label="Option (Arabic)" placeholder="خيار الإجابة..." value={opt.textAr} onChange={v => setExamOptionField(idx, 'textAr', v)} dir="rtl" />
                  <FormField label="Option (Dutch)" placeholder="Antwoordmogelijkheid..." value={opt.textNl} onChange={v => setExamOptionField(idx, 'textNl', v)} />
                  <FormField label="Option (French)" placeholder="Option de réponse..." value={opt.textFr} onChange={v => setExamOptionField(idx, 'textFr', v)} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Actions (exam) */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">* Required fields</p>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/admin/quizzes">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={!examIsValid || examSubmitting}
              className="gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:scale-[1.01] transition-all disabled:shadow-none disabled:scale-100"
            >
              {examSubmitting
                ? <><span className="animate-spin">⏳</span> Saving...</>
                : <><Save className="w-4 h-4" /> Save Exam Question</>}
            </Button>
          </div>
        </div>

      </form>
      )} {/* end bank === 'exam' */}

    </div>
  );
}
