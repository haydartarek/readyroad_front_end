import { expect, test, type Page, type Request } from "@playwright/test";
import { seedCookieConsent } from "./helpers/consent";

const adminUser = {
  id: 1,
  username: "admin",
  email: "admin@rijvia.test",
  role: "ADMIN",
};

const now = "2026-08-12T10:00:00Z";

const responses: Record<string, unknown> = {
  "/admin/marketing/overview": {
    enabled: true,
    tasksByStatus: { COMPLETED: 3, FAILED: 1, WAITING_APPROVAL: 1 },
    tasksToday: 5,
    activeAgents: 2,
    activeWorkers: 1,
    recentActivity: [],
    alerts: [],
    generatedAt: now,
  },
  "/admin/marketing/agents": [
    {
      agentType: "STRATEGY",
      displayName: "Strategy Engine",
      description: "Approved strategy context",
      enabled: true,
      lastRunAt: now,
      lastSuccessAt: now,
      lastFailureAt: null,
      currentTasks: 0,
      tasksToday: 1,
      totalTasks: 3,
      completedTasks: 3,
      failedTasks: 0,
      retryCount: 0,
      successRate: 100,
    },
  ],
  "/admin/marketing/tasks": { total: 0, items: [] },
  "/admin/marketing/errors": [],
  "/admin/marketing/audit": [],
  "/admin/marketing/settings": {
    settings: [
      {
        id: 1,
        agentType: "STRATEGY",
        key: "reportingZone",
        value: "Europe/Brussels",
        updatedBy: "admin",
        updatedAt: now,
      },
    ],
    schedules: [],
  },
  "/admin/marketing/worker-health": {
    status: "HEALTHY",
    enabled: true,
    activeWorkers: 1,
    runningTasks: 0,
    expiredLocks: 0,
    pollIntervalMs: 5000,
    batchSize: 10,
    lockTtlSeconds: 600,
    checkedAt: now,
  },
  "/admin/marketing/analytics/status": {
    serviceAccountConfigured: true,
    authenticationMode: "DEDICATED_READ_ONLY_SERVICE_ACCOUNT",
    ga4AccountId: "403159538",
    ga4PropertyResource: "properties/548176182",
    searchConsoleSiteUrl: "sc-domain:rijvia.be",
    latestSearchConsoleDate: "2026-08-10",
    sources: [{ source: "GA4", status: "HEALTHY", read_only: true, last_success_at: now }],
    alerts: [],
  },
  "/admin/marketing/analytics/settings": {
    values: {},
    policy: { initialBackfillDays: 90, intervalDays: 3, noDataDays: 6, sourceFailureHours: 3 },
    thresholds: {
      windowDays: 28,
      emergingImpressions: 20,
      opportunityImpressions: 50,
      establishedClicks: 10,
    },
  },
  "/admin/marketing/analytics/organic-discovery": {
    opportunities: [
      { id: 1, query: "belgian driving theory questions", state: "OPPORTUNITY", impressions: 500 },
    ],
    contentGaps: [],
    queryClassifications: [],
    languages: [],
    devices: [],
  },
  "/admin/marketing/analytics/reports": [{
    id: 8,
    snapshot_type: "WEEKLY_REPORT",
    period_start: "2026-08-03",
    period_end: "2026-08-09",
    metrics: { clicks: 12, impressions: 840, ctr: 0.0143 },
    evidence: { source: "SEARCH_CONSOLE" },
    created_at: now,
  }],
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
    opportunities: [{ id: 1, query: "rijbewijs belgie", state: "OPPORTUNITY", priority: "P0" }],
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
        titleLanguage: "EN",
        primaryLanguage: "EN",
        priority: "P0",
        strategyContextResolved: true,
        uspId: 1,
        icpId: "ICP-EN-BEGINNER",
        contentPillarId: 2,
        funnelStageId: 3,
        conversionGoalId: 4,
        articleId: null,
        lifecycleState: null,
        canonicalLanguage: null,
        currentVersions: [],
      },
    ],
  },
  "/admin/marketing/strategy": {
    usps: [{ id: 1, title: "RijVia learning platform", description: "Verified", active: true }],
    icps: [{ id: "ICP-EN-BEGINNER", name: "English beginner", language: "EN", active: true }],
    contentPillars: [{ id: 2, pillarKey: "THEORY_EXAM", name: "Theory exam", active: true }],
    funnelStages: [{ id: 3, stageKey: "EDUCATION", sequenceNumber: 3, active: true }],
    conversionGoals: [{ id: 4, goalKey: "CONTINUE_TOPIC_LEARNING", name: "Continue learning", primaryCta: "Study", funnelStageId: 3, active: true }],
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

async function mockAdmin(
  page: Page,
  mutations: Request[],
  overrides: Record<string, unknown> = {},
) {
  await seedCookieConsent(page);
  const appUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3005";
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ sub: "admin", role: "ADMIN", exp: 4_102_444_800 }),
  ).toString("base64url");
  await page.context().addCookies([
    {
      name: "token",
      value: `${header}.${payload}.test-signature`,
      url: appUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "csrf_token",
      value: "playwright-csrf-token",
      url: appUrl,
      sameSite: "Lax",
    },
  ]);
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ json: { authenticated: true, user: adminUser } }),
  );
  await page.route("**/api/proxy/users/me/notifications/unread-count", (route) =>
    route.fulfill({ json: { unreadCount: 0 } }),
  );
  await page.route("**/api/proxy/admin/marketing/**", (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/proxy", "");
    if (request.method() !== "GET") {
      mutations.push(request);
      if (path.includes("/editorial/editor/topics/")) {
        return route.fulfill({
          status: 200,
          json: {
            topicId: 1,
            articleId: 11,
            lifecycleState: "PLANNED",
            articleCreated: true,
            created: true,
            version: {
              id: 21,
              articleId: 11,
              versionNumber: 1,
              language: "EN",
              title: "Belgian theory exam guide",
              slug: "belgian-theory-guide",
              summary: null,
              body: "Targeted editorial draft",
              metaTitle: "Belgian theory exam guide | RijVia",
              metaDescription: "Prepare for the Belgian theory exam with this reviewed RijVia guide.",
              internalLinks: [],
              status: "DRAFT",
              current: true,
              createdAt: now,
              createdBy: "admin",
            },
          },
        });
      }
      return route.fulfill({ status: 202, json: { id: 11, status: "WAITING_APPROVAL" } });
    }
    return route.fulfill({ json: overrides[path] ?? responses[path] });
  });
}

