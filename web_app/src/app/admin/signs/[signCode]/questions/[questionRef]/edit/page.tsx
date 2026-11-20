"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "@/components/localized-link";
import { ArrowLeft, TrafficCone } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminSectionCard from "@/components/admin/AdminSectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/language-context";
import { useLocalizedRouter } from "@/hooks/use-localized-router";
import { apiClient, logApiError } from "@/lib/api";

type LanguageCode = "EN" | "AR" | "NL" | "FR";
type SourceChoice = { text: string; is_correct: boolean };
type SourceTranslation = { question: string; explanation: string; choices: SourceChoice[] };
type SourceQuestion = {
  question_id: string;
  type: string;
  difficulty: string;
  is_critical: boolean;
  show_sign: boolean;
  i18n: Record<LanguageCode, SourceTranslation>;
};
type SourceResponse = { question: SourceQuestion; revision: string };

const LANGUAGES: LanguageCode[] = ["EN", "AR", "NL", "FR"];

function returnToSigns(value: string | null): string {
  if (!value) return "/admin/signs";
  try {
    const url = new URL(value, "http://localhost");
    return url.origin === "http://localhost" && url.pathname === "/admin/signs"
      ? `${url.pathname}${url.search}` : "/admin/signs";
  } catch {
    return "/admin/signs";
  }
}

export default function EditSignQuestionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useLocalizedRouter();
  const { t, isRTL } = useLanguage();
  const signCode = String(params.signCode ?? "");
  const questionRef = String(params.questionRef ?? "");
  const returnTo = useMemo(() => returnToSigns(searchParams.get("returnTo")), [searchParams]);
  const endpoint = `/admin/sign-quiz/signs/${encodeURIComponent(signCode)}/questions/${encodeURIComponent(questionRef)}`;
  const [form, setForm] = useState<SourceQuestion | null>(null);
  const [revision, setRevision] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiClient.get<SourceResponse>(endpoint).then(({ data }) => {
      if (active) {
        setForm(data.question);
        setRevision(data.revision);
      }
    }).catch((err) => {
      logApiError("Failed to load sign question source", err);
      if (active) setError(t("admin.signs.question_load_error"));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint, t]);

  const edit = (change: (current: SourceQuestion) => void) => {
    setForm((current) => {
      if (!current) return current;
      const next = JSON.parse(JSON.stringify(current)) as SourceQuestion;
      change(next);
      return next;
    });
  };

  const setText = (lang: LanguageCode, field: "question" | "explanation", value: string) =>
    edit((next) => { next.i18n[lang][field] = value; });

  const setChoiceText = (lang: LanguageCode, index: number, value: string) =>
    edit((next) => { next.i18n[lang].choices[index].text = value; });

  const setCorrect = (index: number) => edit((next) => {
    for (const lang of LANGUAGES) {
      next.i18n[lang].choices.forEach((choice, choiceIndex) => {
        choice.is_correct = choiceIndex === index;
      });
    }
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form || saving) return;
    setError("");
    if (LANGUAGES.some((lang) => !form.i18n[lang].question.trim()
      || !form.i18n[lang].explanation.trim()
      || form.i18n[lang].choices.some((choice) => !choice.text.trim()))) {
      setError(t("admin.signs.question_required_error"));
      return;
    }
    setSaving(true);
    try {
      await apiClient.put<SourceResponse>(endpoint, { question: form, revision });
      router.push(returnTo);
    } catch (err) {
      logApiError("Failed to save sign question source", err);
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(t(status === 409 ? "admin.quizzes.form.edit_conflict" : "admin.signs.question_save_error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-5 animate-pulse"><div className="h-8 w-64 rounded-xl bg-muted" /><div className="h-64 rounded-2xl border border-border/50 bg-card" /></div>;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-5">
      <AdminPageHeader
        icon={<TrafficCone className="h-6 w-6" />}
        title={t("admin.signs.edit_question")}
        description={`${signCode} · ${questionRef}`}
        actions={<Button variant="outline" asChild className="gap-2"><Link href={returnTo}><ArrowLeft className="h-4 w-4" />{t("common.back")}</Link></Button>}
      />
      {error && <p role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
      {form && <form onSubmit={submit} className="space-y-5">
        <AdminSectionCard title={t("admin.quizzes.form.basic_info")}>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{form.type}</Badge>
            <Badge variant="outline">{form.difficulty}</Badge>
            <Badge variant="outline">{questionRef}</Badge>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t("admin.signs.source_note")}</p>
        </AdminSectionCard>
        <AdminSectionCard title={t("admin.quizzes.form.questions")}>
          <div className="grid gap-4 md:grid-cols-2">
            {LANGUAGES.map((lang) => <label key={lang} className="space-y-1 text-xs font-semibold text-foreground">
              <span>{t(`admin.quizzes.form.question_${lang.toLowerCase()}`)} *</span>
              <textarea value={form.i18n[lang].question} onChange={(event) => setText(lang, "question", event.target.value)}
                dir={lang === "AR" ? "rtl" : "ltr"} rows={3} required
                className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </label>)}
          </div>
        </AdminSectionCard>
        <AdminSectionCard title={t("admin.quizzes.form.explanations")}>
          <div className="grid gap-4 md:grid-cols-2">
            {LANGUAGES.map((lang) => <label key={lang} className="space-y-1 text-xs font-semibold text-foreground">
              <span>{t(`admin.quizzes.form.explanation_${lang.toLowerCase()}`)} *</span>
              <textarea value={form.i18n[lang].explanation} onChange={(event) => setText(lang, "explanation", event.target.value)}
                dir={lang === "AR" ? "rtl" : "ltr"} rows={3} required
                className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </label>)}
          </div>
        </AdminSectionCard>
        <AdminSectionCard title={t("admin.quizzes.form.options_title")}>
          <div className="space-y-4">
            {form.i18n.EN.choices.map((choice, index) => <div key={index} className="space-y-3 rounded-2xl border border-border/50 bg-muted/20 p-4">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="radio" name="correctChoice" checked={choice.is_correct} onChange={() => setCorrect(index)} />
                {t("admin.quizzes.form.option_number", { number: index + 1 })} · {t("admin.quizzes.form.mark_correct")}
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                {LANGUAGES.map((lang) => <label key={lang} className="space-y-1 text-xs font-semibold text-foreground">
                  <span>{t(`admin.quizzes.form.option_text_${lang.toLowerCase()}`)} *</span>
                  <input value={form.i18n[lang].choices[index]?.text ?? ""} onChange={(event) => setChoiceText(lang, index, event.target.value)}
                    dir={lang === "AR" ? "rtl" : "ltr"} required
                    className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </label>)}
              </div>
            </div>)}
          </div>
        </AdminSectionCard>
        <div className="flex justify-end"><Button type="submit" disabled={saving}>{t(saving ? "admin.quizzes.form.updating" : "admin.quizzes.form.update")}</Button></div>
      </form>}
    </div>
  );
}
