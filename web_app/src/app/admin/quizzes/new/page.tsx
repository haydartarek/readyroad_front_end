"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ArrowLeft,
  Upload,
  X,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
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
  categoryCode: string;
  difficultyLevel: string;
  questionType: string;
  questionEn: string;
  questionAr: string;
  questionNl: string;
  questionFr: string;
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

const BLANK_OPTION: OptionForm = {
  textEn: "",
  textAr: "",
  textNl: "",
  textFr: "",
  isCorrect: false,
  displayOrder: 0,
};

const INITIAL_FORM: QuestionForm = {
  categoryCode: "",
  difficultyLevel: "EASY",
  questionType: "MULTIPLE_CHOICE",
  questionEn: "",
  questionAr: "",
  questionNl: "",
  questionFr: "",
  contentImageUrl: "",
  isActive: true,
  options: [
    { ...BLANK_OPTION, displayOrder: 1 },
    { ...BLANK_OPTION, displayOrder: 2 },
  ],
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
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────

export default function AdminAddQuizQuestionPage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  // ─── Quiz question state ────────────────────────────────────────
  const [form, setForm] = useState<QuestionForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ─── Shared state ────────────────────────────────────────────────
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiClient
      .get<CategoryOption[]>("/categories")
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(id);
    }
  }, [toast]);

  const isValid = useMemo(
    () =>
      form.categoryCode.trim() !== "" &&
      form.questionEn.trim() !== "" &&
      form.options.length >= 2 &&
      form.options.length <= 3 &&
      form.options.filter((o) => o.isCorrect).length === 1 &&
      form.options.every((o) => o.textEn.trim() !== ""),
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

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.categoryCode.trim())
      errors.categoryCode =
        t("admin.quizzes.form.error_category") || "Category is required";
    if (!form.questionEn.trim())
      errors.questionEn =
        t("admin.quizzes.form.error_question") ||
        "English question text is required";
    if (form.questionType === "IMAGE_BASED" && !form.contentImageUrl.trim()) {
      errors.contentImageUrl =
        t("admin.quizzes.form.error_image_required") ||
        "An image is required for image-based questions";
    }
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
    form.options.forEach((o, i) => {
      if (!o.textEn.trim())
        errors[`option_${i}`] =
          t("admin.quizzes.form.error_option_en") ||
          "English option text is required";
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
      // Use native fetch so the browser sets the correct multipart boundary automatically.
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
      logApiError("Failed to upload image", err);
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
      await apiClient.post(API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.CREATE, {
        categoryCode: form.categoryCode.trim(),
        difficultyLevel: form.difficultyLevel,
        questionType: form.questionType,
        questionEn: form.questionEn.trim(),
        questionAr: form.questionAr.trim() || "",
        questionNl: form.questionNl.trim() || "",
        questionFr: form.questionFr.trim() || "",
        contentImageUrl: form.contentImageUrl.trim() || null,
        isActive: form.isActive,
        options: form.options.map((o) => ({
          textEn: o.textEn.trim(),
          textAr: o.textAr.trim() || "",
          textNl: o.textNl.trim() || "",
          textFr: o.textFr.trim() || "",
          isCorrect: o.isCorrect,
          displayOrder: o.displayOrder,
        })),
      });
      setToast({
        message:
          t("admin.quizzes.form.create_success") ||
          "Question created successfully",
        type: "success",
      });
      setTimeout(() => router.push("/admin/quizzes"), 600);
    } catch (err: unknown) {
      logApiError("Failed to create quiz question", err);
      if (isServiceUnavailable(err)) setServiceUnavailable(true);
      else {
        const axiosErr = err as {
          response?: { data?: { error?: string; message?: string } };
          message?: string;
        };
        const msg =
          axiosErr?.response?.data?.error ||
          axiosErr?.response?.data?.message ||
          axiosErr?.message;
        setErrorMsg(
          String(
            msg ||
              t("admin.quizzes.form.error_generic") ||
              "Failed to create question",
          ),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {serviceUnavailable && (
        <ServiceUnavailableBanner
          onRetry={() => setServiceUnavailable(false)}
        />
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
        title={t("admin.quizzes.add_new") || "Add Question"}
        description={
          t("admin.quizzes.add_new_desc") ||
          "Create a new theory-bank question with 2 or 3 answer options."
        }
        actions={
          <Button variant="outline" asChild className="gap-2">
            <Link href="/admin/quizzes">
              <ArrowLeft className="w-4 h-4" />
              {t("common.back") || "Back"}
            </Link>
          </Button>
        }
      />

      <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        {t("admin.quizzes.bank_theory_desc") ||
          "Used by the current learner exam flow at /exam and /api/quiz/theory-exam."}
      </div>

      {/* Quiz Form */}
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Error Banner */}
        {errorMsg && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
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
                htmlFor="admin-quiz-new-category"
                className="block text-xs font-semibold text-foreground"
              >
                {t("admin.quizzes.form.category") || "Category"} *
              </label>
              <select
                id="admin-quiz-new-category"
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
                    {getCategoryName(cat)} ({cat.code})
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
                htmlFor="admin-quiz-new-difficulty"
                className="block text-xs font-semibold text-foreground"
              >
                {t("admin.quizzes.form.difficulty") || "Difficulty"}
              </label>
              <select
                id="admin-quiz-new-difficulty"
                name="difficultyLevel"
                value={form.difficultyLevel}
                onChange={(e) => setField("difficultyLevel", e.target.value)}
                className={cn("w-full", NATIVE_SELECT_CLASS)}
              >
                <option value="EASY">{t("difficulty.easy")}</option>
                <option value="MEDIUM">{t("difficulty.medium")}</option>
                <option value="HARD">{t("difficulty.hard")}</option>
              </select>
            </div>

            {/* Question Type */}
            <div className="space-y-1">
              <label
                htmlFor="admin-quiz-new-question-type"
                className="block text-xs font-semibold text-foreground"
              >
                {t("admin.quizzes.form.question_type") || "Question Type"}
              </label>
              <select
                id="admin-quiz-new-question-type"
                name="questionType"
                value={form.questionType}
                onChange={(e) => setField("questionType", e.target.value)}
                className={cn("w-full", NATIVE_SELECT_CLASS)}
              >
                <option value="MULTIPLE_CHOICE">
                  {t("admin.quizzes.type_multiple_choice")}
                </option>
                <option value="TRUE_FALSE">
                  {t("admin.quizzes.type_true_false")}
                </option>
                <option value="IMAGE_BASED">
                  {t("admin.quizzes.type_image_based")}
                </option>
              </select>
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImageUrl(form.contentImageUrl)}
                alt="Question content"
                className="max-h-48 rounded-xl border border-border/50 object-contain bg-muted"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <button
                type="button"
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

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <label
                htmlFor="admin-quiz-new-image-url"
                className="block text-xs font-semibold text-foreground"
              >
                {t("admin.quizzes.form.image_url")}
              </label>
              <input
                id="admin-quiz-new-image-url"
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
                id="admin-quiz-new-image-file"
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
            />
            <FormTextarea
              label={t("admin.quizzes.form.question_ar")}
              placeholder={t("admin.quizzes.form.question_ar_placeholder")}
              value={form.questionAr}
              onChange={(v) => setField("questionAr", v)}
              dir="rtl"
            />
            <FormTextarea
              label={t("admin.quizzes.form.question_nl")}
              placeholder={t("admin.quizzes.form.question_nl_placeholder")}
              value={form.questionNl}
              onChange={(v) => setField("questionNl", v)}
            />
            <FormTextarea
              label={t("admin.quizzes.form.question_fr")}
              placeholder={t("admin.quizzes.form.question_fr_placeholder")}
              value={form.questionFr}
              onChange={(v) => setField("questionFr", v)}
            />
          </div>
        </AdminSectionCard>

        {/* Answer Options */}
        <AdminSectionCard title={`${t("admin.quizzes.form.options_title")} *`}>
          <div className="flex items-center justify-between">
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
                key={idx}
                className={cn(
                  "rounded-2xl border p-4 space-y-3 transition-colors",
                  opt.isCorrect
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border/50 bg-muted/20",
                )}
              >
                {/* Option Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black",
                        opt.isCorrect
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {t("admin.quizzes.form.option_number").replace(
                        "{number}",
                        String(idx + 1),
                      )}
                    </span>
                    {opt.isCorrect && (
                      <Badge className="bg-green-500/10 text-green-600 border-0 text-xs">
                        {t("admin.quizzes.correct_badge")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
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
                    {form.options.length > 2 && (
                      <button
                        type="button"
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
                    error={fieldErrors[`option_${idx}`]}
                    onChange={(v) => setOptionField(idx, "textEn", v)}
                  />
                  <FormField
                    label={t("admin.quizzes.form.option_text_ar")}
                    placeholder={t(
                      "admin.quizzes.form.option_text_ar_placeholder",
                    )}
                    value={opt.textAr}
                    onChange={(v) => setOptionField(idx, "textAr", v)}
                    dir="rtl"
                  />
                  <FormField
                    label={t("admin.quizzes.form.option_text_nl")}
                    placeholder={t(
                      "admin.quizzes.form.option_text_nl_placeholder",
                    )}
                    value={opt.textNl}
                    onChange={(v) => setOptionField(idx, "textNl", v)}
                  />
                  <FormField
                    label={t("admin.quizzes.form.option_text_fr")}
                    placeholder={t(
                      "admin.quizzes.form.option_text_fr_placeholder",
                    )}
                    value={opt.textFr}
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
              <Link href="/admin/quizzes">
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
                  {t("admin.quizzes.form.saving")}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {t("admin.quizzes.form.save")}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