async function expectNoOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);
}

test("Marketing operations remain usable on mobile and preserve approval control", async ({ page }) => {
  const mutations: Request[] = [];
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAdmin(page, mutations);

  await page.goto("/admin/marketing");
  await expect(page.getByRole("heading", { name: "Marketing Operations" })).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(12);
  await expectNoOverflow(page);

  await page.getByRole("tab", { name: "Analytics" }).click();
  await expect(page.getByText("properties/548176182")).toBeVisible();
  await expect(page.getByRole("button", { name: "Run full sync" })).toBeEnabled();
  await expect(page.getByText("Weekly Report")).toBeVisible();
  await expect(page.getByText("Metrics", { exact: true })).toBeVisible();
  await expect(page.locator("pre:visible")).toHaveCount(0);
  await expectNoOverflow(page);

  await page.getByRole("tab", { name: "Organic Discovery" }).click();
  await expect(page.getByRole("heading", { name: "belgian driving theory questions" })).toBeVisible();
  await expectNoOverflow(page);

  await page.getByRole("tab", { name: "SEO Migration" }).click();
  await expect(page.getByText("504").first()).toBeVisible();
  await expect(page.getByText("629").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "rijbewijs belgie" })).toBeVisible();
  await expect(page.locator("pre:visible")).toHaveCount(0);
  await expectNoOverflow(page);

  await page.getByRole("tab", { name: "YouTube" }).click();
  await expect(page.getByText("@RijBewijsBe")).toBeVisible();
  await page.getByRole("button", { name: "Sync channel" }).click();
  await expect.poll(() => mutations.length).toBe(1);
  expect(mutations[0].postDataJSON()).toMatchObject({
    idempotencyKey: expect.stringMatching(/^youtube-sync-/),
  });

  await page.getByRole("tab", { name: "Agents" }).click();
  await expect(page.getByRole("heading", { name: "Strategy engine" })).toBeVisible();
  await page.getByRole("button", { name: "Request disable" }).click();
  await expect.poll(() => mutations.length).toBe(2);
  expect(mutations[1].method()).toBe("PUT");
  expect(mutations[1].postDataJSON()).toMatchObject({
    enabled: false,
    idempotencyKey: expect.stringMatching(/^agent-control-STRATEGY-/),
  });

  await page.getByRole("tab", { name: "Settings" }).click();
  await expect(page.getByText("Runtime settings")).toBeVisible();
  await expect(page.getByText("Agent settings")).toBeVisible();
  await expect(page.getByText("Europe/Brussels", { exact: true })).toBeVisible();
  await expectNoOverflow(page);
});

