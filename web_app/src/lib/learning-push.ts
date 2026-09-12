import { apiClient } from "@/lib/api";

export const CHANNELS_URL = "/users/me/notifications/channels";
const WORKER = "/learning-notifications-sw.js";

export function supportsLearningPush() {
  return typeof window !== "undefined" && window.isSecureContext
    && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function learningPushSubscription() {
  if (!supportsLearningPush()) return null;
  const registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration?.active?.scriptURL.endsWith(WORKER)) return null;
  return registration.pushManager.getSubscription();
}

function assertEnrollmentActive(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Push enrollment aborted", "AbortError");
}

export async function enableLearningPush(publicKey: string, signal?: AbortSignal) {
  assertEnrollmentActive(signal);
  if (!supportsLearningPush()) throw new Error("Push unavailable");
  if (Notification.permission !== "granted"
      && await Notification.requestPermission() !== "granted") throw new Error("Push permission denied");
  assertEnrollmentActive(signal);
  const existingRegistration = await navigator.serviceWorker.getRegistration("/");
  if (existingRegistration && !existingRegistration.active?.scriptURL.endsWith(WORKER))
    throw new Error("Another service worker owns this scope");
  assertEnrollmentActive(signal);
  await navigator.serviceWorker.register(WORKER, { scope: "/" });
  const registration = await navigator.serviceWorker.ready;
  const current = await registration.pushManager.getSubscription();
  assertEnrollmentActive(signal);
  const key = publicKey.replace(/-/g, "+").replace(/_/g, "/");
  const subscription = current ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: Uint8Array.from(atob(key.padEnd(Math.ceil(key.length / 4) * 4, "=")), (c) => c.charCodeAt(0)),
  });
  const data = subscription.toJSON();
  try {
    assertEnrollmentActive(signal);
    await apiClient.post(CHANNELS_URL + "/push", {
      endpoint: data.endpoint, p256dh: data.keys?.p256dh, auth: data.keys?.auth,
    }, { signal });
  } catch (error) {
    if (!current) await subscription.unsubscribe();
    throw error;
  }
}

export async function disableLearningPush() {
  const subscription = await learningPushSubscription();
  if (!subscription) return;
  // Stop delivery in this browser even when the API is temporarily unavailable.
  await subscription.unsubscribe();
  await apiClient.delete(CHANNELS_URL + "/push", { data: { endpoint: subscription.endpoint } });
}
