import { render, screen, waitFor } from "@testing-library/react";
import EditorialEditorPanel from "@/components/admin/marketing/EditorialEditorPanel";
import { apiClient } from "@/lib/api";
import type { EditorialWorkspace, MarketingStrategySnapshot } from "@/lib/marketing-admin";

jest.mock("@/lib/api", () => ({
  apiClient: { get: jest.fn() },
  logApiError: jest.fn(),
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

const get = apiClient.get as jest.Mock;
const t = (key: string) => key;

const workspace: EditorialWorkspace = {
  languages: ["AR", "NL", "FR", "EN"],
  qualityGates: [],
  contentGraph: {
    articleNodeCount: 1,
    assetNodeCount: 1,
    edgeCount: 1,
    orphanArticleCount: 0,
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
    uspId: 1,
    icpId: "ICP-EN-BEGINNER",
    contentPillarId: 1,
    funnelStageId: 1,
    conversionGoalId: 1,
    articleId: 17,
    lifecycleState: "PUBLISHED",
    canonicalLanguage: "EN",
    image: null,
    currentVersions: [{
      language: "EN",
      versionNumber: 1,
      title: "Belgian theory exam guide",
      slug: "belgian-theory-exam-guide",
      status: "PUBLISHED",
      createdAt: "2026-08-01T00:00:00Z",
      createdBy: "owner",
    }],
  }],
};

const strategy: MarketingStrategySnapshot = {
  usps: [],
  icps: [],
  contentPillars: [],
  funnelStages: [],
  conversionGoals: [],
};

describe("EditorialEditorPanel performance monitoring", () => {
  beforeEach(() => {
    get.mockReset();
    get.mockImplementation((url: string) => {
      if (url.endsWith("/versions")) {
        return Promise.resolve({ data: [] });
      }
      if (url.endsWith("/performance")) {
        return Promise.resolve({
          data: {
            latestSnapshots: [{
              id: 1,
              articleId: 17,
              publicationId: 21,
              language: "EN",
              publishedPath: "/blog/belgian-theory-exam-guide",
              periodStart: "2026-07-27",
              periodEnd: "2026-08-23",
              current: { clicks: 12, impressions: 123, ctr: 0.0975, averagePosition: 8.4 },
              previous: { clicks: 8, impressions: 90, ctr: 0.0889, averagePosition: 10.2 },
              evidenceState: "PRESENT",
              indexingState: "DISCOVERED",
              createdAt: "2026-08-24T00:00:00Z",
            }],
            latestRecommendation: {
              id: 3,
              recommended: false,
              reasonCodes: [],
              evidence: {},
              periodEnd: "2026-08-23",
              createdAt: "2026-08-24T00:00:00Z",
            },
          },
        });
      }
      if (url.endsWith("/authoring-status")) {
        return Promise.resolve({
          data: {
            topicId: 1,
            topicStatus: "PUBLISHED",
            articleId: 17,
            lifecycleState: "PUBLISHED",
            briefId: 1,
            briefStatus: "APPROVED",
            briefLanguage: "EN",
            briefReference: "ARTICLE_BRIEF:1",
            claimsTotal: 1,
            claimsSupported: 1,
            claimsRequiringReview: 0,
            claimsMissing: 0,
            latestBriefTaskStatus: "COMPLETED",
            latestSourceTaskStatus: "COMPLETED",
            latestDraftTaskStatus: "COMPLETED",
            canCreateBrief: false,
            canCollectSources: false,
            canCreateDraft: false,
          },
        });
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
  });

  it("renders real read-only Search Console evidence for a published article", async () => {
    render(
      <EditorialEditorPanel
        workspace={workspace}
        strategy={strategy}
        busy={null}
        t={t}
        formatDate={(value) => value ?? "—"}
        onSave={jest.fn()}
        onRequestTranslations={jest.fn()}
        onRequestApproval={jest.fn()}
        onUploadImage={jest.fn()}
        onRemoveImage={jest.fn()}
        onRefresh={jest.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(await screen.findByTestId("editorial-performance")).toBeInTheDocument();
    await waitFor(() => expect(get).toHaveBeenCalledWith(
      "/admin/marketing/editorial/editor/articles/17/performance",
    ));
    expect(screen.getByText("/blog/belgian-theory-exam-guide")).toBeInTheDocument();
    expect(screen.getByText("DISCOVERED")).toBeInTheDocument();
    expect(screen.getByText("123")).toBeInTheDocument();
    expect(screen.getByText("admin.marketing.editorial_performance_stable")).toBeInTheDocument();
  });
});
