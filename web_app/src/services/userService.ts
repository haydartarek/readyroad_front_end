import { apiClient } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";

// ─── Types ───────────────────────────────────────────────

export interface UserProfile {
  id: number;
  userId?: number; // Keep for backward compat
  username: string;
  email: string;
  fullName: string;
  role: "USER" | "MODERATOR" | "ADMIN";
  isActive: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface NotificationCount {
  unreadCount: number; // Backend returns { unreadCount: N }
}

export interface AppNotification {
  id: number;
  type: string; // EXAM_PASSED | EXAM_FAILED | WEAK_AREA | STREAK_ACHIEVED | SYSTEM …
  title: string;
  message: string;
  messageKey?: string; // i18n key for translated message (if set by backend)
  messageParams?: string; // JSON string of interpolation params, e.g. {"score":43,"total":50}
  link?: string;
  isRead: boolean;
  createdAt: string; // ISO-8601 Instant
  readAt?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
}

// ─── Service ─────────────────────────────────────────────

/** GET /api/users/me/notifications/unread-count */
export async function getUnreadNotificationCount(
  signal?: AbortSignal,
): Promise<number> {
  try {
    const response = await apiClient.get<NotificationCount>(
      API_ENDPOINTS.USERS.NOTIFICATIONS_COUNT,
      undefined,
      { signal },
    );
    return response.data.unreadCount;
  } catch (error) {
    if (signal?.aborted) return 0;
    const status = (error as { response?: { status?: number } }).response
      ?.status;
    if (status === 401 || status === 403) throw error;
    return 0;
  }
}

/** GET /api/users/me/notifications — returns up to 50 latest notifications */
export async function getNotifications(): Promise<AppNotification[]> {
  try {
    const response = await apiClient.get<AppNotification[]>(
      API_ENDPOINTS.USERS.NOTIFICATIONS,
    );
    return response.data ?? [];
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response
      ?.status;
    if (status === 401 || status === 403) throw error;
    return [];
  }
}

/** PATCH /api/users/me/notifications/{id}/read */
export async function markNotificationAsRead(id: number): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.USERS.NOTIFICATION_READ(id));
}

/** PATCH /api/users/me/notifications/read-all */
export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.USERS.NOTIFICATIONS_READ_ALL);
}

/** PUT /api/users/me */
export async function updateProfile(
  data: UpdateProfileRequest,
): Promise<UserProfile> {
  const response = await apiClient.put<UserProfile>(
    API_ENDPOINTS.USERS.ME,
    data,
  );
  return response.data;
}
