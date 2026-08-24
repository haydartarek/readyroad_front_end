import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EditorialAuthoringPanel from "@/components/admin/marketing/EditorialAuthoringPanel";
import { apiClient } from "@/lib/api";
import type {
  EditorialAuthoringStatus,
  EditorialTopic,
  MarketingStrategySnapshot,
} from "@/lib/marketing-admin";

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/api", () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
  logApiError: jest.fn(),
}));

const get = apiClient.get as jest.Mock;
const post = apiClient.post as jest.Mock;
const t = (key: string) => key;

const topic: EditorialTopic = {
  topicId: 2,
  topicKey: "OFFICIAL-002",
  order: 2,
  sourceType: "OFFICIAL_STRATEGIC_BACKLOG",
  title: "Theory priority rules",
  titleLanguage: "EN",
  primaryLanguage: "EN",
  priority: "P0",
  strategyContextResolved: true,
  uspId: 1,
  icpId: "ICP-EN-BEGINNER",
  contentPillarId: 2,
  funnelStageId: 3,
  conversionGoalId: 4,
  articleId: 9,
  lifecycleState: "BRIEF_READY",
  canonicalLanguage: "EN",
  image: null,
  currentVersions: [],
};

const strategy: MarketingStrategySnapshot = {
  usps: [{ id: 1, title: "RijVia", description: "Verified", active: true }],
  icps: [{ id: "ICP-EN-BEGINNER", name: "English beginner", language: "EN", active: true }],
  contentPillars: [{ id: 2, pillarKey: "THEORY_EXAM", name: "Theory exam", active: true }],
  funnelStages: [{ id: 3, stageKey: "EDUCATION", sequenceNumber: 3, active: true }],
  conversionGoals: [{
    id: 4,
    goalKey: "CONTINUE_TOPIC_LEARNING",
    name: "Continue learning",
    primaryCta: "Study",
    funnelStageId: 3,
    active: true,
  }],
};

function status(overrides: Partial<EditorialAuthoringStatus> = {}): EditorialAuthoringStatus {
  return {
    topicId: 2,
    topicStatus: "BRIEF_READY",
    articleId: 9,
    lifecycleState: "BRIEF_READY",
    briefId: 7,
    briefStatus: "APPROVED",
    briefLanguage: "EN",
    briefReference: "ARTICLE_BRIEF:7",
    claimsTotal: 0,
    claimsSupported: 0,
    claimsRequiringReview: 0,
    claimsMissing: 0,
    latestBriefTaskStatus: "COMPLETED",
    latestSourceTaskStatus: null,
    latestDraftTaskStatus: null,
    canCreateBrief: false,
    canCollectSources: true,
    canCreateDraft: false,
    ...overrides,
  };
}

describe("EditorialAuthoringPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis.crypto, "randomUUID", {
      configurable: true,
      value: () => "00000000-0000-4000-8000-000000000001",
    });
    post.mockResolvedValue({ data: { id: 1, status: "WAITING_APPROVAL" } });
  });

  it("submits one explicit reviewed source claim through the approval-controlled API", async () => {
    get.mockResolvedValue({ data: status() });
    const onChanged = jest.fn().mockResolvedValue(undefined);
    render(<EditorialAuthoringPanel topic={topic} language="EN" strategy={strategy} t={t} onChanged={onChanged} />);

    fireEvent.change(await screen.findByLabelText("admin.marketing.editorial_authoring_claim_key"), {
      target: { value: "priority-rule" },
    });
    fireEvent.change(screen.getByLabelText("admin.marketing.editorial_authoring_claim_text"), {
      target: { value: "RijVia explains the verified priority rule." },
    });
    fireEvent.change(screen.getByLabelText("admin.marketing.editorial_authoring_source_title"), {
      target: { value: "RijVia priority lesson" },
    });
    fireEvent.change(screen.getByLabelText("admin.marketing.editorial_authoring_internal_reference"), {
      target: { value: "LESSON:les-19" },
    });
    fireEvent.click(screen.getByRole("button", {
      name: "admin.marketing.editorial_authoring_collect_source",
    }));

    await waitFor(() => expect(post).toHaveBeenCalledWith(
      "/admin/marketing/editorial/source-collections",
      expect.objectContaining({
        articleTopicId: 2,
        briefReference: "ARTICLE_BRIEF:7",
        claims: [expect.objectContaining({
          claimKey: "priority-rule",
          claimType: "FACTUAL",
          language: "EN",
          sources: [expect.objectContaining({
            sourceType: "READYROAD_CORE_DATA",
            locationType: "INTERNAL",
            internalReference: "LESSON:les-19",
            verificationStatus: "VERIFIED",
            trustStatus: "CORE_TRUSTED",
          })],
        })],
      }),
    ));
    expect(onChanged).toHaveBeenCalled();
  });

  it("enables the Content Agent draft request only after every claim is supported", async () => {
    get.mockResolvedValue({
      data: status({ claimsTotal: 2, claimsSupported: 2, canCollectSources: true, canCreateDraft: true }),
    });
    render(<EditorialAuthoringPanel
      topic={topic}
      language="EN"
      strategy={strategy}
      t={t}
      onChanged={jest.fn().mockResolvedValue(undefined)}
    />);

    const button = await screen.findByRole("button", {
      name: "admin.marketing.editorial_authoring_generate_draft",
    });
    expect(button).toBeEnabled();
    fireEvent.click(button);

    await waitFor(() => expect(post).toHaveBeenCalledWith(
      "/admin/marketing/editorial/editor/articles/9/draft-requests",
      { idempotencyKey: expect.stringMatching(/^admin-draft-9-/) },
    ));
  });
});
