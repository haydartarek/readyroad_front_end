"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock3,
  Eye,
  FileClock,
  FilePenLine,
  Link2,
  Loader2,
  Network,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import EditorialArticleImagePanel from "@/components/admin/marketing/EditorialArticleImagePanel";
import EditorialConfirmDialog from "@/components/admin/marketing/EditorialConfirmDialog";
import EditorialAuthoringPanel from "@/components/admin/marketing/EditorialAuthoringPanel";
import EditorialMarkdownEditor from "@/components/admin/marketing/EditorialMarkdownEditor";
import ArticleMarkdown, {
  DEFAULT_ARTICLE_TYPOGRAPHY,
} from "@/components/blog/ArticleMarkdown";
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
import { useLanguage } from "@/contexts/language-context";
import { apiClient, getApiErrorMessage, logApiError } from "@/lib/api";
import { editorialCmsCopy } from "@/lib/editorial-cms-copy";
import {
  editorialArticleLabel,
  editorialLifecycleLabel,
  editorialQualityGateLabel,
  editorialTaskStatusLabel,
  editorialTopicSourceLabel,
  editorialWorkflowCopy,
} from "@/lib/editorial-ui-labels";
import type {
  EditorialApprovalRequest,
  EditorialInternalLinkInput,
  EditorialLanguage,
  EditorialPerformanceOverview,
  EditorialSaveRequest,
  EditorialSaveResult,
  EditorialTopic,
  EditorialTypography,
  EditorialVersion,
  EditorialWorkspace,
  MarketingStrategySnapshot,
} from "@/lib/marketing-admin";
import { cn } from "@/lib/utils";

type Translate = (
  key: string,
  variables?: Record<string, string | number>,
) => string;
type DateFormatter = (value: string | null) => string;

const EDITORIAL_WORKFLOW_ADVANCE_SUPPORTED = true;
const EDITORIAL_VERSION_DELETE_SUPPORTED = true;

interface VersionDeleteCopy {
  action: string;
  confirm: (versionNumber: number) => string;
  deleted: string;
  failed: string;
  saveFirst: string;
  historyNote: string;
}

interface EditorialConfirmState {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

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
  onPublishArticle: (taskId: number, reason: string) => Promise<void>;
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

function formFromVersion(
  version: EditorialVersion,
  expectedCurrentVersion: number,
): FormState {
  return {
    title: version.title,
    slug: version.slug ?? "",
    summary: version.summary ?? "",
    body: version.body,
    metaTitle: version.metaTitle ?? "",
    metaDescription: version.metaDescription ?? "",
    internalLinks: version.internalLinks.map(({ targetPath, anchorText }) => ({
      targetPath,
      anchorText,
    })),
    typography: version.typography ?? DEFAULT_ARTICLE_TYPOGRAPHY,
    expectedCurrentVersion,
  };
}

function slugFromFocusKeyword(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 255)
    .replace(/-+$/g, "");
}


