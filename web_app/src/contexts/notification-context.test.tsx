import { act, render, screen } from "@testing-library/react";
import { NotificationProvider, useNotifications } from "./notification-context";
import { getUnreadNotificationCount, markAllNotificationsAsRead } from "@/services/userService";

import { apiClient } from "@/lib/api";
import { enableLearningPush, supportsLearningPush } from "@/lib/learning-push";
const mockUser = { userId: 1, role: "USER" };
jest.mock("@/lib/api", () => ({ apiClient: { get: jest.fn() }, logApiError: jest.fn() }));
jest.mock("@/lib/learning-push", () => ({
  CHANNELS_URL: "/users/me/notifications/channels",
  enableLearningPush: jest.fn(),
  supportsLearningPush: jest.fn().mockReturnValue(false),
}));
jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ user: mockUser, isAuthenticated: true, isLoading: false }),
}));
jest.mock("@/services/userService", () => ({
  getUnreadNotificationCount: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
}));
function Probe() {
  const { unreadCount, markAllRead } = useNotifications();
  return <button onClick={() => void markAllRead().catch(() => {})}>{unreadCount}</button>;
}
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks();
  mockUser.role = "USER";
  jest.mocked(supportsLearningPush).mockReturnValue(false);
});
afterEach(() => { jest.useRealTimers(); });

it("retains the last count and recovers after more than three transient failures", async () => {
  const fetch = jest.mocked(getUnreadNotificationCount);
  fetch.mockResolvedValueOnce(4).mockRejectedValueOnce(new Error("offline"))
    .mockRejectedValueOnce(new Error("offline")).mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue(5);
  render(<NotificationProvider><Probe /></NotificationProvider>);
  await act(async () => { jest.advanceTimersByTime(1); });
  expect(screen.getByRole("button")).toHaveTextContent("4");
  for (const delay of [30000, 60000, 120000]) {
    await act(async () => { jest.advanceTimersByTime(delay); });
    expect(screen.getByRole("button")).toHaveTextContent("4");
  }
  await act(async () => { jest.advanceTimersByTime(240000); });
  expect(screen.getByRole("button")).toHaveTextContent("5");
});

it("does not falsely clear notifications when marking them read fails", async () => {
  jest.mocked(getUnreadNotificationCount).mockResolvedValue(4);
  jest.mocked(markAllNotificationsAsRead).mockRejectedValue(new Error("offline"));
  render(<NotificationProvider><Probe /></NotificationProvider>);
  await act(async () => { jest.advanceTimersByTime(1); });
  await act(async () => { screen.getByRole("button").click(); });
  expect(screen.getByRole("button")).toHaveTextContent("4");
});

describe("automatic learner Push enrollment", () => {
  beforeEach(() => {
    jest.mocked(supportsLearningPush).mockReturnValue(true);
    jest.mocked(apiClient.get).mockResolvedValue({ data: { pushAvailable: true, publicKey: "public-key" } } as never);
    jest.mocked(enableLearningPush).mockResolvedValue(undefined);
    jest.mocked(getUnreadNotificationCount).mockResolvedValue(0);
    Object.defineProperty(window, "Notification", { configurable: true, value: { permission: "granted" } });
  });

  it("registers an authorised browser without opening notification settings", async () => {
    render(<NotificationProvider><Probe /></NotificationProvider>);
    await act(async () => { jest.advanceTimersByTime(1); });
    expect(enableLearningPush).toHaveBeenCalledWith("public-key", expect.any(AbortSignal));
  });

  it.each(["ADMIN", "MODERATOR"])("does not enrol %s accounts", async (role) => {
    mockUser.role = role;
    render(<NotificationProvider><Probe /></NotificationProvider>);
    await act(async () => { jest.advanceTimersByTime(1); });
    expect(apiClient.get).not.toHaveBeenCalled();
    expect(enableLearningPush).not.toHaveBeenCalled();
  });

  it("uses a user gesture for the browser permission request and asks only once", async () => {
    Object.defineProperty(window, "Notification", { configurable: true, value: { permission: "default" } });
    render(<NotificationProvider><Probe /></NotificationProvider>);
    await act(async () => { jest.advanceTimersByTime(1); });
    expect(enableLearningPush).not.toHaveBeenCalled();
    await act(async () => { document.dispatchEvent(new Event("pointerdown")); });
    await act(async () => { document.dispatchEvent(new Event("keydown")); });
    expect(enableLearningPush).toHaveBeenCalledTimes(1);
  });

  it("respects browser permission denial", async () => {
    Object.defineProperty(window, "Notification", { configurable: true, value: { permission: "denied" } });
    render(<NotificationProvider><Probe /></NotificationProvider>);
    await act(async () => { jest.advanceTimersByTime(1); });
    expect(apiClient.get).not.toHaveBeenCalled();
    expect(enableLearningPush).not.toHaveBeenCalled();
  });

  it("cancels enrollment when the authenticated session is replaced", async () => {
    const { unmount } = render(<NotificationProvider><Probe /></NotificationProvider>);
    await act(async () => { jest.advanceTimersByTime(1); });
    const signal = jest.mocked(enableLearningPush).mock.calls[0][1];
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
