// Services Barrel Export
// Allows importing all services from one place: import { login, getCurrentUser } from '@/services'

// ═══════════════════════════════════════════════════════════
// Auth Service
// ═══════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════
// User Service
// ═══════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════
// Analytics Service
// ═══════════════════════════════════════════════════════════
export {
    getWeakAreas,
    getErrorPatterns,
    getAnalyticsSummary,
    type WeakArea,
    type WeakAreasData,
    type ErrorPattern,
    type ErrorPatternsData,
} from './analyticsService';

// ═══════════════════════════════════════════════════════════
// Progress Service
// ═══════════════════════════════════════════════════════════
export {
    getOverallProgress,
    getProgressByCategory,
    getRecentActivity,
    type OverallProgress,
    type CategoryProgress,
    type ProgressByCategory,
    type RecentActivity,
} from './progressService';

// ═══════════════════════════════════════════════════════════
// Lesson Service
// ═══════════════════════════════════════════════════════════
export {
    getAllLessons,
    getLessonByCode,
    searchLessons,
    getLessonsCount,
} from './lessonService';

// ═══════════════════════════════════════════════════════════
// Default Exports (for advanced usage: import userService from '@/services/userService')
// ═══════════════════════════════════════════════════════════
export { default as authService } from './authService';
export { default as userService } from './userService';
export { default as analyticsService } from './analyticsService';
export { default as progressService } from './progressService';
export { default as lessonService } from './lessonService';
