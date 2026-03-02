// Services barrel export
// Usage: import { login, getCurrentUser } from '@/services'

// ─── Auth ────────────────────────────────────────────────

export {
  login,
  register,
  logout,
  isAuthenticated,
  getToken,
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
} from './authService';

// ─── User ────────────────────────────────────────────────

export {
  getCurrentUser,
  getUnreadNotificationCount,
  getUserStats,
  updateProfile,
  hasRole,
  isAdmin,
  isModerator,
  type UserProfile,
  type NotificationCount,
  type UserStats,
  type UpdateProfileRequest,
} from './userService';

// ─── Analytics ───────────────────────────────────────────

export {
  getWeakAreas,
  getErrorPatterns,
  getAnalyticsSummary,
  type WeakArea,
  type WeakAreasData,
  type ErrorPattern,
  type ErrorPatternsData,
  type AnalyticsSummary,
} from './analyticsService';

// ─── Progress ────────────────────────────────────────────

export {
  getOverallProgress,
  getProgressByCategory,
  getRecentActivity,
  type OverallProgress,
  type CategoryProgress,
  type ProgressByCategory,
  type RecentActivity,
} from './progressService';

// ─── Lessons ─────────────────────────────────────────────

export {
  getAllLessons,
  getLessonByCode,
  searchLessons,
  getLessonsCount,
} from './lessonService';

// ─── Service Objects ─────────────────────────────────────

export { default as authService }      from './authService';
export { default as userService }      from './userService';
export { default as analyticsService } from './analyticsService';
export { default as progressService }  from './progressService';
export { default as lessonService }    from './lessonService';
