import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NotificationChannelSettings } from "./notification-channel-settings";
import { apiClient } from "@/lib/api";
import { enableLearningPush } from "@/lib/learning-push";
jest.mock("@/contexts/language-context", () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
jest.mock("@/lib/api", () => ({ apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn() } }));
jest.mock("@/lib/learning-push", () => ({
  CHANNELS_URL: "/users/me/notifications/channels",
  learningPushSubscription: jest.fn().mockResolvedValue(null),
  supportsLearningPush: () => true,
  enableLearningPush: jest.fn().mockResolvedValue(undefined),
  disableLearningPush: jest.fn(),
}));
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(apiClient.get).mockResolvedValue({ data: {
    emailEnabled: false, emailAvailable: true, pushAvailable: true, publicKey: "public-key",
  } } as never);
});
it("asks for browser subscription only after the learner enables Push", async () => {
  render(<NotificationChannelSettings />);
  fireEvent.click(screen.getByText("notif.channels"));
  const checkbox = screen.getByLabelText("notif.channel_push");
  await waitFor(() => expect(checkbox).not.toBeDisabled());
  expect(enableLearningPush).not.toHaveBeenCalled();
  fireEvent.click(checkbox);
  await waitFor(() => expect(enableLearningPush).toHaveBeenCalledWith("public-key"));
  expect(checkbox).toBeChecked();
});
it("retains the previous email preference when saving fails", async () => {
  jest.mocked(apiClient.put).mockRejectedValue(new Error("unavailable"));
  render(<NotificationChannelSettings />);
  fireEvent.click(screen.getByText("notif.channels"));
  const checkbox = screen.getByLabelText("notif.channel_email");
  await waitFor(() => expect(checkbox).not.toBeDisabled());
  fireEvent.click(checkbox);
  expect(await screen.findByRole("alert")).toHaveTextContent("notif.channels_failed");
  expect(checkbox).not.toBeChecked();
});
