'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useLanguage } from '@/contexts/language-context';

// ─── Types ─────────────────────────────────────────────

interface OptionForm {
    id?: number;
    textEn: string;
    textAr: string;
    textNl: string;
    textFr: string;
    isCorrect: boolean;
    displayOrder: number;
}

interface QuestionForm {
    categoryCode: string;
    difficultyLevel: string;
    questionType: string;
    questionEn: string;
    questionAr: string;
    questionNl: string;
    questionFr: string;
    explanationEn: string;
    explanationAr: string;
    explanationNl: string;
    explanationFr: string;
    contentImageUrl: string;
    isActive: boolean;
    options: OptionForm[];
}

interface CategoryOption {
    code: string;
    nameEn: string;
    nameAr: string;
    nameNl: string;
    nameFr: string;
}

interface AdminQuizQuestionResponse {
    id: number;
    categoryCode: string;
    categoryNameEn: string;
    difficultyLevel: string;
    questionType: string;
    questionEn: string;
    questionAr: string;
    questionNl: string;
    questionFr: string;
    explanationEn: string;
    explanationAr: string;
    explanationNl: string;
    explanationFr: string;
    contentImageUrl: string | null;
    isActive: boolean;
    status: string;
    optionsCount: number;
    options: {
        id: number;
        textEn: string;
        textAr: string;
        textNl: string;
        textFr: string;
        isCorrect: boolean;
        displayOrder: number;
    }[];
    isReferenced: boolean;
    createdAt: string;
    updatedAt: string;
}

const BLANK_OPTION: OptionForm = {
    textEn: '', textAr: '', textNl: '', textFr: '',
    isCorrect: false, displayOrder: 0,
};

// ─── Component ─────────────────────────────────────────

