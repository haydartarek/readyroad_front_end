'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { apiClient, isServiceUnavailable, logApiError } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useLanguage } from '@/contexts/language-context';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Plus, RotateCcw, Search, ChevronDown, ChevronUp,
  Pencil, Trash2, CheckCircle2, AlertTriangle, X,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────

interface QuizQuestion {
  id: number; categoryCode: string; categoryNameEn: string;
  difficultyLevel: string; questionType: string;
  questionEn: string; questionAr: string; questionNl: string; questionFr: string;
  explanationEn: string; explanationAr: string; explanationNl: string; explanationFr: string;
  contentImageUrl: string | null; isActive: boolean; status: string;
  optionsCount: number; options: OptionResponse[];
  isReferenced: boolean; createdAt: string; updatedAt: string;
}
interface OptionResponse {
  id: number; textEn: string; textAr: string; textNl: string; textFr: string;
  isCorrect: boolean; displayOrder: number;
}
interface PageResponse {
  items: QuizQuestion[]; page: number; size: number;
  totalItems: number; totalPages: number;
}
interface CategoryOption {
  code: string; nameEn: string; nameAr: string; nameNl: string; nameFr: string;
}

// ─── Constants ─────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const DIFFICULTY_LABELS: Record<string, Record<string, string>> = {
  EASY:   { en: 'Easy',   ar: 'سهل',   nl: 'Makkelijk', fr: 'Facile' },
  MEDIUM: { en: 'Medium', ar: 'متوسط', nl: 'Gemiddeld',  fr: 'Moyen'  },
  HARD:   { en: 'Hard',   ar: 'صعب',   nl: 'Moeilijk',  fr: 'Difficile' },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY:   'bg-green-500/10 text-green-600',
  MEDIUM: 'bg-amber-500/10 text-amber-600',
  HARD:   'bg-destructive/10 text-destructive',
};

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: 'MCQ',
  TRUE_FALSE:      'T/F',
  IMAGE_BASED:     'IMG',
};

type SortField = 'id' | 'questionEn' | 'difficultyLevel' | 'createdAt';
type SortDir   = 'asc' | 'desc';

// ─── Helpers ────────────────────────────────────────────

function generatePageNumbers(current: number, total: number): number[] {
  const pages: number[] = [];
  for (let i = 0; i < total; i++) {
    if (i === 0 || i === total - 1 || Math.abs(i - current) <= 2) pages.push(i);
  }
  return pages;
}

