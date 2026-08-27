"use client";

import { useLocalizedRouter } from "@/hooks/use-localized-router";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "@/components/localized-link";
import { apiClient, isServiceUnavailable, logApiError } from "@/lib/api";
import { getCsrfToken } from "@/lib/auth-token";
import { API_ENDPOINTS } from "@/lib/constants";
import { useLanguage } from "@/contexts/language-context";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminSectionCard from "@/components/admin/AdminSectionCard";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { convertToPublicImageUrl } from "@/lib/image-utils";
import { NATIVE_SELECT_CLASS } from "@/lib/native-select-styles";
import { cn } from "@/lib/utils";
import {
  isValidQuizOptionCount,
  optionDisplayLabel,
  QUIZ_DIFFICULTIES,
  resolveAdminQuizReturnTo,
} from "@/lib/admin-quiz-form";
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

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
  version: number;
  categoryCode: string;
  difficultyLevel: string;
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
  version: number;
  categoryCode: string;
  categoryNameEn: string;
  difficultyLevel: string;
  questionType: string;
  questionEn: string;
  questionAr: string;
  questionNl: string;
  questionFr: string;
  explanationEn: string | null;
  explanationAr: string | null;
  explanationNl: string | null;
  explanationFr: string | null;
  contentImageUrl: string | null;
  isActive: boolean;
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

type AdminQuizQuestionWireResponse = AdminQuizQuestionResponse;

const BLANK_OPTION: OptionForm = {
  textEn: "",
  textAr: "",
  textNl: "",
  textFr: "",
  isCorrect: false,
  displayOrder: 0,
};
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 5;

// ─── Reusable form components ───────────────────────────

