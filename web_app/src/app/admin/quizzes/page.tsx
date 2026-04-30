"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { apiClient, isServiceUnavailable, logApiError } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { useLanguage } from "@/contexts/language-context";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { convertToPublicImageUrl } from "@/lib/image-utils";
import { NATIVE_SELECT_COMPACT_CLASS } from "@/lib/native-select-styles";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

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
  contentImageUrl: string | null;
  isActive: boolean;
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
  EASY: { en: "Easy", ar: "سهل", nl: "Makkelijk", fr: "Facile" },
  MEDIUM: { en: "Medium", ar: "متوسط", nl: "Gemiddeld", fr: "Moyen" },
  HARD: { en: "Hard", ar: "صعب", nl: "Moeilijk", fr: "Difficile" },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-green-500/10 text-green-600",
  MEDIUM: "bg-amber-500/10 text-amber-600",
  HARD: "bg-destructive/10 text-destructive",
};

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "MCQ",
  TRUE_FALSE: "T/F",
  IMAGE_BASED: "IMG",
};

type SortField = "id" | "questionEn" | "difficultyLevel" | "createdAt";
type SortDir = "asc" | "desc";

// ─── Helpers ────────────────────────────────────────────

function generatePageNumbers(current: number, total: number): number[] {
  const pages: number[] = [];
  for (let i = 0; i < total; i++) {
    if (i === 0 || i === total - 1 || Math.abs(i - current) <= 2) pages.push(i);
  }
  return pages;
}

