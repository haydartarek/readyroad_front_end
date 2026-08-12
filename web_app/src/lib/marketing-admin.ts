export type TaskCounts = Record<string, number>;

export interface MarketingAuditItem {
  id: number;
  taskId: number | null;
  eventType: string;
  actor: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
}

export interface MarketingErrorItem {
  id: number;
  taskId: number;
  attemptId: number | null;
  eventCode: string;
  message: string;
  createdAt: string;
}

export interface MarketingOverview {
  enabled: boolean;
  tasksByStatus: TaskCounts;
  tasksToday: number;
  activeAgents: number;
  activeWorkers: number;
  recentActivity: MarketingAuditItem[];
  alerts: MarketingErrorItem[];
  generatedAt: string;
}

export interface MarketingAgent {
  agentType: string;
  displayName: string;
  description: string | null;
  enabled: boolean;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  currentTasks: number;
  tasksToday: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  retryCount: number;
  successRate: number;
}

export interface MarketingTask {
  id: number;
  agentType: string;
  taskType: string;
  status: string;
  priority: string;
  attempts: number;
  maxAttempts: number;
  requiresApproval: boolean;
  approvalMode: string;
  errorCode: string | null;
  errorMessage: string | null;
  scheduledAt: string | null;
  nextRetryAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingTaskPage {
  items: MarketingTask[];
  total: number;
}

export interface MarketingSetting {
  id: number;
  agentType: string;
  key: string;
  value: unknown;
  updatedBy: string;
  updatedAt: string;
}

export interface MarketingSchedule {
  id: number;
  agentType: string;
  key: string;
  taskType: string;
  cronExpression: string;
  zoneId: string;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

export interface MarketingSettings {
  settings: MarketingSetting[];
  schedules: MarketingSchedule[];
}

export interface MarketingWorkerHealth {
  status: "HEALTHY" | "DEGRADED" | "DISABLED";
  enabled: boolean;
  activeWorkers: number;
  runningTasks: number;
  expiredLocks: number;
  pollIntervalMs: number;
  batchSize: number;
  lockTtlSeconds: number;
  checkedAt: string;
}

export function taskCount(counts: TaskCounts | undefined, status: string) {
  return counts?.[status] ?? 0;
}

export function statusTone(status: string) {
  if (["COMPLETED", "HEALTHY", "APPROVED"].includes(status)) return "success";
  if (["FAILED", "REJECTED", "DEGRADED"].includes(status)) return "danger";
  if (["WAITING_APPROVAL", "RETRY_SCHEDULED", "SCHEDULED"].includes(status)) return "warning";
  return "default";
}

export function formatSettingValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}
