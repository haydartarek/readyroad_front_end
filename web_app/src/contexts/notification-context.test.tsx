import { act, render, screen } from "@testing-library/react";
import { NotificationProvider, useNotifications } from "./notification-context";
import { getUnreadNotificationCount, markAllNotificationsAsRead } from "@/services/userService";

const mockUser = { id: 1 };
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
beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); });
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
