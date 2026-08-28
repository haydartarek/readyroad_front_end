"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "@/components/localized-link";
import {
  AlertTriangle,
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

type LocaleCode = "ar" | "nl" | "en" | "fr";

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
  activeQuestions: number;
  publishedQuestions: number;

  eligibleAllLocales: number;
  eligibleByLocale: Record<LocaleCode, number>;
  eligibleByDifficulty: Record<"EASY" | "MEDIUM" | "HARD", number>;

  translationGapQuestions: number;
  explanationGapQuestions: number;
  invalidQuestions: number;
  totalPresentations: number;

  inventoryShare: number;
  targetShare: number;
  representationStatus: string;

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

  if (loading && categories.length === 0) {
    return (
      <div
        className="h-48 animate-pulse rounded-2xl border border-border/50 bg-muted/30"
        data-testid="theory-categories-loading"
      />
    );
  }

  const eligibleCount = categories.filter(
    (category) => category.examEligible,
  ).length;

  return (
    <section
      className="min-w-0 space-y-4"
      data-testid="theory-category-management"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {categories.length} {t("admin.quizzes.health.categories")}
          </Badge>

          <Badge variant="outline">
            {eligibleCount} {t("admin.quizzes.health.eligible")}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
            aria-label={t("admin.quizzes.health.refresh")}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            size="sm"
            className="gap-2"
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

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
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

      <div className="grid min-w-0 gap-3 xl:grid-cols-2">
        {categories.map((category) => (
          <article
            key={category.id}
            className="min-w-0 rounded-2xl border border-border/50 bg-card p-4 shadow-sm"
          >
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="break-words text-base font-black text-foreground">
                    {categoryName(category, language)}
                  </h2>

                  <Badge variant="outline">
                    {category.code}
                  </Badge>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {t("admin.quizzes.health.order")}: {category.displayOrder}
                  {"  "}
                  {t("admin.quizzes.health.weight")}: {category.examTargetWeight}
                </p>
              </div>

              <Badge variant={category.examEligible ? "default" : "outline"}>
                {category.eligibleAllLocales}/{category.minimumRequired}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
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
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["EASY", "MEDIUM", "HARD"] as const).map((difficulty) => (
                <Metric
                  key={difficulty}
                  label={difficulty}
                  value={category.eligibleByDifficulty[difficulty] ?? 0}
                />
              ))}
            </div>

            <div className="mt-3 rounded-xl border border-border/40 bg-muted/20 p-3">
              {category.examEligible ? (
                <p className="text-sm font-bold text-foreground">
                  {category.eligibleAllLocales}/{category.minimumRequired}
                  {"  "}
                  {t("admin.quizzes.health.exam_ready")}
                </p>
              ) : (
                <p className="text-sm font-bold text-foreground">
                  {category.eligibleAllLocales}/{category.minimumRequired}
                  {"  "}
                  {t("admin.quizzes.health.questions_needed")}:{" "}
                  {category.questionsNeeded}
                </p>
              )}

              <p className="mt-1 text-xs text-muted-foreground">
                {t("admin.quizzes.health.minimum_required")}:{" "}
                {category.minimumRequired}
                {"  "}
                {category.active
                  ? t("admin.quizzes.health.active")
                  : t("admin.quizzes.health.inactive")}
                {"  "}
                {category.contentScope}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setDraft(draftFromCategory(category))}
              >
                <Pencil className="h-4 w-4" />
                {t("admin.quizzes.health.edit_category")}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => void toggle(category)}
              >
                {t(
                  category.active
                    ? "admin.quizzes.health.deactivate"
                    : "admin.quizzes.health.activate",
                )}
              </Button>

              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={`/admin/quizzes?categoryCode=${encodeURIComponent(category.code)}`}>
                  {t("admin.quizzes.health.view_questions")}
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>

      {!loading && categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
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
      className="space-y-4 rounded-2xl border border-primary/20 bg-primary/[0.03] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-foreground">
            {t(
              draft.id == null
                ? "admin.quizzes.health.add_category"
                : "admin.quizzes.health.edit_category",
            )}
          </h2>

          {draft.code ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {draft.code}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("admin.quizzes.health.auto_code_hint")}
            </p>
          )}
        </div>

        <Button
          type="button"
          size="icon"
          variant="ghost"
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
                className="min-h-20 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={draft[key]}
                dir={suffix === "Ar" ? "rtl" : "ltr"}
                onChange={(event) => update(key, event.target.value)}
              />
            </Field>
          );
        })}
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(event) => update("active", event.target.checked)}
        />
        {t("admin.quizzes.health.active")}
      </label>

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={saving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {t("admin.quizzes.health.save")}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setDraft(null)}
        >
          {t("admin.quizzes.health.cancel")}
        </Button>
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

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-muted/30 p-2 text-center">
      <p className="text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-foreground">
        {value}
      </p>
    </div>
  );
}

function categoryName(
  category: CategoryHealth,
  language: string,
): string {
  if (language === "ar") return category.nameAr;
  if (language === "nl") return category.nameNl;
  if (language === "fr") return category.nameFr;
  return category.nameEn;
}

function draftFromCategory(
  category: CategoryHealth,
): CategoryDraft {
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

function nextDisplayOrder(
  categories: CategoryHealth[],
): number {
  if (categories.length === 0) return 1;

  return (
    Math.max(
      ...categories.map((category) => category.displayOrder ?? 0),
    ) + 1
  );
}
