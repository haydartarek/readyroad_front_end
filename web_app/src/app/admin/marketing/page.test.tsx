import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import MarketingAdminPage from "./page";
import { apiClient } from "@/lib/api";

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({ t: (key: string) => key, language: "en", isRTL: false }),
}));
jest.mock("@/lib/api", () => ({
  apiClient: { get: jest.fn(), put: jest.fn(), post: jest.fn() },
  logApiError: jest.fn(),
}));

const get = apiClient.get as jest.Mock;
const put = apiClient.put as jest.Mock;
const post = apiClient.post as jest.Mock;

const responses: Record<string, unknown> = {
  "/admin/marketing/overview": {
    enabled: true,
    tasksByStatus: { COMPLETED: 3, FAILED: 1, WAITING_APPROVAL: 1 },
    tasksToday: 5,
    activeAgents: 2,
    activeWorkers: 1,
    recentActivity: [],
    alerts: [],
    generatedAt: "2026-08-12T10:00:00Z",
  },
  "/admin/marketing/agents": [
    {
      agentType: "STRATEGY",
      displayName: "Strategy Engine",
      description: "Approved strategy context",
      enabled: true,
      lastRunAt: null,
      lastSuccessAt: null,
      lastFailureAt: null,
      currentTasks: 0,
      tasksToday: 1,
      totalTasks: 1,
      completedTasks: 0,
      failedTasks: 0,
      retryCount: 0,
      successRate: 0,
    },
  ],
  "/admin/marketing/tasks": {
    total: 1,
    items: [
      {
        id: 7,
        agentType: "STRATEGY",
        taskType: "STRATEGY_CHANGE",
        status: "WAITING_APPROVAL",
        priority: "HIGH",
        attempts: 0,
        maxAttempts: 4,
        requiresApproval: true,
        approvalMode: "HUMAN_APPROVAL",
        errorCode: null,
        errorMessage: null,
        scheduledAt: null,
        nextRetryAt: null,
        createdAt: "2026-08-12T10:00:00Z",
        updatedAt: "2026-08-12T10:00:00Z",
      },
    ],
  },
  "/admin/marketing/errors": [],
  "/admin/marketing/audit": [],
  "/admin/marketing/settings": { settings: [], schedules: [] },
  "/admin/marketing/worker-health": {
    status: "HEALTHY",
    enabled: true,
    activeWorkers: 1,
    runningTasks: 0,
    expiredLocks: 0,
    pollIntervalMs: 5000,
    batchSize: 10,
    lockTtlSeconds: 600,
    checkedAt: "2026-08-12T10:00:00Z",
  },
  "/admin/marketing/analytics/status": {
    serviceAccountConfigured: false,
    authenticationMode: "DEDICATED_READ_ONLY_SERVICE_ACCOUNT",
    ga4AccountId: "403159538",
    ga4PropertyResource: "properties/548176182",
    searchConsoleSiteUrl: "sc-domain:readyroad.be",
    latestSearchConsoleDate: null,
    sources: [],
    alerts: ["GOOGLE_SERVICE_ACCOUNT_NOT_CONFIGURED"],
  },
  "/admin/marketing/analytics/settings": {
    values: {},
    policy: { initialBackfillDays: 90, intervalDays: 3, noDataDays: 6, sourceFailureHours: 3 },
    thresholds: { windowDays: 28, opportunityImpressions: 50 },
  },
  "/admin/marketing/analytics/organic-discovery": {
    opportunities: [],
    contentGaps: [],
    queryClassifications: [],
    languages: [],
    devices: [],
  },
  "/admin/marketing/analytics/reports": [],
  "/admin/marketing/youtube/status": {
    apiKeyConfigured: true,
    readOnly: true,
    channelHandle: "@RijBewijsBe",
    channelId: "UCs_IDQXCz6zADuHIdfS2C2w",
    monitoringIntervalHours: 24,
    videoCount: 13,
    contentPackageCount: 13,
    socialDraftCount: 52,
    latestSync: { status: "COMPLETED" },
    latestVideos: [],
    bestVideos: [],
  },
  "/admin/marketing/seo-migration/workspace": {
    localImportEnabled: true,
    publishingEnabled: false,
    canonicalActivation: "PENDING_RELEASE",
    targetDomain: "rijvia.be",
    latestImport: {
      id: 3,
      sourceFileName: "search-console.xlsx",
      periodStart: "2026-05-22",
      periodEnd: "2026-08-19",
      sheetCounts: { "طلبات البحث": 504, "الصفحات": 629 },
      status: "COMPLETE",
    },
    opportunities: [{ id: 1, priority: "P0", state: "MIGRATION_RISK" }],
    migrationReadiness: { blockedMappings: [] },
    internalLinks: [],
    contentBacklog: { draftBriefs: [], officialTopics: [] },
    strategy: { usps: [] },
    authority: { mode: "FREE_OR_EARNED_ONLY" },
    social: { publishing: "DISABLED" },
    ownerDecisionsRequired: [],
  },
  "/admin/marketing/editorial/editor": {
    languages: ["AR", "NL", "FR", "EN"],
    qualityGates: ["SOURCE_VERIFICATION", "LEGAL_CONSISTENCY"],
    topics: [
      {
        topicId: 1,
        topicKey: "OFFICIAL-001",
        order: 1,
        sourceType: "OFFICIAL_STRATEGIC_BACKLOG",
        title: "Belgian theory exam guide",
        titleLanguage: "AR",
        primaryLanguage: "AR",
        priority: "P0",
        strategyContextResolved: true,
        articleId: null,
        lifecycleState: null,
        canonicalLanguage: null,
        currentVersions: [],
      },
    ],
  },
};