function DetailLang({
  label,
  text,
  dir,
}: {
  label: string;
  text: string;
  dir?: string;
}) {
  return (
    <div
      className="rounded-xl border border-border/50 bg-muted/30 p-3"
      dir={dir}
    >
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-sm text-foreground line-clamp-3">{text || "—"}</p>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────

export default function AdminQuizzesPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ─── Quiz question state ────────────────────────────────────────────
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [page, setPage] = useState(Number(searchParams.get("page")) || 0);
  const [size, setSize] = useState(Number(searchParams.get("size")) || 20);
  const [sortField, setSortField] = useState<SortField>(
    (searchParams.get("sortField") as SortField) || "createdAt",
  );
  const [sortDir, setSortDir] = useState<SortDir>(
    (searchParams.get("sortDir") as SortDir) || "desc",
  );
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get("categoryCode") || "",
  );
  const [difficultyFilter, setDifficultyFilter] = useState(
    searchParams.get("difficulty") || "",
  );
  const [imageFilter, setImageFilter] = useState(
    searchParams.get("hasImage") || "",
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    detail?: string;
    actionLabel?: string;
    actionHref?: string;
    type: "success" | "error";
  } | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  const fetchIdRef = useRef(0);
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    apiClient
      .get<CategoryOption[]>("/categories")
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  const updateUrl = useCallback(
    (params: Record<string, string | number>) => {
      const sp = new URLSearchParams();
      const merged = {
        page,
        size,
        sortField,
        sortDir,
        categoryCode: categoryFilter,
        difficulty: difficultyFilter,
        hasImage: imageFilter,
        q: searchQuery,
        ...params,
      };
      Object.entries(merged).forEach(([k, v]) => {
        const val = String(v);
        if (k === "page") sp.set(k, val);
        else if (
          val !== "" &&
          val !== "0" &&
          val !== "undefined" &&
          val !== "null"
        )
          sp.set(k, val);
      });
      if (!sp.has("page")) sp.set("page", "0");
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [
      page,
      size,
      sortField,
      sortDir,
      categoryFilter,
      difficultyFilter,
      imageFilter,
      searchQuery,
      pathname,
      router,
    ],
  );

  const fetchQuestions = useCallback(async () => {
    const id = ++fetchIdRef.current;
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
      if (imageFilter) params.hasImage = imageFilter;
      if (searchQuery) params.q = searchQuery;
      const res = await apiClient.get<PageResponse>(
        API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.LIST,
        params,
      );
      if (id !== fetchIdRef.current) return;
      setQuestions(res.data.items);
      setTotalItems(res.data.totalItems);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      if (id !== fetchIdRef.current) return;
      logApiError("Failed to fetch admin quiz questions", err);
      if (isServiceUnavailable(err)) setServiceUnavailable(true);
      else
        setError(tRef.current("admin.quizzes.fetch_error"));
    } finally {
      if (id === fetchIdRef.current) setLoading(false);
    }
  }, [
    page,
    size,
    sortField,
    sortDir,
    categoryFilter,
    difficultyFilter,
    imageFilter,
    searchQuery,
  ]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        setSearchQuery(searchInput);
        setPage(0);
        updateUrl({ q: searchInput, page: 0 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line

  useEffect(() => {
    if (toast && (toast.type === "success" || !toast.detail)) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handlePageChange = (p: number) => {
    setPage(p);
    updateUrl({ page: p });
  };
  const handleSizeChange = (s: number) => {
    setSize(s);
    setPage(0);
    updateUrl({ size: s, page: 0 });
  };
  const handleCategoryChange = (c: string) => {
    setCategoryFilter(c);
    setPage(0);
    updateUrl({ categoryCode: c, page: 0 });
  };
  const handleDifficultyChange = (d: string) => {
    setDifficultyFilter(d);
    setPage(0);
    updateUrl({ difficulty: d, page: 0 });
  };
  const handleImageChange = (value: string) => {
    setImageFilter(value);
    setPage(0);
    updateUrl({ hasImage: value, page: 0 });
  };

  const handleSort = (field: SortField) => {
    const newDir: SortDir =
      sortField === field && sortDir === "asc" ? "desc" : "asc";
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
      setToast({
        message: t("admin.quizzes.delete_success"),
        type: "success",
      });
      if (questions.length === 1 && page > 0) handlePageChange(page - 1);
      else fetchQuestions();
    } catch (err: unknown) {
      logApiError("Failed to delete quiz question", err);
      if (isServiceUnavailable(err)) {
        setServiceUnavailable(true);
      } else {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 409) {
          setToast({
            message: t("admin.quizzes.delete_conflict"),
            detail: t("admin.quizzes.delete_conflict_hint"),
            actionLabel: t("admin.quizzes.edit"),
            actionHref: `/admin/quizzes/${id}/edit`,
            type: "error",
          });
        } else if (status === 404) {
          setToast({
            message: t("admin.quizzes.delete_not_found"),
            type: "error",
          });
          fetchQuestions();
        } else {
          setToast({
            message: t("admin.quizzes.delete_failed"),
            type: "error",
          });
        }
      }
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryLabel = (code: string) => {
    const c = categories.find((x) => x.code === code);
    if (!c) return code;
    return (
      { en: c.nameEn, ar: c.nameAr, nl: c.nameNl, fr: c.nameFr }[language] ||
      c.nameEn
    );
  };
  const getDifficultyLabel = (level: string) =>
    DIFFICULTY_LABELS[level]?.[language] ||
    DIFFICULTY_LABELS[level]?.en ||
    level;
  const getQuestionText = (q: QuizQuestion) =>
    ({
      en: q.questionEn,
      ar: q.questionAr,
      nl: q.questionNl,
      fr: q.questionFr,
    })[language] ||
    q.questionEn ||
    t("admin.quizzes.untitled");
  const getOptionText = (o: OptionResponse) =>
    ({ en: o.textEn, ar: o.textAr, nl: o.textNl, fr: o.textFr })[language] ||
    o.textEn;
  const getImageUrl = (url: string | null) =>
    url ? convertToPublicImageUrl(url) ?? "" : "";
  const getAvailabilityLabel = (isActive: boolean) =>
    isActive ? t("admin.quizzes.active") : t("admin.quizzes.inactive");

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? (
      <span className="text-primary ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
    ) : (
      <span className="text-muted-foreground/40 ml-1">↕</span>
    );

  const startIdx = totalItems > 0 ? page * size + 1 : 0;
  const endIdx = Math.min(page * size + questions.length, totalItems);

  // ── Loading skeleton ──
  if (loading && questions.length === 0) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 bg-muted rounded-xl w-64" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-card rounded-2xl border border-border/50 h-14"
            />
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
        <Button variant="outline" onClick={fetchQuestions}>
          {t("admin.quizzes.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {serviceUnavailable && (
        <ServiceUnavailableBanner onRetry={fetchQuestions} />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-max max-w-md rounded-2xl shadow-2xl text-sm font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300",
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-destructive text-white",
          )}
        >
          <div className="flex items-start gap-3 px-4 py-3">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p>{toast.message}</p>
              {toast.detail && (
                <p className="mt-1 text-xs opacity-90">{toast.detail}</p>
              )}
              {toast.actionHref && (
                <Link
                  href={toast.actionHref}
                  className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  {toast.actionLabel}
                </Link>
              )}
            </div>
            <button
              onClick={() => setToast(null)}
              className="opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <AdminPageHeader
        icon={<ClipboardList className="h-6 w-6" />}
        title={t("admin.quizzes.title")}
        description={t("admin.quizzes.description")}
        metrics={[
          {
            label: t("admin.quizzes.total_count"),
            value: totalItems.toLocaleString(),
            tone: "primary",
          },
        ]}
        actions={
          <Button asChild className="gap-2 shadow-md shadow-primary/20">
            <Link href="/admin/quizzes/new">
              <Plus className="w-4 h-4" />
              {t("admin.quizzes.add_new")}
            </Link>
          </Button>
        }
      />

      <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        {t("admin.quizzes.bank_theory_desc")}
      </div>

      {/* ─── QUIZ Questions section ─── */}
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="admin-quizzes-search"
            name="quizzesSearch"
            type="text"
            autoComplete="off"
            placeholder={t("admin.quizzes.search_placeholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <select
          id="admin-quizzes-category-filter"
          name="categoryFilter"
          value={categoryFilter}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className={NATIVE_SELECT_COMPACT_CLASS}
        >
          <option value="">
            {t("admin.quizzes.all_categories")}
          </option>
          {categories.map((cat) => (
            <option key={cat.code} value={cat.code}>
              {getCategoryLabel(cat.code)} ({cat.code})
            </option>
          ))}
        </select>
        <select
          id="admin-quizzes-difficulty-filter"
          name="difficultyFilter"
          value={difficultyFilter}
          onChange={(e) => handleDifficultyChange(e.target.value)}
          className={NATIVE_SELECT_COMPACT_CLASS}
        >
          <option value="">
            {t("admin.quizzes.all_difficulties")}
          </option>
          {["EASY", "MEDIUM", "HARD"].map((d) => (
            <option key={d} value={d}>
              {getDifficultyLabel(d)}
            </option>
          ))}
        </select>
        <select
          id="admin-quizzes-image-filter"
          name="imageFilter"
          value={imageFilter}
          onChange={(e) => handleImageChange(e.target.value)}
          className={NATIVE_SELECT_COMPACT_CLASS}
        >
          <option value="">
            {t("admin.quizzes.all_images")}
          </option>
          <option value="yes">
            {t("admin.quizzes.has_image")}
          </option>
          <option value="no">
            {t("admin.quizzes.no_image")}
          </option>
        </select>
        <select
          id="admin-quizzes-page-size"
          name="pageSize"
          value={size}
          onChange={(e) => handleSizeChange(Number(e.target.value))}
          className={NATIVE_SELECT_COMPACT_CLASS}
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s} {t("admin.quizzes.per_page")}
            </option>
          ))}
        </select>
        {loading && (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {totalItems > 0 && (
        <p className="text-sm text-muted-foreground">
          {t("admin.quizzes.showing")}{" "}
          <span className="font-semibold text-foreground">
            {startIdx}–{endIdx}
          </span>{" "}
          {t("admin.quizzes.of")}{" "}
          <span className="font-semibold text-foreground">{totalItems}</span>
        </p>
      )}

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border/40">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th
                  className="px-4 py-3 text-left font-semibold cursor-pointer select-none w-14"
                  onClick={() => handleSort("id")}
                >
                  {t("admin.quizzes.col_no")}
                  <SortIcon field="id" />
                </th>
                <th
                  className="px-4 py-3 text-left font-semibold cursor-pointer select-none"
                  onClick={() => handleSort("questionEn")}
                >
                  {t("admin.quizzes.col_question")}
                  <SortIcon field="questionEn" />
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  {t("admin.quizzes.col_category")}
                </th>
                <th
                  className="px-4 py-3 text-left font-semibold cursor-pointer select-none"
                  onClick={() => handleSort("difficultyLevel")}
                >
                  {t("admin.quizzes.col_difficulty")}
                  <SortIcon field="difficultyLevel" />
                </th>
                <th className="px-4 py-3 text-center font-semibold">
                  {t("admin.quizzes.col_type")}
                </th>
                <th className="px-4 py-3 text-center font-semibold">
                  {t("admin.quizzes.col_image")}
                </th>
                <th className="px-4 py-3 text-center font-semibold">
                  {t("admin.quizzes.col_options")}
                </th>
                <th className="px-4 py-3 text-center font-semibold">
                  {t("admin.quizzes.col_availability")}
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  {t("admin.quizzes.col_actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="space-y-2">
                      <div className="text-4xl">📋</div>
                      <p className="text-muted-foreground">
                        {t("admin.quizzes.no_results")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                questions.map((q, index) => (
                  <React.Fragment key={q.id}>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-foreground">
                          {page * size + index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-sm">
                        <span className="text-foreground line-clamp-2 text-sm">
                          {getQuestionText(q)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className="text-xs font-medium"
                        >
                          {getCategoryLabel(q.categoryCode)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={cn(
                            "border-0 text-xs font-semibold",
                            DIFFICULTY_COLORS[q.difficultyLevel] ||
                              "bg-muted text-foreground",
                          )}
                        >
                          {getDifficultyLabel(q.difficultyLevel)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-lg">
                          {TYPE_LABELS[q.questionType] || q.questionType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex min-w-12 items-center justify-center rounded-lg px-2 py-0.5 text-xs font-semibold",
                            q.contentImageUrl
                              ? "bg-green-500/10 text-green-600"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {q.contentImageUrl
                            ? t("admin.quizzes.has_image")
                            : t("admin.quizzes.no_image")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-muted-foreground font-semibold">
                          {q.optionsCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          className={cn(
                            "border-0 text-xs font-semibold",
                            q.isActive
                              ? "bg-green-500/10 text-green-600"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {getAvailabilityLabel(Boolean(q.isActive))}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Expand */}
                          <button
                            onClick={() =>
                              setExpandedId(expandedId === q.id ? null : q.id)
                            }
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                          >
                            {expandedId === q.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
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
                                onClick={() => handleDelete(q.id)}
                                disabled={deleting}
                                className="px-2 py-1 text-xs rounded-lg bg-destructive text-white hover:opacity-90 disabled:opacity-50 font-semibold transition-opacity"
                              >
                                {deleting ? t("common.loading") : t("common.confirm")}
                              </button>
                              <button
                                onClick={() => setDeleteId(null)}
                                className="px-2 py-1 text-xs rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                              >
                                {t("common.cancel")}
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
                        <td colSpan={9} className="px-6 py-4 space-y-4">
                          {q.contentImageUrl && (
                            <div className="rounded-2xl border border-border/40 bg-card/80 p-4">
                              <p className="text-xs font-black text-muted-foreground uppercase tracking-wide mb-3">
                                {t("admin.quizzes.col_image")}
                              </p>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getImageUrl(q.contentImageUrl)}
                                alt={getQuestionText(q)}
                                className="max-h-48 rounded-xl border border-border/50 bg-background object-contain"
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <DetailLang
                              label={t("admin.settings_page.language_en")}
                              text={q.questionEn}
                            />
                            <DetailLang
                              label={t("admin.settings_page.language_ar")}
                              text={q.questionAr}
                              dir="rtl"
                            />
                            <DetailLang
                              label={t("admin.settings_page.language_nl")}
                              text={q.questionNl}
                            />
                            <DetailLang
                              label={t("admin.settings_page.language_fr")}
                              text={q.questionFr}
                            />
                          </div>

                          {q.options?.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">
                                {t("admin.quizzes.answer_options")}
                              </p>
                              <div className="space-y-1.5">
                                {q.options
                                  .sort(
                                    (a, b) => a.displayOrder - b.displayOrder,
                                  )
                                  .map((opt, idx) => (
                                    <div
                                      key={opt.id}
                                      className={cn(
                                        "flex items-center gap-2 text-sm px-3 py-2 rounded-xl border transition-colors",
                                        opt.isCorrect
                                          ? "bg-green-500/10 border-green-500/20 text-green-700"
                                          : "bg-card border-border/50 text-foreground",
                                      )}
                                    >
                                      <span className="text-xs font-bold text-muted-foreground w-5">
                                        {idx + 1}.
                                      </span>
                                      <span
                                        className={cn(
                                          "flex-1",
                                          opt.isCorrect && "font-semibold",
                                        )}
                                      >
                                        {getOptionText(opt)}
                                      </span>
                                      {opt.isCorrect && (
                                        <Badge className="bg-green-500/10 text-green-600 border-0 text-xs ml-auto">
                                          {t("admin.quizzes.correct_badge")}
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/40">
                            <span>
                              {t("admin.quizzes.col_availability")}
                              : <strong>{getAvailabilityLabel(Boolean(q.isActive))}</strong>
                            </span>
                            {q.contentImageUrl && (
                              <Badge variant="outline" className="text-xs">
                                {t("admin.quizzes.has_image")}
                              </Badge>
                            )}
                            {q.createdAt && (
                              <span>
                                {t("admin.quizzes.meta_created")}:{" "}
                                {new Date(q.createdAt).toLocaleDateString()}
                              </span>
                            )}
                            {q.updatedAt && (
                              <span>
                                {t("admin.quizzes.meta_updated")}:{" "}
                                {new Date(q.updatedAt).toLocaleDateString()}
                              </span>
                            )}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/30">
            <p className="text-xs text-muted-foreground font-medium">
              {t("admin.quizzes.page_info")
                .replace("{current}", String(page + 1))
                .replace("{total}", String(totalPages))}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(0)}
                disabled={page <= 0}
                className="w-7 h-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 0}
                className="w-7 h-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {generatePageNumbers(page, totalPages).map((p, idx, arr) => (
                <span key={`${p}-${idx}`} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-muted-foreground text-xs">
                      …
                    </span>
                  )}
                  <button
                    onClick={() => handlePageChange(p)}
                    className={cn(
                      "w-7 h-7 rounded-lg text-xs font-semibold transition-all",
                      p === page
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border/50 text-foreground hover:bg-muted",
                    )}
                  >
                    {p + 1}
                  </button>
                </span>
              ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="w-7 h-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages - 1)}
                disabled={page >= totalPages - 1}
                className="w-7 h-7 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
