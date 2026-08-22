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
  intervalDays: number | null;
  zoneId: string;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

export interface AnalyticsStatus {
  serviceAccountConfigured: boolean;
  authenticationMode: string;
  ga4AccountId: string;
  ga4PropertyResource: string;
  searchConsoleSiteUrl: string;
  latestSearchConsoleDate: string | null;
  sources: Array<Record<string, unknown>>;
  alerts: string[];
}

export interface AnalyticsValues {
  initialBackfillDays: number;
  intervalDays: number;
  noDataDays: number;
  sourceFailureHours: number;
  windowDays: number;
  emergingImpressions: number;
  emergingPositionMin: number;
  emergingPositionMax: number;
  opportunityImpressions: number;
  opportunityPositionMin: number;
  opportunityPositionMax: number;
  establishedPositionMax: number;
  establishedClicks: number;
  positionDecline: number;
  clicksDeclinePercent: number;
  ctrDeclinePercent: number;
  stableWindows: number;
}

export interface AnalyticsSettingsView {
  values: AnalyticsValues;
  policy: Record<string, number>;
  thresholds: Record<string, number>;
}

export interface AnalyticsDiscovery {
  opportunities: Array<Record<string, unknown>>;
  contentGaps: Array<Record<string, unknown>>;
  queryClassifications: Array<Record<string, unknown>>;
  languages: Array<Record<string, unknown>>;
  devices: Array<Record<string, unknown>>;
}

export interface YouTubeStatus {
  apiKeyConfigured: boolean;
  readOnly: boolean;
  channelHandle: string;
  channelId: string;
  monitoringIntervalHours: number;
  videoCount: number;
  contentPackageCount: number;
  socialDraftCount: number;
  latestSync: Record<string, unknown>;
  latestVideos: Array<Record<string, unknown>>;
  bestVideos: Array<Record<string, unknown>>;
}

export interface SeoMigrationImport {
  id?: number;
  sourceFileName?: string;
  fileSha256?: string;
  periodStart?: string;
  periodEnd?: string;
  sheetCounts?: Record<string, number>;
  ignoredRowCount?: number;
  status?: string;
  importedAt?: string;
}

export interface SeoMigrationWorkspace {
  localImportEnabled: boolean;
  publishingEnabled: boolean;
  canonicalActivation: string;
  targetDomain: string;
  latestImport: SeoMigrationImport;
  opportunities: Array<Record<string, unknown>>;
  migrationReadiness: Record<string, unknown>;
  internalLinks: Array<Record<string, unknown>>;
  contentBacklog: Record<string, unknown>;
  strategy: Record<string, unknown>;
  authority: Record<string, unknown>;
  social: Record<string, unknown>;
  ownerDecisionsRequired: string[];
}

export type EditorialLanguage = "AR" | "NL" | "FR" | "EN";

export interface EditorialCurrentVersion {
  language: EditorialLanguage;
  versionNumber: number;
  title: string;
  slug: string | null;
  status: string;
  createdAt: string;
  createdBy: string | null;
}

export interface EditorialTopic {
  topicId: number;
  topicKey: string;
  order: number;
  sourceType: string;
  title: string;
  titleLanguage: EditorialLanguage;
  primaryLanguage: EditorialLanguage | null;
  priority: string | null;
  strategyContextResolved: boolean;
  articleId: number | null;
  lifecycleState: string | null;
  canonicalLanguage: EditorialLanguage | null;
  currentVersions: EditorialCurrentVersion[];
}

export interface EditorialWorkspace {
  languages: EditorialLanguage[];
  qualityGates: string[];
  topics: EditorialTopic[];
}

export interface EditorialApprovalRequest {
  passedQualityGates: string[];
  reason: string;
}

export interface EditorialVersion extends EditorialCurrentVersion {
  id: number;
  articleId: number;
  summary: string | null;
  body: string;
  current: boolean;
}

export interface EditorialSaveRequest {
  title: string;
  slug: string | null;
  summary: string | null;
  body: string;
  expectedCurrentVersion: number | null;
}

export interface EditorialSaveResult {
  topicId: number;
  articleId: number;
  lifecycleState: string;
  articleCreated: boolean;
  created: boolean;
  version: EditorialVersion;
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
