"use client";

import { type FormEvent, useState } from "react";
import Link from "@/components/localized-link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminSectionCard from "@/components/admin/AdminSectionCard";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import {
  createAdminLesson,
  type CreateAdminLessonRequest,
} from "@/lib/admin-lessons";
import { getApiErrorMessage, logApiError } from "@/lib/api";
import { localizePathname } from "@/lib/i18n-routing";
import { ArrowLeft, BookOpenText, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

type LanguageCode = "ar" | "nl" | "fr" | "en";

const languages: Array<{ code: LanguageCode; label: string }> = [
  { code: "ar", label: "العربية" },
  { code: "nl", label: "Nederlands" },
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
];

type TextMap = Record<LanguageCode, string>;

const emptyTextMap = (): TextMap => ({ ar: "", nl: "", fr: "", en: "" });

export default function NewAdminLessonPage() {
  const { t, isRTL, language } = useLanguage();
  const router = useRouter();
  const [lessonCode, setLessonCode] = useState("");
  const [titles, setTitles] = useState<TextMap>(emptyTextMap);
  const [descriptions, setDescriptions] = useState<TextMap>(emptyTextMap);
  const [pageTitles, setPageTitles] = useState<TextMap>(emptyTextMap);
  const [contents, setContents] = useState<TextMap>(emptyTextMap);
  const [icon, setIcon] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setError(null);

    const request: CreateAdminLessonRequest = {
      lessonCode: lessonCode.trim(),
      titleAr: titles.ar.trim(),
      titleNl: titles.nl.trim(),
      titleFr: titles.fr.trim(),
      titleEn: titles.en.trim(),
      descriptionAr: descriptions.ar.trim(),
      descriptionNl: descriptions.nl.trim(),
      descriptionFr: descriptions.fr.trim(),
      descriptionEn: descriptions.en.trim(),
      icon: icon.trim(),
      displayOrder,
      estimatedMinutes,
      page: {
        titleAr: pageTitles.ar.trim(),
        titleNl: pageTitles.nl.trim(),
        titleFr: pageTitles.fr.trim(),
        titleEn: pageTitles.en.trim(),
        contentAr: contents.ar.trim(),
        contentNl: contents.nl.trim(),
        contentFr: contents.fr.trim(),
        contentEn: contents.en.trim(),
      },
    };

    if (
      !request.lessonCode ||
      !request.titleAr ||
      !request.titleNl ||
      !request.titleFr ||
      !request.titleEn ||
      !request.page.titleAr ||
      !request.page.titleNl ||
      !request.page.titleFr ||
      !request.page.titleEn
    ) {
      setError(t("admin.lessons.create.required_error"));
      return;
    }

    if (
      !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(request.lessonCode) ||
      request.lessonCode.length > 50 ||
      !Number.isInteger(displayOrder) || displayOrder < 0 ||
      !Number.isInteger(estimatedMinutes) || estimatedMinutes < 1
    ) {
      setError(t("admin.lessons.create.invalid_error"));
      return;
    }

    try {
      setSaving(true);
      const created = await createAdminLesson(request);
      router.push(
        localizePathname(
          `/admin/lessons/${encodeURIComponent(created.lessonCode)}/edit`,
          language,
        ),
      );
    } catch (requestError) {
      logApiError("Failed to create Admin lesson", requestError);
      setError(
        getApiErrorMessage(
          requestError,
          t("admin.lessons.create.error"),
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-5">
      <AdminPageHeader
        icon={<BookOpenText className="h-6 w-6" />}
        title={t("admin.lessons.create.title")}
        description={t("admin.lessons.create.description")}
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link href="/admin/lessons">
              <ArrowLeft className="h-4 w-4" />
              {t("admin.lessons.editor.back_to_lessons")}
            </Link>
          </Button>
        }
      />

      <form onSubmit={submit} className="space-y-5">
        <AdminSectionCard
          title={t("admin.lessons.create.details_title")}
          description={t("admin.lessons.create.details_description")}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t("admin.lessons.editor.lesson_code")}>
              <input
                required
                maxLength={50}
                pattern="[A-Za-z0-9][A-Za-z0-9_-]*"
                value={lessonCode}
                onChange={(event) => setLessonCode(event.target.value)}
                dir="ltr"
                className={inputClass}
              />
            </Field>
            <Field label={t("admin.lessons.editor.field_display_order")}>
              <input
                required
                type="number"
                min={0}
                step={1}
                value={displayOrder}
                onChange={(event) => setDisplayOrder(Number(event.target.value))}
                dir="ltr"
                className={inputClass}
              />
            </Field>
            <Field label={t("admin.lessons.editor.field_estimated_minutes")}>
              <input
                required
                type="number"
                min={1}
                step={1}
                value={estimatedMinutes}
                onChange={(event) => setEstimatedMinutes(Number(event.target.value))}
                dir="ltr"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label={t("admin.lessons.editor.field_icon")}>
            <input
              value={icon}
              maxLength={10}
              onChange={(event) => setIcon(event.target.value)}
              dir="ltr"
              className={inputClass}
            />
          </Field>
        </AdminSectionCard>

        <LanguageTextCard
          title={t("admin.lessons.create.titles_title")}
          values={titles}
          setter={setTitles}
          required
          label={t("admin.lessons.editor.field_title")}
        />

        <LanguageTextCard
          title={t("admin.lessons.editor.lesson_description")}
          values={descriptions}
          setter={setDescriptions}
          label={t("admin.lessons.editor.field_description")}
          multiline
        />

        <LanguageTextCard
          title={t("admin.lessons.create.page_title")}
          values={pageTitles}
          setter={setPageTitles}
          required
          label={t("admin.lessons.editor.page_title")}
        />

        <LanguageTextCard
          title={t("admin.lessons.editor.page_content")}
          values={contents}
          setter={setContents}
          label={t("admin.lessons.editor.page_content")}
          multiline
        />


        {error ? (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? t("admin.lessons.create.saving") : t("admin.lessons.create.submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}

const inputClass = "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40";


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function LanguageTextCard({
  title,
  label,
  values,
  setter,
  description,
  required = false,
  multiline = false,
}: {
  title: string;
  label: string;
  values: TextMap;
  setter: React.Dispatch<React.SetStateAction<TextMap>>;
  description?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  return (
    <AdminSectionCard title={title} description={description}>
      <div className="grid gap-4 md:grid-cols-2">
        {languages.map(({ code, label: languageLabel }) => (
          <Field key={code} label={`${label} — ${languageLabel}`}>
            {multiline ? (
              <textarea
                required={required}
                value={values[code]}
                onChange={(event) => setter((current) => ({ ...current, [code]: event.target.value }))}
                dir={code === "ar" ? "rtl" : "ltr"}
                className="min-h-28 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            ) : (
              <input
                required={required}
                value={values[code]}
                onChange={(event) => setter((current) => ({ ...current, [code]: event.target.value }))}
                dir={code === "ar" ? "rtl" : "ltr"}
                className={inputClass}
              />
            )}
          </Field>
        ))}
      </div>
    </AdminSectionCard>
  );
}
