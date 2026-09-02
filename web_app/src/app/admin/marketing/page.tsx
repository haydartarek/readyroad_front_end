"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  FilePenLine,
  History,
  Import,
  ListTodo,
  RefreshCw,
  RotateCcw,
  SearchCheck,
  Settings2,
  ShieldCheck,
  Youtube,
  XCircle,
} from "lucide-react";
import { apiClient, getApiErrorMessage, logApiError } from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminMetricCard from "@/components/admin/AdminMetricCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import EditorialEditorPanel from "@/components/admin/marketing/EditorialEditorPanel";
import {
  HumanStatusBadge,
  StructuredData,
  StructuredRecordCard,
  TechnicalDetails,
  machineLabel,
  marketingDisplayText,
} from "@/components/admin/marketing/MarketingDataPresentation";
import {
  type MarketingAgent,
  type MarketingAuditItem,
  type MarketingErrorItem,
  type MarketingOverview,
  type MarketingSettings,
  type MarketingTask,
  type MarketingTaskPage,
  type MarketingWorkerHealth,
  type AnalyticsDiscovery,
  type AnalyticsSettingsView,
  type AnalyticsStatus,
  type YouTubeStatus,
  type SeoMigrationWorkspace,
  type EditorialLanguage,
  type EditorialApprovalRequest,
  type EditorialSaveRequest,
  type EditorialSaveResult,
  type EditorialWorkspace,
  type MarketingStrategySnapshot,
  taskCount,
} from "@/lib/marketing-admin";

type View = "overview" | "analytics" | "youtube" | "discovery" | "editorial" | "seo" | "agents" | "tasks" | "approvals" | "errors" | "audit" | "settings";

interface PlatformData {
  overview: MarketingOverview;
  agents: MarketingAgent[];
  tasks: MarketingTaskPage;
  errors: MarketingErrorItem[];
  audit: MarketingAuditItem[];
  settings: MarketingSettings;
  worker: MarketingWorkerHealth;
  analyticsStatus: AnalyticsStatus;
  analyticsSettings: AnalyticsSettingsView;
  discovery: AnalyticsDiscovery;
  reports: Array<Record<string, unknown>>;
  youtubeStatus: YouTubeStatus;
  seoMigration: SeoMigrationWorkspace;
  editorial: EditorialWorkspace;
  strategy: MarketingStrategySnapshot;
}

const VIEWS: Array<{ key: View; icon: typeof Activity }> = [
  { key: "overview", icon: Activity },
  { key: "analytics", icon: BarChart3 },
  { key: "youtube", icon: Youtube },
  { key: "discovery", icon: SearchCheck },
  { key: "editorial", icon: FilePenLine },
  { key: "seo", icon: Import },
  { key: "agents", icon: Bot },
  { key: "tasks", icon: ListTodo },
  { key: "approvals", icon: ClipboardCheck },
  { key: "errors", icon: AlertTriangle },
  { key: "audit", icon: History },
  { key: "settings", icon: Settings2 },
];

function StatusBadge({ status, t, showCode = false }: { status: string; t: Translate; showCode?: boolean }) {
  return <HumanStatusBadge status={status} t={t} showCode={showCode} />;
}

