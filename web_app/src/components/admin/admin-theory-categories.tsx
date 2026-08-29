"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "@/components/localized-link";
import {
  AlertTriangle,
  CheckCircle2,
  FolderCog,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import { apiClient, logApiError } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface CategoryHealth {
  id: number;
  code: string;
  nameEn: string;
  nameNl: string;
  nameFr: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionNl: string | null;
  descriptionFr: string | null;
  descriptionAr: string | null;
  displayOrder: number;
  active: boolean;
  contentScope: "THEORETICAL_EXAM" | "BOTH";
  examTargetWeight: number;
  totalQuestions: number;
  publishedQuestions: number;
  eligibleAllLocales: number;
  eligibleByDifficulty: Record<Difficulty, number>;
  minimumRequired: number;
  questionsNeeded: number;
  examEligible: boolean;
}

interface CategoryDraft {
  id: number | null;
  code: string | null;
  nameEn: string;
  nameNl: string;
  nameFr: string;
  nameAr: string;
  descriptionEn: string;
  descriptionNl: string;
  descriptionFr: string;
  descriptionAr: string;
  displayOrder: number;
  active: boolean;
  contentScope: "THEORETICAL_EXAM" | "BOTH";
  examTargetWeight: string;
}

const EMPTY_DRAFT: CategoryDraft = {
  id: null,
  code: null,
  nameEn: "",
  nameNl: "",
  nameFr: "",
  nameAr: "",
  descriptionEn: "",
  descriptionNl: "",
  descriptionFr: "",
  descriptionAr: "",
  displayOrder: 0,
  active: true,
  contentScope: "THEORETICAL_EXAM",
  examTargetWeight: "10",
};

export function AdminTheoryCategories() {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<CategoryHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<CategoryDraft | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<CategoryHealth[]>(
        API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.CATEGORIES_MANAGE,
      );

      if (!Array.isArray(response.data)) {
        throw new Error("Theory category management response is invalid");
      }

      setCategories(response.data);
    } catch (loadError) {
      logApiError("Failed to load theory categories", loadError);
      setError(t("admin.quizzes.health.load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const payload = (value: CategoryDraft) => ({
    code: value.id == null ? null : value.code,
    nameEn: value.nameEn.trim(),
    nameNl: value.nameNl.trim(),
    nameFr: value.nameFr.trim(),
    nameAr: value.nameAr.trim(),
    descriptionEn: value.descriptionEn.trim() || null,
    descriptionNl: value.descriptionNl.trim() || null,
    descriptionFr: value.descriptionFr.trim() || null,
    descriptionAr: value.descriptionAr.trim() || null,
    displayOrder: value.displayOrder,
    active: value.active,
    contentScope: value.contentScope,
    examTargetWeight:
      value.examTargetWeight.trim() === ""
        ? 10
        : Number(value.examTargetWeight),
  });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;

    try {
      setSaving(true);
      setError(null);

      if (draft.id == null) {
        await apiClient.post(
          API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.CREATE_CATEGORY,
          payload(draft),
        );
      } else {
        await apiClient.put(
          API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.UPDATE_CATEGORY(draft.id),
          payload(draft),
        );
      }

      setDraft(null);
      await load();
    } catch (saveError) {
      logApiError("Failed to save theory category", saveError);
      setError(t("admin.quizzes.health.save_error"));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (category: CategoryHealth) => {
    try {
      setSaving(true);
      setError(null);

      await apiClient.put(
        API_ENDPOINTS.ADMIN.QUIZ_QUESTIONS.UPDATE_CATEGORY(category.id),
        payload({
          ...draftFromCategory(category),
          active: !category.active,
        }),
      );

      await load();
    } catch (toggleError) {
      logApiError("Failed to change theory category status", toggleError);
      setError(t("admin.quizzes.health.save_error"));
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    const eligible = categories.filter((category) => category.examEligible).length;
    const published = categories.reduce(
      (total, category) => total + category.publishedQuestions,
      0,
    );

    return {
      eligible,
      published,
    };
  }, [categories]);

  if (loading && categories.length === 0) {
    return (
      <div
        className="h-64 animate-pulse rounded-3xl border border-border/50 bg-muted/30"
        data-testid="theory-categories-loading"
      />
    );
  }

  return (
    <section
      className="min-w-0 space-y-5"
      data-testid="theory-category-management"
    >
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/[0.09] via-primary/[0.035] to-transparent" />

        <div className="relative space-y-5 p-4 sm:p-5 lg:p-6">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
                <FolderCog className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  {t("admin.quizzes.health.categories")}
                </p>
                <h2 className="mt-1 text-lg font-black tracking-tight text-foreground sm:text-xl">
                  {t("admin.quizzes.health.category_management_title")}
                </h2>
                <p className="mt-1.5 max-w-3xl text-xs leading-5 text-muted-foreground sm:text-sm">
                  {t("admin.quizzes.health.category_management_description")}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void load()}
                disabled={loading}
                aria-label={t("admin.quizzes.health.refresh")}
                className="h-9 w-9 rounded-xl border-border/60 bg-background/80 p-0 shadow-sm"
              >
                <RefreshCw
                  className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                />
              </Button>

              <Button
                type="button"
                size="sm"
                className="gap-2 rounded-xl shadow-sm"
                onClick={() =>
                  setDraft({
                    ...EMPTY_DRAFT,
                    displayOrder: nextDisplayOrder(categories),
                  })
                }
              >
                <Plus className="h-4 w-4" />
                {t("admin.quizzes.health.add_category")}
              </Button>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            <SummaryMetric
              label={t("admin.quizzes.health.categories")}
              value={categories.length}
            />
            <SummaryMetric
              label={t("admin.quizzes.health.eligible")}
              value={summary.eligible}
            />
            <SummaryMetric
              label={t("admin.quizzes.health.published")}
              value={summary.published}
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="min-w-0 break-words">{error}</span>
        </div>
      ) : null}

      {draft ? (
        <CategoryForm
          draft={draft}
          setDraft={setDraft}
          onSubmit={save}
          saving={saving}
          t={t}
        />
      ) : null}

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        {categories.map((category) => (
          <article
            key={category.id}
            className="group relative min-w-0 overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm transition hover:border-primary/25 hover:shadow-md"
          >
            <div
              className={
                category.examEligible
                  ? "absolute inset-x-0 top-0 h-1 bg-primary"
                  : "absolute inset-x-0 top-0 h-1 bg-muted-foreground/20"
              }
            />

            <div className="space-y-4 p-4 pt-5 sm:p-5 sm:pt-6">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-base font-black leading-6 text-foreground sm:text-lg">
                    {categoryName(category, language)}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-lg border border-border/50 bg-muted/20 px-2 py-1 font-semibold">
                      {t("admin.quizzes.health.order")}: {category.displayOrder}
                    </span>
                    <span className="rounded-lg border border-border/50 bg-muted/20 px-2 py-1 font-semibold">
                      {t("admin.quizzes.health.weight")}: {category.examTargetWeight}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge
                    variant={category.examEligible ? "default" : "outline"}
                    className="rounded-full"
                  >
                    {category.examEligible
                      ? t("admin.quizzes.health.exam_ready")
                      : t("admin.quizzes.health.questions_needed")}
                  </Badge>
                  <Badge variant="outline" className="rounded-full bg-background/80">
                    {category.active
                      ? t("admin.quizzes.health.active")
                      : t("admin.quizzes.health.inactive")}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <Metric
                  label={t("admin.quizzes.health.total")}
                  value={category.totalQuestions}
                />
                <Metric
                  label={t("admin.quizzes.health.published")}
                  value={category.publishedQuestions}
                />
                <Metric
                  label={t("admin.quizzes.health.eligible")}
                  value={category.eligibleAllLocales}
                  emphasized
                />
              </div>

              <div className="rounded-2xl border border-border/50 bg-background/60 p-3.5">
                <div className="grid grid-cols-3 gap-2">
                  {(["EASY", "MEDIUM", "HARD"] as const).map((difficulty) => (
                    <Metric
                      key={difficulty}
                      label={difficulty}
                      value={category.eligibleByDifficulty[difficulty] ?? 0}
                      compact
                    />
                  ))}
                </div>
              </div>

              <div
                className={
                  category.examEligible
                    ? "rounded-2xl border border-primary/15 bg-primary/[0.035] p-3.5"
                    : "rounded-2xl border border-border/50 bg-muted/20 p-3.5"
                }
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle2
                    className={
                      category.examEligible
                        ? "mt-0.5 h-4 w-4 shrink-0 text-primary"
                        : "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                    }
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-foreground">
                      {category.eligibleAllLocales}/{category.minimumRequired}{" "}
                      {category.examEligible
                        ? t("admin.quizzes.health.exam_ready")
                        : `${t("admin.quizzes.health.questions_needed")}: ${category.questionsNeeded}`}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {t("admin.quizzes.health.minimum_required")}: {category.minimumRequired}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border/40 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl"
                  onClick={() => setDraft(draftFromCategory(category))}
                >
                  <Pencil className="h-4 w-4" />
                  {t("admin.quizzes.health.edit_category")}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={saving}
                  onClick={() => void toggle(category)}
                >
                  {t(
                    category.active
                      ? "admin.quizzes.health.deactivate"
                      : "admin.quizzes.health.activate",
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  asChild
                >
                  <Link
                    href={`/admin/quizzes?categoryCode=${encodeURIComponent(category.code)}`}
                  >
                    {t("admin.quizzes.health.view_questions")}
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!loading && categories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {t("admin.quizzes.health.categories")}
        </div>
      ) : null}
    </section>
  );
}

function CategoryForm({
  draft,
  setDraft,
  onSubmit,
  saving,
  t,
}: {
  draft: CategoryDraft;
  setDraft: (draft: CategoryDraft | null) => void;
  onSubmit: (event: React.FormEvent) => void;
  saving: boolean;
  t: (key: string) => string;
}) {
  const update = <K extends keyof CategoryDraft>(
    key: K,
    value: CategoryDraft[K],
  ) => {
    setDraft({ ...draft, [key]: value });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-sm"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/[0.08] to-transparent" />

      <div className="relative space-y-5 p-4 sm:p-5 lg:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              {t("admin.quizzes.health.categories")}
            </p>
            <h2 className="mt-1 text-lg font-black text-foreground">
              {t(
                draft.id == null
                  ? "admin.quizzes.health.add_category"
                  : "admin.quizzes.health.edit_category",
              )}
            </h2>
            {draft.id == null ? (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t("admin.quizzes.health.auto_code_hint")}
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-xl"
            onClick={() => setDraft(null)}
            aria-label={t("admin.quizzes.health.cancel")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("admin.quizzes.health.order")}>
            <Input
              aria-label={t("admin.quizzes.health.order")}
              required
              type="number"
              min={0}
              value={draft.displayOrder}
              onChange={(event) =>
                update("displayOrder", Number(event.target.value))
              }
            />
          </Field>

          <Field label={t("admin.quizzes.health.weight")}>
            <Input
              aria-label={t("admin.quizzes.health.weight")}
              required
              type="number"
              min={1}
              max={100}
              value={draft.examTargetWeight}
              onChange={(event) =>
                update("examTargetWeight", event.target.value)
              }
            />
          </Field>

          {(["En", "Nl", "Fr", "Ar"] as const).map((suffix) => {
            const key = `name${suffix}` as const;

            return (
              <Field
                key={key}
                label={t(
                  `admin.quizzes.health.name_${suffix.toLowerCase()}`,
                )}
              >
                <Input
                  aria-label={t(
                    `admin.quizzes.health.name_${suffix.toLowerCase()}`,
                  )}
                  required
                  value={draft[key]}
                  dir={suffix === "Ar" ? "rtl" : "ltr"}
                  onChange={(event) => update(key, event.target.value)}
                />
              </Field>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {(["En", "Nl", "Fr", "Ar"] as const).map((suffix) => {
            const key = `description${suffix}` as const;

            return (
              <Field
                key={key}
                label={t(
                  `admin.quizzes.health.description_${suffix.toLowerCase()}`,
                )}
              >
                <textarea
                  aria-label={t(
                    `admin.quizzes.health.description_${suffix.toLowerCase()}`,
                  )}
                  className="min-h-24 w-full min-w-0 rounded-xl border border-input bg-background/70 px-3 py-2.5 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={draft[key]}
                  dir={suffix === "Ar" ? "rtl" : "ltr"}
                  onChange={(event) => update(key, event.target.value)}
                />
              </Field>
            );
          })}
        </div>

        <label className="flex w-fit items-center gap-2 rounded-xl border border-border/50 bg-background/70 px-3 py-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(event) => update("active", event.target.checked)}
          />
          {t("admin.quizzes.health.active")}
        </label>

        <div className="flex flex-wrap gap-2 border-t border-border/40 pt-4">
          <Button
            type="submit"
            disabled={saving}
            className="gap-2 rounded-xl"
          >
            <Save className="h-4 w-4" />
            {t("admin.quizzes.health.save")}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => setDraft(null)}
          >
            {t("admin.quizzes.health.cancel")}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/45 bg-background/65 px-3.5 py-3 shadow-[0_1px_0_rgb(0_0_0/0.02)]">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-black tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  compact = false,
  emphasized = false,
}: {
  label: string;
  value: number;
  compact?: boolean;
  emphasized?: boolean;
}) {
  return (
    <div
      className={
        emphasized
          ? "rounded-xl border border-primary/15 bg-primary/[0.045] p-2.5 text-center"
          : "rounded-xl border border-border/40 bg-muted/20 p-2.5 text-center"
      }
    >
      <p className="truncate text-[11px] font-semibold text-muted-foreground sm:text-xs">
        {label}
      </p>
      <p
        className={
          compact
            ? "mt-1 text-base font-black text-foreground"
            : "mt-1 text-lg font-black text-foreground"
        }
      >
        {value}
      </p>
    </div>
  );
}

function categoryName(category: CategoryHealth, language: string): string {
  if (language === "ar") return category.nameAr;
  if (language === "nl") return category.nameNl;
  if (language === "fr") return category.nameFr;
  return category.nameEn;
}

function draftFromCategory(category: CategoryHealth): CategoryDraft {
  return {
    id: category.id,
    code: category.code,
    nameEn: category.nameEn,
    nameNl: category.nameNl,
    nameFr: category.nameFr,
    nameAr: category.nameAr,
    descriptionEn: category.descriptionEn ?? "",
    descriptionNl: category.descriptionNl ?? "",
    descriptionFr: category.descriptionFr ?? "",
    descriptionAr: category.descriptionAr ?? "",
    displayOrder: category.displayOrder,
    active: category.active,
    contentScope: category.contentScope,
    examTargetWeight: String(category.examTargetWeight),
  };
}

function nextDisplayOrder(categories: CategoryHealth[]): number {
  if (categories.length === 0) return 1;

  return (
    Math.max(
      ...categories.map((category) => category.displayOrder ?? 0),
    ) + 1
  );
}