export default function AdminEditQuizQuestionPage() {
    const router = useRouter();
    const params = useParams();
    const questionId = params.id as string;
    const { t, language } = useLanguage();

    const [form, setForm] = useState<QuestionForm>({
        categoryCode: '', difficultyLevel: 'EASY', questionType: 'MULTIPLE_CHOICE',
        questionEn: '', questionAr: '', questionNl: '', questionFr: '',
        explanationEn: '', explanationAr: '', explanationNl: '', explanationFr: '',
        contentImageUrl: '', isActive: true, options: [],
    });
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isReferenced, setIsReferenced] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const MAX_FILE_SIZE_MB = 5;

    // Load data
    useEffect(() => {
        Promise.all([
            apiClient.get<CategoryOption[]>('/categories').catch(() => ({ data: [] as CategoryOption[] })),
            apiClient.get<AdminQuizQuestionResponse>(API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.DETAIL(questionId)),
        ]).then(([catRes, qRes]) => {
            setCategories(catRes.data);
            const q = qRes.data;
            setIsReferenced(q.isReferenced ?? false);
            setForm({
                categoryCode: q.categoryCode || '',
                difficultyLevel: q.difficultyLevel || 'EASY',
                questionType: q.questionType || 'MULTIPLE_CHOICE',
                questionEn: q.questionEn || '',
                questionAr: q.questionAr || '',
                questionNl: q.questionNl || '',
                questionFr: q.questionFr || '',
                explanationEn: q.explanationEn || '',
                explanationAr: q.explanationAr || '',
                explanationNl: q.explanationNl || '',
                explanationFr: q.explanationFr || '',
                contentImageUrl: q.contentImageUrl || '',
                isActive: q.isActive ?? true,
                options: q.options.map(o => ({
                    id: o.id,
                    textEn: o.textEn || '',
                    textAr: o.textAr || '',
                    textNl: o.textNl || '',
                    textFr: o.textFr || '',
                    isCorrect: o.isCorrect,
                    displayOrder: o.displayOrder,
                })),
            });
        }).catch(err => {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 404) {
                setErrorMsg(t('admin.quizzes.edit_not_found') || 'Question not found');
            } else {
                setErrorMsg(t('admin.quizzes.fetch_error') || 'Failed to load question');
            }
        }).finally(() => setLoading(false));
    }, [questionId, t]);

    useEffect(() => { if (toast) { const t2 = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t2); } }, [toast]);

    const isValid = useMemo(() => {
        return form.categoryCode.trim() !== '' &&
            form.questionEn.trim() !== '' &&
            form.options.length >= 2 &&
            form.options.some(o => o.isCorrect) &&
            form.options.every(o => o.textEn.trim() !== '');
    }, [form]);

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
        if (form.options.length < 2) errors.options = t('admin.quizzes.form.error_options') || 'At least 2 options are required';
        if (!form.options.some(o => o.isCorrect)) errors.correct = t('admin.quizzes.form.error_correct') || 'At least one correct option required';
        const emptyOpt = form.options.findIndex(o => !o.textEn.trim());
        if (emptyOpt >= 0) errors[`option_${emptyOpt}`] = 'English option text is required';
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

        // Client-side type validation
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setToast({ message: t('admin.quizzes.upload.invalid_type') || 'Invalid file type. Allowed: JPG, JPEG, PNG, WEBP', type: 'error' });
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Client-side size validation
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setToast({ message: (t('admin.quizzes.upload.too_large') || 'File too large. Maximum size:') + ` ${MAX_FILE_SIZE_MB}MB`, type: 'error' });
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
            setToast({ message: t('admin.quizzes.upload.success') || 'Image uploaded successfully', type: 'success' });
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
            const msg = axiosErr?.response?.data?.error || axiosErr?.message || 'Upload failed';
            setToast({ message: String(msg), type: 'error' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = () => {
        setField('contentImageUrl', '');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    /** Resolve image URL — backend returns relative paths like /images/quiz/xxx.png */
    const resolveImageUrl = (url: string): string => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        // Relative path from backend — prepend backend base URL
        return `http://localhost:8890${url}`;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        if (!validate()) return;

        try {
            setSubmitting(true);
            await apiClient.put(API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.UPDATE(questionId), {
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
                    id: o.id || null,
                    textEn: o.textEn.trim(),
                    textAr: o.textAr.trim() || '',
                    textNl: o.textNl.trim() || '',
                    textFr: o.textFr.trim() || '',
                    isCorrect: o.isCorrect,
                    displayOrder: o.displayOrder,
                })),
            });
            setToast({ message: t('admin.quizzes.form.update_success') || 'Question updated successfully', type: 'success' });
            setTimeout(() => router.push('/admin/quizzes'), 600);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { status?: number; data?: { error?: string; message?: string } }; message?: string };
            const status = axiosErr?.response?.status;
            if (status === 409) {
                setErrorMsg(t('admin.quizzes.edit_conflict') || axiosErr?.response?.data?.error || 'Cannot change structural fields — this question is referenced by quiz attempts. Create a new question instead.');
            } else {
                const msg = axiosErr?.response?.data?.error || axiosErr?.response?.data?.message || axiosErr?.message;
                setErrorMsg(String(msg || t('admin.quizzes.form.update_error') || 'Failed to update question'));
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
                <Link href="/admin/quizzes" className="text-gray-400 hover:text-gray-600 transition-colors text-xl">←</Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {t('admin.quizzes.edit_title') || 'Edit Question'}: #{questionId}
                    </h1>
                    <p className="text-gray-600 mt-1">{t('admin.quizzes.edit_desc') || 'Update an existing quiz question.'}</p>
                </div>
            </div>

            <form onSubmit={onSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                {errorMsg && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>}

                {isReferenced && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        <p className="font-medium">{t('admin.quizzes.edit_referenced_title') || '⚠ This question is referenced by quiz attempts'}</p>
                        <p className="mt-1 text-amber-700">{t('admin.quizzes.edit_referenced_detail') || 'Category, difficulty, question type, options, and correct answers cannot be changed to prevent historical data corruption. You can still edit text, explanations, image, and active status. To make structural changes, create a new question instead.'}</p>
                    </div>
                )}

                {/* Basic Info */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.quizzes.form.basic_info') || 'Basic Information'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.quizzes.form.category') || 'Category'} *</label>
                            <select value={form.categoryCode} onChange={e => setField('categoryCode', e.target.value)}
                                disabled={isReferenced}
                                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${fieldErrors.categoryCode ? 'border-red-300' : 'border-gray-300'} ${isReferenced ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                <option value="">{t('admin.quizzes.form.select_category') || 'Select a category...'}</option>
                                {categories.map(cat => <option key={cat.code} value={cat.code}>{getCategoryName(cat)} ({cat.code})</option>)}
                            </select>
                            {fieldErrors.categoryCode && <p className="mt-1 text-xs text-red-600">{fieldErrors.categoryCode}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.quizzes.form.difficulty') || 'Difficulty Level'}</label>
                            <select value={form.difficultyLevel} onChange={e => setField('difficultyLevel', e.target.value)}
                                disabled={isReferenced}
                                className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${isReferenced ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                <option value="EASY">Easy</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HARD">Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.quizzes.form.question_type') || 'Question Type'}</label>
                            <select value={form.questionType} onChange={e => setField('questionType', e.target.value)}
                                disabled={isReferenced}
                                className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${isReferenced ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                                <option value="TRUE_FALSE">True / False</option>
                                <option value="IMAGE_BASED">Image Based</option>
                            </select>
                        </div>
                    </div>
                    {/* Active toggle */}
                    <div className="mt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.isActive}
                                onChange={e => setField('isActive', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm text-gray-700">Active</span>
                        </label>
                    </div>
                </div>

                {/* Image Upload */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.quizzes.upload.title') || 'Content Image'}</h2>

                    {/* Preview */}
                    {form.contentImageUrl && (
                        <div className="mb-4 relative inline-block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={resolveImageUrl(form.contentImageUrl)}
                                alt="Question content"
                                className="max-h-48 rounded-lg border border-gray-200 object-contain bg-gray-50"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <button type="button" onClick={removeImage}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm"
                                title={t('admin.quizzes.upload.remove') || 'Remove Image'}>
                                ×
                            </button>
                        </div>
                    )}

                    {/* Upload + URL */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.quizzes.form.image_url') || 'Content Image URL'}</label>
                            <input value={form.contentImageUrl} placeholder="https://example.com/image.png or /images/quiz/..."
                                onChange={e => setField('contentImageUrl', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="flex items-end">
                            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp"
                                onChange={handleImageUpload} className="hidden" />
                            <button type="button" disabled={uploading}
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 text-sm font-medium rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
                                {uploading
                                    ? (t('admin.quizzes.upload.uploading') || 'Uploading...')
                                    : (t('admin.quizzes.upload.button') || '📤 Upload Image')}
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{t('admin.quizzes.upload.hint') || 'Accepted: JPG, JPEG, PNG, WEBP. Max 5MB.'}</p>
                </div>

                {/* Question Text */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.quizzes.form.questions') || 'Question Text (Multilingual)'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormTextarea label={(t('admin.quizzes.form.question_en') || 'Question (English)') + ' *'} placeholder="What does this sign mean?" value={form.questionEn} error={fieldErrors.questionEn} onChange={v => setField('questionEn', v)} />
                        <FormTextarea label={t('admin.quizzes.form.question_ar') || 'Question (Arabic)'} placeholder="ماذا تعني هذه العلامة؟" value={form.questionAr} onChange={v => setField('questionAr', v)} dir="rtl" />
                        <FormTextarea label={t('admin.quizzes.form.question_nl') || 'Question (Dutch)'} placeholder="Wat betekent dit verkeersbord?" value={form.questionNl} onChange={v => setField('questionNl', v)} />
                        <FormTextarea label={t('admin.quizzes.form.question_fr') || 'Question (French)'} placeholder="Que signifie ce panneau?" value={form.questionFr} onChange={v => setField('questionFr', v)} />
                    </div>
                </div>

                {/* Explanations */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.quizzes.form.explanations') || 'Explanations (Multilingual)'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormTextarea label={t('admin.quizzes.form.explanation_en') || 'Explanation (English)'} placeholder="This sign indicates..." value={form.explanationEn} onChange={v => setField('explanationEn', v)} />
                        <FormTextarea label={t('admin.quizzes.form.explanation_ar') || 'Explanation (Arabic)'} placeholder="تشير هذه العلامة إلى..." value={form.explanationAr} onChange={v => setField('explanationAr', v)} dir="rtl" />
                        <FormTextarea label={t('admin.quizzes.form.explanation_nl') || 'Explanation (Dutch)'} placeholder="Dit bord geeft aan..." value={form.explanationNl} onChange={v => setField('explanationNl', v)} />
                        <FormTextarea label={t('admin.quizzes.form.explanation_fr') || 'Explanation (French)'} placeholder="Ce panneau indique..." value={form.explanationFr} onChange={v => setField('explanationFr', v)} />
                    </div>
                </div>

                {/* Answer Options */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">{t('admin.quizzes.form.options_title') || 'Answer Options'} *</h2>
                        <button type="button" onClick={addOption}
                            disabled={isReferenced}
                            className={`text-sm text-blue-600 hover:text-blue-800 font-medium ${isReferenced ? 'opacity-40 cursor-not-allowed' : ''}`}>
                            + {t('admin.quizzes.form.add_option') || 'Add Option'}
                        </button>
                    </div>
                    {(fieldErrors.options || fieldErrors.correct) && (
                        <p className="text-xs text-red-600 mb-3">{fieldErrors.options || fieldErrors.correct}</p>
                    )}
                    <div className="space-y-4">
                        {form.options.map((opt, idx) => (
                            <div key={idx} className={`border rounded-lg p-4 ${opt.isCorrect ? 'border-green-300 bg-green-50/50' : 'border-gray-200'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-gray-700">Option {idx + 1}</span>
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={opt.isCorrect}
                                                onChange={e => setOptionField(idx, 'isCorrect', e.target.checked)}
                                                disabled={isReferenced}
                                                className={`rounded border-gray-300 text-green-600 focus:ring-green-500 ${isReferenced ? 'opacity-60 cursor-not-allowed' : ''}`} />
                                            <span className="text-xs text-gray-600">{t('admin.quizzes.form.is_correct') || 'Correct Answer'}</span>
                                        </label>
                                        {form.options.length > 2 && !isReferenced && (
                                            <button type="button" onClick={() => removeOption(idx)}
                                                className="text-xs text-red-500 hover:text-red-700">
                                                {t('admin.quizzes.form.remove_option') || 'Remove'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <FormField label={(t('admin.quizzes.form.option_text_en') || 'Option (English)') + ' *'} placeholder="Answer option..." value={opt.textEn}
                                        error={fieldErrors[`option_${idx}`]} onChange={v => setOptionField(idx, 'textEn', v)} />
                                    <FormField label={t('admin.quizzes.form.option_text_ar') || 'Option (Arabic)'} placeholder="خيار الإجابة..." value={opt.textAr} onChange={v => setOptionField(idx, 'textAr', v)} dir="rtl" />
                                    <FormField label={t('admin.quizzes.form.option_text_nl') || 'Option (Dutch)'} placeholder="Antwoordmogelijkheid..." value={opt.textNl} onChange={v => setOptionField(idx, 'textNl', v)} />
                                    <FormField label={t('admin.quizzes.form.option_text_fr') || 'Option (French)'} placeholder="Option de réponse..." value={opt.textFr} onChange={v => setOptionField(idx, 'textFr', v)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-xs text-gray-400">{t('admin.quizzes.form.required_note') || '* Required fields'}</p>
                    <div className="flex gap-3">
                        <Link href="/admin/quizzes" className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                            {t('admin.quizzes.cancel') || 'Cancel'}
                        </Link>
                        <button type="submit" disabled={!isValid || submitting}
                            className="px-6 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            {submitting ? (t('admin.quizzes.form.updating') || 'Updating...') : (t('admin.quizzes.form.update') || 'Update Question')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

// ─── Reusable form components ──────────────────────────

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

function FormTextarea({ label, placeholder, value, error, onChange, dir }: {
    label: string; placeholder?: string; value: string; error?: string; onChange: (v: string) => void; dir?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <textarea value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} dir={dir} rows={3}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${error ? 'border-red-300' : 'border-gray-300'}`} />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