export default function MarketingAdminPage() {
  const { t, language } = useLanguage();
  const [view, setView] = useState<View>("overview");
  const [data, setData] = useState<PlatformData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overview, agents, tasks, errors, audit, settings, worker, analyticsStatus, analyticsSettings, discovery, reports, youtubeStatus, seoMigration, editorial, strategy] = await Promise.all([
        apiClient.get<MarketingOverview>("/admin/marketing/overview"),
        apiClient.get<MarketingAgent[]>("/admin/marketing/agents"),
        apiClient.get<MarketingTaskPage>("/admin/marketing/tasks", { limit: 100 }),
        apiClient.get<MarketingErrorItem[]>("/admin/marketing/errors", { limit: 50 }),
        apiClient.get<MarketingAuditItem[]>("/admin/marketing/audit", { limit: 50 }),
        apiClient.get<MarketingSettings>("/admin/marketing/settings"),
        apiClient.get<MarketingWorkerHealth>("/admin/marketing/worker-health"),
        apiClient.get<AnalyticsStatus>("/admin/marketing/analytics/status"),
        apiClient.get<AnalyticsSettingsView>("/admin/marketing/analytics/settings"),
        apiClient.get<AnalyticsDiscovery>("/admin/marketing/analytics/organic-discovery", { limit: 100 }),
        apiClient.get<Array<Record<string, unknown>>>("/admin/marketing/analytics/reports", { limit: 20 }),
        apiClient.get<YouTubeStatus>("/admin/marketing/youtube/status"),
        apiClient.get<SeoMigrationWorkspace>("/admin/marketing/seo-migration/workspace"),
        apiClient.get<EditorialWorkspace>("/admin/marketing/editorial/editor"),
        apiClient.get<MarketingStrategySnapshot>("/admin/marketing/strategy"),
      ]);
      setData({
        overview: overview.data,
        agents: agents.data,
        tasks: tasks.data,
        errors: errors.data,
        audit: audit.data,
        settings: settings.data,
        worker: worker.data,
        analyticsStatus: analyticsStatus.data,
        analyticsSettings: analyticsSettings.data,
        discovery: discovery.data,
        reports: reports.data,
        youtubeStatus: youtubeStatus.data,
        seoMigration: seoMigration.data,
        editorial: editorial.data,
        strategy: strategy.data,
      });
    } catch (requestError) {
      logApiError("Failed to load marketing admin platform", requestError);
      setError(getApiErrorMessage(requestError, ""));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mutate = async (key: string, action: () => Promise<unknown>, messageKey: string) => {
    setBusy(key);
    try {
      await action();
      toast.success(t(messageKey));
      await load();
    } catch (requestError) {
      logApiError("Marketing admin action failed", requestError);
      toast.error(getApiErrorMessage(requestError, t("admin.marketing.action_failed")));
    } finally {
      setBusy(null);
    }
  };

  const approvals = useMemo(
    () => data?.tasks.items.filter((task) => task.status === "WAITING_APPROVAL") ?? [],
    [data],
  );

  const saveEditorial = async (
    topicId: number,
    editorLanguage: EditorialLanguage,
    request: EditorialSaveRequest,
  ) => {
    setBusy("editorial-save");
    try {
      const response = await apiClient.put<EditorialSaveResult>(
        `/admin/marketing/editorial/editor/topics/${topicId}/versions/${editorLanguage}`,
        request,
      );
      toast.success(t(response.data.created
        ? "admin.marketing.editorial_saved"
        : "admin.marketing.editorial_unchanged"));
      await load();
      return response.data;
    } catch (requestError) {
      logApiError("Editorial draft save failed", requestError);
      toast.error(getApiErrorMessage(requestError, t("admin.marketing.action_failed")));
      throw requestError;
    } finally {
      setBusy(null);
    }
  };

  const requestEditorialTranslations = async (
    articleId: number,
    idempotencyKey: string,
  ) => {
    setBusy("editorial-translation");
    try {
      await apiClient.post(
        `/admin/marketing/editorial/editor/articles/${articleId}/translation-requests`,
        { idempotencyKey },
      );
      toast.success(t("admin.marketing.editorial_translation_requested"));
      await load();
    } catch (requestError) {
      logApiError("Editorial translation request failed", requestError);
      toast.error(
        getApiErrorMessage(
          requestError,
          t("admin.marketing.action_failed"),
        ),
      );
      throw requestError;
    } finally {
      setBusy(null);
    }
  };
  const requestEditorialApproval = async (
    articleId: number,
    request: EditorialApprovalRequest,
  ) => {
    setBusy("editorial-approval");
    try {
      await apiClient.post(
        `/admin/marketing/editorial/editor/articles/${articleId}/approval-requests`,
        request,
      );
      toast.success(t("admin.marketing.editorial_approval_requested"));
      await load();
    } catch (requestError) {
      logApiError("Editorial approval request failed", requestError);
      toast.error(getApiErrorMessage(requestError, t("admin.marketing.action_failed")));
      throw requestError;
    } finally {
      setBusy(null);
    }
  };

  const publishEditorialArticle = async (taskId: number, reason: string) => {
    setBusy("editorial-publish");
    try {
      await apiClient.post(`/admin/marketing/tasks/${taskId}/approve`, { reason });
      toast.success(t("admin.marketing.editorial_publish_approved"));
      await load();
    } catch (requestError) {
      logApiError("Editorial publication approval failed", requestError);
      toast.error(getApiErrorMessage(requestError, t("admin.marketing.action_failed")));
      throw requestError;
    } finally {
      setBusy(null);
    }
  };

  const uploadEditorialImage = async (articleId: number, formData: FormData) => {
    setBusy("editorial-image");
    try {
      const response = await apiClient.post(
        "/admin/marketing/editorial/editor/articles/" + articleId + "/image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      const uploadedImage =
        response.data as PlatformData["editorial"]["topics"][number]["image"];

      setData((current) => {
        if (!current) return current;

        return {
          ...current,
          editorial: {
            ...current.editorial,
            topics: current.editorial.topics.map((topic) =>
              topic.articleId === articleId
                ? { ...topic, image: uploadedImage }
                : topic,
            ),
          },
        };
      });

      toast.success(t("admin.marketing.editorial_image_saved"));
    } catch (requestError) {
      logApiError("Editorial image upload failed", requestError);
      toast.error(getApiErrorMessage(requestError, t("admin.marketing.action_failed")));
      throw requestError;
    } finally {
      setBusy(null);
    }
  };

  const removeEditorialImage = async (articleId: number) => {
    setBusy("editorial-image");
    try {
      await apiClient.delete(
        "/admin/marketing/editorial/editor/articles/" + articleId + "/image",
      );

      setData((current) => {
        if (!current) return current;

        return {
          ...current,
          editorial: {
            ...current.editorial,
            topics: current.editorial.topics.map((topic) =>
              topic.articleId === articleId
                ? { ...topic, image: null }
                : topic,
            ),
          },
        };
      });

      toast.success(t("admin.marketing.editorial_image_removed"));
    } catch (requestError) {
      logApiError("Editorial image removal failed", requestError);
      toast.error(getApiErrorMessage(requestError, t("admin.marketing.action_failed")));
      throw requestError;
    } finally {
      setBusy(null);
    }
  };

  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(`${language}-BE`, {
          dateStyle: "medium",
          timeStyle: "short",
          calendar: "gregory",
        }).format(new Date(value))
      : t("admin.marketing.never");

  return (
    <div className="min-w-0 space-y-5">
      <AdminPageHeader
        icon={<Bot className="h-6 w-6" />}
        title={t("admin.marketing.title")}
        description={t("admin.marketing.description")}
        badge={data ? <StatusBadge status={data.worker.status} t={t} /> : undefined}
        actions={
          <Button
            className="w-full sm:w-auto"
            variant="outline"
            onClick={load}
            disabled={loading}
            aria-busy={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            {t("admin.marketing.refresh")}
          </Button>
        }
      />

      <nav
        className="min-w-0 overflow-x-auto overscroll-x-contain rounded-2xl border border-border/60 bg-card p-1.5 shadow-sm"
        aria-label={t("admin.marketing.title")}
      >
        <div
          className="flex min-w-max gap-1"
          role="tablist"
          aria-orientation="horizontal"
        >
          {VIEWS.map(({ key, icon: Icon }) => {
            const active = view === key;

            return (
              <button
                key={key}
                id={"marketing-tab-" + key}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls="marketing-panel"
                tabIndex={active ? 0 : -1}
                onClick={() => setView(key)}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-transparent px-3 text-sm font-semibold outline-none transition-colors",
                  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
                  active
                    ? "border-primary/20 bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t("admin.marketing.tab_" + key)}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {loading && !data ? <LoadingState /> : null}
      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="font-bold text-destructive">{t("admin.marketing.load_failed")}</p>
          <p className="mx-auto mt-2 max-w-2xl break-words text-sm text-destructive/85">
            {error || t("admin.marketing.load_failed")}
          </p>
          <Button className="mt-4" onClick={load}>{t("common.retry")}</Button>
        </div>
      ) : null}
      {data ? (
        <div
          id="marketing-panel"
          role="tabpanel"
          aria-labelledby={"marketing-tab-" + view}
          className="min-w-0"
        >
          {view === "overview" ? <Overview data={data} t={t} formatDate={formatDate} /> : null}
          {view === "analytics" ? (
            <AnalyticsPanel
              data={data}
              busy={busy}
              t={t}
              formatDate={formatDate}
              onSync={() => mutate(
                "analytics-sync",
                () => apiClient.post("/admin/marketing/analytics/sync", {
                  idempotencyKey: `analytics-sync-${crypto.randomUUID()}`,
                }),
                "admin.marketing.analytics_sync_created",
              )}
              onSettings={(policy, thresholds) => mutate(
                "analytics-settings",
                () => apiClient.put("/admin/marketing/analytics/settings", {
                  policy,
                  thresholds,
                  idempotencyKey: `analytics-settings-${crypto.randomUUID()}`,
                }),
                "admin.marketing.analytics_settings_saved",
              )}
            />
          ) : null}
          {view === "youtube" ? (
            <YouTubePanel
              status={data.youtubeStatus}
              busy={busy}
              t={t}
              onSync={() => mutate(
                "youtube-sync",
                () => apiClient.post("/admin/marketing/youtube/sync", {
                  idempotencyKey: `youtube-sync-${crypto.randomUUID()}`,
                }),
                "admin.marketing.youtube_sync_created",
              )}
            />
          ) : null}
          {view === "discovery" ? <DiscoveryPanel data={data.discovery} t={t} formatDate={formatDate} /> : null}
          {view === "editorial" ? (
            <EditorialEditorPanel
              workspace={data.editorial}
              strategy={data.strategy}
              busy={busy}
              t={t}
              formatDate={formatDate}
              onSave={saveEditorial}
              onRequestTranslations={requestEditorialTranslations}
              onRequestApproval={requestEditorialApproval}
              onPublishArticle={publishEditorialArticle}
              onUploadImage={uploadEditorialImage}
              onRemoveImage={removeEditorialImage}
              onRefresh={load}
            />
          ) : null}
          {view === "seo" ? (
            <SeoMigrationPanel
              workspace={data.seoMigration}
              busy={busy}
              t={t}
              formatDate={formatDate}
              onImport={(file) => mutate(
                "seo-import",
                () => {
                  const formData = new FormData();
                  formData.append("file", file);
                  return apiClient.post("/admin/marketing/seo-migration/import", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                  });
                },
                "admin.marketing.seo_import_complete",
              )}
            />
          ) : null}
          {view === "agents" ? (
            <Agents
              agents={data.agents}
              busy={busy}
              t={t}
              formatDate={formatDate}
              onToggle={(agent) => mutate(
                `agent-${agent.agentType}`,
                () => apiClient.put(`/admin/marketing/agents/${agent.agentType}/enabled`, {
                  enabled: !agent.enabled,
                  idempotencyKey: `agent-control-${agent.agentType}-${crypto.randomUUID()}`,
                }),
                "admin.marketing.approval_created",
              )}
            />
          ) : null}
          {view === "tasks" ? (
            <Tasks
              tasks={data.tasks.items}
              busy={busy}
              t={t}
              formatDate={formatDate}
              onRetry={(task) => mutate(
                `retry-${task.id}`,
                () => apiClient.post(`/admin/marketing/tasks/${task.id}/retry`),
                "admin.marketing.retry_created",
              )}
            />
          ) : null}
          {view === "approvals" ? (
            <Approvals
              tasks={approvals}
              busy={busy}
              t={t}
              onDecision={(task, decision, reason) => mutate(
                `${decision}-${task.id}`,
                () => apiClient.post(
                  `/admin/marketing/tasks/${task.id}/${decision}`,
                  reason ? { reason } : {},
                ),
                decision === "approve" ? "admin.marketing.approved" : "admin.marketing.rejected",
              )}
            />
          ) : null}
          {view === "errors" ? <Errors items={data.errors} t={t} formatDate={formatDate} /> : null}
          {view === "audit" ? <Audit items={data.audit} t={t} formatDate={formatDate} /> : null}
          {view === "settings" ? <Settings data={data} t={t} formatDate={formatDate} /> : null}
        </div>
      ) : null}
    </div>
  );
}

type Translate = (key: string, variables?: Record<string, string | number>) => string;
type DateFormatter = (value: string | null) => string;

function LoadingState() {
  return <div className="h-64 animate-pulse rounded-2xl border border-border/50 bg-muted/40" />;
}

function Empty({ t }: { t: Translate }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{t("admin.marketing.empty")}</p>;
}

function ownerDecisionText(decision: string, t: Translate) {
  if (decision.startsWith("Upload the local Search Console XLSX export")) {
    return t("admin.marketing.owner_decision_import_search_console");
  }
  if (decision.startsWith("Confirm official RijVia social handles")) {
    return t("admin.marketing.owner_decision_confirm_social");
  }
  if (decision.startsWith("Approve or reject each local content brief")) {
    return t("admin.marketing.owner_decision_review_content_briefs");
  }
  return decision;
}

function Overview({ data, t, formatDate }: { data: PlatformData; t: Translate; formatDate: DateFormatter }) {
  const counts = data.overview.tasksByStatus;

  return (
    <div className="min-w-0 space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          icon={<ListTodo />}
          label={t("admin.marketing.tasks_today")}
          value={data.overview.tasksToday}
        />
        <AdminMetricCard
          icon={<CheckCircle2 />}
          label={t("admin.marketing.completed")}
          value={taskCount(counts, "COMPLETED")}
          valueClassName="text-green-600"
        />
        <AdminMetricCard
          icon={<XCircle />}
          label={t("admin.marketing.failed")}
          value={taskCount(counts, "FAILED")}
          valueClassName="text-destructive"
        />
        <AdminMetricCard
          icon={<ClipboardCheck />}
          label={t("admin.marketing.waiting_approval")}
          value={taskCount(counts, "WAITING_APPROVAL")}
          valueClassName="text-amber-600"
        />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
          <h2 className="font-black">
            {t("admin.marketing.worker_health")}
          </h2>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Metric
              label={t("admin.marketing.status")}
              value={
                <StatusBadge
                  status={data.worker.status}
                  t={t}
                />
              }
            />
            <Metric
              label={t("admin.marketing.active_agents")}
              value={data.overview.activeAgents}
            />
            <Metric
              label={t("admin.marketing.active_workers")}
              value={data.worker.activeWorkers}
            />
            <Metric
              label={t("admin.marketing.running_tasks")}
              value={data.worker.runningTasks}
            />
            <Metric
              label={t("admin.marketing.expired_locks")}
              value={data.worker.expiredLocks}
            />
            <Metric
              label={t("admin.marketing.checked_at")}
              value={formatDate(data.worker.checkedAt)}
            />
          </dl>
        </section>

        <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
          <h2 className="font-black">
            {t("admin.marketing.recent_activity")}
          </h2>

          <div className="mt-4">
            {data.overview.recentActivity.length ? (
              <div className="divide-y divide-border/50">
                {data.overview.recentActivity.map((item) => (
                  <article
                    key={item.id}
                    className="flex min-w-0 flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold">
                        {machineLabel(t, item.eventType)}
                      </p>

                      <code
                        dir="ltr"
                        className="mt-0.5 block max-w-full break-all text-start text-[11px] text-muted-foreground"
                      >
                        {item.eventType}
                      </code>

                      <p
                        dir="ltr"
                        className="mt-1 max-w-full break-all text-start text-xs text-muted-foreground"
                      >
                        {item.actor}
                      </p>
                    </div>

                    <time className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </time>
                  </article>
                ))}
              </div>
            ) : (
              <Empty t={t} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl bg-muted/45 p-3">
      <dt className="break-words text-xs text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 min-w-0 break-words font-bold">
        {value}
      </dd>
    </div>
  );
}

function Agents({ agents, busy, t, formatDate, onToggle }: { agents: MarketingAgent[]; busy: string | null; t: Translate; formatDate: DateFormatter; onToggle: (agent: MarketingAgent) => void }) {
  if (!agents.length) {
    return <Empty t={t} />;
  }

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      {agents.map((agent) => {
        const actionBusy = busy === "agent-" + agent.agentType;

        return (
          <article
            key={agent.agentType}
            className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5"
          >
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h2 className="min-w-0 break-words font-black">
                    {machineLabel(t, agent.agentType)}
                  </h2>

                  <StatusBadge
                    status={agent.enabled ? "ENABLED" : "DISABLED"}
                    t={t}
                  />
                </div>

                <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
                  {agent.description}
                </p>

                <code
                  dir="ltr"
                  className="mt-2 block max-w-full break-all text-start text-[11px] text-muted-foreground"
                >
                  {agent.displayName}{" · "}{agent.agentType}
                </code>
              </div>

              {agent.agentType !== "ADMIN_PLATFORM" ? (
                <Button
                  className="w-full sm:w-auto sm:shrink-0"
                  size="sm"
                  variant="outline"
                  disabled={Boolean(busy)}
                  aria-busy={actionBusy}
                  onClick={() => onToggle(agent)}
                >
                  {agent.enabled
                    ? t("admin.marketing.request_disable")
                    : t("admin.marketing.request_enable")}
                </Button>
              ) : null}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric
                label={t("admin.marketing.tasks_today")}
                value={agent.tasksToday}
              />
              <Metric
                label={t("admin.marketing.success_rate")}
                value={agent.successRate + "%"}
              />
              <Metric
                label={t("admin.marketing.retries")}
                value={agent.retryCount}
              />
              <Metric
                label={t("admin.marketing.last_run")}
                value={formatDate(agent.lastRunAt)}
              />
            </dl>
          </article>
        );
      })}
    </div>
  );
}

function Tasks({ tasks, busy, t, formatDate, onRetry }: { tasks: MarketingTask[]; busy: string | null; t: Translate; formatDate: DateFormatter; onRetry: (task: MarketingTask) => void }) {
  if (!tasks.length) {
    return <Empty t={t} />;
  }

  return (
    <div className="min-w-0 space-y-3">
      {tasks.map((task) => {
        const retryBusy = busy === "retry-" + task.id;

        return (
          <article
            key={task.id}
            className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm lg:flex-row lg:items-start lg:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black">
                  #{task.id}
                </span>
                <StatusBadge status={task.status} t={t} />
                <StatusBadge status={task.priority} t={t} />
              </div>

              <p className="mt-2 break-words text-sm font-semibold">
                {machineLabel(t, task.agentType)}
                {" · "}
                {machineLabel(t, task.taskType)}
              </p>

              <code
                dir="ltr"
                className="mt-1 block max-w-full break-all text-start text-[11px] text-muted-foreground"
              >
                {task.agentType} / {task.taskType}
              </code>

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <time>{formatDate(task.createdAt)}</time>
                <span aria-hidden="true">{"·"}</span>
                <span dir="ltr">
                  {task.attempts}/{task.maxAttempts}
                </span>
              </div>

              {task.errorCode ? (
                <div className="mt-3 min-w-0 rounded-xl border border-destructive/20 bg-destructive/[0.03] p-3">
                  <p className="break-words text-xs font-semibold text-destructive">
                    {machineLabel(t, task.errorCode)}
                  </p>

                  <code
                    dir="ltr"
                    className="mt-1 block max-w-full break-all text-start text-[11px] text-destructive/80"
                  >
                    {task.errorCode}
                  </code>

                  <p className="mt-2 break-words text-sm leading-6 text-destructive">
                    {task.errorMessage}
                  </p>
                </div>
              ) : null}
            </div>

            {task.status === "FAILED" ? (
              <Button
                className="w-full sm:w-auto lg:shrink-0"
                variant="outline"
                disabled={Boolean(busy)}
                aria-busy={retryBusy}
                onClick={() => onRetry(task)}
              >
                <RotateCcw />
                {t("admin.marketing.retry")}
              </Button>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function Approvals({ tasks, busy, t, onDecision }: { tasks: MarketingTask[]; busy: string | null; t: Translate; onDecision: (task: MarketingTask, decision: "approve" | "reject", reason?: string) => void }) {
  const [reasons, setReasons] = useState<Record<number, string>>({});

  if (!tasks.length) {
    return <Empty t={t} />;
  }

  return (
    <div className="min-w-0 space-y-3">
      {tasks.map((task) => {
        const requiresReason = task.taskType === "ARTICLE_APPROVAL";
        const reason = reasons[task.id] ?? "";
        const reasonMissing = requiresReason && !reason.trim();
        const approveBusy = busy === "approve-" + task.id;
        const rejectBusy = busy === "reject-" + task.id;

        return (
          <article
            key={task.id}
            className="grid min-w-0 gap-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm dark:bg-amber-950/10 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,28rem)] lg:items-start"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black">
                  #{task.id}
                </span>
                <StatusBadge status={task.status} t={t} />
              </div>

              <p className="mt-2 break-words text-sm font-semibold">
                {machineLabel(t, task.agentType)}
              </p>

              <code
                dir="ltr"
                className="mt-1 block max-w-full break-all text-start text-[11px] text-muted-foreground"
              >
                {task.agentType} / {task.taskType}
              </code>
            </div>

            <div className="min-w-0 space-y-3">
              {requiresReason ? (
                <label className="block min-w-0 space-y-1.5 text-sm font-semibold">
                  <span>
                    {t("admin.marketing.editorial_approval_decision_reason")}
                  </span>

                  <textarea
                    value={reason}
                    onChange={(event) =>
                      setReasons((current) => ({
                        ...current,
                        [task.id]: event.target.value,
                      }))
                    }
                    maxLength={1000}
                    rows={3}
                    required
                    aria-required="true"
                    disabled={Boolean(busy)}
                    className="min-h-24 w-full min-w-0 resize-y rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-shadow focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>
              ) : null}

              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  className="w-full sm:w-auto"
                  size="sm"
                  disabled={Boolean(busy) || reasonMissing}
                  aria-busy={approveBusy}
                  onClick={() =>
                    onDecision(
                      task,
                      "approve",
                      reason.trim() || undefined,
                    )
                  }
                >
                  <ShieldCheck />
                  {t("admin.marketing.approve")}
                </Button>

                <Button
                  className="w-full sm:w-auto"
                  size="sm"
                  variant="outline"
                  disabled={Boolean(busy) || reasonMissing}
                  aria-busy={rejectBusy}
                  onClick={() =>
                    onDecision(
                      task,
                      "reject",
                      reason.trim() || undefined,
                    )
                  }
                >
                  <XCircle />
                  {t("admin.marketing.reject")}
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Errors({ items, t, formatDate }: { items: MarketingErrorItem[]; t: Translate; formatDate: DateFormatter }) {
  if (!items.length) {
    return <Empty t={t} />;
  }

  return (
    <div className="min-w-0 space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="min-w-0 rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-4 shadow-sm"
        >
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="break-words font-black text-destructive">
                {machineLabel(t, item.eventCode)}
              </p>

              <code
                dir="ltr"
                className="mt-1 block max-w-full break-all text-start text-[11px] text-destructive/80"
              >
                {item.eventCode}
              </code>
            </div>

            <time className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
              {formatDate(item.createdAt)}
            </time>
          </div>

          <p className="mt-3 break-words text-sm leading-6">
            {item.message}
          </p>

          <p
            dir="ltr"
            className="mt-2 break-all text-start text-xs text-muted-foreground"
          >
            Task #{item.taskId}
            {item.attemptId
              ? "  Attempt #" + item.attemptId
              : ""}
          </p>
        </article>
      ))}
    </div>
  );
}

function Audit({ items, t, formatDate }: { items: MarketingAuditItem[]; t: Translate; formatDate: DateFormatter }) {
  if (!items.length) {
    return <Empty t={t} />;
  }

  return (
    <div className="min-w-0">
      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <article
            key={item.id}
            className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <div className="flex min-w-0 flex-col gap-2">
              <p className="break-words font-semibold">
                {machineLabel(t, item.eventType)}
              </p>

              <code
                dir="ltr"
                className="block max-w-full break-all text-start text-[11px] text-muted-foreground"
              >
                {item.eventType}
              </code>
            </div>

            <dl className="mt-4 grid min-w-0 gap-3">
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-muted-foreground">
                  {t("admin.marketing.actor")}
                </dt>
                <dd
                  dir="ltr"
                  className="mt-1 break-all text-start text-sm"
                >
                  {item.actor}
                </dd>
              </div>

              <div className="min-w-0">
                <dt className="text-xs font-semibold text-muted-foreground">
                  {t("admin.marketing.entity")}
                </dt>
                <dd className="mt-1 min-w-0 text-sm">
                  <p className="break-words">
                    {item.entityType
                      ? machineLabel(t, item.entityType)
                      : ""}
                  </p>

                  {item.entityId ? (
                    <code
                      dir="ltr"
                      className="mt-1 block max-w-full break-all text-start text-[11px] text-muted-foreground"
                    >
                      {item.entityId}
                    </code>
                  ) : null}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold text-muted-foreground">
                  {t("admin.marketing.date")}
                </dt>
                <dd className="mt-1 text-sm text-muted-foreground">
                  {formatDate(item.createdAt)}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="p-3 text-start">
                {t("admin.marketing.event")}
              </th>
              <th className="p-3 text-start">
                {t("admin.marketing.actor")}
              </th>
              <th className="p-3 text-start">
                {t("admin.marketing.entity")}
              </th>
              <th className="p-3 text-start">
                {t("admin.marketing.date")}
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-t border-border/50 transition-colors hover:bg-muted/20"
              >
                <td className="p-3 align-top">
                  <p className="font-semibold">
                    {machineLabel(t, item.eventType)}
                  </p>
                  <code
                    dir="ltr"
                    className="block max-w-64 break-all text-start text-[11px] text-muted-foreground"
                  >
                    {item.eventType}
                  </code>
                </td>

                <td
                  dir="ltr"
                  className="max-w-64 break-all p-3 text-start align-top"
                >
                  {item.actor}
                </td>

                <td className="p-3 align-top">
                  <p>
                    {item.entityType
                      ? machineLabel(t, item.entityType)
                      : ""}
                  </p>

                  {item.entityId ? (
                    <code
                      dir="ltr"
                      className="block max-w-64 break-all text-start text-[11px] text-muted-foreground"
                    >
                      {item.entityId}
                    </code>
                  ) : null}
                </td>

                <td className="whitespace-nowrap p-3 align-top text-muted-foreground">
                  {formatDate(item.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Settings({ data, t, formatDate }: { data: PlatformData; t: Translate; formatDate: DateFormatter }) {
  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
      <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
        <h2 className="font-black">
          {t("admin.marketing.runtime_settings")}
        </h2>

        <dl className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
          <Metric
            label={t("admin.marketing.poll_interval")}
            value={data.worker.pollIntervalMs + " ms"}
          />
          <Metric
            label={t("admin.marketing.batch_size")}
            value={data.worker.batchSize}
          />
          <Metric
            label={t("admin.marketing.lock_ttl")}
            value={data.worker.lockTtlSeconds + " s"}
          />
          <Metric
            label={t("admin.marketing.expired_locks")}
            value={data.worker.expiredLocks}
          />
        </dl>
      </section>

      <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
        <h2 className="font-black">
          {t("admin.marketing.agent_settings")}
        </h2>

        <div className="mt-4 min-w-0 space-y-3">
          {data.settings.settings.length ? (
            data.settings.settings.map((setting) => (
              <article
                key={setting.id}
                className="min-w-0 rounded-xl border border-border/50 bg-muted/25 p-3 sm:p-4"
              >
                <div className="min-w-0">
                  <h3 className="break-words font-bold">
                    {machineLabel(t, setting.key)}
                  </h3>

                  <code
                    dir="ltr"
                    className="mt-1 block max-w-full break-all text-start text-[11px] text-muted-foreground"
                  >
                    {setting.agentType}
                  </code>
                </div>

                <div className="mt-3 min-w-0">
                  <StructuredData
                    data={setting.value}
                    t={t}
                    formatDate={formatDate}
                  />
                </div>

                <p className="mt-3 break-words text-xs text-muted-foreground">
                  {t("admin.marketing.updated")}:{" "}
                  {formatDate(setting.updatedAt)}
                </p>
              </article>
            ))
          ) : (
            <Empty t={t} />
          )}
        </div>
      </section>

      <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5 xl:col-span-2">
        <h2 className="font-black">
          {t("admin.marketing.schedules")}
        </h2>

        <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-2">
          {data.settings.schedules.length ? (
            data.settings.schedules.map((schedule) => (
              <article
                key={schedule.id}
                className="min-w-0 rounded-xl border border-border/50 bg-muted/25 p-4"
              >
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words font-bold">
                      {machineLabel(t, schedule.key)}
                    </h3>

                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {schedule.intervalDays
                        ? t("admin.marketing.schedule_every_days", {
                            count: schedule.intervalDays,
                          })
                        : t("admin.marketing.schedule_defined")}
                    </p>
                  </div>

                  <StatusBadge
                    status={schedule.enabled ? "ENABLED" : "DISABLED"}
                    t={t}
                  />
                </div>

                <dl className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
                  <Metric
                    label={t("admin.marketing.next_run")}
                    value={formatDate(schedule.nextRunAt)}
                  />
                  <Metric
                    label={t("admin.marketing.last_run")}
                    value={formatDate(schedule.lastRunAt)}
                  />
                </dl>

                <details className="mt-3 min-w-0 rounded-lg border border-border/50 bg-background/70 p-2.5">
                  <summary className="cursor-pointer rounded-md text-xs font-semibold text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
                    {t("admin.marketing.technical_details")}
                  </summary>

                  <code
                    dir="ltr"
                    className="mt-2 block max-w-full break-all text-start text-xs text-muted-foreground"
                  >
                    {schedule.agentType}
                    {" · "}
                    {schedule.taskType}
                  </code>

                  <code
                    dir="ltr"
                    className="mt-1 block max-w-full break-all text-start text-xs text-muted-foreground"
                  >
                    {schedule.cronExpression}
                    {" · "}
                    {schedule.zoneId}
                  </code>
                </details>
              </article>
            ))
          ) : (
            <Empty t={t} />
          )}
        </div>
      </section>
    </div>
  );
}
const ANALYTICS_POLICY_KEYS = ["initialBackfillDays", "intervalDays", "noDataDays", "sourceFailureHours"] as const;
const ANALYTICS_THRESHOLD_KEYS = ["windowDays", "emergingImpressions", "emergingPositionMin", "emergingPositionMax", "opportunityImpressions", "opportunityPositionMin", "opportunityPositionMax", "establishedPositionMax", "establishedClicks", "positionDecline", "clicksDeclinePercent", "ctrDeclinePercent", "stableWindows"] as const;

function selectAnalyticsSettings(
  source: Record<string, number>,
  fallback: Record<string, number>,
  keys: readonly string[],
) {
  return Object.fromEntries(keys.flatMap((key) => {
    const value = Number.isFinite(source[key]) ? source[key] : fallback[key];
    return Number.isFinite(value) ? [[key, value]] : [];
  }));
}

function AnalyticsPanel({ data, busy, t, formatDate, onSync, onSettings }: { data: PlatformData; busy: string | null; t: Translate; formatDate: DateFormatter; onSync: () => void; onSettings: (policy: Record<string, number>, thresholds: Record<string, number>) => void }) {
  const values =
    data.analyticsSettings.values as unknown as Record<string, number>;

  const [policy, setPolicy] = useState(() =>
    selectAnalyticsSettings(
      data.analyticsSettings.policy,
      values,
      ANALYTICS_POLICY_KEYS,
    )
  );

  const [thresholds, setThresholds] = useState(() =>
    selectAnalyticsSettings(
      data.analyticsSettings.thresholds,
      values,
      ANALYTICS_THRESHOLD_KEYS,
    )
  );

  const status = data.analyticsStatus;
  const syncBusy = busy === "analytics-sync";
  const settingsBusy = busy === "analytics-settings";

  const numberField = (
    group: "policy" | "thresholds",
    key: string,
    value: number,
  ) => (
    <label
      key={group + "-" + key}
      className="min-w-0 space-y-1.5 text-xs font-semibold text-muted-foreground"
    >
      <span className="block break-words">
        {t("admin.marketing.analytics_" + key)}
      </span>

      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={value}
        disabled={Boolean(busy)}
        onChange={(event) => {
          const next = Number(event.target.value);

          if (group === "policy") {
            setPolicy((current) => ({
              ...current,
              [key]: next,
            }));
          } else {
            setThresholds((current) => ({
              ...current,
              [key]: next,
            }));
          }
        }}
        className="h-10 w-full min-w-0 rounded-xl border border-border/60 bg-background px-3 text-foreground outline-none transition-shadow focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          icon={<ShieldCheck />}
          label={t("admin.marketing.analytics_auth")}
          value={
            status.serviceAccountConfigured
              ? t("admin.marketing.configured")
              : t("admin.marketing.not_configured")
          }
          valueClassName={
            status.serviceAccountConfigured
              ? "text-green-600"
              : "text-amber-600"
          }
        />

        <AdminMetricCard
          icon={<BarChart3 />}
          label="GA4"
          value={status.ga4PropertyResource}
        />

        <AdminMetricCard
          icon={<SearchCheck />}
          label="Search Console"
          value={t("admin.marketing.analytics_rijvia_property")}
        />

        <AdminMetricCard
          icon={<History />}
          label={t("admin.marketing.latest_data")}
          value={
            status.latestSearchConsoleDate ??
            t("admin.marketing.never")
          }
        />
      </div>

      {status.alerts.length ? (
        <section className="min-w-0 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900 dark:bg-amber-950/10">
          <div className="space-y-2">
            {status.alerts.map((alert) => (
              <div key={alert} className="min-w-0">
                <p className="break-words font-semibold">
                  {machineLabel(t, alert)}
                </p>
                <code
                  dir="ltr"
                  className="mt-0.5 block max-w-full break-all text-start text-[11px] opacity-80"
                >
                  {alert}
                </code>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="min-w-0">
        <Button
          className="w-full sm:w-auto"
          onClick={onSync}
          disabled={
            !status.serviceAccountConfigured ||
            Boolean(busy)
          }
          aria-busy={syncBusy}
        >
          <RefreshCw
            className={cn(
              "h-4 w-4",
              syncBusy && "animate-spin",
            )}
          />
          {t("admin.marketing.analytics_sync")}
        </Button>

        {!status.serviceAccountConfigured ? (
          <p className="mt-2 break-words text-xs font-semibold text-amber-700">
            {t("admin.marketing.not_configured")}
          </p>
        ) : null}
      </div>

      <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
        <h2 className="font-black">
          {t("admin.marketing.analytics_sources")}
        </h2>

        <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-2">
          {status.sources.length ? (
            status.sources.map((source, index) => (
              <StructuredRecordCard
                key={"analytics-source-" + index}
                data={source}
                titleField="source"
                fallbackTitle={t("admin.marketing.analytics_source")}
                t={t}
                formatDate={formatDate}
              />
            ))
          ) : (
            <Empty t={t} />
          )}
        </div>
      </section>

      <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
        <h2 className="font-black">
          {t("admin.marketing.analytics_thresholds")}
        </h2>

        <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(policy).map(([key, value]) =>
            numberField("policy", key, value)
          )}

          {Object.entries(thresholds).map(([key, value]) =>
            numberField("thresholds", key, value)
          )}
        </div>

        <Button
          className="mt-4 w-full sm:w-auto"
          variant="outline"
          disabled={Boolean(busy)}
          aria-busy={settingsBusy}
          onClick={() => onSettings(policy, thresholds)}
        >
          {t("admin.marketing.save_settings")}
        </Button>
      </section>

      <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
        <h2 className="font-black">
          {t("admin.marketing.analytics_reports")}
        </h2>

        <div className="mt-4 min-w-0 space-y-3">
          {data.reports.length ? (
            data.reports.map((report, index) => (
              <StructuredRecordCard
                key={String(report.id ?? index)}
                data={report}
                titleField="snapshot_type"
                fallbackTitle={t("admin.marketing.analytics_report")}
                t={t}
                formatDate={formatDate}
              />
            ))
          ) : (
            <Empty t={t} />
          )}
        </div>
      </section>
    </div>
  );
}
function YouTubePanel({ status, busy, t, onSync }: { status: YouTubeStatus; busy: string | null; t: Translate; onSync: () => void }) {
  const syncBusy = busy === "youtube-sync";

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          icon={<Youtube />}
          label={t("admin.marketing.youtube_channel")}
          value={status.channelHandle}
        />
        <AdminMetricCard
          icon={<Activity />}
          label={t("admin.marketing.youtube_videos")}
          value={status.videoCount}
        />
        <AdminMetricCard
          icon={<ClipboardCheck />}
          label={t("admin.marketing.youtube_packages")}
          value={status.contentPackageCount}
        />
        <AdminMetricCard
          icon={<ListTodo />}
          label={t("admin.marketing.youtube_social_drafts")}
          value={status.socialDraftCount}
        />
      </div>

      <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-black">
              {t("admin.marketing.youtube_monitor")}
            </h2>

            <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">
              {t("admin.marketing.youtube_interval", {
                hours: status.monitoringIntervalHours,
              })}
            </p>

            {!status.apiKeyConfigured ? (
              <p className="mt-2 break-words text-xs font-semibold text-amber-700">
                {t("admin.marketing.not_configured")}
              </p>
            ) : null}
          </div>

          <Button
            className="w-full sm:w-auto sm:shrink-0"
            onClick={onSync}
            disabled={
              !status.apiKeyConfigured ||
              Boolean(busy)
            }
            aria-busy={syncBusy}
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                syncBusy && "animate-spin",
              )}
            />
            {t("admin.marketing.youtube_sync")}
          </Button>
        </div>

        <dl className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label={t("admin.marketing.status")}
            value={
              <StatusBadge
                status={
                  status.apiKeyConfigured
                    ? "CONFIGURED"
                    : "NOT_CONFIGURED"
                }
                t={t}
              />
            }
          />

          <Metric
            label={t("admin.marketing.youtube_access")}
            value={
              status.readOnly
                ? t("admin.marketing.read_only")
                : ""
            }
          />

          <Metric
            label={t("admin.marketing.youtube_channel_id")}
            value={status.channelId}
          />

          <Metric
            label={t("admin.marketing.youtube_last_sync")}
            value={
              status.latestSync.status
                ? (
                    <StatusBadge
                      status={String(status.latestSync.status)}
                      t={t}
                    />
                  )
                : t("admin.marketing.never")
            }
          />
        </dl>

        <TechnicalDetails
          data={status.latestSync}
          t={t}
        />
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <YouTubeVideoList
          title={t("admin.marketing.youtube_latest")}
          videos={status.latestVideos}
          t={t}
        />
        <YouTubeVideoList
          title={t("admin.marketing.youtube_best")}
          videos={status.bestVideos}
          t={t}
        />
      </div>
    </div>
  );
}
function YouTubeVideoList({ title, videos, t }: { title: string; videos: Array<Record<string, unknown>>; t: Translate }) {
  return (
    <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h2 className="min-w-0 break-words font-black">
          {title}
        </h2>

        <Badge variant="outline" className="shrink-0">
          {videos.length}
        </Badge>
      </div>

      <div className="mt-4 min-w-0 space-y-3">
        {videos.length ? (
          videos.map((video) => (
            <article
              key={String(video.video_id)}
              className="min-w-0 rounded-xl border border-border/40 bg-muted/30 p-3 sm:p-4"
            >
              <p className="break-words text-sm font-bold leading-6">
                {String(video.title)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {t("admin.marketing.youtube_views")}:{" "}
                <span dir="ltr">
                  {String(video.view_count ?? 0)}
                </span>
              </p>

              <TechnicalDetails
                data={video}
                t={t}
              />
            </article>
          ))
        ) : (
          <Empty t={t} />
        )}
      </div>
    </section>
  );
}
function DiscoveryPanel({ data, t, formatDate }: { data: AnalyticsDiscovery; t: Translate; formatDate: DateFormatter }) {
  const cards = [
    ["opportunities", data.opportunities, "query"],
    ["content_gaps", data.contentGaps, "query"],
    [
      "query_classifications",
      data.queryClassifications,
      "search_intent",
    ],
    [
      "language_performance",
      data.languages,
      "language",
    ],
    [
      "device_performance",
      data.devices,
      "device",
    ],
  ] as const;

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
      {cards.map(([key, items, titleField]) => (
        <section
          key={key}
          className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5"
        >
          <div className="flex min-w-0 items-start justify-between gap-3">
            <h2 className="min-w-0 break-words font-black">
              {t("admin.marketing." + key)}
            </h2>

            <Badge
              variant="outline"
              className="shrink-0"
            >
              {items.length}
            </Badge>
          </div>

          <div className="mt-4 min-w-0 space-y-3">
            {items.length ? (
              items.map((item, index) => (
                <StructuredRecordCard
                  key={
                    key +
                    "-" +
                    String(item.id ?? index)
                  }
                  data={item}
                  titleField={titleField}
                  fallbackTitle={t(
                    "admin.marketing." +
                    key +
                    "_item"
                  )}
                  t={t}
                  formatDate={formatDate}
                />
              ))
            ) : (
              <Empty t={t} />
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
function SeoMigrationPanel({
  workspace,
  busy,
  t,
  formatDate,
  onImport,
}: {
  workspace: SeoMigrationWorkspace;
  busy: string | null;
  t: Translate;
  formatDate: DateFormatter;
  onImport: (file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const latest = workspace.latestImport;
  const counts = latest.sheetCounts ?? {};
  const importBusy = busy === "seo-import";

  const sections: Array<[string, unknown]> = [
    ["migration_readiness", workspace.migrationReadiness],
    ["internal_links", workspace.internalLinks],
    ["content_backlog", workspace.contentBacklog],
    ["strategy_context", workspace.strategy],
    ["authority", workspace.authority],
    ["social", workspace.social],
  ];

  return (
    <div className="min-w-0 space-y-5">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          icon={<Import />}
          label={t("admin.marketing.seo_snapshot")}
          value={
            latest.status
              ? <StatusBadge status={latest.status} t={t} />
              : t("admin.marketing.never")
          }
        />

        <AdminMetricCard
          icon={<SearchCheck />}
          label={t("admin.marketing.seo_queries")}
          value={
            counts["طلبات البحث"] ??
            0
          }
        />

        <AdminMetricCard
          icon={<BarChart3 />}
          label={t("admin.marketing.seo_pages")}
          value={
            counts["الصفحات"] ??
            0
          }
        />

        <AdminMetricCard
          icon={<ShieldCheck />}
          label={t("admin.marketing.seo_canonical")}
          value={
            <span className="inline-flex min-w-0 flex-wrap items-center justify-center gap-2">
              <span
                dir="ltr"
                className="max-w-full break-all"
              >
                {workspace.targetDomain}
              </span>
              <StatusBadge
                status={workspace.canonicalActivation}
                t={t}
              />
            </span>
          }
        />
      </div>

      <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="font-black">
              {t("admin.marketing.seo_import_title")}
            </h2>

            <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">
              {t("admin.marketing.seo_import_description")}
            </p>

            {latest.sourceFileName ? (
              <p className="mt-2 max-w-full break-all text-xs text-muted-foreground">
                {marketingDisplayText(latest.sourceFileName)}
                {" · "}
                {latest.periodStart}
                {" — "}
                {latest.periodEnd}
              </p>
            ) : null}

            {latest.sourceFileName ? (
              <div className="mt-3 min-w-0">
                <StructuredData
                  data={latest}
                  t={t}
                  formatDate={formatDate}
                  technicalDetails
                />
              </div>
            ) : null}
          </div>

          {workspace.localImportEnabled ? (
            <div className="flex w-full min-w-0 flex-col gap-2 lg:max-w-xl sm:flex-row">
              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                aria-label={t("admin.marketing.seo_choose_file")}
                disabled={Boolean(busy)}
                onChange={(event) =>
                  setFile(
                    event.target.files?.[0] ?? null
                  )
                }
                className="min-h-11 w-full min-w-0 flex-1 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 file:me-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:font-semibold file:text-primary"
              />

              <Button
                className="w-full sm:w-auto sm:shrink-0"
                disabled={!file || Boolean(busy)}
                aria-busy={importBusy}
                onClick={() => {
                  if (file) {
                    onImport(file);
                  }
                }}
              >
                <Import
                  className={cn(
                    "h-4 w-4",
                    importBusy && "animate-pulse",
                  )}
                />
                {t("admin.marketing.seo_import")}
              </Button>
            </div>
          ) : (
            <StatusBadge
              status="IMPORT_DISABLED"
              t={t}
            />
          )}
        </div>
      </section>

      <section className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <h2 className="min-w-0 break-words font-black">
            {t("admin.marketing.opportunities")}
          </h2>

          <Badge
            variant="outline"
            className="shrink-0"
          >
            {workspace.opportunities.length}
          </Badge>
        </div>

        <div className="mt-4 min-w-0 space-y-3">
          {workspace.opportunities.length ? (
            workspace.opportunities
              .slice(0, 25)
              .map((item, index) => (
                <StructuredRecordCard
                  key={
                    "seo-opportunity-" +
                    String(item.id ?? index)
                  }
                  data={item}
                  titleField="query"
                  fallbackTitle={t(
                    "admin.marketing.opportunity_item"
                  )}
                  t={t}
                  formatDate={formatDate}
                />
              ))
          ) : (
            <Empty t={t} />
          )}
        </div>
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        {sections.map(([key, value]) => (
          <section
            key={key}
            className="min-w-0 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5"
          >
            <h2 className="break-words font-black">
              {t("admin.marketing.seo_" + key)}
            </h2>

            <div className="mt-4 min-w-0">
              <StructuredData
                data={value}
                t={t}
                formatDate={formatDate}
              />
            </div>
          </section>
        ))}
      </div>

      {workspace.ownerDecisionsRequired.length ? (
        <section className="min-w-0 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-amber-900 dark:bg-amber-950/10 sm:p-5">
          <h2 className="font-black">
            {t("admin.marketing.seo_owner_decisions")}
          </h2>

          <ul className="mt-3 list-outside list-disc space-y-2 ps-5 text-sm leading-6">
            {workspace.ownerDecisionsRequired.map(
              (decision) => (
                <li
                  key={decision}
                  className="break-words"
                >
                  {ownerDecisionText(decision, t)}
                </li>
              )
            )}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
