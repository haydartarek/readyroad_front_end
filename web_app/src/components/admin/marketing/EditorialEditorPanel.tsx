"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Eye,
  FileClock,
  FilePenLine,
  Link2,
  Loader2,
  Network,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { apiClient, getApiErrorMessage, logApiError } from "@/lib/api";
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
import ArticleMarkdown, {
  DEFAULT_ARTICLE_TYPOGRAPHY,
} from "@/components/blog/ArticleMarkdown";
import EditorialMarkdownEditor from "@/components/admin/marketing/EditorialMarkdownEditor";
import { cn } from "@/lib/utils";
import EditorialArticleImagePanel from "@/components/admin/marketing/EditorialArticleImagePanel";
import EditorialAuthoringPanel from "@/components/admin/marketing/EditorialAuthoringPanel";
import type {
  EditorialApprovalRequest,
  EditorialInternalLinkInput,
  EditorialLanguage,
  EditorialTypography,
  EditorialPerformanceOverview,
  EditorialSaveRequest,
  EditorialSaveResult,
  EditorialTopic,
  EditorialVersion,
  EditorialWorkspace,
  MarketingStrategySnapshot,
} from "@/lib/marketing-admin";

type Translate = (
  key: string,
  variables?: Record<string, string | number>,
) => string;
type DateFormatter = (value: string | null) => string;

interface EditorialEditorPanelProps {
  workspace: EditorialWorkspace;
  strategy: MarketingStrategySnapshot;
  busy: string | null;
  t: Translate;
  formatDate: DateFormatter;
  onSave: (
    topicId: number,
    language: EditorialLanguage,
    request: EditorialSaveRequest,
  ) => Promise<EditorialSaveResult>;
  onRequestTranslations: (
    articleId: number,
    idempotencyKey: string,
  ) => Promise<void>;
  onRequestApproval: (
    articleId: number,
    request: EditorialApprovalRequest,
  ) => Promise<void>;
  onUploadImage: (articleId: number, formData: FormData) => Promise<void>;
  onRemoveImage: (articleId: number) => Promise<void>;
  onRefresh: () => Promise<void>;
}

interface FormState {
  title: string;
  slug: string;
  summary: string;
  body: string;
  metaTitle: string;
  metaDescription: string;
  internalLinks: EditorialInternalLinkInput[];
  typography: EditorialTypography;
  expectedCurrentVersion: number | null;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  summary: "",
  body: "",
  metaTitle: "",
  metaDescription: "",
  internalLinks: [],
  typography: DEFAULT_ARTICLE_TYPOGRAPHY,
  expectedCurrentVersion: null,
};

