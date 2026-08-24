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
  uspId: number | null;
  icpId: string | null;
  contentPillarId: number | null;
  funnelStageId: number | null;
  conversionGoalId: number | null;
  articleId: number | null;
  lifecycleState: string | null;
  canonicalLanguage: EditorialLanguage | null;
  image: EditorialArticleImageAsset | null;
  currentVersions: EditorialCurrentVersion[];
}

export interface EditorialAuthoringStatus {
  topicId: number;
  topicStatus: string;
  articleId: number | null;
  lifecycleState: string | null;
  briefId: number | null;
  briefStatus: string | null;
  briefLanguage: EditorialLanguage | null;
  briefReference: string | null;
  claimsTotal: number;
  claimsSupported: number;
  claimsRequiringReview: number;
  claimsMissing: number;
  latestBriefTaskStatus: string | null;
  latestSourceTaskStatus: string | null;
  latestDraftTaskStatus: string | null;
  canCreateBrief: boolean;
  canCollectSources: boolean;
  canCreateDraft: boolean;
}

export interface MarketingStrategySnapshot {
  usps: Array<{
    id: number;
    title: string;
    description: string;
    active: boolean;
  }>;
  icps: Array<{
    id: string;
    name: string;
    language: string;
    active: boolean;
  }>;
  contentPillars: Array<{
    id: number;
    pillarKey: string;
    name: string;
    active: boolean;
  }>;
  funnelStages: Array<{
    id: number;
    stageKey: string;
    sequenceNumber: number;
    active: boolean;
  }>;
  conversionGoals: Array<{
    id: number;
    goalKey: string;
    name: string;
    primaryCta: string;
    funnelStageId: number;
    active: boolean;
  }>;
}

export interface EditorialArticleImageVariant {
  type: "HERO" | "CARD" | "MOBILE" | "OG";
  format: "JPEG";
  publicPath: string;
  width: number;
  height: number;
  byteSize: number;
}

export interface EditorialArticleImageLocalization {
  language: EditorialLanguage;
  altText: string;
  caption: string | null;
}

export interface EditorialArticleImageLicense {
  id: number;
  sourcePlatform: "UNSPLASH" | "PIXABAY" | "PEXELS";
  sourceAssetId: string;
  sourceUrl: string;
  photographerName: string;
  photographerUrl: string;
  licenseName: string;
  licenseUrl: string;
  licenseVerifiedAt: string;
  downloadedAt: string;
  originalFileName: string;
  approvedBy: string;
  approvedAt: string;
  approvalReason: string;
}

export interface EditorialArticleImageAsset {
  id: number;
  articleId: number;
  status: "APPROVED" | "PENDING_LICENSE" | "SUPERSEDED";
  originalFileName: string;
  originalWidth: number;
  originalHeight: number;
  focalPointX: number;
  focalPointY: number;
  variants: EditorialArticleImageVariant[];
  localizations: EditorialArticleImageLocalization[];
  license: EditorialArticleImageLicense | null;
  createdAt: string;
  createdBy: string;
}

export interface EditorialContentGraphNode {
  id: string;
  type: string;
  label: string;
  language: EditorialLanguage;
  path: string | null;
  published: boolean;
}

export interface EditorialContentGraphEdge {
  sourceId: string;
  targetId: string;
  type: string;
  targetPath: string;
  anchorText: string;
}

export interface EditorialContentGraphOrphan {
  articleId: number;
  language: EditorialLanguage;
  title: string;
  lifecycleState: string;
  reason: string;
}

export interface EditorialContentGraph {
  articleNodeCount: number;
  assetNodeCount: number;
  edgeCount: number;
  orphanArticleCount: number;
  nodes: EditorialContentGraphNode[];
  edges: EditorialContentGraphEdge[];
  orphanArticles: EditorialContentGraphOrphan[];
}

export interface EditorialWorkspace {
  languages: EditorialLanguage[];
  qualityGates: string[];
  contentGraph: EditorialContentGraph;
  topics: EditorialTopic[];
}

export interface EditorialPerformanceMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  averagePosition: number;
}

export interface EditorialPerformanceSnapshot {
  id: number;
  articleId: number;
  publicationId: number;
  language: EditorialLanguage;
  publishedPath: string;
  periodStart: string;
  periodEnd: string;
  current: EditorialPerformanceMetrics;
  previous: EditorialPerformanceMetrics;
  evidenceState: "PRESENT" | "MISSING";
  indexingState: "DISCOVERED" | "NO_DATA";
  createdAt: string;
}

export interface EditorialRefreshRecommendation {
  id: number;
  recommended: boolean;
  reasonCodes: string[];
  evidence: Record<string, unknown>;
  periodEnd: string;
  createdAt: string;
}

export interface EditorialPerformanceOverview {
  latestSnapshots: EditorialPerformanceSnapshot[];
  latestRecommendation: EditorialRefreshRecommendation | null;
}

export interface EditorialApprovalRequest {
  passedQualityGates: string[];
  reason: string;
}

export interface EditorialInternalLink {
  type: "ARTICLE" | "LESSON" | "TRAFFIC_SIGN" | "PRACTICE" | "EXAM" | "VIDEO";
  targetPath: string;
  anchorText: string;
}

export type EditorialInternalLinkInput = Pick<
  EditorialInternalLink,
  "targetPath" | "anchorText"
>;

export interface EditorialVersion extends EditorialCurrentVersion {
  id: number;
  articleId: number;
  summary: string | null;
  body: string;
  metaTitle: string | null;
  metaDescription: string | null;
  internalLinks: EditorialInternalLink[];
  current: boolean;
}

export interface EditorialSaveRequest {
  title: string;
  slug: string | null;
  summary: string | null;
  body: string;
  metaTitle: string;
  metaDescription: string;
  internalLinks: EditorialInternalLinkInput[];
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
  if (["COMPLETED", "HEALTHY", "APPROVED", "RELEASED"].includes(status)) return "success";
  if (["FAILED", "REJECTED", "DEGRADED"].includes(status)) return "danger";
  if (["WAITING_APPROVAL", "RETRY_SCHEDULED", "SCHEDULED"].includes(status)) return "warning";
  return "default";
}

export function formatSettingValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}