test("Admin can save a versioned editorial draft without mobile overflow", async ({ page }) => {
  const mutations: Request[] = [];
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAdmin(page, mutations);

  await page.goto("/admin/marketing");
  await page.getByRole("tab", { name: "Editorial" }).click();
  await expect(page.getByRole("heading", { name: "Belgian theory exam guide" })).toBeVisible();
  const slugField = page.getByLabel("URL slug");
  await expect(slugField).toHaveValue("belgian-theory-exam-guide");
  await expect(slugField).not.toBeEditable();
  await page.getByLabel("Summary").fill("Targeted preview summary");
  await page.getByLabel("SEO title").fill("Belgian theory exam guide | RijVia");
  await page.getByLabel("Meta description").fill(
    "Prepare for the Belgian theory exam with this reviewed RijVia guide.",
  );
  await page
    .getByTestId("editorial-markdown-editor")
    .getByRole("textbox")
    .fill("Targeted editorial draft");
  await page
    .getByTestId("editorial-internal-links")
    .getByRole("button", { name: "Add link" })
    .click();
  await page.getByLabel("Destination path *").fill("/exam");
  await page.getByLabel("Descriptive link text *").fill("Start the theory exam");
  await page.getByRole("button", { name: "Preview" }).click();
  const preview = page.getByRole("dialog", { name: "Article preview" });
  await expect(preview).toBeVisible();
  await expect(preview.getByText("Targeted preview summary")).toBeVisible();
  await expect(preview.getByText("Targeted editorial draft")).toBeVisible();
  await expect(preview.getByText("Start the theory exam")).toBeVisible();
  await expect(preview.getByTestId("editorial-preview")).toHaveAttribute("dir", "ltr");
  expect(mutations).toHaveLength(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Save draft" }).click();

  await expect.poll(() => mutations.length).toBe(1);
  expect(mutations[0].method()).toBe("PUT");
  expect(new URL(mutations[0].url()).pathname).toContain(
    "/admin/marketing/editorial/editor/topics/1/versions/EN",
  );
  expect(mutations[0].postDataJSON()).toMatchObject({
    title: "Belgian theory exam guide",
    slug: "belgian-theory-exam-guide",
    summary: "Targeted preview summary",
    body: "Targeted editorial draft",
    metaTitle: "Belgian theory exam guide | RijVia",
    metaDescription: "Prepare for the Belgian theory exam with this reviewed RijVia guide.",
    internalLinks: [{ targetPath: "/exam", anchorText: "Start the theory exam" }],
    expectedCurrentVersion: null,
  });
  await expectNoOverflow(page);
});

test("All Marketing tabs remain usable without responsive overflow or browser errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await mockAdmin(page, []);

  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    await page.goto("/admin/marketing");

    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(12);
    for (let index = 0; index < 12; index += 1) {
      const tab = tabs.nth(index);
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("tabpanel")).toBeVisible();
      await expectNoOverflow(page);
    }
  }

  expect(consoleErrors).toEqual([]);
});