function FormField({
  label,
  placeholder,
  value,
  error,
  onChange,
  dir,
  disabled = false,
}: {
  label: string;
  placeholder?: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  dir?: string;
  disabled?: boolean;
}) {
  const fieldId = useId();
  return (
    <div className="space-y-1">
      <label
        htmlFor={fieldId}
        className="block text-xs font-semibold text-foreground"
      >
        {label}
      </label>
      <input
        id={fieldId}
        name={fieldId}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        disabled={disabled}
        className={cn(
          "w-full rounded-xl border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground",
          error
            ? "border-destructive/50 focus:ring-destructive/20"
            : "border-border/50",
        )}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FormTextarea({
  label,
  placeholder,
  value,
  error,
  warning,
  onChange,
  dir,
  disabled = false,
}: {
  label: string;
  placeholder?: string;
  value: string;
  error?: string;
  warning?: string;
  onChange: (v: string) => void;
  dir?: string;
  disabled?: boolean;
}) {
  const fieldId = useId();
  return (
    <div className="space-y-1">
      <label
        htmlFor={fieldId}
        className="block text-xs font-semibold text-foreground"
      >
        {label}
      </label>
      <textarea
        id={fieldId}
        name={fieldId}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        rows={3}
        disabled={disabled}
        className={cn(
          "w-full rounded-xl border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground",
          error
            ? "border-destructive/50 focus:ring-destructive/20"
            : "border-border/50",
        )}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!error && warning && (
        <p className="text-xs font-semibold text-amber-600">{warning}</p>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────

export default function AdminEditQuizQuestionPage() {
  const router = useLocalizedRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const questionId = params.id as string;
  const { t, language } = useLanguage();
  const returnTo = useMemo(
    () => resolveAdminQuizReturnTo(searchParams.get("returnTo")),
    [searchParams],
  );

  const [form, setForm] = useState<QuestionForm>({
    version: 0,
    categoryCode: "",
    difficultyLevel: "EASY",
    questionEn: "",
    questionAr: "",
    questionNl: "",
    questionFr: "",
    explanationEn: "",
    explanationAr: "",
    explanationNl: "",
    explanationFr: "",
    contentImageUrl: "",
    isActive: true,
    options: [],
  });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFilename, setImageFilename] = useState("");
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);
  const [isReferenced, setIsReferenced] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      apiClient
        .get<CategoryOption[]>(API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.CATEGORIES)
        .catch(() => ({ data: [] as CategoryOption[] })),
      apiClient.get<AdminQuizQuestionWireResponse>(
        API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.DETAIL(questionId),
      ),
    ])
      .then(([catRes, qRes]) => {
        setCategories(catRes.data);
        const q = qRes.data;
        const options = Array.isArray(q.options) ? q.options : [];
        setIsReferenced(Boolean(q.isReferenced));
        setForm({
          version: q.version,
          categoryCode: q.categoryCode || "",
          difficultyLevel: q.difficultyLevel || "EASY",
          questionEn: q.questionEn || "",
          questionAr: q.questionAr || "",
          questionNl: q.questionNl || "",
          questionFr: q.questionFr || "",
          explanationEn: q.explanationEn || "",
          explanationAr: q.explanationAr || "",
          explanationNl: q.explanationNl || "",
          explanationFr: q.explanationFr || "",
          contentImageUrl: q.contentImageUrl || "",
          isActive: q.isActive ?? true,
          options: options.map((o) => ({
            id: o.id,
            textEn: o.textEn || "",
            textAr: o.textAr || "",
            textNl: o.textNl || "",
            textFr: o.textFr || "",
            isCorrect: o.isCorrect,
            displayOrder: o.displayOrder,
          })),
        });
      })
      .catch((err) => {
        logApiError("Failed to load quiz question", err);
        if (isServiceUnavailable(err)) setServiceUnavailable(true);
        else {
          const status = (err as { response?: { status?: number } })?.response
            ?.status;
          setErrorMsg(
            status === 404
              ? t("admin.quizzes.edit_not_found") || "Question not found"
              : t("admin.quizzes.fetch_error") || "Failed to load question",
          );
        }
      })
      .finally(() => setLoading(false));
  }, [questionId, t]);

  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(id);
    }
  }, [toast]);

  useEffect(() => {
    setImagePreviewFailed(false);
  }, [form.contentImageUrl]);

  const isValid = useMemo(
    () =>
      form.categoryCode.trim() !== "" &&
      form.questionEn.trim() !== "" &&
      form.questionAr.trim() !== "" &&
      form.questionNl.trim() !== "" &&
      form.questionFr.trim() !== "" &&
      form.options.length >= 2 &&
      form.options.length <= 3 &&
      isValidQuizOptionCount(form.options.length) &&
      form.options.filter((o) => o.isCorrect).length === 1 &&
      form.options.every(
        (o) =>
          o.textEn.trim() !== "" &&
          o.textAr.trim() !== "" &&
          o.textNl.trim() !== "" &&
          o.textFr.trim() !== "",
      ),
    [form],
  );

  const setField = <K extends keyof QuestionForm>(
    key: K,
    value: QuestionForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
    setErrorMsg(null);
  };

  const setOptionField = (
    idx: number,
    key: keyof OptionForm,
    value: string | boolean | number,
  ) => {
    setForm((prev) => {
      const opts = [...prev.options];
      opts[idx] = { ...opts[idx], [key]: value };
      return { ...prev, options: opts };
    });
  };

  const setCorrectOption = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((option, optionIdx) => ({
        ...option,
        isCorrect: optionIdx === idx,
      })),
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.correct;
      return next;
    });
  };

  const addOption = () => {
    if (form.options.length >= 3) return;
    setForm((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { ...BLANK_OPTION, displayOrder: prev.options.length + 1 },
      ],
    }));
  };

  const removeOption = (idx: number) => {
    if (form.options.length <= 2) return;
    setForm((prev) => ({
      ...prev,
      options: prev.options
        .filter((_, i) => i !== idx)
        .map((o, i) => ({ ...o, displayOrder: i + 1 })),
    }));
  };

  const moveOption = (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 0 || target >= form.options.length) return;
    setForm((prev) => {
      const options = [...prev.options];
      [options[idx], options[target]] = [options[target], options[idx]];
      return {
        ...prev,
        options: options.map((option, optionIdx) => ({
          ...option,
          displayOrder: optionIdx + 1,
        })),
      };
    });
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.categoryCode.trim())
      errors.categoryCode =
        t("admin.quizzes.form.error_category") || "Category is required";
    (["En", "Ar", "Nl", "Fr"] as const).forEach((suffix) => {
      const key = `question${suffix}` as keyof QuestionForm;
      if (!String(form[key]).trim()) {
        errors[key] =
          t("admin.quizzes.form.error_question_all_languages") ||
          "Question text is required in all four languages";
      }
    });
    if (form.options.length < 2)
      errors.options =
        t("admin.quizzes.form.error_min_options") ||
        "At least 2 options are required";
    if (form.options.length > 3)
      errors.options =
        t("admin.quizzes.form.error_max_options") ||
        "Maximum 3 options allowed";
    const correctCount = form.options.filter((o) => o.isCorrect).length;
    if (correctCount === 0)
      errors.correct =
        t("admin.quizzes.form.error_exactly_one_correct") ||
        "Exactly one option must be marked as correct";
    if (correctCount > 1)
      errors.correct =
        t("admin.quizzes.form.error_only_one_correct") ||
        "Only one option can be marked as correct";
    const languageFields = ["textEn", "textAr", "textNl", "textFr"] as const;
    form.options.forEach((o, i) => {
      languageFields.forEach((field) => {
        if (!o[field].trim()) {
          errors[`option_${i}_${field}`] =
            t("admin.quizzes.form.error_option_all_languages") ||
            "Every option is required in all four languages";
        }
      });
    });
    languageFields.forEach((field) => {
      const values = form.options.map((option) =>
        option[field].trim().replace(/\s+/g, " ").toLocaleLowerCase(),
      );
      if (values.some((value, index) => value && values.indexOf(value) !== index)) {
        errors.options =
          t("admin.quizzes.form.error_duplicate_options") ||
          "Answer options must be unique in every language";
      }
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getCategoryName = (cat: CategoryOption): string => {
    const map: Record<string, string> = {
      en: cat.nameEn,
      ar: cat.nameAr,
      nl: cat.nameNl,
      fr: cat.nameFr,
    };
    return map[language] || cat.nameEn;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setToast({
        message: t("admin.quizzes.upload.invalid_type") || "Invalid file type",
        type: "error",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setToast({
        message: `${t("admin.quizzes.upload.too_large")} ${MAX_FILE_SIZE_MB}MB`,
        type: "error",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      if (imageFilename.trim()) {
        formData.append("filename", imageFilename.trim());
      }
      const headers: Record<string, string> = {};
      const csrf = getCsrfToken();
      if (csrf) headers["x-csrf-token"] = csrf;
      const res = await fetch("/api/proxy/admin/upload/image", {
        method: "POST",
        headers,
        body: formData,
      });
      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errData?.error || `Upload failed (${res.status})`);
      }
      const data = (await res.json()) as { url: string };
      setField("contentImageUrl", data.url);
      setToast({
        message:
          t("admin.quizzes.upload.success") || "Image uploaded successfully",
        type: "success",
      });
    } catch (err: unknown) {
      logApiError("Failed to upload quiz image", err);
      if (isServiceUnavailable(err)) setServiceUnavailable(true);
      else {
        const msg =
          (err as { message?: string })?.message ||
          t("admin.quizzes.upload.failed") ||
          "Upload failed";
        setToast({ message: String(msg), type: "error" });
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const resolveImageUrl = (url: string): string => {
    if (!url) return "";
    return convertToPublicImageUrl(url) ?? "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!validate()) return;
    try {
      setSubmitting(true);
      await apiClient.put(
        API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.UPDATE(questionId),
        {
          version: form.version,
          categoryCode: form.categoryCode.trim(),
          difficultyLevel: form.difficultyLevel,
          questionEn: form.questionEn.trim(),
          questionAr: form.questionAr.trim() || "",
          questionNl: form.questionNl.trim() || "",
          questionFr: form.questionFr.trim() || "",
          explanationEn: form.explanationEn.trim() || "",
          explanationAr: form.explanationAr.trim() || "",
          explanationNl: form.explanationNl.trim() || "",
          explanationFr: form.explanationFr.trim() || "",
          contentImageUrl: form.contentImageUrl.trim() || null,
          isActive: form.isActive,
          options: form.options.map((o) => ({
            id: o.id || null,
            textEn: o.textEn.trim(),
            textAr: o.textAr.trim() || "",
            textNl: o.textNl.trim() || "",
            textFr: o.textFr.trim() || "",
            isCorrect: o.isCorrect,
            displayOrder: o.displayOrder,
          })),
        },
      );
      setToast({
        message:
          t("admin.quizzes.form.update_success") ||
          "Question updated successfully",
        type: "success",
      });
      setTimeout(() => router.push(returnTo), 600);
    } catch (err: unknown) {
      logApiError("Failed to update quiz question", err);
      if (isServiceUnavailable(err)) setServiceUnavailable(true);
      else {
        const axiosErr = err as {
          response?: {
            status?: number;
            data?: { error?: string; message?: string };
          };
          message?: string;
        };
        const msg =
          axiosErr?.response?.data?.error ||
          axiosErr?.response?.data?.message ||
          axiosErr?.message;
        setErrorMsg(String(
          axiosErr?.response?.status === 409
            ? t("admin.quizzes.form.edit_conflict") ||
                "This question changed in another session. Reload it before saving."
            : msg ||
                t("admin.quizzes.form.update_error") ||
                "Failed to update question",
        ));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 bg-muted rounded-xl w-64" />
        <div className="bg-card rounded-2xl border border-border/50 p-5 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {serviceUnavailable && (
        <ServiceUnavailableBanner onRetry={() => window.location.reload()} />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-300",
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-destructive text-white",
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      <AdminPageHeader
        icon={<ClipboardList className="h-6 w-6" />}
        title={t("admin.quizzes.edit_title") || "Edit Question"}
        description={
          t("admin.quizzes.edit_desc") ||
          "Update an existing theory-bank question."
        }
        actions={
          <Button variant="outline" asChild className="gap-2">
            <Link href={returnTo}>
              <ArrowLeft className="w-4 h-4" />
              {t("common.back") || "Back"}
            </Link>
          </Button>
        }
      />

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Error Banner */}
        {errorMsg && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isReferenced && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              {t("admin.quizzes.edit_referenced_detail") ||
                "This question is referenced by learner history. Existing answer records remain preserved while its current content is edited."}
            </span>
          </div>
        )}

        {/* Basic Info */}
        <AdminSectionCard
          title={t("admin.quizzes.form.basic_info") || "Basic Information"}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <div className="space-y-1">
              <label
                htmlFor="admin-quiz-edit-category"
                className="block text-xs font-semibold text-foreground"
              >
                {t("admin.quizzes.form.category") || "Category"} *
              </label>
              <select
                id="admin-quiz-edit-category"
                name="categoryCode"
                value={form.categoryCode}
                onChange={(e) => setField("categoryCode", e.target.value)}
                className={cn(
                  "w-full",
                  NATIVE_SELECT_CLASS,
                  fieldErrors.categoryCode
                    ? "border-destructive/50"
                    : "border-border/50",
                )}
              >
                <option value="">
                  {t("admin.quizzes.form.select_category") ||
                    "Select a category..."}
                </option>
                {categories.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {getCategoryName(cat)}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryCode && (
                <p className="text-xs text-destructive">
                  {fieldErrors.categoryCode}
                </p>
              )}
            </div>

            {/* Difficulty */}
            <div className="space-y-1">
              <label
                htmlFor="admin-quiz-edit-difficulty"
                className="block text-xs font-semibold text-foreground"
              >
                {t("admin.quizzes.form.difficulty") || "Difficulty"}
              </label>
              <select
                id="admin-quiz-edit-difficulty"
                name="difficultyLevel"
                value={form.difficultyLevel}
                onChange={(e) => setField("difficultyLevel", e.target.value)}
                className={cn("w-full", NATIVE_SELECT_CLASS)}
              >
                {QUIZ_DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {t(`difficulty.${difficulty.toLowerCase()}`)}
                  </option>
                ))}
              </select>
              {fieldErrors.difficultyLevel && (
                <p className="text-xs text-destructive">
                  {fieldErrors.difficultyLevel}
                </p>
              )}
            </div>
          </div>

          {/* Active Toggle */}
          <label className="flex items-center gap-3 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField("isActive", e.target.checked)}
              className="sr-only"
            />
            <div
              className={cn(
                "w-10 h-6 rounded-full transition-colors duration-200 flex items-center px-1 cursor-pointer",
                form.isActive ? "bg-green-500" : "bg-muted",
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                  form.isActive ? "translate-x-4" : "translate-x-0",
                )}
              />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {form.isActive
                ? t("admin.quizzes.active")
                : t("admin.quizzes.inactive")}
            </span>
          </label>
        </AdminSectionCard>

        {/* Image Upload */}
        <AdminSectionCard
          title={t("admin.quizzes.upload.title") || "Content Image"}
        >
          {form.contentImageUrl && (
            <div className="relative inline-block">
              {imagePreviewFailed ? (
                <div
                  role="status"
                  className="flex aspect-video w-80 max-w-full flex-col items-center justify-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50/60 p-4 text-center text-sm text-amber-900"
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span>{t("admin.quizzes.form.image_preview_error")}</span>
                </div>
              ) : (
                <Image
                  src={resolveImageUrl(form.contentImageUrl)}
                  alt={t("practice.question_image_alt")}
                  width={320}
                  height={180}
                  unoptimized
                  className="aspect-video max-w-full rounded-xl border border-border/50 bg-muted object-contain"
                  onError={() => {
                    const failedUrl = resolveImageUrl(form.contentImageUrl);
                    console.error("Failed to load quiz question image", failedUrl);
                    setImagePreviewFailed(true);
                  }}
                />
              )}
              <button
                type="button"
                aria-label={t("admin.quizzes.upload.remove")}
                onClick={() => {
                  setField("contentImageUrl", "");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="space-y-1">
            <label
              htmlFor="admin-quiz-edit-image-filename"
              className="block text-xs font-semibold text-foreground"
            >
              {t("admin.quizzes.upload.filename")}
            </label>
            <input
              id="admin-quiz-edit-image-filename"
              name="contentImageFilename"
              value={imageFilename}
              maxLength={100}
              placeholder={t("admin.quizzes.upload.filename_placeholder")}
              onChange={(event) => setImageFilename(event.target.value)}
              className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground">
              {t("admin.quizzes.upload.filename_hint")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <label
                htmlFor="admin-quiz-edit-image-url"
                className="block text-xs font-semibold text-foreground"
              >
                {t("admin.quizzes.form.image_url")}
              </label>
              <input
                id="admin-quiz-edit-image-url"
                name="contentImageUrl"
                value={form.contentImageUrl}
                autoComplete="url"
                placeholder={t("admin.quizzes.form.image_url_placeholder")}
                onChange={(e) => setField("contentImageUrl", e.target.value)}
                className={cn(
                  "w-full rounded-xl border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30",
                  fieldErrors.contentImageUrl
                    ? "border-destructive/50"
                    : "border-border/50",
                )}
              />
              {fieldErrors.contentImageUrl && (
                <p className="text-xs text-destructive">
                  {fieldErrors.contentImageUrl}
                </p>
              )}
            </div>
            <div className="flex items-end">
              <input
                id="admin-quiz-edit-image-file"
                name="contentImageFile"
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 border-primary/30 text-primary hover:bg-primary/5 whitespace-nowrap"
              >
                {uploading ? (
                  <>
                    <span className="animate-spin">⏳</span>{" "}
                    {t("admin.quizzes.upload.uploading")}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />{" "}
                    {t("admin.quizzes.upload.action")}
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("admin.quizzes.upload.hint")}
          </p>
        </AdminSectionCard>

        {/* Question Text */}
        <AdminSectionCard title={t("admin.quizzes.form.questions")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormTextarea
              label={`${t("admin.quizzes.form.question_en")} *`}
              placeholder={t("admin.quizzes.form.question_en_placeholder")}
              value={form.questionEn}
              error={fieldErrors.questionEn}
              onChange={(v) => setField("questionEn", v)}
              disabled={false}
            />
            <FormTextarea
              label={`${t("admin.quizzes.form.question_ar")} *`}
              placeholder={t("admin.quizzes.form.question_ar_placeholder")}
              value={form.questionAr}
              error={fieldErrors.questionAr}
              onChange={(v) => setField("questionAr", v)}
              dir="rtl"
              disabled={false}
            />
            <FormTextarea
              label={`${t("admin.quizzes.form.question_nl")} *`}
              placeholder={t("admin.quizzes.form.question_nl_placeholder")}
              value={form.questionNl}
              error={fieldErrors.questionNl}
              onChange={(v) => setField("questionNl", v)}
              disabled={false}
            />
            <FormTextarea
              label={`${t("admin.quizzes.form.question_fr")} *`}
              placeholder={t("admin.quizzes.form.question_fr_placeholder")}
              value={form.questionFr}
              error={fieldErrors.questionFr}
              onChange={(v) => setField("questionFr", v)}
              disabled={false}
            />
          </div>
        </AdminSectionCard>

        <AdminSectionCard title={t("admin.quizzes.form.explanations")}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormTextarea
              label={t("admin.quizzes.form.explanation_en")}
              value={form.explanationEn}
              onChange={(value) => setField("explanationEn", value)}
              warning={!form.explanationEn.trim() ? t("admin.quizzes.missing_translation") : undefined}
            />
            <FormTextarea
              label={t("admin.quizzes.form.explanation_ar")}
              value={form.explanationAr}
              onChange={(value) => setField("explanationAr", value)}
              dir="rtl"
              warning={!form.explanationAr.trim() ? t("admin.quizzes.missing_translation") : undefined}
            />
            <FormTextarea
              label={t("admin.quizzes.form.explanation_nl")}
              value={form.explanationNl}
              onChange={(value) => setField("explanationNl", value)}
              warning={!form.explanationNl.trim() ? t("admin.quizzes.missing_translation") : undefined}
            />
            <FormTextarea
              label={t("admin.quizzes.form.explanation_fr")}
              value={form.explanationFr}
              onChange={(value) => setField("explanationFr", value)}
              warning={!form.explanationFr.trim() ? t("admin.quizzes.missing_translation") : undefined}
            />
          </div>
        </AdminSectionCard>

        {/* Answer Options */}
        <AdminSectionCard title={`${t("admin.quizzes.form.options_title")} *`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {t("admin.quizzes.form.rule_note")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              disabled={form.options.length >= 3}
              className="gap-1.5 text-xs h-8"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("admin.quizzes.form.add_option")}
              {form.options.length >= 3 && (
                <span className="text-muted-foreground">
                  {t("admin.quizzes.form.max_options")}
                </span>
              )}
            </Button>
          </div>

          {(fieldErrors.options || fieldErrors.correct) && (
            <p className="text-xs text-destructive">
              {fieldErrors.options || fieldErrors.correct}
            </p>
          )}

          <div className="space-y-4">
            {form.options.map((opt, idx) => (
              <div
                key={opt.id ?? `new-${idx}`}
                className={cn(
                  "rounded-2xl border p-4 space-y-3 transition-colors",
                  opt.isCorrect
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border/50 bg-muted/20",
                )}
              >
                {/* Option Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black",
                        opt.isCorrect
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {optionDisplayLabel(idx)}
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {t("admin.quizzes.form.option_number").replace(
                        "{number}",
                        optionDisplayLabel(idx),
                      )}
                    </span>
                    {opt.isCorrect && (
                      <Badge className="bg-green-500/10 text-green-600 border-0 text-xs">
                        {t("admin.quizzes.correct_badge")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={opt.isCorrect}
                        onChange={() => setCorrectOption(idx)}
                        className="rounded border-border"
                      />
                      <span className="text-xs text-muted-foreground font-medium">
                        {t("admin.quizzes.form.mark_correct")}
                      </span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveOption(idx, -1)}
                        disabled={idx === 0}
                        aria-label={t("admin.quizzes.form.move_up")}
                        className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveOption(idx, 1)}
                        disabled={idx === form.options.length - 1}
                        aria-label={t("admin.quizzes.form.move_down")}
                        className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                    {form.options.length > 2 && (
                      <button
                        type="button"
                        aria-label={`${t("admin.quizzes.form.remove_option")} ${optionDisplayLabel(idx)}`}
                        onClick={() => removeOption(idx)}
                        className="text-destructive hover:opacity-70 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    label={`${t("admin.quizzes.form.option_text_en")} *`}
                    placeholder={t(
                      "admin.quizzes.form.option_text_en_placeholder",
                    )}
                    value={opt.textEn}
                    error={fieldErrors[`option_${idx}_textEn`]}
                    onChange={(v) => setOptionField(idx, "textEn", v)}
                  />
                  <FormField
                    label={`${t("admin.quizzes.form.option_text_ar")} *`}
                    placeholder={t(
                      "admin.quizzes.form.option_text_ar_placeholder",
                    )}
                    value={opt.textAr}
                    error={fieldErrors[`option_${idx}_textAr`]}
                    onChange={(v) => setOptionField(idx, "textAr", v)}
                    dir="rtl"
                  />
                  <FormField
                    label={`${t("admin.quizzes.form.option_text_nl")} *`}
                    placeholder={t(
                      "admin.quizzes.form.option_text_nl_placeholder",
                    )}
                    value={opt.textNl}
                    error={fieldErrors[`option_${idx}_textNl`]}
                    onChange={(v) => setOptionField(idx, "textNl", v)}
                  />
                  <FormField
                    label={`${t("admin.quizzes.form.option_text_fr")} *`}
                    placeholder={t(
                      "admin.quizzes.form.option_text_fr_placeholder",
                    )}
                    value={opt.textFr}
                    error={fieldErrors[`option_${idx}_textFr`]}
                    onChange={(v) => setOptionField(idx, "textFr", v)}
                  />
                </div>
              </div>
            ))}
          </div>
        </AdminSectionCard>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            {t("admin.quizzes.form.required_note")}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href={returnTo}>
                {t("admin.quizzes.cancel") || "Cancel"}
              </Link>
            </Button>
            <Button
              type="submit"
              disabled={!isValid || submitting}
              className="gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:scale-[1.01] transition-all disabled:shadow-none disabled:scale-100"
            >
              {submitting ? (
                <>
                  <span className="animate-spin">⏳</span>{" "}
                  {t("admin.quizzes.form.updating")}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {t("admin.quizzes.form.update")}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