describe("MarketingAdminPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis.crypto, "randomUUID", {
      configurable: true,
      value: () => "00000000-0000-4000-8000-000000000001",
    });
    get.mockImplementation((url: string) => Promise.resolve({ data: responses[url] }));
    put.mockImplementation((url: string) => {
      if (url.includes("/editorial/editor/topics/")) {
        return Promise.resolve({
          data: {
            topicId: 1,
            articleId: 11,
            lifecycleState: "PLANNED",
            articleCreated: true,
            created: true,
            version: {
              id: 21,
              articleId: 11,
              versionNumber: 1,
              language: "AR",
              title: "Belgian theory exam guide",
              slug: "theory-guide",
              summary: null,
              body: "Draft body",
              status: "DRAFT",
              current: true,
              createdAt: "2026-08-22T10:00:00Z",
              createdBy: "admin",
            },
          },
        });
      }
      return Promise.resolve({ data: { status: "WAITING_APPROVAL" } });
    });
    post.mockResolvedValue({ data: { status: "PENDING" } });
  });

  it("loads the operational overview and exposes every basic platform tab", async () => {
    render(<MarketingAdminPage />);

    expect(await screen.findByText("admin.marketing.tasks_today")).toBeInTheDocument();
    expect(screen.getAllByText("HEALTHY").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("tab")).toHaveLength(12);
    expect(get).toHaveBeenCalledWith("/admin/marketing/tasks", { limit: 100 });
    expect(get).toHaveBeenCalledWith("/admin/marketing/analytics/organic-discovery", { limit: 100 });
  });

  it("edits a localized article draft through the versioned editorial contract", async () => {
    render(<MarketingAdminPage />);
    await screen.findByText("admin.marketing.tasks_today");

    fireEvent.click(screen.getByRole("tab", { name: "admin.marketing.tab_editorial" }));
    expect(screen.getAllByText("Belgian theory exam guide")).toHaveLength(2);
    fireEvent.change(screen.getByLabelText(/admin.marketing.editorial_slug/), {
      target: { value: "theory-guide" },
    });
    fireEvent.change(screen.getByLabelText(/admin.marketing.editorial_body/), {
      target: { value: "Draft body" },
    });
    fireEvent.click(screen.getByRole("button", { name: "admin.marketing.editorial_save" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalledWith(
        "/admin/marketing/editorial/editor/topics/1/versions/AR",
        {
          title: "Belgian theory exam guide",
          slug: "theory-guide",
          summary: null,
          body: "Draft body",
          expectedCurrentVersion: null,
        },
      );
    });
  });

  it("previews the current editorial form without saving it", async () => {
    render(<MarketingAdminPage />);
    await screen.findByText("admin.marketing.tasks_today");

    fireEvent.click(screen.getByRole("tab", { name: "admin.marketing.tab_editorial" }));
    fireEvent.change(screen.getByLabelText(/admin.marketing.editorial_summary/), {
      target: { value: "Preview summary" },
    });
    fireEvent.change(screen.getByLabelText(/admin.marketing.editorial_body/), {
      target: { value: "Unsaved preview body" },
    });
    fireEvent.click(screen.getByRole("button", { name: "admin.marketing.editorial_preview" }));

    expect(screen.getByRole("dialog", { name: "admin.marketing.editorial_preview_title" }))
      .toBeInTheDocument();
    const preview = screen.getByTestId("editorial-preview");
    expect(preview).toHaveAttribute("dir", "rtl");
    expect(within(preview).getByText("Preview summary")).toBeInTheDocument();
    expect(within(preview).getByText("Unsaved preview body")).toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
  });

  it("submits the exact saved article versions for human approval", async () => {
    const currentVersions = ["AR", "NL", "FR", "EN"].map((language, index) => ({
      language,
      versionNumber: 1,
      title: `${language} article`,
      slug: `${language.toLowerCase()}-article`,
      status: "DRAFT",
      createdAt: "2026-08-22T10:00:00Z",
      createdBy: "admin",
      id: 21 + index,
      articleId: 11,
      summary: null,
      body: `${language} body`,
      current: true,
    }));
    get.mockImplementation((url: string) => {
      if (url === "/admin/marketing/editorial/editor") {
        return Promise.resolve({
          data: {
            languages: ["AR", "NL", "FR", "EN"],
            qualityGates: ["SOURCE_VERIFICATION", "LEGAL_CONSISTENCY"],
            topics: [{
              ...((responses["/admin/marketing/editorial/editor"] as { topics: Record<string, unknown>[] }).topics[0]),
              articleId: 11,
              lifecycleState: "IMAGE_REQUIRED",
              canonicalLanguage: "AR",
              currentVersions,
            }],
          },
        });
      }
      if (url === "/admin/marketing/editorial/editor/articles/11/versions") {
        return Promise.resolve({ data: [currentVersions[0]] });
      }
      return Promise.resolve({ data: responses[url] });
    });

    render(<MarketingAdminPage />);
    await screen.findByText("admin.marketing.tasks_today");
    fireEvent.click(screen.getByRole("tab", { name: "admin.marketing.tab_editorial" }));
    await screen.findByTestId("editorial-approval-request");

    const requestButton = screen.getByRole("button", { name: "admin.marketing.editorial_request_approval" });
    expect(requestButton).toBeDisabled();
    fireEvent.click(screen.getByLabelText("admin.marketing.editorial_approval_confirm"));
    fireEvent.change(screen.getByLabelText("admin.marketing.editorial_approval_reason"), {
      target: { value: "All required evidence was reviewed." },
    });
    fireEvent.click(requestButton);

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith(
        "/admin/marketing/editorial/editor/articles/11/approval-requests",
        {
          passedQualityGates: ["SOURCE_VERIFICATION", "LEGAL_CONSISTENCY"],
          reason: "All required evidence was reviewed.",
        },
      );
    });
  });

  it("requires a reason for an article approval decision", async () => {
    get.mockImplementation((url: string) => {
      if (url === "/admin/marketing/tasks") {
        return Promise.resolve({
          data: {
            total: 1,
            items: [{
              ...((responses["/admin/marketing/tasks"] as { items: Record<string, unknown>[] }).items[0]),
              agentType: "CONTENT",
              taskType: "ARTICLE_APPROVAL",
            }],
          },
        });
      }
      return Promise.resolve({ data: responses[url] });
    });

    render(<MarketingAdminPage />);
    await screen.findByText("admin.marketing.tasks_today");
    fireEvent.click(screen.getByRole("tab", { name: "admin.marketing.tab_approvals" }));

    const approve = screen.getByRole("button", { name: "admin.marketing.approve" });
    expect(approve).toBeDisabled();
    fireEvent.change(screen.getByLabelText("admin.marketing.editorial_approval_decision_reason"), {
      target: { value: "Verified exact versions." },
    });
    fireEvent.click(approve);

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith(
        "/admin/marketing/tasks/7/approve",
        { reason: "Verified exact versions." },
      );
    });
  });

  it("shows the evidence-backed SEO workspace and imports the selected XLSX", async () => {
    render(<MarketingAdminPage />);
    await screen.findByText("admin.marketing.tasks_today");

    fireEvent.click(screen.getByRole("tab", { name: "admin.marketing.tab_seo" }));
    expect(screen.getByText("504")).toBeInTheDocument();
    expect(screen.getByText("629")).toBeInTheDocument();

    const file = new File(["PK-test"], "search-console.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fireEvent.change(screen.getByLabelText("admin.marketing.seo_choose_file"), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: "admin.marketing.seo_import" }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith(
        "/admin/marketing/seo-migration/import",
        expect.any(FormData),
        { headers: { "Content-Type": "multipart/form-data" } },
      );
    });
  });

  it("shows the read-only YouTube monitor and requests a task-based sync", async () => {
    render(<MarketingAdminPage />);
    await screen.findByText("admin.marketing.tasks_today");

    fireEvent.click(screen.getByRole("tab", { name: "admin.marketing.tab_youtube" }));
    expect(screen.getByText("@RijBewijsBe")).toBeInTheDocument();
    expect(screen.getAllByText("13")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "admin.marketing.youtube_sync" }));
    await waitFor(() => {
      expect(post).toHaveBeenCalledWith(
        "/admin/marketing/youtube/sync",
        expect.objectContaining({
          idempotencyKey: expect.stringMatching(/^youtube-sync-/),
        }),
      );
    });
  });

  it("requests an approval-bound agent state change instead of toggling locally", async () => {
    render(<MarketingAdminPage />);
    await screen.findByText("admin.marketing.tasks_today");

    fireEvent.click(screen.getByRole("tab", { name: "admin.marketing.tab_agents" }));
    fireEvent.click(screen.getByRole("button", { name: "admin.marketing.request_disable" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalledTimes(1);
      expect(put.mock.calls[0][0]).toBe("/admin/marketing/agents/STRATEGY/enabled");
      expect(put.mock.calls[0][1]).toEqual({
        enabled: false,
        idempotencyKey: expect.stringMatching(/^agent-control-STRATEGY-/),
      });
    });
  });
});