test("Editorial rich controls validate and submit one local article image", async ({ page }) => {
  const mutations: Request[] = [];
  const currentVersion = {
    id: 21,
    articleId: 11,
    versionNumber: 1,
    language: "EN",
    title: "Belgian theory exam guide",
    slug: "belgian-theory-guide",
    summary: "A reviewed RijVia guide.",
    body: "Targeted editorial draft",
    metaTitle: "Belgian theory exam guide | RijVia",
    metaDescription: "Prepare for the Belgian theory exam with this reviewed RijVia guide.",
    internalLinks: [],
    status: "DRAFT",
    current: true,
    createdAt: now,
    createdBy: "admin",
  };
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAdmin(page, mutations, {
    "/admin/marketing/editorial/editor": {
      languages: ["AR", "NL", "FR", "EN"],
      qualityGates: ["SOURCE_VERIFICATION", "LEGAL_CONSISTENCY"],
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
        topicId: 1,
        topicKey: "OFFICIAL-001",
        order: 1,
        sourceType: "OFFICIAL_STRATEGIC_BACKLOG",
        title: "Belgian theory exam guide",
        titleLanguage: "EN",
        primaryLanguage: "EN",
        priority: "P0",
        strategyContextResolved: true,
        articleId: 11,
        lifecycleState: "DRAFT_READY",
        canonicalLanguage: "EN",
        image: null,
        currentVersions: [currentVersion],
      }],
    },
    "/admin/marketing/editorial/editor/articles/11/versions": [currentVersion],
  });

  await page.goto("/admin/marketing");
  await page.getByRole("tab", { name: "Editorial" }).click();

  const editor = page.getByTestId("editorial-markdown-editor");
  for (const control of [
    "Heading 2",
    "Heading 3",
    "Heading 4",
    "Paragraph",
    "Bold",
    "Italic",
    "Bulleted list",
    "Numbered list",
    "Add link",
    "Clear formatting",
  ]) {
    await expect(editor.getByRole("button", { name: control })).toBeVisible();
  }

  const imagePanel = page.getByTestId("editorial-article-image");
  const fileInput = imagePanel.getByLabel(/Image from device/);
  await fileInput.setInputFiles({
    name: "animated.gif",
    mimeType: "image/gif",
    buffer: Buffer.from("GIF89a"),
  });
  await expect(imagePanel.getByText("Only JPEG or PNG files are supported.")).toBeVisible();

  await fileInput.setInputFiles({
    name: "belgian-road.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nWQAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(imagePanel.getByText("Only JPEG or PNG files are supported.")).toHaveCount(0);
  await imagePanel.getByLabel(/Image owner or file source/).fill("RijVia owner upload");
  await imagePanel.getByLabel(/License name/).fill("Owned media");
  await imagePanel.getByLabel(/Alt text AR/).fill("طريق بلجيكي آمن");
  await imagePanel.getByLabel(/Alt text NL/).fill("Een veilige Belgische weg");
  await imagePanel.getByLabel(/Alt text FR/).fill("Une route belge sûre");
  await imagePanel.getByLabel(/Alt text EN/).fill("A safe Belgian road");
  await imagePanel.getByLabel(/Image approval reason/).fill("Ownership and publication rights verified");
  await imagePanel.getByRole("checkbox").check();

  const upload = imagePanel.getByRole("button", { name: "Upload and process image" });
  await expect(upload).toBeEnabled();
  await upload.click();

  await expect.poll(() => mutations.filter((request) =>
    new URL(request.url()).pathname.endsWith("/editorial/editor/articles/11/image"),
  ).length).toBe(1);
  const imageRequest = mutations.find((request) =>
    new URL(request.url()).pathname.endsWith("/editorial/editor/articles/11/image"),
  );
  expect(imageRequest?.method()).toBe("POST");
  expect(imageRequest?.headers()["content-type"]).toContain("multipart/form-data; boundary=");
  await expectNoOverflow(page);
});

