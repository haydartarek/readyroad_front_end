"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, FileClock, FilePenLine, Loader2, Save, Search, ShieldCheck } from "lucide-react";
import { apiClient, logApiError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  EditorialApprovalRequest,
  EditorialLanguage,
  EditorialSaveRequest,
  EditorialSaveResult,
  EditorialTopic,
  EditorialVersion,
  EditorialWorkspace,
} from "@/lib/marketing-admin";

type Translate = (key: string, variables?: Record<string, string | number>) => string;
type DateFormatter = (value: string | null) => string;

interface EditorialEditorPanelProps {
  workspace: EditorialWorkspace;
  busy: string | null;
  t: Translate;
  formatDate: DateFormatter;
  onSave: (
    topicId: number,
    language: EditorialLanguage,
    request: EditorialSaveRequest,
  ) => Promise<EditorialSaveResult>;
  onRequestApproval: (
    articleId: number,
    request: EditorialApprovalRequest,
  ) => Promise<void>;
}

interface FormState {
  title: string;
  slug: string;
  summary: string;
  body: string;
  expectedCurrentVersion: number | null;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  summary: "",
  body: "",
  expectedCurrentVersion: null,
};

export default function EditorialEditorPanel({
  workspace,
  busy,
  t,
  formatDate,
  onSave,
  onRequestApproval,
}: EditorialEditorPanelProps) {
  const [search, setSearch] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(
    workspace.topics[0]?.topicId ?? null,
  );
  const [language, setLanguage] = useState<EditorialLanguage>(
    workspace.topics[0]?.canonicalLanguage
      ?? workspace.topics[0]?.primaryLanguage
      ?? workspace.topics[0]?.titleLanguage
      ?? "AR",
  );
  const [history, setHistory] = useState<EditorialVersion[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [approvalReason, setApprovalReason] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [baseline, setBaseline] = useState<FormState>(EMPTY_FORM);

  const selectedTopic = useMemo(
    () => workspace.topics.find((topic) => topic.topicId === selectedTopicId) ?? null,
    [selectedTopicId, workspace.topics],
  );
  const filteredTopics = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return workspace.topics;
    return workspace.topics.filter((topic) =>
      `${topic.topicKey} ${topic.title} ${topic.priority ?? ""}`.toLocaleLowerCase().includes(query),
    );
  }, [search, workspace.topics]);
  const currentSummary = selectedTopic?.currentVersions.find(
    (version) => version.language === language,
  );
  const currentVersionNumber = currentSummary?.versionNumber;
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const saving = busy === "editorial-save";
  const requestingApproval = busy === "editorial-approval";
  const lifecycleState = selectedTopic?.lifecycleState;
  const editorLocked = [
    "WAITING_APPROVAL",
    "APPROVED",
    "SCHEDULED",
    "PUBLISHED",
    "REJECTED",
    "ARCHIVED",
  ].includes(lifecycleState ?? "");
  const hasEveryLanguage = workspace.languages.every((item) =>
    selectedTopic?.currentVersions.some((version) => version.language === item),
  );
  const canRequestApproval = Boolean(
    selectedTopic?.articleId
      && lifecycleState === "IMAGE_REQUIRED"
      && hasEveryLanguage
      && !dirty
      && approvalConfirmed
      && approvalReason.trim(),
  );

  useEffect(() => {
    setApprovalConfirmed(false);
    setApprovalReason("");
  }, [selectedTopicId, lifecycleState]);

  useEffect(() => {
    let active = true;
    const loadVersion = async () => {
      setHistoryError(false);
      if (!selectedTopic?.articleId || !currentVersionNumber) {
        const initial = {
          ...EMPTY_FORM,
          title: selectedTopic?.titleLanguage === language ? selectedTopic.title : "",
        };
        setHistory([]);
        setForm(initial);
        setBaseline(initial);
        return;
      }
      setHistoryLoading(true);
      try {
        const response = await apiClient.get<EditorialVersion[]>(
          `/admin/marketing/editorial/editor/articles/${selectedTopic.articleId}/versions`,
          { language },
        );
        if (!active) return;
        const versions = response.data;
        const current = versions.find((version) => version.current) ?? versions[0];
        const next = current
          ? {
              title: current.title,
              slug: current.slug ?? "",
              summary: current.summary ?? "",
              body: current.body,
              expectedCurrentVersion: current.versionNumber,
            }
          : EMPTY_FORM;
        setHistory(versions);
        setForm(next);
        setBaseline(next);
      } catch (error) {
        if (!active) return;
        logApiError("Failed to load editorial article versions", error);
        setHistoryError(true);
      } finally {
        if (active) setHistoryLoading(false);
      }
    };
    void loadVersion();
    return () => {
      active = false;
    };
  }, [currentVersionNumber, language, selectedTopic?.articleId, selectedTopic?.title, selectedTopic?.titleLanguage]);

  const canLeave = () => !dirty || window.confirm(t("admin.marketing.editorial_discard_changes"));

  const selectTopic = (topic: EditorialTopic) => {
    if (!canLeave()) return;
    setSelectedTopicId(topic.topicId);
    setLanguage(topic.canonicalLanguage ?? topic.primaryLanguage ?? topic.titleLanguage);
  };

  const selectLanguage = (next: EditorialLanguage) => {
    if (next === language || !canLeave()) return;
    setLanguage(next);
  };

  const save = async () => {
    if (!selectedTopic || !form.title.trim() || !form.body.trim()) return;
    const result = await onSave(selectedTopic.topicId, language, {
      title: form.title.trim(),
      slug: form.slug.trim() || null,
      summary: form.summary.trim() || null,
      body: form.body,
      expectedCurrentVersion: form.expectedCurrentVersion,
    });
    const next = {
      ...form,
      expectedCurrentVersion: result.version.versionNumber,
    };
    setForm(next);
    setBaseline(next);
  };

  const requestApproval = async () => {
    if (!selectedTopic?.articleId || !canRequestApproval) return;
    await onRequestApproval(selectedTopic.articleId, {
      passedQualityGates: workspace.qualityGates,
      reason: approvalReason.trim(),
    });
  };

  if (!workspace.topics.length) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{t("admin.marketing.empty")}</p>;
  }

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(16rem,0.34fr)_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("admin.marketing.editorial_search")}
            className="ps-9"
          />
        </div>
        <div className="mt-3 max-h-[42rem] space-y-2 overflow-y-auto pe-1">
          {filteredTopics.map((topic) => (
            <button
              key={topic.topicId}
              type="button"
              onClick={() => selectTopic(topic)}
              className={cn(
                "w-full min-w-0 rounded-xl border p-3 text-start transition-colors",
                selectedTopicId === topic.topicId
                  ? "border-primary/30 bg-primary/[0.07]"
                  : "border-border/50 bg-background hover:border-primary/20 hover:bg-muted/40",
              )}
            >
              <span className="flex min-w-0 items-center justify-between gap-2">
                <span className="min-w-0 break-words text-sm font-bold">{topic.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">#{topic.order}</span>
              </span>
              <span className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline">{topic.priority ?? "—"}</Badge>
                <Badge variant="outline">{topic.lifecycleState ?? topic.sourceType}</Badge>
                <span className="text-xs text-muted-foreground">
                  {topic.currentVersions.length}/4 {t("admin.marketing.editorial_languages")}
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {selectedTopic ? (
        <section className="min-w-0 space-y-5 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-6">
          <header className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">{selectedTopic.topicKey}</p>
              <h2 className="mt-1 break-words text-lg font-black">{selectedTopic.title}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">{selectedTopic.lifecycleState ?? t("admin.marketing.editorial_not_started")}</Badge>
                <Badge variant="outline">
                  {selectedTopic.strategyContextResolved
                    ? t("admin.marketing.editorial_strategy_ready")
                    : t("admin.marketing.editorial_strategy_missing")}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-1" role="tablist" aria-label={t("admin.marketing.editorial_language")}>
              {workspace.languages.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={language === item}
                  onClick={() => selectLanguage(item)}
                  className={cn(
                    "h-9 min-w-11 rounded-lg border px-3 text-xs font-bold",
                    language === item
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-background hover:bg-muted",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </header>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <Field label={t("admin.marketing.editorial_title")} required>
              <Input
                value={form.title}
                disabled={editorLocked}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                maxLength={500}
              />
            </Field>
            <Field label={t("admin.marketing.editorial_slug")}>
              <Input
                dir="ltr"
                value={form.slug}
                disabled={editorLocked}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                maxLength={255}
              />
            </Field>
          </div>
          <Field label={t("admin.marketing.editorial_summary")}>
            <textarea
              value={form.summary}
              disabled={editorLocked}
              onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
              maxLength={2000}
              rows={3}
              className="w-full resize-y rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />
          </Field>
          <Field label={t("admin.marketing.editorial_body")} required>
            <textarea
              value={form.body}
              disabled={editorLocked}
              onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
              maxLength={500000}
              rows={18}
              className="min-h-80 w-full resize-y rounded-xl border border-border/60 bg-background px-3 py-3 font-mono text-sm leading-6 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />
          </Field>

          <div className="flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {currentSummary
                ? t("admin.marketing.editorial_current_version", { version: currentSummary.versionNumber })
                : t("admin.marketing.editorial_first_version")}
              {dirty ? ` · ${t("admin.marketing.editorial_unsaved")}` : ""}
            </p>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewOpen(true)}
                disabled={!form.title.trim() || !form.body.trim()}
                className="w-full sm:w-auto"
              >
                <Eye />
                {t("admin.marketing.editorial_preview")}
              </Button>
              <Button
                onClick={() => void save()}
                disabled={editorLocked || saving || !form.title.trim() || !form.body.trim()}
                className="w-full sm:w-auto"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                {t("admin.marketing.editorial_save")}
              </Button>
            </div>
          </div>

          {lifecycleState === "IMAGE_REQUIRED" ? (
            <section className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-4" data-testid="editorial-approval-request">
              <div>
                <h3 className="flex items-center gap-2 font-black">
                  <ShieldCheck className="h-4 w-4" />
                  {t("admin.marketing.editorial_approval_title")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("admin.marketing.editorial_approval_description")}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5" aria-label={t("admin.marketing.editorial_quality_gates")}>
                {workspace.qualityGates.map((gate) => (
                  <Badge key={gate} variant="outline" className="bg-background/80">{gate.replaceAll("_", " ")}</Badge>
                ))}
              </div>
              <label className="flex items-start gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={approvalConfirmed}
                  onChange={(event) => setApprovalConfirmed(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />
                <span>{t("admin.marketing.editorial_approval_confirm")}</span>
              </label>
              <label className="block space-y-1.5 text-sm font-semibold">
                <span>{t("admin.marketing.editorial_approval_reason")}</span>
                <textarea
                  value={approvalReason}
                  onChange={(event) => setApprovalReason(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  className="w-full resize-y rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                />
              </label>
              {!hasEveryLanguage ? (
                <p className="text-sm font-semibold text-destructive">
                  {t("admin.marketing.editorial_approval_languages_required")}
                </p>
              ) : null}
              {dirty ? (
                <p className="text-sm font-semibold text-destructive">
                  {t("admin.marketing.editorial_approval_save_first")}
                </p>
              ) : null}
              <Button
                type="button"
                onClick={() => void requestApproval()}
                disabled={requestingApproval || !canRequestApproval}
              >
                {requestingApproval ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                {t("admin.marketing.editorial_request_approval")}
              </Button>
            </section>
          ) : null}

          {lifecycleState === "WAITING_APPROVAL" ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4" data-testid="editorial-awaiting-approval">
              <h3 className="flex items-center gap-2 font-black"><ShieldCheck className="h-4 w-4" />{t("admin.marketing.editorial_waiting_approval")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("admin.marketing.editorial_waiting_approval_description")}</p>
            </section>
          ) : null}

          <section className="border-t border-border/50 pt-4">
            <h3 className="flex items-center gap-2 font-bold"><FileClock className="h-4 w-4" />{t("admin.marketing.editorial_history")}</h3>
            {historyLoading ? <p className="mt-3 text-sm text-muted-foreground">{t("common.loading")}</p> : null}
            {historyError ? <p className="mt-3 text-sm text-destructive">{t("admin.marketing.editorial_history_failed")}</p> : null}
            {!historyLoading && !historyError && history.length ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {history.map((version) => (
                  <div key={version.id} className="min-w-0 rounded-xl bg-muted/40 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold">v{version.versionNumber}</span>
                      {version.current ? <Badge variant="outline">{t("admin.marketing.editorial_current")}</Badge> : null}
                    </div>
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      {formatDate(version.createdAt)} · {version.createdBy ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            {!historyLoading && !historyError && !history.length ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <FilePenLine className="h-4 w-4" />{t("admin.marketing.editorial_no_versions")}
              </p>
            ) : null}
          </section>

          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl lg:max-w-4xl">
              <DialogHeader className="text-start">
                <DialogTitle>{t("admin.marketing.editorial_preview_title")}</DialogTitle>
                <DialogDescription>
                  {t("admin.marketing.editorial_preview_description")}
                </DialogDescription>
              </DialogHeader>
              <article
                lang={language.toLowerCase()}
                dir={language === "AR" ? "rtl" : "ltr"}
                className="min-w-0 rounded-2xl border border-border/60 bg-card p-5 text-start shadow-sm sm:p-8"
                data-testid="editorial-preview"
              >
                <Badge variant="outline">{language}</Badge>
                <h1 className="mt-4 break-words text-2xl font-black leading-tight sm:text-3xl">
                  {form.title}
                </h1>
                {form.summary ? (
                  <p className="mt-4 whitespace-pre-wrap break-words text-base leading-7 text-muted-foreground">
                    {form.summary}
                  </p>
                ) : null}
                <div className="mt-6 whitespace-pre-wrap break-words text-base leading-8 text-foreground">
                  {form.body}
                </div>
              </article>
            </DialogContent>
          </Dialog>
        </section>
      ) : null}
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-0 space-y-1.5 text-sm font-semibold">
      <span className="block text-muted-foreground">{label}{required ? " *" : ""}</span>
      {children}
    </label>
  );
}