function DetailLang({ label, text, dir }: { label: string; text: string; dir?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/30 p-3" dir={dir}>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-foreground line-clamp-3">{text || '—'}</p>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────

export default function AdminQuizzesPage() {
  const { t, language } = useLanguage();
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();

  const [questions, setQuestions]   = useState<QuizQuestion[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [page, setPage]               = useState(Number(searchParams.get('page')) || 0);
  const [size, setSize]               = useState(Number(searchParams.get('size')) || 20);
  const [sortField, setSortField]     = useState<SortField>((searchParams.get('sortField') as SortField) || 'createdAt');
  const [sortDir, setSortDir]         = useState<SortDir>((searchParams.get('sortDir') as SortDir) || 'desc');
  const [categoryFilter, setCategoryFilter]   = useState(searchParams.get('categoryCode') || '');
  const [difficultyFilter, setDifficultyFilter] = useState(searchParams.get('difficulty') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [totalItems, setTotalItems]   = useState(0);
  const [totalPages, setTotalPages]   = useState(0);

  const [expandedId, setExpandedId]   = useState<number | null>(null);
  const [deleteId, setDeleteId]       = useState<number | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [toast, setToast]             = useState<{
    message: string; detail?: string;
    actionLabel?: string; actionHref?: string;
    type: 'success' | 'error';
  } | null>(null);

  const [showResetModal, setShowResetModal]   = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting]             = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  const fetchIdRef = useRef(0);
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    apiClient.get<CategoryOption[]>('/categories')
      .then(res => setCategories(res.data))
      .catch(() => {});
  }, []);

  const updateUrl = useCallback((params: Record<string, string | number>) => {
    const sp = new URLSearchParams();
    const merged = {
      page, size, sortField, sortDir,
      categoryCode: categoryFilter, difficulty: difficultyFilter, q: searchQuery,
      ...params,
    };
    Object.entries(merged).forEach(([k, v]) => {
      const val = String(v);
      if (k === 'page') sp.set(k, val);
      else if (val !== '' && val !== '0' && val !== 'undefined' && val !== 'null') sp.set(k, val);
    });
    if (!sp.has('page')) sp.set('page', '0');
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }, [page, size, sortField, sortDir, categoryFilter, difficultyFilter, searchQuery, pathname, router]);

  const fetchQuestions = useCallback(async () => {
    const id = ++fetchIdRef.current;
    try {
      setLoading(true); setError(null);
      const params: Record<string, string | number> = { page, size, sort: `${sortField},${sortDir}` };
      if (categoryFilter)  params.categoryCode = categoryFilter;
      if (difficultyFilter) params.difficulty  = difficultyFilter;
      if (searchQuery)     params.q            = searchQuery;
      const res = await apiClient.get<PageResponse>(API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.LIST, params);
      if (id !== fetchIdRef.current) return;
      setQuestions(res.data.items);
      setTotalItems(res.data.totalItems);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      if (id !== fetchIdRef.current) return;
      logApiError('Failed to fetch admin quiz questions', err);
      if (isServiceUnavailable(err)) setServiceUnavailable(true);
      else setError(tRef.current('admin.quizzes.fetch_error') || 'Failed to load quiz questions');
    } finally {
      if (id === fetchIdRef.current) setLoading(false);
    }
  }, [page, size, sortField, sortDir, categoryFilter, difficultyFilter, searchQuery]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        setSearchQuery(searchInput); setPage(0); updateUrl({ q: searchInput, page: 0 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line

  useEffect(() => {
    if (toast && (toast.type === 'success' || !toast.detail)) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handlePageChange       = (p: number) => { setPage(p); updateUrl({ page: p }); };
  const handleSizeChange       = (s: number) => { setSize(s); setPage(0); updateUrl({ size: s, page: 0 }); };
  const handleCategoryChange   = (c: string) => { setCategoryFilter(c); setPage(0); updateUrl({ categoryCode: c, page: 0 }); };
  const handleDifficultyChange = (d: string) => { setDifficultyFilter(d); setPage(0); updateUrl({ difficulty: d, page: 0 }); };

  const handleSort = (field: SortField) => {
    const newDir: SortDir = sortField === field && sortDir === 'asc' ? 'desc' : 'asc';
    setSortField(field); setSortDir(newDir); setPage(0);
    updateUrl({ sortField: field, sortDir: newDir, page: 0 });
  };

  const handleDelete = async (id: number) => {
    try {
      setDeleting(true);
      await apiClient.delete(API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.DELETE(id));
      setDeleteId(null);
      setToast({ message: t('admin.quizzes.delete_success') || 'Question deleted successfully', type: 'success' });
      if (questions.length === 1 && page > 0) handlePageChange(page - 1);
      else fetchQuestions();
    } catch (err: unknown) {
      logApiError('Failed to delete quiz question', err);
      if (isServiceUnavailable(err)) {
        setServiceUnavailable(true);
      } else {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 409) {
          setToast({
            message: t('admin.quizzes.delete_conflict') || 'Cannot delete — referenced by quiz attempts.',
            detail: t('admin.quizzes.delete_conflict_hint') || 'Deactivate the question instead.',
            actionLabel: t('admin.quizzes.edit') || 'Edit',
            actionHref: `/admin/quizzes/${id}/edit`,
            type: 'error',
          });
        } else if (status === 404) {
          setToast({ message: 'Question not found — already deleted.', type: 'error' });
          fetchQuestions();
        } else {
          setToast({ message: 'Failed to delete question. Please try again.', type: 'error' });
        }
      }
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleResetTestData = async () => {
    if (resetConfirmText !== 'RESET TEST DATA') return;
    try {
      setResetting(true);
      const res = await apiClient.post<{ deletedAnswers: number; deletedAttempts: number }>(
        API_ENDPOINTS.ADMIN.RESET_TEST_DATA,
        { confirmation: 'RESET TEST DATA' }
      );
      setToast({
        message: 'Test data reset completed successfully',
        detail: `Attempts deleted: ${res.data.deletedAttempts} · Answers deleted: ${res.data.deletedAnswers}`,
        type: 'success',
      });
      fetchQuestions();
    } catch (err: unknown) {
      logApiError('Failed to reset test data', err);
      if (isServiceUnavailable(err)) setServiceUnavailable(true);
      else {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Reset failed';
        setToast({ message: String(msg), type: 'error' });
      }
    } finally {
      setResetting(false); setShowResetModal(false); setResetConfirmText('');
    }
  };

  const getCategoryLabel  = (code: string)  => { const c = categories.find(x => x.code === code); if (!c) return code; return ({ en: c.nameEn, ar: c.nameAr, nl: c.nameNl, fr: c.nameFr })[language] || c.nameEn; };
  const getDifficultyLabel = (level: string) => DIFFICULTY_LABELS[level]?.[language] || DIFFICULTY_LABELS[level]?.en || level;
  const getQuestionText   = (q: QuizQuestion) => ({ en: q.questionEn, ar: q.questionAr, nl: q.questionNl, fr: q.questionFr })[language] || q.questionEn || `Question #${q.id}`;
  const getOptionText     = (o: OptionResponse) => ({ en: o.textEn, ar: o.textAr, nl: o.textNl, fr: o.textFr })[language] || o.textEn;

  const SortIcon = ({ field }: { field: SortField }) => (
    sortField === field
      ? <span className="text-primary ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
      : <span className="text-muted-foreground/40 ml-1">↕</span>
  );

  const startIdx = totalItems > 0 ? page * size + 1 : 0;
  const endIdx   = Math.min(page * size + questions.length, totalItems);

  // ── Loading skeleton ──
  if (loading && questions.length === 0) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 bg-muted rounded-xl w-64" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-card rounded-2xl border border-border/50 h-14" />
          ))}
        </div>
      </div>
    );
  }

  // ── Full error state ──
  if (error && questions.length === 0) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
        <p className="text-destructive font-semibold">{error}</p>
        <Button variant="outline" onClick={fetchQuestions}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {serviceUnavailable && <ServiceUnavailableBanner onRetry={fetchQuestions} />}

      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed top-4 right-4 z-50 max-w-md rounded-2xl shadow-xl text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-300',
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-destructive text-white'
        )}>
          <div className="flex items-start gap-3 px-4 py-3">
            {toast.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p>{toast.message}</p>
              {toast.detail && <p className="mt-1 text-xs opacity-90">{toast.detail}</p>}
              {toast.actionHref && (
                <Link
                  href={toast.actionHref}
                  className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  {toast.actionLabel}
                </Link>
              )}
            </div>
            <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 transition-opacity flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{t('admin.quizzes.title') || 'Quiz Questions'}</h1>
          <p className="text-muted-foreground mt-1">
            {t('admin.quizzes.total_count') || 'Total'}:{' '}
            <span className="font-bold text-foreground">{totalItems}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowResetModal(true)}
            className="gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/5 hover:border-amber-500/50"
          >
            <RotateCcw className="w-4 h-4" />
            {t('admin.quizzes.reset_test_data') || 'Reset Test Data'}
          </Button>
          <Button asChild className="gap-2 shadow-md shadow-primary/20">
            <Link href="/admin/quizzes/new">
              <Plus className="w-4 h-4" />
              {t('admin.quizzes.add_new') || 'Add Question'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('admin.quizzes.search_placeholder') || 'Search questions...'}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <select
          value={categoryFilter} onChange={e => handleCategoryChange(e.target.value)}
          className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">{t('admin.quizzes.all_categories') || 'All Categories'}</option>
          {categories.map(cat => (
            <option key={cat.code} value={cat.code}>{getCategoryLabel(cat.code)} ({cat.code})</option>
          ))}
        </select>
        <select
          value={difficultyFilter} onChange={e => handleDifficultyChange(e.target.value)}
          className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">{t('admin.quizzes.all_difficulties') || 'All Difficulties'}</option>
          {['EASY', 'MEDIUM', 'HARD'].map(d => (
            <option key={d} value={d}>{getDifficultyLabel(d)}</option>
          ))}
        </select>
        <select
          value={size} onChange={e => handleSizeChange(Number(e.target.value))}
          className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {PAGE_SIZE_OPTIONS.map(s => (
            <option key={s} value={s}>{s} / page</option>
          ))}
        </select>
        {loading && (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {totalItems > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{startIdx}–{endIdx}</span> of{' '}
          <span className="font-semibold text-foreground">{totalItems}</span>
        </p>
      )}

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border/40">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 text-left font-semibold cursor-pointer select-none w-14" onClick={() => handleSort('id')}>
                  ID<SortIcon field="id" />
                </th>
                <th className="px-4 py-3 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('questionEn')}>
                  {t('admin.quizzes.col_question') || 'Question'}<SortIcon field="questionEn" />
                </th>
                <th className="px-4 py-3 text-left font-semibold">{t('admin.quizzes.col_category') || 'Category'}</th>
                <th className="px-4 py-3 text-left font-semibold cursor-pointer select-none" onClick={() => handleSort('difficultyLevel')}>
                  {t('admin.quizzes.col_difficulty') || 'Difficulty'}<SortIcon field="difficultyLevel" />
                </th>
                <th className="px-4 py-3 text-center font-semibold">Type</th>
                <th className="px-4 py-3 text-center font-semibold">Opts</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="space-y-2">
                      <div className="text-4xl">📋</div>
                      <p className="text-muted-foreground">{t('admin.quizzes.no_results') || 'No quiz questions found'}</p>
                    </div>
                  </td>
                </tr>
              ) : questions.map(q => (
                <React.Fragment key={q.id}>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">#{q.id}</span>
                    </td>
                    <td className="px-4 py-3 max-w-sm">
                      <span className="text-foreground line-clamp-2 text-sm">{getQuestionText(q)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs font-medium">
                        {getCategoryLabel(q.categoryCode)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn('border-0 text-xs font-semibold', DIFFICULTY_COLORS[q.difficultyLevel] || 'bg-muted text-foreground')}>
                        {getDifficultyLabel(q.difficultyLevel)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-lg">
                        {TYPE_LABELS[q.questionType] || q.questionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-muted-foreground font-semibold">{q.optionsCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn(
                        'border-0 text-xs font-semibold',
                        q.status === 'PUBLISHED' ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'
                      )}>
                        {q.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Expand */}
                        <button
                          onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                        >
                          {expandedId === q.id
                            ? <ChevronUp className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {/* Edit */}
                        <Link
                          href={`/admin/quizzes/${q.id}/edit`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        {/* Delete */}
                        {deleteId === q.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(q.id)} disabled={deleting}
                              className="px-2 py-1 text-xs rounded-lg bg-destructive text-white hover:opacity-90 disabled:opacity-50 font-semibold transition-opacity"
                            >
                              {deleting ? '...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="px-2 py-1 text-xs rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(q.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {expandedId === q.id && (
                    <tr className="bg-primary/5">
                      <td colSpan={8} className="px-6 py-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <DetailLang label="English"    text={q.questionEn} />
                          <DetailLang label="العربية"   text={q.questionAr} dir="rtl" />
                          <DetailLang label="Nederlands" text={q.questionNl} />
                          <DetailLang label="Français"   text={q.questionFr} />
                        </div>

                        {q.options?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Answer Options</p>
                            <div className="space-y-1.5">
                              {q.options
                                .sort((a, b) => a.displayOrder - b.displayOrder)
                                .map((opt, idx) => (
                                  <div
                                    key={opt.id}
                                    className={cn(
                                      'flex items-center gap-2 text-sm px-3 py-2 rounded-xl border transition-colors',
                                      opt.isCorrect
                                        ? 'bg-green-500/10 border-green-500/20 text-green-700'
                                        : 'bg-card border-border/50 text-foreground'
                                    )}
                                  >
                                    <span className="text-xs font-bold text-muted-foreground w-5">{idx + 1}.</span>
                                    <span className={cn('flex-1', opt.isCorrect && 'font-semibold')}>{getOptionText(opt)}</span>
                                    {opt.isCorrect && (
                                      <Badge className="bg-green-500/10 text-green-600 border-0 text-xs ml-auto">✓ Correct</Badge>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {q.explanationEn && (
                          <div className="space-y-1">
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">Explanation</p>
                            <p className="text-sm text-muted-foreground">{q.explanationEn}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/40">
                          <span>ID: <strong>{q.id}</strong></span>
                          <span>Active: <strong>{q.isActive ? '✓' : '✗'}</strong></span>
                          {q.contentImageUrl && <Badge variant="outline" className="text-xs">Has Image</Badge>}
                          {q.createdAt && <span>Created: {new Date(q.createdAt).toLocaleDateString()}</span>}
                          {q.updatedAt && <span>Updated: {new Date(q.updatedAt).toLocaleDateString()}</span>}
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
                className="w-7 h-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handlePageChange(page - 1)} disabled={page <= 0}
                className="w-7 h-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all">
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
                className="w-7 h-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handlePageChange(totalPages - 1)} disabled={page >= totalPages - 1}
                className="w-7 h-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reset Test Data Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-3xl shadow-2xl border border-border/50 max-w-md w-full mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  {t('admin.quizzes.reset_confirm_title') || 'Reset Test Data'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {t('admin.quizzes.reset_confirm_warning') ||
                    'This will permanently delete all quiz attempts and answers marked as test data. Real user data will NOT be affected.'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Type <span className="font-mono text-destructive">RESET TEST DATA</span> to confirm:
              </label>
              <input
                type="text" autoFocus
                value={resetConfirmText}
                onChange={e => setResetConfirmText(e.target.value)}
                placeholder="RESET TEST DATA"
                className="w-full rounded-xl border border-border/50 px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-2 focus:ring-destructive/30 transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => { setShowResetModal(false); setResetConfirmText(''); }}
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetTestData}
                disabled={resetConfirmText !== 'RESET TEST DATA' || resetting}
                className="gap-2 bg-destructive hover:bg-destructive/90 text-white shadow-md shadow-destructive/20 disabled:opacity-40"
              >
                {resetting
                  ? <><span className="animate-spin">⏳</span> Resetting…</>
                  : <><RotateCcw className="w-4 h-4" /> Reset Test Data</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