test("Editorial authoring dropdowns preserve mixed-direction labels within mobile fields", async ({ page }) => {
  const mutations: Request[] = [];
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width: 320, height: 844 });
  await mockAdmin(page, mutations);

  await page.goto("/ar/admin/marketing");
  await page.getByRole("tab", { name: "المحرر", exact: true }).click();

  const authoring = page.getByTestId("editorial-authoring");
  const dropdowns = authoring.getByRole("combobox");
  await expect(dropdowns).toHaveCount(6);
  for (let index = 0; index < await dropdowns.count(); index += 1) {
    const dropdown = dropdowns.nth(index);
    await expect(dropdown).toHaveAttribute("dir", "auto");
    await expect(dropdown).toHaveClass(/min-w-0/);
    await expect(dropdown).toHaveClass(/max-w-full/);
  }

  const measurements = await dropdowns.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth };
  }));
  for (const measurement of measurements) {
    expect(measurement.left).toBeGreaterThanOrEqual(0);
    expect(measurement.right).toBeLessThanOrEqual(320);
    expect(measurement.scrollWidth).toBeLessThanOrEqual(measurement.clientWidth);
  }

  await dropdowns.first().click();
  const popup = page.locator('[data-slot="select-content"]');
  await expect(popup).toBeVisible();
  const popupBounds = await popup.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right };
  });
  expect(popupBounds.left).toBeGreaterThanOrEqual(0);
  expect(popupBounds.right).toBeLessThanOrEqual(320);
  await page.keyboard.press("Escape");

  await expect(
    authoring.getByRole("combobox", { name: "USP" }),
  ).toContainText("دعم أربع لغات");
  await expect(page.locator("body")).not.toContainText(/ReadyRoad/i);
  await expectNoOverflow(page);
  expect(consoleErrors).toEqual([]);
});

test("Marketing operations preserve localized responsive layouts", async ({ page }) => {
  const mutations: Request[] = [];
  await mockAdmin(page, mutations);

  const routes = ["/admin/marketing", "/ar/admin/marketing", "/nl/admin/marketing", "/fr/admin/marketing"];
  const widths = [390, 768, 1280];
  for (const route of routes) {
    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
      await page.goto(route);
      await expect(page.getByRole("tab")).toHaveCount(12);
      await expectNoOverflow(page);
    }
  }
});