export default function EditorialEditorPanel({
  workspace,
  strategy,
  busy,
  t,
  formatDate,
  onSave,
  onRequestTranslations,
  onRequestApproval,
  onUploadImage,
  onRemoveImage,
  onRefresh,
}: EditorialEditorPanelProps) {
  const [search, setSearch] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(
    workspace.topics[0]?.topicId ?? null,
  );
  const [language, setLanguage] = useState<EditorialLanguage>(
    workspace.topics[0]?.canonicalLanguage ??
      workspace.topics[0]?.primaryLanguage ??
      workspace.topics[0]?.titleLanguage ??
      "AR",
  );
  const [history, setHistory] = useState<EditorialVersion[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [performance, setPerformance] =
    useState<EditorialPerformanceOverview | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState<string | null>(null);
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [approvalReason, setApprovalReason] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [baseline, setBaseline] = useState<FormState>(EMPTY_FORM);

  const selectedTopic = useMemo(
    () =>
      workspace.topics.find((topic) => topic.topicId === selectedTopicId) ??
      null,
    [selectedTopicId, workspace.topics],
  );
  const filteredTopics = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return workspace.topics;
    return workspace.topics.filter((topic) =>
      `${topic.topicKey} ${topic.title} ${topic.priority ?? ""}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [search, workspace.topics]);
  const currentSummary = selectedTopic?.currentVersions.find(
    (version) => version.language === language,
  );
  const currentVersionNumber = currentSummary?.versionNumber;
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const saving = busy === "editorial-save";
  const requestingTranslations = busy === "editorial-translation";
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
  const internalLinksComplete = form.internalLinks.every(
    (link) => link.targetPath.trim() && link.anchorText.trim(),
  );
  const hasEveryLanguage = workspace.languages.every((item) =>
    selectedTopic?.currentVersions.some((version) => version.language === item),
  );
  const canonicalVersion = selectedTopic?.currentVersions.find(
    (version) => version.language === selectedTopic.canonicalLanguage,
  );

  const canRequestTranslations = Boolean(
    selectedTopic?.articleId &&
      lifecycleState === "TRANSLATION_REQUIRED" &&
      canonicalVersion &&
      !dirty &&
      !historyLoading,
  );

  const canRequestApproval = Boolean(
    selectedTopic?.articleId &&
    lifecycleState === "IMAGE_REQUIRED" &&
    hasEveryLanguage &&
    !dirty &&
    approvalConfirmed &&
    approvalReason.trim(),
  );

  useEffect(() => {
    setApprovalConfirmed(false);
    setApprovalReason("");
  }, [selectedTopicId, lifecycleState]);

  useEffect(() => {
    let active = true;
    const loadVersion = async () => {
      setHistoryError(null);
      if (!selectedTopic?.articleId || !currentVersionNumber) {
        const initial = {
          ...EMPTY_FORM,
          internalLinks: [],
          title:
            selectedTopic?.titleLanguage === language
              ? selectedTopic.title
              : "",
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
        const current =
          versions.find((version) => version.current) ?? versions[0];
        const next = current
          ? {
              title: current.title,
              slug: current.slug ?? "",
              summary: current.summary ?? "",
              body: current.body,
              metaTitle: current.metaTitle ?? "",
              metaDescription: current.metaDescription ?? "",
              internalLinks: current.internalLinks.map(
                ({ targetPath, anchorText }) => ({
                  targetPath,
                  anchorText,
                }),
              ),
              typography: current.typography ?? DEFAULT_ARTICLE_TYPOGRAPHY,
              expectedCurrentVersion: current.versionNumber,
            }
          : EMPTY_FORM;
        setHistory(versions);
        setForm(next);
        setBaseline(next);
      } catch (error) {
        if (!active) return;
        logApiError("Failed to load editorial article versions", error);
        setHistoryError(
          getApiErrorMessage(error, ""),
        );
      } finally {
        if (active) setHistoryLoading(false);
      }
    };
    void loadVersion();
    return () => {
      active = false;
    };
  }, [
    currentVersionNumber,
    language,
    selectedTopic?.articleId,
    selectedTopic?.title,
    selectedTopic?.titleLanguage,
  ]);

  useEffect(() => {
    let active = true;
    const articleId = selectedTopic?.articleId;
    if (
      !articleId ||
      !["PUBLISHED", "UPDATE_RECOMMENDED"].includes(lifecycleState ?? "")
    ) {
      setPerformance(null);
      setPerformanceError(null);
      return () => {
        active = false;
      };
    }
    setPerformanceError(null);
    setPerformanceLoading(true);
    apiClient
      .get<EditorialPerformanceOverview>(
        `/admin/marketing/editorial/editor/articles/${articleId}/performance`,
      )
      .then((response) => {
        if (active) setPerformance(response.data);
      })
      .catch((error) => {
        if (active) {
          logApiError("Failed to load editorial article performance", error);
          setPerformance(null);
          setPerformanceError(
            getApiErrorMessage(error, ""),
          );
        }
      })
      .finally(() => {
        if (active) setPerformanceLoading(false);
      });
    return () => {
      active = false;
    };
  }, [lifecycleState, selectedTopic?.articleId]);

  const canLeave = () =>
    !dirty || window.confirm(t("admin.marketing.editorial_discard_changes"));

  const selectTopic = (topic: EditorialTopic) => {
    if (!canLeave()) return;
    setSelectedTopicId(topic.topicId);
    setLanguage(
      topic.canonicalLanguage ?? topic.primaryLanguage ?? topic.titleLanguage,
    );
  };

  const selectLanguage = (next: EditorialLanguage) => {
    if (next === language || !canLeave()) return;
    setLanguage(next);
  };

  const save = async () => {
    if (
      !selectedTopic ||
      !form.title.trim() ||
      !form.body.trim() ||
      !form.metaTitle.trim() ||
      !form.metaDescription.trim()
    )
      return;
    const result = await onSave(selectedTopic.topicId, language, {
      title: form.title.trim(),
      slug: form.slug.trim() || null,
      summary: form.summary.trim() || null,
      body: form.body,
      metaTitle: form.metaTitle.trim(),
      metaDescription: form.metaDescription.trim(),
      internalLinks: form.internalLinks.map((link) => ({
        targetPath: link.targetPath.trim(),
        anchorText: link.anchorText.trim(),
      })),
      typography: form.typography,
      expectedCurrentVersion: form.expectedCurrentVersion,
    });
    const next = {
      ...form,
      expectedCurrentVersion: result.version.versionNumber,
    };
    setForm(next);
    setBaseline(next);
  };

  const requestTranslations = async () => {
    if (
      !selectedTopic?.articleId ||
      !canonicalVersion ||
      !canRequestTranslations
    ) {
      return;
    }

    await onRequestTranslations(
      selectedTopic.articleId,
      `admin-translation-${selectedTopic.articleId}-${canonicalVersion.language}-v${canonicalVersion.versionNumber}`,
    );
  };

  const requestApproval = async () => {
    if (!selectedTopic?.articleId || !canRequestApproval) return;
    await onRequestApproval(selectedTopic.articleId, {
      passedQualityGates: workspace.qualityGates,
      reason: approvalReason.trim(),
    });
  };

  if (!workspace.topics.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {t("admin.marketing.empty")}
      </p>
    );
  }

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(16rem,0.34fr)_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <section
          className="mb-4 border-b border-border/50 pb-4"
          data-testid="editorial-content-graph"
        >
          <h2 className="flex items-center gap-2 text-sm font-black">
            <Network className="h-4 w-4 text-primary" aria-hidden="true" />
            {t("admin.marketing.editorial_content_graph")}
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-lg bg-muted/50 p-2">
              <strong className="block text-base text-foreground">
                {workspace.contentGraph.articleNodeCount}
              </strong>
              <span className="text-muted-foreground">
                {t("admin.marketing.editorial_graph_articles")}
              </span>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <strong className="block text-base text-foreground">
                {workspace.contentGraph.edgeCount}
              </strong>
              <span className="text-muted-foreground">
                {t("admin.marketing.editorial_graph_links")}
              </span>
            </div>
          </div>
          {workspace.contentGraph.orphanArticleCount ? (
            <div className="mt-3">
              <p className="text-xs font-bold text-amber-700">
                {t("admin.marketing.editorial_graph_orphans", {
                  count: workspace.contentGraph.orphanArticleCount,
                })}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {workspace.contentGraph.orphanArticles
                  .slice(0, 3)
                  .map((article) => (
                    <li
                      key={`${article.articleId}:${article.language}`}
                      className="break-words"
                    >
                      {article.language} · {article.title}
                    </li>
                  ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-xs font-semibold text-emerald-700">
              {t("admin.marketing.editorial_graph_connected")}
            </p>
          )}
        </section>
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
                <span className="min-w-0 break-words text-sm font-bold">
                  {topic.title}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  #{topic.order}
                </span>
              </span>
              <span className="mt-2 flex flex-wrap items-center gap-1.5">
                {topic.priority ? (
                  <Badge variant="outline">{topic.priority}</Badge>
                ) : null}
                <Badge variant="outline">
                  {topic.lifecycleState ?? topic.sourceType}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {topic.currentVersions.length}/4{" "}
                  {t("admin.marketing.editorial_languages")}
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
              <p className="text-xs font-semibold text-muted-foreground">
                {selectedTopic.topicKey}
              </p>
              <h2 className="mt-1 break-words text-lg font-black">
                {selectedTopic.title}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">
                  {selectedTopic.lifecycleState ??
                    t("admin.marketing.editorial_not_started")}
                </Badge>
                <Badge variant="outline">
                  {selectedTopic.strategyContextResolved
                    ? t("admin.marketing.editorial_strategy_ready")
                    : t("admin.marketing.editorial_strategy_missing")}
                </Badge>
              </div>
            </div>
            <div
              className="flex flex-wrap gap-1"
              role="tablist"
              aria-label={t("admin.marketing.editorial_language")}
            >
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

          <EditorialAuthoringPanel
            topic={selectedTopic}
            language={language}
            strategy={strategy}
            t={t}
            onChanged={onRefresh}
          />

          {["PUBLISHED", "UPDATE_RECOMMENDED"].includes(
            lifecycleState ?? "",
          ) ? (
            <section
              className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-4"
              data-testid="editorial-performance"
            >
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 font-bold">
                    <Activity
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    {t("admin.marketing.editorial_performance")}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {t("admin.marketing.editorial_performance_description")}
                  </p>
                </div>
                {performance?.latestRecommendation ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0",
                      performance.latestRecommendation.recommended
                        ? "border-amber-300 text-amber-700"
                        : "border-emerald-300 text-emerald-700",
                    )}
                  >
                    {performance.latestRecommendation.recommended
                      ? t("admin.marketing.editorial_performance_recommended")
                      : t("admin.marketing.editorial_performance_stable")}
                  </Badge>
                ) : null}
              </div>
              {performanceLoading ? (
                <div className="h-20 animate-pulse rounded-lg bg-muted/50" />
              ) : performanceError ? (
                <p className="break-words text-sm font-semibold text-destructive">
                  {performanceError || t("admin.marketing.action_failed")}
                </p>
              ) : performance?.latestSnapshots.length ? (
                <div className="grid min-w-0 gap-2 md:grid-cols-2">
                  {performance.latestSnapshots.map((snapshot) => (
                    <article
                      key={snapshot.id}
                      className="min-w-0 rounded-lg border border-border/50 p-3"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0">
                          <strong className="text-sm">
                            {snapshot.language}
                          </strong>
                          <p
                            dir="ltr"
                            className="mt-0.5 break-all text-start text-[11px] text-muted-foreground"
                          >
                            {snapshot.publishedPath}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {snapshot.evidenceState === "PRESENT"
                            ? snapshot.indexingState
                            : t(
                                "admin.marketing.editorial_performance_no_data",
                              )}
                        </Badge>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
                        <PerformanceMetric
                          label={t(
                            "admin.marketing.editorial_performance_clicks",
                          )}
                          value={formatMetric(snapshot.current.clicks)}
                        />
                        <PerformanceMetric
                          label={t(
                            "admin.marketing.editorial_performance_impressions",
                          )}
                          value={formatMetric(snapshot.current.impressions)}
                        />
                        <PerformanceMetric
                          label={t("admin.marketing.editorial_performance_ctr")}
                          value={`${formatMetric(snapshot.current.ctr * 100)}%`}
                        />
                        <PerformanceMetric
                          label={t(
                            "admin.marketing.editorial_performance_position",
                          )}
                          value={formatMetric(snapshot.current.averagePosition)}
                        />
                      </dl>
                      <p className="mt-2 text-center text-[11px] text-muted-foreground">
                        {t("admin.marketing.editorial_performance_period", {
                          start: snapshot.periodStart,
                          end: snapshot.periodEnd,
                        })}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("admin.marketing.editorial_performance_empty")}
                </p>
              )}
            </section>
          ) : null}

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <Field label={t("admin.marketing.editorial_title")} required>
              <Input
                value={form.title}
                disabled={editorLocked}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                maxLength={500}
              />
            </Field>
            <Field label={t("admin.marketing.editorial_slug")}>
              <Input
                dir="ltr"
                value={form.slug}
                disabled={editorLocked}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    slug: event.target.value,
                  }))
                }
                maxLength={255}
              />
            </Field>
          </div>
          <Field label={t("admin.marketing.editorial_summary")}>
            <textarea
              value={form.summary}
              disabled={editorLocked}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  summary: event.target.value,
                }))
              }
              maxLength={2000}
              rows={3}
              className="w-full resize-y rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />
          </Field>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <Field label={t("admin.marketing.editorial_meta_title")} required>
              <Input
                value={form.metaTitle}
                disabled={editorLocked}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    metaTitle: event.target.value,
                  }))
                }
                maxLength={500}
              />
            </Field>
            <Field
              label={t("admin.marketing.editorial_meta_description")}
              required
            >
              <textarea
                value={form.metaDescription}
                disabled={editorLocked}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    metaDescription: event.target.value,
                  }))
                }
                maxLength={2000}
                rows={3}
                className="w-full resize-y rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
            </Field>
          </div>
          <section className="min-w-0 space-y-1.5">
            <p className="block text-sm font-semibold text-muted-foreground">
              {t("admin.marketing.editorial_body")} *
            </p>
            <EditorialMarkdownEditor
              value={form.body}
              disabled={editorLocked}
              dir={language === "AR" ? "rtl" : "ltr"}
              maxLength={500000}
              t={t}
              onChange={(body) => setForm((current) => ({ ...current, body }))}
              typography={form.typography}
              onTypographyChange={(typography) =>
                setForm((current) => ({ ...current, typography }))
              }
            />
          </section>

          <section
            className="space-y-3 border-t border-border/50 pt-5"
            data-testid="editorial-internal-links"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 font-bold">
                  <Link2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t("admin.marketing.editorial_internal_links")}
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t("admin.marketing.editorial_internal_links_description")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    internalLinks: [
                      ...current.internalLinks,
                      { targetPath: "", anchorText: "" },
                    ],
                  }))
                }
                disabled={editorLocked}
                className="w-full shrink-0 sm:w-auto"
              >
                <Plus />
                {t("admin.marketing.editorial_internal_link_add")}
              </Button>
            </div>

            {form.internalLinks.length ? (
              <div className="space-y-3">
                {form.internalLinks.map((link, index) => (
                  <div
                    key={index}
                    className="grid min-w-0 gap-3 rounded-xl border border-border/60 bg-background/60 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
                  >
                    <Field
                      label={t(
                        "admin.marketing.editorial_internal_link_target",
                      )}
                      required
                    >
                      <Input
                        dir="ltr"
                        value={link.targetPath}
                        disabled={editorLocked}
                        maxLength={500}
                        placeholder={
                          language === "EN"
                            ? "/lessons/les-19/2"
                            : `/${language.toLowerCase()}/lessons/les-19/2`
                        }
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            internalLinks: current.internalLinks.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, targetPath: event.target.value }
                                  : item,
                            ),
                          }))
                        }
                      />
                    </Field>
                    <Field
                      label={t(
                        "admin.marketing.editorial_internal_link_anchor",
                      )}
                      required
                    >
                      <Input
                        value={link.anchorText}
                        disabled={editorLocked}
                        maxLength={500}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            internalLinks: current.internalLinks.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, anchorText: event.target.value }
                                  : item,
                            ),
                          }))
                        }
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          internalLinks: current.internalLinks.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        }))
                      }
                      disabled={editorLocked}
                      className="h-10 w-full shrink-0 p-0 text-destructive hover:text-destructive sm:w-10"
                      aria-label={t(
                        "admin.marketing.editorial_internal_link_remove",
                      )}
                      title={t(
                        "admin.marketing.editorial_internal_link_remove",
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("admin.marketing.editorial_internal_links_empty")}
              </p>
            )}
          </section>

          <div className="flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {currentSummary
                ? t("admin.marketing.editorial_current_version", {
                    version: currentSummary.versionNumber,
                  })
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
                disabled={
                  editorLocked ||
                  saving ||
                  !form.title.trim() ||
                  !form.body.trim() ||
                  !form.metaTitle.trim() ||
                  !form.metaDescription.trim() ||
                  !internalLinksComplete
                }
                className="w-full sm:w-auto"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                {t("admin.marketing.editorial_save")}
              </Button>
            </div>
          </div>

          {lifecycleState === "TRANSLATION_REQUIRED" ? (
            <section
              className="min-w-0 space-y-4 rounded-2xl border border-sky-200 bg-sky-50/40 p-4 dark:bg-sky-950/10 sm:p-5"
              data-testid="editorial-translation-request"
            >
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 font-black">
                  <FilePenLine
                    className="h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {t("admin.marketing.editorial_translation_title")}
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t("admin.marketing.editorial_translation_description")}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {workspace.languages.map((item) => {
                  const available = selectedTopic.currentVersions.some(
                    (version) => version.language === item,
                  );

                  return (
                    <Badge
                      key={item}
                      variant="outline"
                      title={t(
                        available
                          ? "admin.marketing.editorial_translation_available"
                          : "admin.marketing.editorial_translation_missing",
                      )}
                      className={cn(
                        "bg-background/80",
                        available
                          ? "border-emerald-300 text-emerald-700"
                          : "border-amber-300 text-amber-700",
                      )}
                    >
                      {item}:{" "}
                      {t(
                        available
                          ? "admin.marketing.editorial_translation_available"
                          : "admin.marketing.editorial_translation_missing",
                      )}
                    </Badge>
                  );
                })}
              </div>

              {dirty ? (
                <p className="text-sm font-semibold text-destructive">
                  {t("admin.marketing.editorial_translation_save_first")}
                </p>
              ) : null}

              {!canonicalVersion ? (
                <p className="text-sm font-semibold text-destructive">
                  {t("admin.marketing.editorial_translation_source_required")}
                </p>
              ) : null}

              <Button
                type="button"
                onClick={() => void requestTranslations()}
                disabled={Boolean(busy) || !canRequestTranslations}
              >
                {requestingTranslations ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <FilePenLine />
                )}
                {t("admin.marketing.editorial_translation_action")}
              </Button>
            </section>
          ) : null}

          {selectedTopic.articleId ? (
            <EditorialArticleImagePanel
              key={selectedTopic.articleId}
              articleId={selectedTopic.articleId}
              suggestedFileName={`${form.slug || selectedTopic.topicKey}-${language.toLowerCase()}-hero`}
              image={selectedTopic.image ?? null}
              busy={busy === "editorial-image"}
              t={t}
              onUpload={onUploadImage}
              onRemove={onRemoveImage}
            />
          ) : null}

          {lifecycleState === "IMAGE_REQUIRED" ? (
            <section
              className="min-w-0 space-y-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 dark:bg-amber-950/10 sm:p-5"
              data-testid="editorial-approval-request"
            >
              <div>
                <h3 className="flex items-center gap-2 font-black">
                  <ShieldCheck className="h-4 w-4" />
                  {t("admin.marketing.editorial_approval_title")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("admin.marketing.editorial_approval_description")}
                </p>
              </div>
              <div
                className="flex flex-wrap gap-1.5"
                aria-label={t("admin.marketing.editorial_quality_gates")}
              >
                {workspace.qualityGates.map((gate) => (
                  <Badge
                    key={gate}
                    variant="outline"
                    className="bg-background/80"
                  >
                    {gate.replaceAll("_", " ")}
                  </Badge>
                ))}
              </div>
              <label className="flex items-start gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={approvalConfirmed}
                  disabled={Boolean(busy)}
                  onChange={(event) =>
                    setApprovalConfirmed(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />
                <span>{t("admin.marketing.editorial_approval_confirm")}</span>
              </label>
              <label className="block space-y-1.5 text-sm font-semibold">
                <span>{t("admin.marketing.editorial_approval_reason")}</span>
                <textarea
                  value={approvalReason}
                  disabled={Boolean(busy)}
                  required
                  aria-required="true"
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
                {requestingApproval ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <ShieldCheck />
                )}
                {t("admin.marketing.editorial_request_approval")}
              </Button>
            </section>
          ) : null}

          {lifecycleState === "WAITING_APPROVAL" ? (
            <section
              className="min-w-0 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 dark:bg-amber-950/10 sm:p-5"
              data-testid="editorial-awaiting-approval"
            >
              <h3 className="flex items-center gap-2 font-black">
                <ShieldCheck className="h-4 w-4" />
                {t("admin.marketing.editorial_waiting_approval")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("admin.marketing.editorial_waiting_approval_description")}
              </p>
            </section>
          ) : null}

          <section className="min-w-0 border-t border-border/50 pt-4" aria-busy={historyLoading}>
            <h3 className="flex items-center gap-2 font-bold">
              <FileClock className="h-4 w-4" />
              {t("admin.marketing.editorial_history")}
            </h3>
            {historyLoading ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {t("common.loading")}
              </p>
            ) : null}
            {historyError ? (
              <p className="mt-3 break-words text-sm text-destructive">
                {historyError || t("admin.marketing.editorial_history_failed")}
              </p>
            ) : null}
            {!historyLoading && !historyError && history.length ? (
              <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
                {history.map((version) => (
                  <div
                    key={version.id}
                    className="min-w-0 rounded-xl bg-muted/40 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold">
                        v{version.versionNumber}
                      </span>
                      {version.current ? (
                        <Badge variant="outline">
                          {t("admin.marketing.editorial_current")}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      {formatDate(version.createdAt)} ·{" "}
                      {version.createdBy ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            {!historyLoading && !historyError && !history.length ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <FilePenLine className="h-4 w-4" />
                {t("admin.marketing.editorial_no_versions")}
              </p>
            ) : null}
          </section>

          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-3xl lg:max-w-4xl">
              <DialogHeader className="text-start">
                <DialogTitle>
                  {t("admin.marketing.editorial_preview_title")}
                </DialogTitle>
                <DialogDescription>
                  {t("admin.marketing.editorial_preview_description")}
                </DialogDescription>
              </DialogHeader>
              <article
                lang={language.toLowerCase()}
                dir={language === "AR" ? "rtl" : "ltr"}
                className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card p-4 text-start shadow-sm sm:p-8"
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
                <ArticleMarkdown
                  body={form.body}
                  typography={form.typography}
                  className="mt-6 text-base leading-8 text-foreground"
                />
                {form.internalLinks.length ? (
                  <section className="mt-8 border-t border-border/60 pt-5">
                    <h2 className="flex items-center gap-2 text-base font-black">
                      <Link2 className="h-4 w-4" aria-hidden="true" />
                      {t("admin.marketing.editorial_internal_links")}
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {form.internalLinks.map((link, index) => (
                        <li
                          key={`${index}:${link.targetPath}`}
                          className="break-words text-sm font-semibold text-primary"
                        >
                          {link.anchorText || link.targetPath}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </article>
            </DialogContent>
          </Dialog>
        </section>
      ) : null}
    </div>
  );
}

function PerformanceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-muted/45 p-2">
      <dt className="break-words text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-bold text-foreground">{value}</dd>
    </div>
  );
}

function formatMetric(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
    value,
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
      <span className="block text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
