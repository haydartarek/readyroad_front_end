'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useLanguage } from '@/contexts/language-context';

// ─── Types ─────────────────────────────────────────────

interface QuizQuestion {
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
    options: OptionResponse[];
    isReferenced: boolean;
    createdAt: string;
    updatedAt: string;
}

interface OptionResponse {
    id: number;
    textEn: string;
    textAr: string;
    textNl: string;
    textFr: string;
    isCorrect: boolean;
    displayOrder: number;
}

interface PageResponse {
    items: QuizQuestion[];
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

const DIFFICULTY_LABELS: Record<string, Record<string, string>> = {
    EASY: { en: 'Easy', ar: 'سهل', nl: 'Makkelijk', fr: 'Facile' },
    MEDIUM: { en: 'Medium', ar: 'متوسط', nl: 'Gemiddeld', fr: 'Moyen' },
    HARD: { en: 'Hard', ar: 'صعب', nl: 'Moeilijk', fr: 'Difficile' },
};

const DIFFICULTY_COLORS: Record<string, string> = {
    EASY: 'bg-green-100 text-green-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HARD: 'bg-red-100 text-red-700',
};

const TYPE_LABELS: Record<string, string> = {
    MULTIPLE_CHOICE: 'MCQ',
    TRUE_FALSE: 'T/F',
    IMAGE_BASED: 'IMG',
};

type SortField = 'id' | 'questionEn' | 'difficultyLevel' | 'createdAt';
type SortDir = 'asc' | 'desc';

// ─── Component ─────────────────────────────────────────

export default function AdminQuizzesPage() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<CategoryOption[]>([]);

    const [page, setPage] = useState(Number(searchParams.get('page')) || 0);
    const [size, setSize] = useState(Number(searchParams.get('size')) || 20);
    const [sortField, setSortField] = useState<SortField>(
        (searchParams.get('sortField') as SortField) || 'createdAt'
    );
    const [sortDir, setSortDir] = useState<SortDir>(
        (searchParams.get('sortDir') as SortDir) || 'desc'
    );
    const [categoryFilter, setCategoryFilter] = useState(searchParams.get('categoryCode') || '');
    const [difficultyFilter, setDifficultyFilter] = useState(searchParams.get('difficulty') || '');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState<{ message: string; detail?: string; actionLabel?: string; actionHref?: string; type: 'success' | 'error' } | null>(null);

    // Reset Test Data state
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState('');
    const [resetting, setResetting] = useState(false);
    const [resetResult, setResetResult] = useState<{ deletedAnswers: number; deletedAttempts: number } | null>(null);

    // Race-condition guard: only the latest fetch writes state
    const fetchIdRef = useRef(0);
    // Stable ref for t() so fetchQuestions doesn't depend on its identity
    const tRef = useRef(t);
    tRef.current = t;

    useEffect(() => {
        apiClient.get<CategoryOption[]>('/categories')
            .then(res => setCategories(res.data))
            .catch(() => { });
    }, []);

    const updateUrl = useCallback((params: Record<string, string | number>) => {
        const sp = new URLSearchParams();
        const merged = {
            page, size, sortField, sortDir,
            categoryCode: categoryFilter,
            difficulty: difficultyFilter,
            q: searchQuery,
            ...params,
        };
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
    }, [page, size, sortField, sortDir, categoryFilter, difficultyFilter, searchQuery, pathname, router]);

    const fetchQuestions = useCallback(async () => {
        const id = ++fetchIdRef.current;          // unique id for this request
        try {
            setLoading(true);
            setError(null);

            const params: Record<string, string | number> = {
                page,
                size,
                sort: `${sortField},${sortDir}`,
            };
            if (categoryFilter) params.categoryCode = categoryFilter;
            if (difficultyFilter) params.difficulty = difficultyFilter;
            if (searchQuery) params.q = searchQuery;

            const res = await apiClient.get<PageResponse>(API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.LIST, params);

            // Discard if a newer request was fired while we waited
            if (id !== fetchIdRef.current) return;

            setQuestions(res.data.items);
            setTotalItems(res.data.totalItems);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            if (id !== fetchIdRef.current) return;   // stale error — ignore
            console.error('Failed to fetch admin quiz questions:', err);
            setError(tRef.current('admin.quizzes.fetch_error') || 'Failed to load quiz questions');
        } finally {
            if (id === fetchIdRef.current) setLoading(false);
        }
    }, [page, size, sortField, sortDir, categoryFilter, difficultyFilter, searchQuery]);

    useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== searchQuery) {
                setSearchQuery(searchInput);
                setPage(0);
                updateUrl({ q: searchInput, page: 0 });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        if (toast) {
            // Success toasts auto-dismiss; error toasts with detail stay until dismissed
            if (toast.type === 'success' || !toast.detail) {
                const timer = setTimeout(() => setToast(null), 3500);
                return () => clearTimeout(timer);
            }
        }
    }, [toast]);

    const handlePageChange = (newPage: number) => { setPage(newPage); updateUrl({ page: newPage }); };
    const handleSizeChange = (newSize: number) => { setSize(newSize); setPage(0); updateUrl({ size: newSize, page: 0 }); };
    const handleCategoryChange = (code: string) => { setCategoryFilter(code); setPage(0); updateUrl({ categoryCode: code, page: 0 }); };
    const handleDifficultyChange = (d: string) => { setDifficultyFilter(d); setPage(0); updateUrl({ difficulty: d, page: 0 }); };

    const handleSort = (field: SortField) => {
        let newDir: SortDir = 'asc';
        if (sortField === field) newDir = sortDir === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDir(newDir);
        setPage(0);
        updateUrl({ sortField: field, sortDir: newDir, page: 0 });
    };

    const handleDelete = async (id: number) => {
        try {
            setDeleting(true);
            await apiClient.delete(API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.DELETE(id));
            setDeleteId(null);
            setToast({ message: t('admin.quizzes.delete_success') || 'Question deleted successfully', type: 'success' });
            if (questions.length === 1 && page > 0) {
                handlePageChange(page - 1);
            } else {
                fetchQuestions();
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { status?: number; data?: { error?: string } } };
            const status = axiosErr?.response?.status;
            if (status === 409) {
                setToast({
                    message: t('admin.quizzes.delete_conflict') || 'Cannot delete this question because it is referenced by quiz attempts or user answers. Remove those references first.',
                    detail: t('admin.quizzes.delete_conflict_hint') || 'Tip: You can deactivate or unpublish the question instead of deleting it.',
                    actionLabel: t('admin.quizzes.edit') || 'Edit',
                    actionHref: `/admin/quizzes/${id}/edit`,
                    type: 'error',
                });
            } else if (status === 404) {
                setToast({
                    message: t('admin.quizzes.delete_not_found') || 'Question not found — it may have been already deleted.',
                    type: 'error',
                });
                fetchQuestions();
            } else {
                setToast({
                    message: t('admin.quizzes.delete_failed') || 'Failed to delete question. Please try again.',
                    type: 'error',
                });
            }
            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    };

    const getQuestionText = (q: QuizQuestion): string => {
        const map: Record<string, string> = { en: q.questionEn, ar: q.questionAr, nl: q.questionNl, fr: q.questionFr };
        return map[language] || q.questionEn || `Question #${q.id}`;
    };

    const handleResetTestData = async () => {
        if (resetConfirmText !== 'RESET TEST DATA') return;
        try {
            setResetting(true);
            const res = await apiClient.post<{ deletedAnswers: number; deletedAttempts: number }>(
                API_ENDPOINTS.ADMIN.RESET_TEST_DATA,
                { confirmation: 'RESET TEST DATA' }
            );
            setResetResult(res.data);
            setToast({
                message: t('admin.quizzes.reset_success') || 'Test data reset completed successfully',
                detail: `${t('admin.quizzes.reset_deleted_attempts') || 'Attempts deleted'}: ${res.data.deletedAttempts}, ${t('admin.quizzes.reset_deleted_answers') || 'Answers deleted'}: ${res.data.deletedAnswers}`,
                type: 'success',
            });
            fetchQuestions(); // Refresh to update referenced status
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
            const msg = axiosErr?.response?.data?.error || axiosErr?.message || 'Reset failed';
            setToast({ message: String(msg), type: 'error' });
        } finally {
            setResetting(false);
            setShowResetModal(false);
            setResetConfirmText('');
        }
    };

    const getCategoryLabel = (code: string): string => {
        const cat = categories.find(c => c.code === code);
        if (cat) {
            const map: Record<string, string> = { en: cat.nameEn, ar: cat.nameAr, nl: cat.nameNl, fr: cat.nameFr };
            return map[language] || cat.nameEn;
        }
        return code;
    };

    const getDifficultyLabel = (level: string): string => {
        return DIFFICULTY_LABELS[level]?.[language] || DIFFICULTY_LABELS[level]?.en || level;
    };

    const getOptionText = (opt: OptionResponse): string => {
        const map: Record<string, string> = { en: opt.textEn, ar: opt.textAr, nl: opt.textNl, fr: opt.textFr };
        return map[language] || opt.textEn;
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
        return <span className="text-blue-600 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
    };

    const startIdx = totalItems > 0 ? page * size + 1 : 0;
    const endIdx = Math.min(page * size + questions.length, totalItems);

    if (loading && questions.length === 0) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-white rounded-lg border p-4 h-16 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error && questions.length === 0) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-700 font-medium mb-3">{error}</p>
                <button onClick={fetchQuestions} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">
                    {t('admin.quizzes.retry') || 'Retry'}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 max-w-md px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    <div className="flex items-start gap-2">
                        <div className="flex-1">
                            <p>{toast.message}</p>
                            {toast.detail && (
                                <p className="mt-1.5 text-xs opacity-90">{toast.detail}</p>
                            )}
                            {toast.actionHref && (
                                <Link href={toast.actionHref}
                                    className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-white/20 hover:bg-white/30 rounded transition-colors">
                                    {toast.actionLabel}
                                </Link>
                            )}
                        </div>
                        <button onClick={() => setToast(null)}
                            className="text-white/70 hover:text-white text-lg leading-none flex-shrink-0 mt-0.5"
                            aria-label="Dismiss">
                            ×
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('admin.quizzes.title') || 'Quiz Questions'}</h1>
                    <p className="text-gray-600 mt-1">
                        {t('admin.quizzes.total_count') || 'Total'}: <span className="font-semibold text-gray-900">{totalItems}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowResetModal(true)}
                        className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium">
                        ⟳ {t('admin.quizzes.reset_test_data') || 'Reset Test Data'}
                    </button>
                    <Link href="/admin/quizzes/new"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        + {t('admin.quizzes.add_new') || 'Add Question'}
                    </Link>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                <input type="text" placeholder={t('admin.quizzes.search_placeholder') || 'Search questions...'} value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    className="flex-1 min-w-[200px] max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <select value={categoryFilter} onChange={e => handleCategoryChange(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option value="">{t('admin.quizzes.all_categories') || 'All Categories'}</option>
                    {categories.map(cat => (
                        <option key={cat.code} value={cat.code}>{getCategoryLabel(cat.code)} ({cat.code})</option>
                    ))}
                </select>
                <select value={difficultyFilter} onChange={e => handleDifficultyChange(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option value="">{t('admin.quizzes.all_difficulties') || 'All Difficulties'}</option>
                    {['EASY', 'MEDIUM', 'HARD'].map(d => (
                        <option key={d} value={d}>{getDifficultyLabel(d)}</option>
                    ))}
                </select>
                <select value={size} onChange={e => handleSizeChange(Number(e.target.value))}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                    {PAGE_SIZE_OPTIONS.map(s => (
                        <option key={s} value={s}>{s} {t('admin.quizzes.per_page') || 'per page'}</option>
                    ))}
                </select>
                {loading && <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
            </div>

            {totalItems > 0 && (
                <p className="text-sm text-gray-500">
                    {t('admin.quizzes.showing') || 'Showing'} {startIdx}–{endIdx} / {totalItems}
                </p>
            )}

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer select-none w-10" onClick={() => handleSort('id')}>
                                    ID<SortIcon field="id" />
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer select-none" onClick={() => handleSort('questionEn')}>
                                    {t('admin.quizzes.col_question') || 'Question'}<SortIcon field="questionEn" />
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">{t('admin.quizzes.col_category') || 'Category'}</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer select-none" onClick={() => handleSort('difficultyLevel')}>
                                    {t('admin.quizzes.col_difficulty') || 'Difficulty'}<SortIcon field="difficultyLevel" />
                                </th>
                                <th className="px-4 py-3 text-center font-medium text-gray-600">{t('admin.quizzes.col_type') || 'Type'}</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-600">{t('admin.quizzes.col_options') || 'Opts'}</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-600">{t('admin.quizzes.col_status') || 'Status'}</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-600">{t('admin.quizzes.col_actions') || 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {questions.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">{t('admin.quizzes.no_results') || 'No quiz questions found'}</td></tr>
                            ) : (
                                questions.map(q => (
                                    <React.Fragment key={q.id}>
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3"><span className="font-mono text-xs text-gray-500">{q.id}</span></td>
                                            <td className="px-4 py-3 max-w-md"><span className="text-gray-900 line-clamp-2">{getQuestionText(q)}</span></td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{getCategoryLabel(q.categoryCode)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[q.difficultyLevel] || 'bg-gray-100 text-gray-700'}`}>
                                                    {getDifficultyLabel(q.difficultyLevel)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center"><span className="text-xs text-gray-600 font-mono">{TYPE_LABELS[q.questionType] || q.questionType}</span></td>
                                            <td className="px-4 py-3 text-center"><span className="text-xs text-gray-600">{q.optionsCount}</span></td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${q.status === 'PUBLISHED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{q.status}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <button onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                                                        className="text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                                        title={t('admin.quizzes.view') || 'View'}>
                                                        {expandedId === q.id ? '▲' : '▼'}
                                                    </button>
                                                    <Link href={`/admin/quizzes/${q.id}/edit`}
                                                        className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                                                        {t('admin.quizzes.edit') || 'Edit'}
                                                    </Link>
                                                    {deleteId === q.id ? (
                                                        <div className="inline-flex items-center gap-1">
                                                            <button onClick={() => handleDelete(q.id)} disabled={deleting}
                                                                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50">
                                                                {deleting ? '...' : (t('admin.quizzes.confirm_delete') || 'Confirm')}
                                                            </button>
                                                            <button onClick={() => setDeleteId(null)}
                                                                className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300">
                                                                {t('admin.quizzes.cancel') || 'Cancel'}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => setDeleteId(q.id)}
                                                            className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors">
                                                            {t('admin.quizzes.delete') || 'Delete'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === q.id && (
                                            <tr className="bg-blue-50/50">
                                                <td colSpan={8} className="px-6 py-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                                        <DetailLang label="English" text={q.questionEn} />
                                                        <DetailLang label="العربية" text={q.questionAr} dir="rtl" />
                                                        <DetailLang label="Nederlands" text={q.questionNl} />
                                                        <DetailLang label="Français" text={q.questionFr} />
                                                    </div>
                                                    {q.options && q.options.length > 0 && (
                                                        <div className="mb-3">
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Answer Options</p>
                                                            <div className="space-y-1">
                                                                {q.options
                                                                    .sort((a, b) => a.displayOrder - b.displayOrder)
                                                                    .map((opt, idx) => (
                                                                        <div key={opt.id} className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded ${opt.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'}`}>
                                                                            <span className="text-xs font-medium text-gray-400 w-5">{idx + 1}.</span>
                                                                            <span className={opt.isCorrect ? 'text-green-700 font-medium' : 'text-gray-700'}>{getOptionText(opt)}</span>
                                                                            {opt.isCorrect && <span className="text-green-600 text-xs ml-auto">✓ Correct</span>}
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {q.explanationEn && (
                                                        <div className="mb-3">
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Explanation</p>
                                                            <p className="text-sm text-gray-600">{q.explanationEn}</p>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                                        <span>ID: {q.id}</span>
                                                        <span>Active: {q.isActive ? '✓' : '✗'}</span>
                                                        {q.contentImageUrl && <span>Has Image</span>}
                                                        {q.createdAt && <span>Created: {new Date(q.createdAt).toLocaleDateString()}</span>}
                                                        {q.updatedAt && <span>Updated: {new Date(q.updatedAt).toLocaleDateString()}</span>}
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

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                        <p className="text-xs text-gray-500">Page {page + 1} of {totalPages}</p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => handlePageChange(0)} disabled={page <= 0}
                                className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">««</button>
                            <button onClick={() => handlePageChange(page - 1)} disabled={page <= 0}
                                className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">«</button>
                            {generatePageNumbers(page, totalPages).map((p, idx, arr) => (
                                <span key={`${p}-${idx}`}>
                                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-gray-400 text-xs">…</span>}
                                    <button onClick={() => handlePageChange(p)}
                                        className={`px-2.5 py-1 text-xs rounded border ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'}`}>
                                        {p + 1}
                                    </button>
                                </span>
                            ))}
                            <button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages - 1}
                                className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">»</button>
                            <button onClick={() => handlePageChange(totalPages - 1)} disabled={page >= totalPages - 1}
                                className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">»»</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Reset Test Data Confirmation Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
                        <h3 className="text-lg font-bold text-red-700 mb-2">
                            {t('admin.quizzes.reset_confirm_title') || 'Reset Test Data'}
                        </h3>
                        <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                            {t('admin.quizzes.reset_confirm_warning') || 'This will permanently delete all quiz attempts and answers marked as test data. Real user data will NOT be affected. This action cannot be undone.'}
                        </p>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('admin.quizzes.reset_confirm_label') || 'Type'} <span className="font-mono font-bold text-red-600">RESET TEST DATA</span> {t('admin.quizzes.reset_confirm_label_suffix') || 'to confirm'}:
                        </label>
                        <input
                            type="text"
                            value={resetConfirmText}
                            onChange={(e) => setResetConfirmText(e.target.value)}
                            placeholder="RESET TEST DATA"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowResetModal(false); setResetConfirmText(''); }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={resetting}
                            >
                                {t('admin.quizzes.cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={handleResetTestData}
                                disabled={resetConfirmText !== 'RESET TEST DATA' || resetting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {resetting ? (t('admin.quizzes.resetting') || 'Resetting…') : (t('admin.quizzes.reset_confirm_button') || 'Reset Test Data')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function generatePageNumbers(current: number, total: number): number[] {
    const pages: number[] = [];
    for (let i = 0; i < total; i++) {
        if (i === 0 || i === total - 1 || Math.abs(i - current) <= 2) pages.push(i);
    }
    return pages;
}

function DetailLang({ label, text, dir }: { label: string; text: string; dir?: string }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-3" dir={dir}>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-sm text-gray-900 line-clamp-3">{text || '—'}</p>
        </div>
    );
}