test("Admin requests and decides exact-version article approval", async ({ page }) => {
  const mutations: Request[] = [];
  const currentVersions = ["AR", "NL", "FR", "EN"].map((language, index) => ({
    id: 21 + index,
    articleId: 11,
    language,
    versionNumber: 1,
    title: `${language} article`,
    slug: `${language.toLowerCase()}-article`,
    summary: null,
    body: `${language} body`,
    metaTitle: `${language} article | RijVia`,
    metaDescription: `${language} article metadata description`,
    internalLinks: [],
    status: "DRAFT",
    current: true,
    createdAt: now,
    createdBy: "admin",
  }));
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAdmin(page, mutations, {
    "/admin/marketing/editorial/editor": {
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
        topicId: 1,
        topicKey: "OFFICIAL-001",
        order: 1,
        sourceType: "OFFICIAL_STRATEGIC_BACKLOG",
        title: "Belgian theory exam guide",
        titleLanguage: "EN",
        primaryLanguage: "EN",
        priority: "P0",
        strategyContextResolved: true,
        articleId: 11,
        lifecycleState: "IMAGE_REQUIRED",
        canonicalLanguage: "EN",
        image: null,
        currentVersions,
      }],
    },
    "/admin/marketing/editorial/editor/articles/11/versions": [currentVersions[3]],
    "/admin/marketing/tasks": {
      total: 1,
      items: [{
        id: 17,
        agentType: "CONTENT",
        taskType: "ARTICLE_APPROVAL",
        status: "WAITING_APPROVAL",
        priority: "CRITICAL",
        attempts: 0,
        maxAttempts: 4,
        requiresApproval: true,
        approvalMode: "HUMAN_APPROVAL",
        errorCode: null,
        errorMessage: null,
        scheduledAt: null,
        nextRetryAt: null,
        createdAt: now,
        updatedAt: now,
      }],
    },
  });

  await page.goto("/admin/marketing");
  await page.getByRole("tab", { name: "Editorial" }).click();
  const request = page.getByTestId("editorial-approval-request");
  await request.getByLabel("I confirm that every listed quality gate has been checked for these exact saved versions.").check();
  await request.getByLabel("Approval request reason").fill("All exact versions were reviewed.");
  await request.getByRole("button", { name: "Request approval" }).click();

  await expect.poll(() => mutations.length).toBe(1);
  expect(new URL(mutations[0].url()).pathname).toContain(
    "/admin/marketing/editorial/editor/articles/11/approval-requests",
  );
  expect(mutations[0].postDataJSON()).toEqual({
    passedQualityGates: ["SOURCE_VERIFICATION", "LEGAL_CONSISTENCY"],
    reason: "All exact versions were reviewed.",
  });

  await page.getByRole("tab", { name: "Approvals" }).click();
  const approval = page.getByText("ARTICLE_APPROVAL").locator("..").locator("..");
  await approval.getByLabel("Decision reason").fill("Approved exact versions.");
  await approval.getByRole("button", { name: "Approve" }).click();

  await expect.poll(() => mutations.length).toBe(2);
  expect(new URL(mutations[1].url()).pathname).toContain("/admin/marketing/tasks/17/approve");
  expect(mutations[1].postDataJSON()).toEqual({ reason: "Approved exact versions." });
  await expectNoOverflow(page);
});

test("Marketing operations keep the existing desktop admin layout", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockAdmin(page, []);

  await page.goto("/admin/marketing");
  await expect(page.getByRole("heading", { name: "Marketing Operations" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Marketing" })).toBeVisible();
  await expectNoOverflow(page);
});

test("Live local Marketing data remains readable through the real Backend", async ({ page }) => {
  test.skip(
    process.env.PLAYWRIGHT_LIVE_ADMIN !== "true" ||
      !process.env.PLAYWRIGHT_ADMIN_PASSWORD,
    "Requires the explicitly configured local Admin account.",
  );

  const browserErrors: string[] = [];
  const failedApiResponses: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("response", (response) => {
    if (
      response.url().includes("/api/") &&
      response.status() >= 400
    ) {
      failedApiResponses.push(`${response.status()} ${new URL(response.url()).pathname}`);
    }
  });
  await seedCookieConsent(page);

  const login = await page.request.post("/api/auth/login", {
    data: {
      username: "admin",
      password: process.env.PLAYWRIGHT_ADMIN_PASSWORD,
    },
  });
  expect(login.status()).toBe(200);

  const localePaths = [
    "/admin/marketing",
    "/ar/admin/marketing",
    "/nl/admin/marketing",
    "/fr/admin/marketing",
  ];

  for (const localePath of localePaths) {
    const widths = localePath === "/ar/admin/marketing" ? [390, 1440] : [390];
    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
      const response = await page.goto(localePath);
      expect(response?.status()).toBe(200);

      const tabs = page.getByRole("tab");
      await expect(tabs).toHaveCount(12);
      for (let index = 0; index < 12; index += 1) {
        await tabs.nth(index).click();
        await expectNoOverflow(page);
      }

      await expect(page.locator("body")).not.toContainText(/ReadyRoad/i);
      await expect(page.locator("body")).not.toContainText(/[ÃÂØÙ]/);
      await expect(page.locator("body")).not.toContainText(
        /Node Type|Container Node|Value Node|Big Decimal/i,
      );
    }
  }

  expect(failedApiResponses).toEqual([]);
  expect(browserErrors).toEqual([]);
});