export default function EditorialEditorPanel({
  workspace,
  strategy,
  busy,
  t,
  formatDate,
  onSave,
  onRequestTranslations,
  onRequestApproval,
  onPublishArticle,
  onUploadImage,
  onRemoveImage,
  onRefresh,
}: EditorialEditorPanelProps) {
  const { language: uiLanguage } = useLanguage();
  const copy = editorialCmsCopy(uiLanguage);
  const workflowCopy = editorialWorkflowCopy(uiLanguage);
  const versionDeleteCopy: VersionDeleteCopy = {
    action: t("admin.marketing.editorial_version_delete"),
    confirm: (versionNumber: number) =>
      t("admin.marketing.editorial_version_delete_confirm", {
        version: versionNumber,
      }),
    deleted: t("admin.marketing.editorial_version_deleted"),
    failed: t("admin.marketing.editorial_version_delete_failed"),
    saveFirst: t("admin.marketing.editorial_version_delete_save_first"),
    historyNote: t("admin.marketing.editorial_version_history_note"),
  };

  const [confirmState, setConfirmState] =
    useState<EditorialConfirmState | null>(null);

  const confirmDirection =
    uiLanguage.toLowerCase() === "ar" ? "rtl" : "ltr";

  const acceptConfirmation = () => {
    const action = confirmState?.onConfirm;
    setConfirmState(null);
    action?.();
  };
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
  const [historyPreview, setHistoryPreview] = useState<EditorialVersion | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [performance, setPerformance] = useState<EditorialPerformanceOverview | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState<string | null>(null);
  const [updateStarting, setUpdateStarting] = useState(false);
  const [workflowAdvancing, setWorkflowAdvancing] = useState(false);
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [approvalReason, setApprovalReason] = useState("");
  const [publishReason, setPublishReason] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [baseline, setBaseline] = useState<FormState>(EMPTY_FORM);

  const selectedTopic = useMemo(
    () =>
      workspace.topics.find((topic) => topic.topicId === selectedTopicId) ?? null,
    [selectedTopicId, workspace.topics],
  );

  useEffect(() => {
    if (workspace.topics.length === 0) {
      setSelectedTopicId(null);
      return;
    }

    if (workspace.topics.some((topic) => topic.topicId === selectedTopicId)) {
      return;
    }

    const firstTopic = workspace.topics[0];
    setSelectedTopicId(firstTopic.topicId);
    setLanguage(
      firstTopic.canonicalLanguage ??
        firstTopic.primaryLanguage ??
        firstTopic.titleLanguage,
    );
  }, [selectedTopicId, workspace.topics]);
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
  const publishing = busy === "editorial-publish";
  const lifecycleState = selectedTopic?.lifecycleState;
  const editorLanguages: EditorialLanguage[] = ["AR", "NL", "FR", "EN"];
  const focusKeywords = useMemo<Record<EditorialLanguage, string>>(
    () => ({
      AR: selectedTopic?.currentVersions.find((version) => version.language === "AR")?.focusKeyword ?? "",
      NL: selectedTopic?.currentVersions.find((version) => version.language === "NL")?.focusKeyword ?? "",
      FR: selectedTopic?.currentVersions.find((version) => version.language === "FR")?.focusKeyword ?? "",
      EN: selectedTopic?.currentVersions.find((version) => version.language === "EN")?.focusKeyword ?? "",
    }),
    [selectedTopic?.currentVersions],
  );
  const dynamicSlugSource = focusKeywords[language]?.trim()
    || currentSummary?.title?.trim()
    || selectedTopic?.title?.trim()
    || "";
  const dynamicSlug = slugFromFocusKeyword(dynamicSlugSource);

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
  const hasEveryLanguage = editorLanguages.every((item) =>
    selectedTopic?.currentVersions.some((version) => version.language === item),
  );
  const canonicalVersion = selectedTopic?.currentVersions.find(
    (version) => version.language === selectedTopic.canonicalLanguage,
  );
  const translationsRequiringAdaptation = editorLanguages.filter((item) =>
    item !== selectedTopic?.canonicalLanguage
      && !selectedTopic?.currentVersions.some(
        (version) => version.language === item && Boolean(version.focusKeyword?.trim()),
      ),
  );
  const canRequestTranslations = Boolean(
    selectedTopic?.articleId &&
      ["TRANSLATION_REQUIRED", "IMAGE_REQUIRED"].includes(lifecycleState ?? "") &&
      canonicalVersion &&
      translationsRequiringAdaptation.length > 0 &&
      !dirty &&
      !historyLoading,
  );
  const canAdvanceWorkflow = Boolean(
    EDITORIAL_WORKFLOW_ADVANCE_SUPPORTED &&
      selectedTopic?.articleId &&
      ["DRAFT_READY", "FACT_CHECK_REQUIRED", "LEGAL_REVIEW_REQUIRED"].includes(
        lifecycleState ?? "",
      ) &&
      !dirty &&
      !historyLoading &&
      !workflowAdvancing,
  );

  const workflowActionLabel =
    lifecycleState === "DRAFT_READY"
      ? workflowCopy.startFactCheck
      : lifecycleState === "FACT_CHECK_REQUIRED"
        ? workflowCopy.confirmFactCheck
        : lifecycleState === "LEGAL_REVIEW_REQUIRED"
          ? workflowCopy.confirmLegalReview
          : workflowCopy.advance;

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
    setPublishReason("");
  }, [selectedTopicId, lifecycleState]);

  useEffect(() => {
    let active = true;

    const loadVersion = async () => {
      setHistoryError(null);
      setHistoryPreview(null);
      if (!selectedTopic?.articleId || !currentVersionNumber) {
        const initial = {
          ...EMPTY_FORM,
          internalLinks: [],
          title:
            selectedTopic?.titleLanguage === language ? selectedTopic.title : "",
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
          ? formFromVersion(current, current.versionNumber)
          : EMPTY_FORM;
        setHistory(versions);
        setForm(next);
        setBaseline(next);
      } catch (error) {
        if (!active) return;
        logApiError("Failed to load editorial article versions", error);
        setHistoryError(getApiErrorMessage(error, ""));
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
    if (!articleId || !["PUBLISHED", "UPDATE_RECOMMENDED"].includes(lifecycleState ?? "")) {
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
          setPerformanceError(getApiErrorMessage(error, ""));
        }
      })
      .finally(() => {
        if (active) setPerformanceLoading(false);
      });

    return () => {
      active = false;
    };
  }, [lifecycleState, selectedTopic?.articleId]);

  const requestLeave = (action: () => void) => {
    if (!dirty) {
      action();
      return;
    }

    setConfirmState({
      title: t("admin.marketing.editorial_discard_title"),
      description: t("admin.marketing.editorial_discard_changes"),
      confirmLabel: t("admin.marketing.editorial_discard_confirm"),
      destructive: true,
      onConfirm: action,
    });
  };

  const selectTopic = (topic: EditorialTopic) => {
    requestLeave(() => {
      setSelectedTopicId(topic.topicId);
      setLanguage(
        topic.canonicalLanguage ??
          topic.primaryLanguage ??
          topic.titleLanguage,
      );
    });
  };

  const selectLanguage = (next: EditorialLanguage) => {
    if (next === language) return;

    requestLeave(() => {
      setLanguage(next);
    });
  };

  const save = async () => {
    if (
      !selectedTopic ||
      !form.title.trim() ||
      !form.body.trim() ||
      !form.metaTitle.trim() ||
      !form.metaDescription.trim()
    ) {
      return;
    }

    const result = await onSave(selectedTopic.topicId, language, {
      title: form.title.trim(),
      slug: dynamicSlug || form.slug.trim() || null,
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

  const versionDeleteProtectedStates = [
    "WAITING_APPROVAL",
    "APPROVED",
    "SCHEDULED",
    "PUBLISHED",
  ];

  const canDeleteVersion = (version: EditorialVersion) =>
    EDITORIAL_VERSION_DELETE_SUPPORTED &&
    history.length > 1 &&
    !dirty &&
    !historyLoading &&
    version.status !== "PUBLISHED" &&
    !(
      version.current &&
      versionDeleteProtectedStates.includes(lifecycleState ?? "")
    );

  const performDeleteVersion = async (version: EditorialVersion) => {
    const articleId = selectedTopic?.articleId;

    if (!articleId || historyLoading) return;

    if (dirty) {
      toast.error(versionDeleteCopy.saveFirst);
      return;
    }


    setHistoryLoading(true);
    setHistoryError(null);

    try {
      await apiClient.delete(
        `/admin/marketing/editorial/editor/articles/${articleId}/versions/${version.id}`,
      );

      const response = await apiClient.get<EditorialVersion[]>(
        `/admin/marketing/editorial/editor/articles/${articleId}/versions`,
        { language },
      );

      const versions = response.data;
      const current =
        versions.find((item) => item.current) ?? versions[0] ?? null;

      const next = current
        ? formFromVersion(current, current.versionNumber)
        : EMPTY_FORM;

      setHistory(versions);
      setForm(next);
      setBaseline(next);

      if (historyPreview?.id === version.id) {
        setHistoryPreview(null);
      }

      toast.success(versionDeleteCopy.deleted);

      await onRefresh();
    } catch (error) {
      logApiError("Failed to permanently delete editorial article version", error);

      const message = getApiErrorMessage(
        error,
        versionDeleteCopy.failed,
      );

      setHistoryError(message);
      toast.error(message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const deleteVersion = (version: EditorialVersion) => {
    if (dirty) {
      toast.error(versionDeleteCopy.saveFirst);
      return;
    }

    setConfirmState({
      title: t("admin.marketing.editorial_version_delete_title"),
      description: versionDeleteCopy.confirm(version.versionNumber),
      confirmLabel: versionDeleteCopy.action,
      destructive: true,
      onConfirm: () => void performDeleteVersion(version),
    });
  };

  const restoreVersion = (version: EditorialVersion) => {
    if (version.current || !form.expectedCurrentVersion) return;

    setConfirmState({
      title: t("admin.marketing.editorial_version_restore_title"),
      description: copy.versionRestoreConfirm,
      confirmLabel: copy.versionRestore,
      onConfirm: () => {
        setForm(
          formFromVersion(
            version,
            form.expectedCurrentVersion as number,
          ),
        );
        toast.success(copy.versionLoaded);
      },
    });
  };

  const startUpdate = async () => {
    const articleId = selectedTopic?.articleId;
    if (!articleId || lifecycleState !== "PUBLISHED" || updateStarting) return;
    setUpdateStarting(true);
    try {
      await apiClient.post(
        `/admin/marketing/editorial/editor/articles/${articleId}/update-session`,
      );
      toast.success(copy.updateStarted);
      await onRefresh();
    } catch (error) {
      logApiError("Failed to start editorial article update", error);
      toast.error(getApiErrorMessage(error, t("admin.marketing.action_failed")));
    } finally {
      setUpdateStarting(false);
    }
  };

  const performAdvanceWorkflow = async () => {
    const articleId = selectedTopic?.articleId;

    if (!articleId || !canAdvanceWorkflow) return;


    setWorkflowAdvancing(true);

    try {
      await apiClient.post(
        `/admin/marketing/editorial/editor/articles/${articleId}/workflow/advance`,
      );

      toast.success(workflowCopy.advanced);
      await onRefresh();
    } catch (error) {
      logApiError("Failed to advance editorial workflow", error);
      toast.error(
        getApiErrorMessage(
          error,
          t("admin.marketing.action_failed"),
        ),
      );
    } finally {
      setWorkflowAdvancing(false);
    }
  };
  const advanceWorkflow = () => {
    if (!selectedTopic?.articleId || !canAdvanceWorkflow) return;

    const description =
      lifecycleState === "DRAFT_READY"
        ? workflowCopy.startFactCheckConfirm
        : lifecycleState === "FACT_CHECK_REQUIRED"
          ? workflowCopy.factCheckConfirm
          : workflowCopy.legalReviewConfirm;

    setConfirmState({
      title: t("admin.marketing.editorial_workflow_confirm_title"),
      description,
      confirmLabel: workflowActionLabel,
      onConfirm: () => void performAdvanceWorkflow(),
    });
  };
  const requestTranslations = async () => {
    if (!selectedTopic?.articleId || !canonicalVersion || !canRequestTranslations) return;
    await onRequestTranslations(
      selectedTopic.articleId,
      `admin-translation-${selectedTopic.articleId}-${canonicalVersion.language}-v${canonicalVersion.versionNumber}-${translationsRequiringAdaptation.join("-")}-seo-v2`,
    );
  };

  const requestApproval = async () => {
    if (!selectedTopic?.articleId || !canRequestApproval) return;
    await onRequestApproval(selectedTopic.articleId, {
      passedQualityGates: workspace.qualityGates,
      reason: approvalReason.trim(),
    });
  };

  const publishArticle = () => {
    const taskId = selectedTopic?.pendingApprovalTaskId;
    const reason = publishReason.trim();
    if (!taskId || !reason || publishing) return;
    setConfirmState({
      title: t("admin.marketing.editorial_publish_title"),
      description: t("admin.marketing.editorial_publish_confirm"),
      confirmLabel: t("admin.marketing.editorial_publish_action"),
      onConfirm: () => void onPublishArticle(taskId, reason),
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
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(17rem,0.32fr)_minmax(0,1fr)]">
      <aside className="min-w-0 self-start rounded-3xl border border-border/50 bg-card/80 p-4 shadow-sm xl:sticky xl:top-4">
        <section className="mb-4 border-b border-border/50 pb-4" data-testid="editorial-content-graph">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Network className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-black">{t("admin.marketing.editorial_content_graph")}</h2>
              <p className="text-xs text-muted-foreground">
                {workspace.contentGraph.articleNodeCount} {t("admin.marketing.editorial_graph_articles")} · {workspace.contentGraph.edgeCount} {t("admin.marketing.editorial_graph_links")}
              </p>
            </div>
          </div>
        </section>

        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("admin.marketing.editorial_search")}
            className="h-11 rounded-xl ps-9"
          />
        </div>

        <div className="mt-3 max-h-[70vh] space-y-2 overflow-y-auto pe-1">
          {filteredTopics.map((topic) => (
            <button
              key={topic.topicId}
              type="button"
              onClick={() => selectTopic(topic)}
              className={cn(
                "w-full min-w-0 rounded-2xl border p-3 text-start transition",
                selectedTopicId === topic.topicId
                  ? "border-primary/30 bg-primary/[0.07] shadow-sm"
                  : "border-border/50 bg-background hover:border-primary/20 hover:bg-muted/35",
              )}
            >
              <span className="flex min-w-0 items-start justify-between gap-2">
                <span className="min-w-0 break-words text-sm font-bold">{topic.title}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{editorialArticleLabel(topic.order, uiLanguage)}</span>
              </span>
              <span className="mt-2 flex flex-wrap items-center gap-1.5">
                {topic.priority ? <Badge variant="outline">{topic.priority}</Badge> : null}
                <Badge variant="outline">
                  {topic.lifecycleState
                    ? editorialLifecycleLabel(topic.lifecycleState, uiLanguage)
                    : editorialTopicSourceLabel(topic.sourceType, uiLanguage)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {topic.currentVersions.length}/4 {t("admin.marketing.editorial_languages")}
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {selectedTopic ? (
        <main className="min-w-0 space-y-5">
          <section className="min-w-0 overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm">
            {selectedTopic.articleId ? (
              <div
                className="border-b border-border/50 bg-sky-50/30 p-4 dark:bg-sky-950/10 sm:p-6"
                data-testid="editorial-translation-top"
              >
                <TranslationPanel
                  languages={editorLanguages}
                  topic={selectedTopic}
                  dirty={dirty}
                  canonicalVersionAvailable={Boolean(canonicalVersion)}
                  busy={requestingTranslations}
                  canRequest={canRequestTranslations}
                  t={t}
                  onRequest={() => void requestTranslations()}
                />
              </div>
            ) : null}

            <header className="border-b border-border/50 bg-gradient-to-b from-primary/[0.055] to-transparent p-4 sm:p-6">
              <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    {editorialArticleLabel(selectedTopic.order, uiLanguage)}
                  </p>
                  <h2 className="mt-1 break-words text-xl font-black text-foreground sm:text-2xl">
                    {selectedTopic.title}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline">{selectedTopic.lifecycleState ? editorialLifecycleLabel(selectedTopic.lifecycleState, uiLanguage) : t("admin.marketing.editorial_not_started")}</Badge>
                    <Badge variant="outline">
                      {selectedTopic.strategyContextResolved
                        ? t("admin.marketing.editorial_strategy_ready")
                        : t("admin.marketing.editorial_strategy_missing")}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 rounded-xl border border-border/50 bg-background/80 p-1" role="tablist" aria-label={t("admin.marketing.editorial_language")}>
                  {editorLanguages.map((item) => (
                    <button
                      key={item}
                      type="button"
                      role="tab"
                      aria-selected={language === item}
                      onClick={() => selectLanguage(item)}
                      className={cn(
                        "h-10 min-w-12 rounded-lg px-3 text-xs font-black transition",
                        language === item
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </header>

            <div className="min-w-0 space-y-6 p-4 sm:p-6">
              <EditorialAuthoringPanel
                topic={selectedTopic}
                language={language}
                strategy={strategy}
                t={t}
                onChanged={onRefresh}
              />

              {EDITORIAL_WORKFLOW_ADVANCE_SUPPORTED &&
              ["DRAFT_READY", "FACT_CHECK_REQUIRED", "LEGAL_REVIEW_REQUIRED"].includes(
                lifecycleState ?? "",
              ) ? (
                <section
                  className="rounded-2xl border border-primary/20 bg-primary/[0.035] p-4 sm:p-5"
                  data-testid="editorial-workflow-advance"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-black text-foreground">
                        {workflowCopy.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {workflowCopy.currentStage}: {editorialLifecycleLabel(lifecycleState, uiLanguage)}
                      </p>
                    </div>

                    <Button
                      type="button"
                      className="shrink-0 gap-2"
                      onClick={() => void advanceWorkflow()}
                      disabled={!canAdvanceWorkflow}
                    >
                      {workflowAdvancing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      {workflowActionLabel}
                    </Button>
                  </div>
                </section>
              ) : null}
              {lifecycleState === "PUBLISHED" ? (
                <section className="rounded-2xl border border-primary/20 bg-primary/[0.035] p-4 sm:p-5" data-testid="editorial-start-update">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="flex items-center gap-2 font-black text-foreground">
                        <RefreshCw className="h-4 w-4 text-primary" aria-hidden="true" />
                        {copy.startUpdate}
                      </h3>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                        {copy.startUpdateDescription}
                      </p>
                    </div>
                    <Button type="button" className="shrink-0 gap-2" onClick={() => void startUpdate()} disabled={updateStarting}>
                      {updateStarting ? <Loader2 className="animate-spin" /> : <FilePenLine />}
                      {copy.startUpdate}
                    </Button>
                  </div>
                </section>
              ) : null}

              {["PUBLISHED", "UPDATE_RECOMMENDED"].includes(lifecycleState ?? "") ? (
                <PerformancePanel
                  performance={performance}
                  loading={performanceLoading}
                  error={performanceError}
                  t={t}
                />
              ) : null}

              <section className="space-y-4" aria-label={copy.editorTitle}>
                <section className="min-w-0 space-y-2">
                  <div>
                    <h3 className="font-black text-foreground">{copy.editorTitle}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("admin.marketing.editorial_markdown_help")}
                    </p>
                  </div>

                  <EditorialMarkdownEditor
                    value={form.body}
                    disabled={editorLocked}
                    dir={language === "AR" ? "rtl" : "ltr"}
                    maxLength={500000}
                    t={t}
                    onChange={(body) => setForm((current) => ({ ...current, body }))}
                    typography={form.typography}
                  />
                </section>

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
                      className="h-11 rounded-xl"
                    />
                  </Field>

                  <Field label={t("admin.marketing.editorial_slug")}>
                    <Input
                      dir={language === "AR" ? "rtl" : "ltr"}
                      value={dynamicSlug || form.slug}
                      disabled={editorLocked}
                      readOnly={Boolean(dynamicSlug)}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          slug: event.target.value,
                        }))
                      }
                      maxLength={255}
                      className="h-11 rounded-xl"
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
                    rows={4}
                    className="w-full resize-y rounded-xl border border-border/60 bg-background px-4 py-3 text-sm leading-6 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="h-11 rounded-xl"
                    />
                  </Field>

                  <Field label={t("admin.marketing.editorial_meta_description")} required>
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
                      rows={4}
                      className="w-full resize-y rounded-xl border border-border/60 bg-background px-4 py-3 text-sm leading-6 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </Field>
                </div>
              </section>

              <InternalLinksEditor
                links={form.internalLinks}
                language={language}
                disabled={editorLocked}
                t={t}
                onChange={(internalLinks) => setForm((current) => ({ ...current, internalLinks }))}
              />

              <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {currentSummary
                    ? t("admin.marketing.editorial_current_version", { version: currentSummary.versionNumber })
                    : t("admin.marketing.editorial_first_version")}
                  {dirty ? ` · ${t("admin.marketing.editorial_unsaved")}` : ""}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)} disabled={!form.title.trim() || !form.body.trim()}>
                    <Eye />
                    {copy.editorPreview}
                  </Button>
                  <Button
                    type="button"
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
                  >
                    {saving ? <Loader2 className="animate-spin" /> : <Save />}
                    {copy.saveDraft}
                  </Button>
                </div>
              </div>


              {selectedTopic.articleId ? (
                <EditorialArticleImagePanel
                  key={selectedTopic.articleId}
                  articleId={selectedTopic.articleId}
                  suggestedFileName={`${dynamicSlug || form.slug || selectedTopic.topicKey}-${language.toLowerCase()}-hero`}
                  focusKeywords={focusKeywords}
                  image={selectedTopic.image ?? null}
                  busy={busy === "editorial-image"}
                  t={t}
                  onUpload={onUploadImage}
                  onRemove={onRemoveImage}
                />
              ) : null}

              {lifecycleState === "IMAGE_REQUIRED" ? (
                <ApprovalPanel
                  qualityGates={workspace.qualityGates}
                  uiLanguage={uiLanguage}
                  hasEveryLanguage={hasEveryLanguage}
                  dirty={dirty}
                  confirmed={approvalConfirmed}
                  reason={approvalReason}
                  busy={requestingApproval}
                  canRequest={canRequestApproval}
                  t={t}
                  onConfirmed={setApprovalConfirmed}
                  onReason={setApprovalReason}
                  onRequest={() => void requestApproval()}
                />
              ) : null}

              {lifecycleState === "WAITING_APPROVAL" ? (
                <section className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 dark:bg-amber-950/10 sm:p-5" data-testid="editorial-awaiting-approval">
                  <h3 className="flex items-center gap-2 font-black">
                    <ShieldCheck className="h-4 w-4" />
                    {t("admin.marketing.editorial_waiting_approval")}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("admin.marketing.editorial_waiting_approval_description")}
                  </p>
                  <label className="block space-y-1.5 text-sm font-semibold">
                    <span>{t("admin.marketing.editorial_publish_reason")}</span>
                    <textarea
                      value={publishReason}
                      onChange={(event) => setPublishReason(event.target.value)}
                      maxLength={1000}
                      rows={3}
                      disabled={publishing}
                      className="w-full resize-y rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                    />
                  </label>
                  {!selectedTopic.pendingApprovalTaskId ? (
                    <p className="text-sm font-semibold text-destructive">
                      {t("admin.marketing.editorial_publish_task_missing")}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    onClick={publishArticle}
                    disabled={publishing || !selectedTopic.pendingApprovalTaskId || !publishReason.trim()}
                    aria-busy={publishing}
                  >
                    {publishing ? <Loader2 className="animate-spin" /> : <Send />}
                    {t("admin.marketing.editorial_publish_action")}
                  </Button>
                </section>
              ) : null}

              <VersionHistory
                history={history}
                loading={historyLoading}
                error={historyError}
                copy={copy}
                formatDate={formatDate}
                t={t}
                uiLanguage={uiLanguage}
                onPreview={setHistoryPreview}
                onRestore={restoreVersion}
                onDelete={(version) => void deleteVersion(version)}
                canDelete={canDeleteVersion}
                deleteCopy={versionDeleteCopy}
              />
            </div>
          </section>
        </main>
      ) : null}

      <ArticlePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        language={language}
        form={form}
        t={t}
      />

      <EditorialConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title ?? ""}
        description={confirmState?.description ?? ""}
        confirmLabel={
          confirmState?.confirmLabel ??
          t("admin.marketing.confirm")
        }
        cancelLabel={t("admin.marketing.cancel")}
        direction={confirmDirection}
        destructive={Boolean(confirmState?.destructive)}
        onOpenChange={(open) => {
          if (!open) setConfirmState(null);
        }}
        onConfirm={acceptConfirmation}
      />

      <VersionPreviewDialog
        version={historyPreview}
        onClose={() => setHistoryPreview(null)}
        language={language}
        formatDate={formatDate}
        copy={copy}
        onDelete={(version) => void deleteVersion(version)}
        canDelete={canDeleteVersion}
        deleteCopy={versionDeleteCopy}
      />
    </div>
  );
}

function InternalLinksEditor({
  links,
  language,
  disabled,
  t,
  onChange,
}: {
  links: EditorialInternalLinkInput[];
  language: EditorialLanguage;
  disabled: boolean;
  t: Translate;
  onChange: (links: EditorialInternalLinkInput[]) => void;
}) {
  return (
    <section className="space-y-3 border-t border-border/50 pt-5" data-testid="editorial-internal-links">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-black">
            <Link2 className="h-4 w-4 text-primary" aria-hidden="true" />
            {t("admin.marketing.editorial_internal_links")}
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("admin.marketing.editorial_internal_links_description")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => onChange([...links, { targetPath: "", anchorText: "" }])}
        >
          <Plus />
          {t("admin.marketing.editorial_internal_link_add")}
        </Button>
      </div>

      {links.length ? (
        <div className="space-y-3">
          {links.map((link, index) => (
            <div key={index} className="grid min-w-0 gap-3 rounded-2xl border border-border/50 bg-background/60 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
              <Field label={t("admin.marketing.editorial_internal_link_target")} required>
                <Input
                  dir="ltr"
                  value={link.targetPath}
                  disabled={disabled}
                  maxLength={500}
                  placeholder={language === "EN" ? "/lessons/les-19/2" : `/${language.toLowerCase()}/lessons/les-19/2`}
                  onChange={(event) =>
                    onChange(links.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, targetPath: event.target.value } : item,
                    ))
                  }
                />
              </Field>
              <Field label={t("admin.marketing.editorial_internal_link_anchor")} required>
                <Input
                  value={link.anchorText}
                  disabled={disabled}
                  maxLength={500}
                  onChange={(event) =>
                    onChange(links.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, anchorText: event.target.value } : item,
                    ))
                  }
                />
              </Field>
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={() => onChange(links.filter((_, itemIndex) => itemIndex !== index))}
                className="h-10 w-full p-0 text-destructive hover:text-destructive sm:w-10"
                aria-label={t("admin.marketing.editorial_internal_link_remove")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("admin.marketing.editorial_internal_links_empty")}</p>
      )}
    </section>
  );
}

function VersionHistory({
  history,
  loading,
  error,
  copy,
  formatDate,
  t,
  uiLanguage,
  onPreview,
  onRestore,
  onDelete,
  canDelete,
  deleteCopy,
}: {
  history: EditorialVersion[];
  loading: boolean;
  error: string | null;
  copy: ReturnType<typeof editorialCmsCopy>;
  formatDate: DateFormatter;
  t: Translate;
  uiLanguage: string;
  onPreview: (version: EditorialVersion) => void;
  onRestore: (version: EditorialVersion) => void;
  onDelete: (version: EditorialVersion) => void;
  canDelete: (version: EditorialVersion) => boolean;
  deleteCopy: VersionDeleteCopy;
}) {
  return (
    <section className="min-w-0 border-t border-border/50 pt-5" aria-busy={loading} data-testid="editorial-version-history">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileClock className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-black text-foreground">{copy.versionTitle}</h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{copy.versionDescription}</p>
        </div>
      </div>

      <p className="mt-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-xs leading-5 text-muted-foreground">
        {copy.immutableHistory}
      </p>

      {loading ? <p className="mt-3 text-sm text-muted-foreground">{t("common.loading")}</p> : null}
      {error ? <p className="mt-3 break-words text-sm text-destructive">{error || t("admin.marketing.editorial_history_failed")}</p> : null}

      {!loading && !error && history.length ? (
        <div className="mt-4 space-y-2">
          {history.map((version) => (
            <article key={version.id} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border/50 bg-background/65 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-foreground">v{version.versionNumber}</span>
                  {version.current ? <Badge>{copy.versionCurrent}</Badge> : <Badge variant="outline">{editorialTaskStatusLabel(version.status, uiLanguage)}</Badge>}
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDate(version.createdAt)} · {version.createdBy ?? "—"}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">{version.title}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <Button type="button" variant="outline" size="sm" onClick={() => onPreview(version)}>
                  <Eye />
                  {copy.versionPreview}
                </Button>
                {!version.current ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => onRestore(version)}>
                    <Undo2 />
                    {copy.versionRestore}
                  </Button>
                ) : null}
                {EDITORIAL_VERSION_DELETE_SUPPORTED ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(version)}
                    disabled={!canDelete(version)}
                  >
                    <Trash2 />
                    {deleteCopy.action}
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {!loading && !error && !history.length ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <FilePenLine className="h-4 w-4" />
          {t("admin.marketing.editorial_no_versions")}
        </p>
      ) : null}
    </section>
  );
}

function TranslationPanel({
  languages,
  topic,
  dirty,
  canonicalVersionAvailable,
  busy,
  canRequest,
  t,
  onRequest,
}: {
  languages: EditorialLanguage[];
  topic: EditorialTopic;
  dirty: boolean;
  canonicalVersionAvailable: boolean;
  busy: boolean;
  canRequest: boolean;
  t: Translate;
  onRequest: () => void;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-sky-200 bg-sky-50/40 p-4 dark:bg-sky-950/10 sm:p-5" data-testid="editorial-translation-request">
      <div>
        <h3 className="flex items-center gap-2 font-black">
          <FilePenLine className="h-4 w-4 text-primary" />
          {t("admin.marketing.editorial_translation_title")}
        </h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("admin.marketing.editorial_translation_description")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {languages.map((item) => {
          const version = topic.currentVersions.find((candidate) => candidate.language === item);
          const available = Boolean(
            version && (item === topic.canonicalLanguage || version.focusKeyword?.trim()),
          );
          return (
            <Badge key={item} variant="outline" className={available ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"}>
              {item}: {t(available ? "admin.marketing.editorial_translation_available" : "admin.marketing.editorial_translation_missing")}
            </Badge>
          );
        })}
      </div>
      {dirty ? <p className="text-sm font-semibold text-destructive">{t("admin.marketing.editorial_translation_save_first")}</p> : null}
      {!canonicalVersionAvailable ? <p className="text-sm font-semibold text-destructive">{t("admin.marketing.editorial_translation_source_required")}</p> : null}
      <Button type="button" onClick={onRequest} disabled={busy || !canRequest}>
        {busy ? <Loader2 className="animate-spin" /> : <FilePenLine />}
        {t("admin.marketing.editorial_translation_action")}
      </Button>
    </section>
  );
}

function ApprovalPanel({
  qualityGates,
  uiLanguage,
  hasEveryLanguage,
  dirty,
  confirmed,
  reason,
  busy,
  canRequest,
  t,
  onConfirmed,
  onReason,
  onRequest,
}: {
  qualityGates: string[];
  uiLanguage: string;
  hasEveryLanguage: boolean;
  dirty: boolean;
  confirmed: boolean;
  reason: string;
  busy: boolean;
  canRequest: boolean;
  t: Translate;
  onConfirmed: (value: boolean) => void;
  onReason: (value: string) => void;
  onRequest: () => void;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 dark:bg-amber-950/10 sm:p-5" data-testid="editorial-approval-request">
      <div>
        <h3 className="flex items-center gap-2 font-black"><ShieldCheck className="h-4 w-4" />{t("admin.marketing.editorial_approval_title")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.marketing.editorial_approval_description")}</p>
      </div>
      <div className="flex flex-wrap gap-1.5" aria-label={t("admin.marketing.editorial_quality_gates")}>
        {qualityGates.map((gate) => (
          <Badge
            key={gate}
            variant="outline"
            className="bg-background/80"
          >
            {editorialQualityGateLabel(gate, uiLanguage)}
          </Badge>
        ))}
      </div>
      <label className="flex items-start gap-3 text-sm font-semibold">
        <input type="checkbox" checked={confirmed} disabled={busy} onChange={(event) => onConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
        <span>{t("admin.marketing.editorial_approval_confirm")}</span>
      </label>
      <label className="block space-y-1.5 text-sm font-semibold">
        <span>{t("admin.marketing.editorial_approval_reason")}</span>
        <textarea value={reason} disabled={busy} required onChange={(event) => onReason(event.target.value)} maxLength={1000} rows={3} className="w-full resize-y rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15" />
      </label>
      {!hasEveryLanguage ? <p className="text-sm font-semibold text-destructive">{t("admin.marketing.editorial_approval_languages_required")}</p> : null}
      {dirty ? <p className="text-sm font-semibold text-destructive">{t("admin.marketing.editorial_approval_save_first")}</p> : null}
      <Button type="button" onClick={onRequest} disabled={busy || !canRequest}>
        {busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
        {t("admin.marketing.editorial_request_approval")}
      </Button>
    </section>
  );
}

function PerformancePanel({
  performance,
  loading,
  error,
  t,
}: {
  performance: EditorialPerformanceOverview | null;
  loading: boolean;
  error: string | null;
  t: Translate;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-border/50 bg-background/60 p-4" data-testid="editorial-performance">
      <div className="flex items-start gap-2">
        <Activity className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
        <div>
          <h3 className="font-black">{t("admin.marketing.editorial_performance")}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("admin.marketing.editorial_performance_description")}</p>
        </div>
      </div>
      {loading ? <div className="h-20 animate-pulse rounded-xl bg-muted/50" /> : null}
      {error ? <p className="break-words text-sm font-semibold text-destructive">{error}</p> : null}
      {!loading && !error && performance?.latestSnapshots.length ? (
        <div className="grid min-w-0 gap-2 md:grid-cols-2">
          {performance.latestSnapshots.map((snapshot) => (
            <article key={snapshot.id} className="min-w-0 rounded-xl border border-border/50 p-3">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0"><strong className="text-sm">{snapshot.language}</strong><p dir="ltr" className="mt-0.5 break-all text-start text-[11px] text-muted-foreground">{snapshot.publishedPath}</p></div>
                <Badge variant="outline" className="shrink-0">{snapshot.evidenceState === "PRESENT" ? snapshot.indexingState : t("admin.marketing.editorial_performance_no_data")}</Badge>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
                <PerformanceMetric label={t("admin.marketing.editorial_performance_clicks")} value={formatMetric(snapshot.current.clicks)} />
                <PerformanceMetric label={t("admin.marketing.editorial_performance_impressions")} value={formatMetric(snapshot.current.impressions)} />
                <PerformanceMetric label={t("admin.marketing.editorial_performance_ctr")} value={`${formatMetric(snapshot.current.ctr * 100)}%`} />
                <PerformanceMetric label={t("admin.marketing.editorial_performance_position")} value={formatMetric(snapshot.current.averagePosition)} />
              </dl>
            </article>
          ))}
        </div>
      ) : null}
      {!loading && !error && performance?.latestRecommendation ? (
        <Badge variant="outline" className={performance.latestRecommendation.recommended ? "border-amber-300 text-amber-700" : "border-emerald-300 text-emerald-700"}>
          {performance.latestRecommendation.recommended ? t("admin.marketing.editorial_performance_recommended") : t("admin.marketing.editorial_performance_stable")}
        </Badge>
      ) : null}
    </section>
  );
}

function ArticlePreviewDialog({
  open,
  onOpenChange,
  language,
  form,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: EditorialLanguage;
  form: FormState;
  t: Translate;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-3xl lg:max-w-4xl">
        <DialogHeader className="text-start">
          <DialogTitle>{t("admin.marketing.editorial_preview_title")}</DialogTitle>
          <DialogDescription>{t("admin.marketing.editorial_preview_description")}</DialogDescription>
        </DialogHeader>
        <ArticlePreview language={language} title={form.title} summary={form.summary} body={form.body} typography={form.typography} internalLinks={form.internalLinks} t={t} />
      </DialogContent>
    </Dialog>
  );
}

function VersionPreviewDialog({
  version,
  onClose,
  language,
  formatDate,
  copy,
  onDelete,
  canDelete,
  deleteCopy,
}: {
  version: EditorialVersion | null;
  onClose: () => void;
  language: EditorialLanguage;
  formatDate: DateFormatter;
  copy: ReturnType<typeof editorialCmsCopy>;
  onDelete: (version: EditorialVersion) => void;
  canDelete: (version: EditorialVersion) => boolean;
  deleteCopy: VersionDeleteCopy;
}) {
  return (
    <Dialog open={Boolean(version)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-3xl lg:max-w-4xl">
        {version ? (
          <>
            <DialogHeader className="text-start">
              <DialogTitle>{copy.versionPreview} · v{version.versionNumber}</DialogTitle>
              <DialogDescription>{formatDate(version.createdAt)} · {version.createdBy ?? "—"}</DialogDescription>
            </DialogHeader>
            <ArticlePreview language={language} title={version.title} summary={version.summary ?? ""} body={version.body} typography={version.typography ?? DEFAULT_ARTICLE_TYPOGRAPHY} internalLinks={version.internalLinks} t={(key) => key} />
            {EDITORIAL_VERSION_DELETE_SUPPORTED ? (
              <div className="flex justify-end border-t border-border/60 pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onDelete(version)}
                  disabled={!canDelete(version)}
                >
                  <Trash2 />
                  {deleteCopy.action}
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ArticlePreview({
  language,
  title,
  summary,
  body,
  typography,
  internalLinks,
  t,
}: {
  language: EditorialLanguage;
  title: string;
  summary: string;
  body: string;
  typography: EditorialTypography;
  internalLinks: EditorialInternalLinkInput[];
  t: Translate;
}) {
  return (
    <article lang={language.toLowerCase()} dir={language === "AR" ? "rtl" : "ltr"} className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card p-4 text-start shadow-sm sm:p-8" data-testid="editorial-preview">
      <Badge variant="outline">{language}</Badge>
      <h1 className="mt-4 break-words text-2xl font-black leading-tight sm:text-3xl">{title}</h1>
      {summary ? <p className="mt-4 whitespace-pre-wrap break-words text-base leading-7 text-muted-foreground">{summary}</p> : null}
      <ArticleMarkdown body={body} typography={typography} className="mt-6 text-base leading-8 text-foreground" />
      {internalLinks.length ? (
        <section className="mt-8 border-t border-border/60 pt-5">
          <h2 className="flex items-center gap-2 text-base font-black"><Link2 className="h-4 w-4" />{t("admin.marketing.editorial_internal_links")}</h2>
          <ul className="mt-3 space-y-2">{internalLinks.map((link, index) => <li key={`${index}:${link.targetPath}`} className="break-words text-sm font-semibold text-primary">{link.anchorText || link.targetPath}</li>)}</ul>
        </section>
      ) : null}
    </article>
  );
}

function PerformanceMetric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-md bg-muted/45 p-2"><dt className="break-words text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-bold text-foreground">{value}</dd></div>;
}

function formatMetric(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
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
