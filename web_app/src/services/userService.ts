import { apiClient, isServiceUnavailable } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';

// ─── Types ───────────────────────────────────────────────

export interface UserProfile {
  id:         number;
  userId?:    number; // Keep for backward compat
  username:   string;
  email:      string;
  fullName:   string;
  role:       'USER' | 'MODERATOR' | 'ADMIN';
  isActive:   boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface NotificationCount {
  unreadCount: number; // Backend returns { unreadCount: N }
}

export interface AppNotification {
  id:        number;
  type:      string;   // EXAM_PASSED | EXAM_FAILED | WEAK_AREA | STREAK_ACHIEVED | SYSTEM …
  title:     string;
  message:   string;
  link?:     string;
  isRead:    boolean;
  createdAt: string;   // ISO-8601 Instant
  readAt?:   string;
}

export interface UserStats {
  totalExams:             number;
  passedExams:            number;
  averageScore:           number;
  totalPracticeQuestions: number;
  correctAnswers:         number;
  accuracy:               number;
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?:    string;
}

// ─── Constants ───────────────────────────────────────────

const ROLE_HIERARCHY: Record<UserProfile['role'], number> = {
  ADMIN:     3,
  MODERATOR: 2,
  USER:      1,
};

// ─── Service ─────────────────────────────────────────────

/** GET /api/users/me */
export async function getCurrentUser(): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>(API_ENDPOINTS.USERS.ME);
  return response.data;
}

/** GET /api/users/me/notifications/unread-count */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const response = await apiClient.get<NotificationCount>(
      API_ENDPOINTS.USERS.NOTIFICATIONS_COUNT,
    );
    return response.data.unreadCount;
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response?.status;
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
    const status = (error as { response?: { status?: number } }).response?.status;
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

/** GET /api/users/me/stats — returns null if endpoint is unavailable */
export async function getUserStats(): Promise<UserStats | null> {
  try {
    const response = await apiClient.get<UserStats>('/users/me/stats');
    return response.data;
  } catch (error) {
    if (isServiceUnavailable(error)) throw error;
    return null;
  }
}

/** PUT /api/users/me */
export async function updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  const response = await apiClient.put<UserProfile>(API_ENDPOINTS.USERS.ME, data);
  return response.data;
}

// ─── Role Helpers ────────────────────────────────────────

export function hasRole(user: UserProfile | null, role: UserProfile['role']): boolean {
  if (!user) return false;
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[role];
}

export function isAdmin(user: UserProfile | null): boolean {
  return user?.role === 'ADMIN';
}

export function isModerator(user: UserProfile | null): boolean {
  return hasRole(user, 'MODERATOR');
}

// ─── Service Object ──────────────────────────────────────

export const userService = {
  getCurrentUser,
  getUnreadNotificationCount,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUserStats,
  updateProfile,
  hasRole,
  isAdmin,
  isModerator,
};

export default userService;
