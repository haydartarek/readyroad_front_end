import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
};

describe("MarketingAdminPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis.crypto, "randomUUID", {
      configurable: true,
      value: () => "00000000-0000-4000-8000-000000000001",
    });
    get.mockImplementation((url: string) => Promise.resolve({ data: responses[url] }));
    put.mockResolvedValue({ data: { status: "WAITING_APPROVAL" } });
  });

  it("loads the operational overview and exposes every basic platform tab", async () => {
    render(<MarketingAdminPage />);

    expect(await screen.findByText("admin.marketing.tasks_today")).toBeInTheDocument();
    expect(screen.getAllByText("HEALTHY").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("tab")).toHaveLength(7);
    expect(get).toHaveBeenCalledWith("/admin/marketing/tasks", { limit: 100 });
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
