import { apiClient } from "@/lib/api";
import { disableLearningPush, enableLearningPush } from "./learning-push";

jest.mock("@/lib/api", () => ({ apiClient: { post: jest.fn(), delete: jest.fn() } }));
const unsubscribe = jest.fn();
const getSubscription = jest.fn();
const subscribe = jest.fn();
const permission = jest.fn();
const registration = { active: { scriptURL: "http://localhost:3000/learning-notifications-sw.js" },
  pushManager: { getSubscription, subscribe } };
const subscription = { endpoint: "https://fcm.googleapis.com/test", unsubscribe,
  toJSON: () => ({ endpoint: "https://fcm.googleapis.com/test", keys: { p256dh: "public-test-key", auth: "test-auth" } }) };

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });
  Object.defineProperty(window, "PushManager", { configurable: true, value: function() {} });
  Object.defineProperty(window, "Notification", { configurable: true, value: { permission: "default", requestPermission: permission } });
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: {
    getRegistration: jest.fn().mockResolvedValue(registration),
    register: jest.fn().mockResolvedValue(registration),
    ready: Promise.resolve(registration),
  } });
  permission.mockResolvedValue("granted");
  getSubscription.mockResolvedValue(null);
  subscribe.mockResolvedValue(subscription);
  unsubscribe.mockResolvedValue(true);
  jest.mocked(apiClient.post).mockResolvedValue({ data: {} } as never);
});
it("does not subscribe or send a request when browser permission is refused", async () => {
  permission.mockResolvedValue("denied");
  await expect(enableLearningPush("AQ")).rejects.toThrow("permission denied");
  expect(subscribe).not.toHaveBeenCalled();
  expect(apiClient.post).not.toHaveBeenCalled();
});
it("revokes a newly created browser subscription if server registration fails", async () => {
  jest.mocked(apiClient.post).mockRejectedValue(new Error("unavailable"));
  await expect(enableLearningPush("AQ")).rejects.toThrow("unavailable");
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});
it("unsubscribes the browser even when server deletion fails", async () => {
  getSubscription.mockResolvedValue(subscription);
  jest.mocked(apiClient.delete).mockRejectedValue(new Error("offline"));
  await expect(disableLearningPush()).rejects.toThrow("offline");
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});

it("uses an already granted browser permission without another request", async () => {
  Object.defineProperty(window, "Notification", { configurable: true,
    value: { permission: "granted", requestPermission: permission } });
  await enableLearningPush("AQ");
  expect(permission).not.toHaveBeenCalled();
  expect(apiClient.post).toHaveBeenCalledTimes(1);
});
it("does not register a subscription after logout aborts enrollment", async () => {
  const controller = new AbortController();
  subscribe.mockImplementationOnce(async () => { controller.abort(); return subscription; });
  await expect(enableLearningPush("AQ", controller.signal)).rejects.toThrow();
  expect(apiClient.post).not.toHaveBeenCalled();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});
