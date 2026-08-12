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
  History,
  ListTodo,
  RefreshCw,
  RotateCcw,
  SearchCheck,
  Settings2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { apiClient, logApiError } from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminMetricCard from "@/components/admin/AdminMetricCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  formatSettingValue,
  statusTone,
  taskCount,
} from "@/lib/marketing-admin";

type View = "overview" | "analytics" | "discovery" | "agents" | "tasks" | "approvals" | "errors" | "audit" | "settings";

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
}

const VIEWS: Array<{ key: View; icon: typeof Activity }> = [
  { key: "overview", icon: Activity },
  { key: "analytics", icon: BarChart3 },
  { key: "discovery", icon: SearchCheck },
  { key: "agents", icon: Bot },
  { key: "tasks", icon: ListTodo },
  { key: "approvals", icon: ClipboardCheck },
  { key: "errors", icon: AlertTriangle },
  { key: "audit", icon: History },
  { key: "settings", icon: Settings2 },
];

function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-border/60 bg-muted/30",
        tone === "success" && "border-green-200 bg-green-50 text-green-700",
        tone === "danger" && "border-red-200 bg-red-50 text-red-700",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {status.replaceAll("_", " ")}
    </Badge>
  );
}

export default function MarketingAdminPage() {
  const { t, language } = useLanguage();
  const [view, setView] = useState<View>("overview");
  const [data, setData] = useState<PlatformData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [overview, agents, tasks, errors, audit, settings, worker, analyticsStatus, analyticsSettings, discovery, reports] = await Promise.all([
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
      });
    } catch (requestError) {
      logApiError("Failed to load marketing admin platform", requestError);
      setError(true);
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
      toast.error(t("admin.marketing.action_failed"));
    } finally {
      setBusy(null);
    }
  };

  const approvals = useMemo(
    () => data?.tasks.items.filter((task) => task.status === "WAITING_APPROVAL") ?? [],
    [data],
  );

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
        badge={data ? <StatusBadge status={data.worker.status} /> : undefined}
        actions={
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            {t("admin.marketing.refresh")}
          </Button>
        }
      />

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card p-1.5 shadow-sm">
        <div className="flex min-w-max gap-1" role="tablist" aria-label={t("admin.marketing.title")}>
          {VIEWS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={cn(
                "flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors",
                view === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4" />
              {t(`admin.marketing.tab_${key}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingState /> : null}
      {!loading && error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="font-bold text-destructive">{t("admin.marketing.load_failed")}</p>
          <Button className="mt-4" onClick={load}>{t("common.retry")}</Button>
        </div>
      ) : null}
      {!loading && data && !error ? (
        <div role="tabpanel">
          {view === "overview" ? <Overview data={data} t={t} formatDate={formatDate} /> : null}
          {view === "analytics" ? (
            <AnalyticsPanel
              data={data}
              busy={busy}
              t={t}
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
          {view === "discovery" ? <DiscoveryPanel data={data.discovery} t={t} /> : null}
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
              onDecision={(task, decision) => mutate(
                `${decision}-${task.id}`,
                () => apiClient.post(`/admin/marketing/tasks/${task.id}/${decision}`, {}),
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

type Translate = (key: string) => string;
type DateFormatter = (value: string | null) => string;

function LoadingState() {
  return <div className="h-64 animate-pulse rounded-2xl border border-border/50 bg-muted/40" />;
}

function Empty({ t }: { t: Translate }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{t("admin.marketing.empty")}</p>;
}

function Overview({ data, t, formatDate }: { data: PlatformData; t: Translate; formatDate: DateFormatter }) {
  const counts = data.overview.tasksByStatus;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard icon={<ListTodo />} label={t("admin.marketing.tasks_today")} value={data.overview.tasksToday} />
        <AdminMetricCard icon={<CheckCircle2 />} label={t("admin.marketing.completed")} value={taskCount(counts, "COMPLETED")} valueClassName="text-green-600" />
        <AdminMetricCard icon={<XCircle />} label={t("admin.marketing.failed")} value={taskCount(counts, "FAILED")} valueClassName="text-destructive" />
        <AdminMetricCard icon={<ClipboardCheck />} label={t("admin.marketing.waiting_approval")} value={taskCount(counts, "WAITING_APPROVAL")} valueClassName="text-amber-600" />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="font-black">{t("admin.marketing.worker_health")}</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Metric label={t("admin.marketing.status")} value={<StatusBadge status={data.worker.status} />} />
            <Metric label={t("admin.marketing.active_agents")} value={data.overview.activeAgents} />
            <Metric label={t("admin.marketing.active_workers")} value={data.worker.activeWorkers} />
            <Metric label={t("admin.marketing.running_tasks")} value={data.worker.runningTasks} />
            <Metric label={t("admin.marketing.expired_locks")} value={data.worker.expiredLocks} />
            <Metric label={t("admin.marketing.checked_at")} value={formatDate(data.worker.checkedAt)} />
          </dl>
        </section>
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="font-black">{t("admin.marketing.recent_activity")}</h2>
          <div className="mt-4 space-y-3">
            {data.overview.recentActivity.length ? data.overview.recentActivity.map((item) => (
              <div key={item.id} className="flex min-w-0 items-start justify-between gap-3 border-b border-border/50 pb-3 last:border-0">
                <div className="min-w-0"><p className="break-words text-sm font-semibold">{item.eventType}</p><p className="text-xs text-muted-foreground">{item.actor}</p></div>
                <time className="shrink-0 text-xs text-muted-foreground">{formatDate(item.createdAt)}</time>
              </div>
            )) : <Empty t={t} />}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-xl bg-muted/45 p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-bold">{value}</dd></div>;
}

function Agents({ agents, busy, t, formatDate, onToggle }: { agents: MarketingAgent[]; busy: string | null; t: Translate; formatDate: DateFormatter; onToggle: (agent: MarketingAgent) => void }) {
  return agents.length ? <div className="grid gap-4 lg:grid-cols-2">{agents.map((agent) => (
    <article key={agent.agentType} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words font-black">{agent.displayName}</h2><StatusBadge status={agent.enabled ? "ENABLED" : "DISABLED"} /></div><p className="mt-1 break-words text-sm text-muted-foreground">{agent.description}</p></div>
        {agent.agentType !== "ADMIN_PLATFORM" ? <Button size="sm" variant="outline" disabled={busy === `agent-${agent.agentType}`} onClick={() => onToggle(agent)}>{agent.enabled ? t("admin.marketing.request_disable") : t("admin.marketing.request_enable")}</Button> : null}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><Metric label={t("admin.marketing.tasks_today")} value={agent.tasksToday} /><Metric label={t("admin.marketing.success_rate")} value={`${agent.successRate}%`} /><Metric label={t("admin.marketing.retries")} value={agent.retryCount} /><Metric label={t("admin.marketing.last_run")} value={formatDate(agent.lastRunAt)} /></dl>
    </article>
  ))}</div> : <Empty t={t} />;
}

function Tasks({ tasks, busy, t, formatDate, onRetry }: { tasks: MarketingTask[]; busy: string | null; t: Translate; formatDate: DateFormatter; onRetry: (task: MarketingTask) => void }) {
  return tasks.length ? <div className="space-y-3">{tasks.map((task) => (
    <article key={task.id} className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-black">#{task.id}</span><StatusBadge status={task.status} /><Badge variant="outline">{task.priority}</Badge></div><p className="mt-2 break-words text-sm font-semibold">{task.agentType} / {task.taskType}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(task.createdAt)} · {task.attempts}/{task.maxAttempts}</p>{task.errorCode ? <p className="mt-2 break-words text-xs text-destructive">{task.errorCode}: {task.errorMessage}</p> : null}</div>
      {task.status === "FAILED" ? <Button variant="outline" disabled={busy === `retry-${task.id}`} onClick={() => onRetry(task)}><RotateCcw />{t("admin.marketing.retry")}</Button> : null}
    </article>
  ))}</div> : <Empty t={t} />;
}

function Approvals({ tasks, busy, t, onDecision }: { tasks: MarketingTask[]; busy: string | null; t: Translate; onDecision: (task: MarketingTask, decision: "approve" | "reject") => void }) {
  return tasks.length ? <div className="space-y-3">{tasks.map((task) => (
    <article key={task.id} className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><p className="font-black">#{task.id} · {task.agentType}</p><p className="break-words text-sm text-muted-foreground">{task.taskType}</p></div>
      <div className="flex flex-wrap gap-2"><Button size="sm" disabled={busy === `approve-${task.id}`} onClick={() => onDecision(task, "approve")}><ShieldCheck />{t("admin.marketing.approve")}</Button><Button size="sm" variant="outline" disabled={busy === `reject-${task.id}`} onClick={() => onDecision(task, "reject")}><XCircle />{t("admin.marketing.reject")}</Button></div>
    </article>
  ))}</div> : <Empty t={t} />;
}

function Errors({ items, t, formatDate }: { items: MarketingErrorItem[]; t: Translate; formatDate: DateFormatter }) {
  return items.length ? <div className="space-y-3">{items.map((item) => <article key={item.id} className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black text-destructive">{item.eventCode}</p><time className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</time></div><p className="mt-2 break-words text-sm">{item.message}</p><p className="mt-1 text-xs text-muted-foreground">Task #{item.taskId}</p></article>)}</div> : <Empty t={t} />;
}

function Audit({ items, t, formatDate }: { items: MarketingAuditItem[]; t: Translate; formatDate: DateFormatter }) {
  return items.length ? <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card"><table className="w-full min-w-[720px] text-sm"><thead className="bg-muted/50 text-start text-muted-foreground"><tr><th className="p-3 text-start">{t("admin.marketing.event")}</th><th className="p-3 text-start">{t("admin.marketing.actor")}</th><th className="p-3 text-start">{t("admin.marketing.entity")}</th><th className="p-3 text-start">{t("admin.marketing.date")}</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t border-border/50"><td className="p-3 font-semibold">{item.eventType}</td><td className="p-3">{item.actor}</td><td className="p-3">{item.entityType ?? "—"} {item.entityId ?? ""}</td><td className="p-3 text-muted-foreground">{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div> : <Empty t={t} />;
}

function Settings({ data, t, formatDate }: { data: PlatformData; t: Translate; formatDate: DateFormatter }) {
  return <div className="grid gap-5 xl:grid-cols-2"><section className="rounded-2xl border border-border/60 bg-card p-5"><h2 className="font-black">{t("admin.marketing.runtime_settings")}</h2><dl className="mt-4 grid grid-cols-2 gap-3"><Metric label={t("admin.marketing.poll_interval")} value={`${data.worker.pollIntervalMs} ms`} /><Metric label={t("admin.marketing.batch_size")} value={data.worker.batchSize} /><Metric label={t("admin.marketing.lock_ttl")} value={`${data.worker.lockTtlSeconds} s`} /><Metric label={t("admin.marketing.expired_locks")} value={data.worker.expiredLocks} /></dl></section><section className="rounded-2xl border border-border/60 bg-card p-5"><h2 className="font-black">{t("admin.marketing.agent_settings")}</h2><div className="mt-4 space-y-3">{data.settings.settings.length ? data.settings.settings.map((setting) => <div key={setting.id} className="min-w-0 rounded-xl bg-muted/40 p-3"><p className="break-words font-bold">{setting.agentType} · {setting.key}</p><code className="mt-1 block max-w-full whitespace-pre-wrap break-all text-xs text-muted-foreground">{formatSettingValue(setting.value)}</code><p className="mt-2 text-xs text-muted-foreground">{t("admin.marketing.updated")}: {formatDate(setting.updatedAt)}</p></div>) : <Empty t={t} />}</div></section><section className="rounded-2xl border border-border/60 bg-card p-5 xl:col-span-2"><h2 className="font-black">{t("admin.marketing.schedules")}</h2><div className="mt-4 grid gap-3 lg:grid-cols-2">{data.settings.schedules.length ? data.settings.schedules.map((schedule) => <div key={schedule.id} className="rounded-xl bg-muted/40 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold">{schedule.key}</p><StatusBadge status={schedule.enabled ? "ENABLED" : "DISABLED"} /></div><p className="mt-1 break-words text-xs text-muted-foreground">{schedule.agentType} · {schedule.cronExpression} · {schedule.zoneId}</p><p className="mt-1 text-xs text-muted-foreground">{t("admin.marketing.next_run")}: {formatDate(schedule.nextRunAt)}</p></div>) : <Empty t={t} />}</div></section></div>;
}

function AnalyticsPanel({ data, busy, t, onSync, onSettings }: { data: PlatformData; busy: string | null; t: Translate; onSync: () => void; onSettings: (policy: Record<string, number>, thresholds: Record<string, number>) => void }) {
  const [policy, setPolicy] = useState(data.analyticsSettings.policy);
  const [thresholds, setThresholds] = useState(data.analyticsSettings.thresholds);
  const status = data.analyticsStatus;
  const numberField = (group: "policy" | "thresholds", key: string, value: number) => (
    <label key={`${group}-${key}`} className="min-w-0 space-y-1 text-xs font-semibold text-muted-foreground">
      <span className="break-words">{t(`admin.marketing.analytics_${key}`)}</span>
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (group === "policy") setPolicy((current) => ({ ...current, [key]: next }));
          else setThresholds((current) => ({ ...current, [key]: next }));
        }}
        className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
      />
    </label>
  );
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AdminMetricCard icon={<ShieldCheck />} label={t("admin.marketing.analytics_auth")} value={status.serviceAccountConfigured ? t("admin.marketing.configured") : t("admin.marketing.not_configured")} valueClassName={status.serviceAccountConfigured ? "text-green-600" : "text-amber-600"} />
      <AdminMetricCard icon={<BarChart3 />} label="GA4" value={status.ga4PropertyResource} />
      <AdminMetricCard icon={<SearchCheck />} label="Search Console" value={status.searchConsoleSiteUrl} />
      <AdminMetricCard icon={<History />} label={t("admin.marketing.latest_data")} value={status.latestSearchConsoleDate ?? t("admin.marketing.never")} />
    </div>
    {status.alerts.length ? <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm font-semibold text-amber-800">{status.alerts.join(" · ")}</div> : null}
    <div className="flex flex-wrap gap-2">
      <Button onClick={onSync} disabled={!status.serviceAccountConfigured || busy === "analytics-sync"}><RefreshCw className={cn("h-4 w-4", busy === "analytics-sync" && "animate-spin")} />{t("admin.marketing.analytics_sync")}</Button>
    </div>
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <h2 className="font-black">{t("admin.marketing.analytics_thresholds")}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(policy).map(([key, value]) => numberField("policy", key, value))}
        {Object.entries(thresholds).map(([key, value]) => numberField("thresholds", key, value))}
      </div>
      <Button className="mt-4" variant="outline" disabled={busy === "analytics-settings"} onClick={() => onSettings(policy, thresholds)}>{t("admin.marketing.save_settings")}</Button>
    </section>
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <h2 className="font-black">{t("admin.marketing.analytics_reports")}</h2>
      <div className="mt-4 space-y-3">{data.reports.length ? data.reports.map((report) => <pre key={String(report.id)} className="max-w-full overflow-x-auto rounded-xl bg-muted/40 p-3 text-xs">{JSON.stringify(report, null, 2)}</pre>) : <Empty t={t} />}</div>
    </section>
  </div>;
}

function DiscoveryPanel({ data, t }: { data: AnalyticsDiscovery; t: Translate }) {
  const cards = [
    ["opportunities", data.opportunities],
    ["content_gaps", data.contentGaps],
    ["query_classifications", data.queryClassifications],
    ["language_performance", data.languages],
    ["device_performance", data.devices],
  ] as const;
  return <div className="grid gap-5 xl:grid-cols-2">{cards.map(([key, items]) => <section key={key} className="min-w-0 rounded-2xl border border-border/60 bg-card p-5 shadow-sm"><h2 className="font-black">{t(`admin.marketing.${key}`)}</h2><div className="mt-4 space-y-3">{items.length ? items.map((item, index) => <pre key={`${key}-${index}`} className="max-w-full overflow-x-auto rounded-xl bg-muted/40 p-3 text-xs">{JSON.stringify(item, null, 2)}</pre>) : <Empty t={t} />}</div></section>)}</div>;
}
