import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import MarketingAdminPage from "./page";
import { apiClient } from "@/lib/api";

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/contexts/language-context", () => ({
  useLanguage: () => ({ t: (key: string) => key, language: "en", isRTL: false }),
}));
jest.mock("@/lib/api", () => ({
  apiClient: { get: jest.fn(), put: jest.fn(), post: jest.fn() },
  getApiErrorMessage: (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback,
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
    searchConsoleSiteUrl: "sc-domain:rijvia.be",
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
    publishingEnabled: true,
    canonicalActivation: "RELEASED",
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
    social: { publishing: "BLOCKED_PROVIDER_API_OAUTH", officialHandlesConfigured: true },
    ownerDecisionsRequired: [],
  },
  "/admin/marketing/editorial/editor": {
    languages: ["AR", "NL", "FR", "EN"],
    qualityGates: ["SOURCE_VERIFICATION", "LEGAL_CONSISTENCY"],
    contentGraph: {
      articleNodeCount: 0,
      assetNodeCount: 0,
      edgeCount: 0,
      orphanArticleCount: 0,
      nodes: [],
      edges: [],
      orphanArticles: [],
    },
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
        uspId: 1,
        icpId: "ICP-AR-BEGINNER",
        contentPillarId: 2,
        funnelStageId: 3,
        conversionGoalId: 4,
        keywordClusterId: 1,
        targetQueries: ["امتحان السياقة النظري في بلجيكا"],
        articleId: null,
        lifecycleState: null,
        canonicalLanguage: null,
        currentVersions: [],
      },
    ],
  },
  "/admin/marketing/strategy": {
    usps: [{ id: 1, title: "RijVia learning platform", description: "Verified platform", active: true }],
    icps: [{ id: "ICP-AR-BEGINNER", name: "Arabic beginner", language: "AR", active: true }],
    contentPillars: [{ id: 2, pillarKey: "THEORY_EXAM", name: "Theory exam", active: true }],
    funnelStages: [{ id: 3, stageKey: "EDUCATION", sequenceNumber: 3, active: true }],
    conversionGoals: [{
      id: 4,
      goalKey: "CONTINUE_TOPIC_LEARNING",
      name: "Continue learning",
      primaryCta: "Study the lesson",
      funnelStageId: 3,
      active: true,
    }],
  },
  "/admin/marketing/editorial/editor/topics/1/authoring-status": {
    topicId: 1,
    topicStatus: "PLANNED",
    articleId: null,
    lifecycleState: null,
    briefId: null,
    briefStatus: null,
    briefLanguage: null,
    briefReference: null,
    claimsTotal: 0,
    claimsSupported: 0,
    claimsRequiringReview: 0,
    claimsMissing: 0,
    latestBriefTaskStatus: null,
    latestSourceTaskStatus: null,
    latestDraftTaskStatus: null,
    canCreateBrief: true,
    canCollectSources: false,
    canCreateDraft: false,
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
              metaTitle: "Belgian theory exam guide | RijVia",
              metaDescription: "Prepare for the Belgian theory exam with this reviewed RijVia guide.",
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
    expect(screen.getAllByText("Healthy").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("tab")).toHaveLength(12);
    expect(get).toHaveBeenCalledWith("/admin/marketing/tasks", { limit: 100 });
    expect(get).toHaveBeenCalledWith("/admin/marketing/analytics/organic-discovery", { limit: 100 });
  });

  it("shows the exact backend reason when the platform load fails", async () => {
    get.mockRejectedValueOnce(new Error("Strategy context is unavailable"));

    render(<MarketingAdminPage />);

    expect(await screen.findByText("Strategy context is unavailable"))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "common.retry" }))
      .toBeEnabled();
  });

  it("edits a localized article draft through the versioned editorial contract", async () => {
    render(<MarketingAdminPage />);
    await screen.findByText("admin.marketing.tasks_today");

    fireEvent.click(screen.getByRole("tab", { name: "admin.marketing.tab_editorial" }));
    await screen.findByText("admin.marketing.editorial_authoring_generate_draft");
    expect(screen.getAllByText("Belgian theory exam guide")).toHaveLength(2);
    fireEvent.change(screen.getByLabelText(/admin.marketing.editorial_slug/), {
      target: { value: "theory-guide" },
    });
    fireEvent.change(screen.getByLabelText(/admin.marketing.editorial_body/), {
      target: { value: "Draft body" },
    });
    fireEvent.change(screen.getByLabelText(/admin.marketing.editorial_meta_title/), {
      target: { value: "Belgian theory exam guide | RijVia" },
    });
    fireEvent.change(screen.getByLabelText(/admin.marketing.editorial_meta_description/), {
      target: { value: "Prepare for the Belgian theory exam with this reviewed RijVia guide." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save new version" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalledWith(
        "/admin/marketing/editorial/editor/topics/1/versions/AR",
        {
          title: "Belgian theory exam guide",
          slug: "theory-guide",
          summary: null,
          body: "Draft body",
          metaTitle: "Belgian theory exam guide | RijVia",
          metaDescription: "Prepare for the Belgian theory exam with this reviewed RijVia guide.",
          internalLinks: [],
          typography: {
            h1Size: "DEFAULT",
            h2Size: "DEFAULT",
            h3Size: "DEFAULT",
            h4Size: "DEFAULT",
            paragraphSize: "DEFAULT",
            textColor: "DEFAULT",
          },
          expectedCurrentVersion: null,
        },
      );
    });
  });

  it("keeps the selected article after a save refresh", async () => {
    const firstTopic = (responses["/admin/marketing/editorial/editor"] as {
      topics: Record<string, unknown>[];
    }).topics[0];
    const editorResponse = {
      ...(responses["/admin/marketing/editorial/editor"] as Record<string, unknown>),
      topics: [
        firstTopic,
        {
          ...firstTopic,
          topicId: 2,
          topicKey: "OFFICIAL-002",
          order: 2,
          title: "Second article",
          titleLanguage: "EN",
          primaryLanguage: "EN",
        },
      ],
    };
    let editorRequests = 0;
    let resolveEditorReload!: (value: { data: typeof editorResponse }) => void;
    const editorReload = new Promise<{ data: typeof editorResponse }>((resolve) => {
      resolveEditorReload = resolve;
    });

    get.mockImplementation((url: string) => {
      if (url === "/admin/marketing/editorial/editor") {
        editorRequests += 1;
        return editorRequests === 1
          ? Promise.resolve({ data: editorResponse })
          : editorReload;
      }
      if (url === "/admin/marketing/editorial/editor/topics/2/authoring-status") {
        return Promise.resolve({
          data: {
            ...(responses["/admin/marketing/editorial/editor/topics/1/authoring-status"] as Record<string, unknown>),
            topicId: 2,
          },
        });
      }
      return Promise.resolve({ data: responses[url] });
    });

    render(<MarketingAdminPage />);
    await screen.findByText("admin.marketing.tasks_today");
    fireEvent.click(screen.getByRole("tab", { name: "admin.marketing.tab_editorial" }));

    const secondTopicButton = await screen.findByRole("button", { name: /Second article/ });
    fireEvent.click(secondTopicButton);
    expect(secondTopicButton).toHaveClass("border-primary/30");

    fireEvent.change(screen.getByLabelText(/admin.marketing.editorial_slug/), {
      target: { value: "second-article" },
    });
    fireEvent.change(screen.getByLabelText(/admin.marketing.editorial_body/), {
      target: { value: "Second article body" },
    });
    fireEvent.change(screen.getByLabelText(/admin.marketing.editorial_meta_title/), {
      target: { value: "Second article | RijVia" },
    });
    fireEvent.change(screen.getByLabelText(/admin.marketing.editorial_meta_description/), {
      target: { value: "Second article metadata description for RijVia learners." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save new version" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalledWith(
        "/admin/marketing/editorial/editor/topics/2/versions/EN",
        expect.objectContaining({ slug: "second-article" }),
      );
    });
    await waitFor(() => expect(editorRequests).toBe(2));
    expect(screen.getByRole("button", { name: /Second article/ }))
      .toHaveClass("border-primary/30");

    resolveEditorReload({ data: editorResponse });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Second article/ }))
        .toHaveClass("border-primary/30");
    });
  });

  it("derives the read-only slug from the localized focus keyword", async () => {
    const topic = {
      ...((responses["/admin/marketing/editorial/editor"] as {
        topics: Record<string, unknown>[];
      }).topics[0]),
      articleId: 11,
      lifecycleState: "DRAFT_READY",
      canonicalLanguage: "AR",
      currentVersions: [{
        language: "AR",
        versionNumber: 1,
        title: "دليل الامتحان النظري",
        slug: null,
        focusKeyword: "امتحان السياقة النظري في بلجيكا",
        status: "DRAFT",
        createdAt: "2026-08-31T10:00:00Z",
        createdBy: "admin",
      }],
    };

    get.mockImplementation((url: string) => {
      if (url === "/admin/marketing/editorial/editor") {
        return Promise.resolve({
          data: {
            ...(responses["/admin/marketing/editorial/editor"] as Record<string, unknown>),
            topics: [topic],
          },
        });
      }
      if (url === "/admin/marketing/editorial/editor/articles/11/versions") {
        return Promise.resolve({
          data: [{
            ...topic.currentVersions[0],
            id: 21,
            articleId: 11,
            summary: "ملخص",
            body: "محتوى المقال",
            metaTitle: "دليل الامتحان النظري | RijVia",
            metaDescription: "دليل موثق للاستعداد للامتحان النظري في بلجيكا.",
            internalLinks: [],
            typography: {
              h1Size: "DEFAULT",
              h2Size: "DEFAULT",
              h3Size: "DEFAULT",
              h4Size: "DEFAULT",
              paragraphSize: "DEFAULT",
              textColor: "DEFAULT",
            },
            current: true,
          }],
        });
      }
      return Promise.resolve({ data: responses[url] });
    });

    render(<MarketingAdminPage />);
    await screen.findByText("admin.marketing.tasks_today");
    fireEvent.click(screen.getByRole("tab", { name: "admin.marketing.tab_editorial" }));

    const slug = await screen.findByLabelText(/admin.marketing.editorial_slug/);
    expect(slug).toHaveValue("امتحان-السياقة-النظري-في-بلجيكا");
    expect(slug).toHaveAttribute("readonly");
  });

  it("derives the initial slug from the real topic title before the first draft exists", async () => {
    const topic = {
      ...((responses["/admin/marketing/editorial/editor"] as {
        topics: Record<string, unknown>[];
      }).topics[0]),
      articleId: 11,
      lifecycleState: "DRAFTING",
      canonicalLanguage: "AR",
      title: "كم عدد أسئلة امتحان السياقة النظري في بلجيكا؟",
      currentVersions: [],
    };

    get.mockImplementation((url: string) => {
      if (url === "/admin/marketing/editorial/editor") {
        return Promise.resolve({
          data: {
            ...(responses["/admin/marketing/editorial/editor"] as Record<string, unknown>),
            topics: [topic],
          },
        });
      }
      if (url === "/admin/marketing/editorial/editor/articles/11/versions") {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: responses[url] });
    });

    render(<MarketingAdminPage />);
    await screen.findByText("admin.marketing.tasks_today");
    fireEvent.click(screen.getByRole("tab", { name: "admin.marketing.tab_editorial" }));

    const slug = await screen.findByLabelText(/admin.marketing.editorial_slug/);
    expect(slug).toHaveValue("كم-عدد-اسيلة-امتحان-السياقة-النظري-في-بلجيكا");
    expect(slug).toHaveAttribute("readonly");
    expect(screen.getByLabelText("admin.marketing.editorial_image_alt AR")).toHaveValue("");
    expect(screen.getByLabelText("admin.marketing.editorial_image_alt NL")).toHaveValue("");
    expect(screen.getByLabelText("admin.marketing.editorial_image_alt FR")).toHaveValue("");
    expect(screen.getByLabelText("admin.marketing.editorial_image_alt EN")).toHaveValue("");
  });

  it("queues a strategy-bound article brief from the editorial workflow", async () => {
    render(<MarketingAdminPage />);
    await screen.findByText("admin.marketing.tasks_today");

    fireEvent.click(screen.getByRole("tab", { name: "admin.marketing.tab_editorial" }));
    fireEvent.change(await screen.findByLabelText("admin.marketing.editorial_authoring_purpose"), {
      target: { value: "Explain the verified learning topic." },
    });
    fireEvent.change(screen.getByLabelText("admin.marketing.editorial_authoring_queries"), {
      target: { value: "Belgian theory exam" },
    });
    fireEvent.change(screen.getByLabelText("admin.marketing.editorial_authoring_requirements"), {
      target: { value: "RijVia core lesson" },
    });
    fireEvent.click(screen.getByRole("button", {
      name: "admin.marketing.editorial_authoring_create_brief",
    }));

    await waitFor(() => expect(post).toHaveBeenCalledWith(
      "/admin/marketing/editorial/topics/1/briefs",
      expect.objectContaining({
        targetLanguage: "AR",
        searchIntent: "INFORMATIONAL",
        workingTitle: "Belgian theory exam guide",
        purpose: "Explain the verified learning topic.",
        strategyContext: {
          uspId: 1,
          icpId: "ICP-AR-BEGINNER",
          contentPillarId: 2,
          funnelStageId: 3,
          conversionGoalId: 4,
        },
        targetQueries: ["Belgian theory exam"],
        sourceRequirements: ["RijVia core lesson"],
      }),
    ));
  });

  it("previews the current editorial form without saving it", async () => {
    render(<MarketingAdminPage />);
    await screen.findByText("admin.marketing.tasks_today");

    fireEvent.click(screen.getByRole("tab", { name: "admin.marketing.tab_editorial" }));
    await screen.findByText("admin.marketing.editorial_authoring_generate_draft");
    fireEvent.change(screen.getByLabelText(/admin.marketing.editorial_summary/), {
      target: { value: "Preview summary" },
    });
    fireEvent.change(screen.getByLabelText(/admin.marketing.editorial_body/), {
      target: { value: "Unsaved preview body" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    expect(screen.getByRole("dialog", { name: "admin.marketing.editorial_preview_title" }))
      .toBeInTheDocument();
    const preview = screen.getByTestId("editorial-preview");
    expect(preview).toHaveAttribute("dir", "rtl");
    expect(within(preview).getByText("Preview summary")).toBeInTheDocument();
    expect(within(preview).getByText("Unsaved preview body")).toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
  });

  it("requests the missing editorial translations from the canonical version", async () => {
    const canonicalVersion = {
      language: "AR",
      versionNumber: 3,
      title: "Canonical AR article",
      slug: "canonical-ar-article",
      status: "DRAFT",
      createdAt: "2026-08-26T10:00:00Z",
      createdBy: "admin",
      id: 31,
      articleId: 11,
      summary: "Canonical summary",
      metaTitle: "Canonical AR article | RijVia",
      metaDescription: "Canonical article metadata description",
      body: "Canonical body",
      internalLinks: [],
      typography: {
        h1Size: "DEFAULT",
        h2Size: "DEFAULT",
        h3Size: "DEFAULT",
        h4Size: "DEFAULT",
        paragraphSize: "DEFAULT",
        textColor: "DEFAULT",
      },
      current: true,
    };

    get.mockImplementation((url: string) => {
      if (url === "/admin/marketing/editorial/editor") {
        return Promise.resolve({
          data: {
            languages: ["AR", "NL", "FR", "EN"],
            qualityGates: ["SOURCE_VERIFICATION", "TRANSLATION_QUALITY"],
            contentGraph: {
              articleNodeCount: 1,
              assetNodeCount: 0,
              edgeCount: 0,
              orphanArticleCount: 1,
              nodes: [],
              edges: [],
              orphanArticles: [],
            },
            topics: [{
              ...((responses["/admin/marketing/editorial/editor"] as {
                topics: Record<string, unknown>[];
              }).topics[0]),
              articleId: 11,
              lifecycleState: "TRANSLATION_REQUIRED",
              canonicalLanguage: "AR",
              image: null,
              currentVersions: [{
                language: "AR",
                versionNumber: 3,
                title: "Canonical AR article",
                slug: "canonical-ar-article",
                status: "DRAFT",
                createdAt: "2026-08-26T10:00:00Z",
                createdBy: "admin",
              }],
            }],
          },
        });
      }

      if (
        url ===
        "/admin/marketing/editorial/editor/articles/11/versions"
      ) {
        return Promise.resolve({
          data: [canonicalVersion],
        });
      }

      return Promise.resolve({
        data: responses[url],
      });
    });

    render(<MarketingAdminPage />);

    await screen.findByText("admin.marketing.tasks_today");

    fireEvent.click(
      screen.getByRole("tab", {
        name: "admin.marketing.tab_editorial",
      }),
    );

    await screen.findByTestId("editorial-translation-request");

    const translationButton = screen.getByRole("button", {
      name: "admin.marketing.editorial_translation_action",
    });

    await waitFor(() => {
      expect(translationButton).toBeEnabled();
    });

    fireEvent.change(
      screen.getByLabelText(/admin.marketing.editorial_title/),
      {
        target: {
          value: "Unsaved canonical title",
        },
      },
    );

    expect(translationButton).toBeDisabled();

    expect(
      screen.getByText(
        "admin.marketing.editorial_translation_save_first",
      ),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText(/admin.marketing.editorial_title/),
      {
        target: {
          value: "Canonical AR article",
        },
      },
    );

    await waitFor(() => {
      expect(translationButton).toBeEnabled();
    });

    fireEvent.click(translationButton);

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith(
        "/admin/marketing/editorial/editor/articles/11/translation-requests",
        {
          idempotencyKey: "admin-translation-11-AR-v3",
        },
      );
    });
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
      metaTitle: `${language} article | RijVia`,
      metaDescription: `${language} article metadata description`,
      body: `${language} body`,
      internalLinks: [],
      current: true,
    }));
    get.mockImplementation((url: string) => {
      if (url === "/admin/marketing/editorial/editor") {
        return Promise.resolve({
          data: {
            languages: ["AR", "NL", "FR", "EN"],
            qualityGates: ["SOURCE_VERIFICATION", "LEGAL_CONSISTENCY"],
            contentGraph: {
              articleNodeCount: 4,
              assetNodeCount: 0,
              edgeCount: 0,
              orphanArticleCount: 4,
              nodes: [],
              edges: [],
              orphanArticles: [],
            },
            topics: [{
              ...((responses["/admin/marketing/editorial/editor"] as { topics: Record<string, unknown>[] }).topics[0]),
              articleId: 11,
              lifecycleState: "IMAGE_REQUIRED",
              canonicalLanguage: "AR",
              image: null,
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
    await screen.findByText("admin.marketing.editorial_authoring_generate_draft");
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
    expect(screen.getAllByText("504").length).toBeGreaterThan(0);
    expect(screen.getAllByText("629").length).toBeGreaterThan(0);

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

  it("renders operational records as readable fields and keeps raw payloads inside technical details", async () => {
    const originalSettings = responses["/admin/marketing/analytics/settings"];
    const originalReports = responses["/admin/marketing/analytics/reports"];
    const originalDiscovery = responses["/admin/marketing/analytics/organic-discovery"];

    responses["/admin/marketing/analytics/settings"] = {
      values: {},
      policy: {
        initialBackfillDays: 90,
        intervalDays: 3,
        noDataDays: 6,
        sourceFailureHours: 3,
        containerNode: 1,
      },
      thresholds: { windowDays: 28, opportunityImpressions: 50, pojo: 1 },
    };
    responses["/admin/marketing/analytics/reports"] = [{
      id: 8,
      snapshot_type: "WEEKLY_REPORT",
      period_start: "2026-08-10",
      period_end: "2026-08-16",
      metrics: { clicks: 12, impressions: 840, ctr: 0.0143 },
      evidence: { source: "SEARCH_CONSOLE" },
      created_at: "2026-08-17T08:00:00Z",
    }];
    responses["/admin/marketing/analytics/organic-discovery"] = {
      opportunities: [{
        id: 11,
        query: "belgian theory exam",
        page: "/lessons",
        language: "EN",
        state: "OPPORTUNITY",
        impressions: 120,
        clicks: 9,
        ctr: 0.075,
        average_position: 8.4,
        evidence: { source: "SEARCH_CONSOLE" },
      }],
      contentGaps: [],
      queryClassifications: [],
      languages: [],
      devices: [],
    };

    try {
      render(<MarketingAdminPage />);
      await screen.findByText("admin.marketing.tasks_today");

      fireEvent.click(screen.getByRole("tab", { name: "admin.marketing.tab_analytics" }));
      expect(screen.getByText("Weekly Report")).toBeInTheDocument();
      expect(screen.getByText("Metrics")).toBeInTheDocument();
      expect(screen.queryByText("Container Node")).not.toBeInTheDocument();
      expect(screen.queryByText("Pojo")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("tab", { name: "admin.marketing.tab_discovery" }));
      expect(screen.getByText("belgian theory exam")).toBeInTheDocument();
      expect(screen.getByText("Average Position")).toBeInTheDocument();
      expect(screen.getByText("7.5%")).toBeInTheDocument();

      const rawBlocks = Array.from(document.querySelectorAll("pre"));
      expect(rawBlocks.length).toBeGreaterThan(0);
      expect(rawBlocks.every((block) => block.closest("details"))).toBe(true);
    } finally {
      responses["/admin/marketing/analytics/settings"] = originalSettings;
      responses["/admin/marketing/analytics/reports"] = originalReports;
      responses["/admin/marketing/analytics/organic-discovery"] = originalDiscovery;
    }
  });
});
