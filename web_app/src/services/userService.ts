// User Service - Handles all user-related API calls
// Location: src/services/userService.ts

import { apiClient } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';

// ═══════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════

/**
 * User profile data structure
 */
export interface UserProfile {
    userId: number;
    username: string;
    email: string;
    fullName: string;
    role: 'USER' | 'MODERATOR' | 'ADMIN';
    isActive: boolean;
    createdAt?: string;
    lastLogin?: string;
}

/**
 * Notification count response
 */
export interface NotificationCount {
    count: number;
}

/**
 * User statistics
 */
export interface UserStats {
    totalExams: number;
    passedExams: number;
    averageScore: number;
    totalPracticeQuestions: number;
    correctAnswers: number;
    accuracy: number;
}

/**
 * Update profile request
 */
export interface UpdateProfileRequest {
    fullName?: string;
    email?: string;
    // Add other updatable fields as needed
}

// ═══════════════════════════════════════════════════════════
// User Service Functions
// ═══════════════════════════════════════════════════════════

/**
 * Get current user profile
 * ✅ Endpoint: GET /api/users/me
 * ✅ Status: Working
 */
export const getCurrentUser = async (): Promise<UserProfile> => {
    try {
        const response = await apiClient.get<UserProfile>(API_ENDPOINTS.USERS.ME);
        return response.data;
    } catch (error) {
        console.error('[UserService] Failed to fetch current user:', error);
        throw error;
    }
};

/**
 * Get unread notification count
 * ✅ Endpoint: GET /api/users/me/notifications/unread-count
 * ✅ Status: Working
 */
export const getUnreadNotificationCount = async (): Promise<number> => {
    try {
        const response = await apiClient.get<NotificationCount>(
            API_ENDPOINTS.USERS.NOTIFICATIONS_COUNT
        );
        return response.data.count;
    } catch (error) {
        // Re-throw auth errors so the caller can count them;
        // the API interceptor already handles session clearing.
        const status = (error as { response?: { status?: number } }).response?.status;
        if (status === 401 || status === 403) {
            throw error;
        }
        // Swallow transient network errors — return 0 to hide badge
        return 0;
    }
};

/**
 * Get user statistics (if backend supports it)
 * ⚠️  This endpoint might not exist yet - implement when backend is ready
 */
export const getUserStats = async (): Promise<UserStats | null> => {
    try {
        const response = await apiClient.get<UserStats>('/users/me/stats');
        return response.data;
    } catch (error) {
        console.error('[UserService] Failed to fetch user stats:', error);
        // Return null if not implemented yet
        return null;
    }
};

/**
 * Update user profile
 * ⚠️  Implement this when backend endpoint is ready
 */
export const updateProfile = async (
    data: UpdateProfileRequest
): Promise<UserProfile> => {
    try {
        const response = await apiClient.put<UserProfile>(
            API_ENDPOINTS.USERS.ME,
            data
        );
        return response.data;
    } catch (error) {
        console.error('[UserService] Failed to update profile:', error);
        throw error;
    }
};

/**
 * Check if user has specific role
 */
export const hasRole = (user: UserProfile | null, role: UserProfile['role']): boolean => {
    if (!user) return false;

    // Role hierarchy: ADMIN > MODERATOR > USER
    const roleHierarchy = {
        ADMIN: 3,
        MODERATOR: 2,
        USER: 1,
    };

    return roleHierarchy[user.role] >= roleHierarchy[role];
};

/**
 * Check if user is admin
 */
export const isAdmin = (user: UserProfile | null): boolean => {
    return user?.role === 'ADMIN';
};

/**
 * Check if user is moderator or higher
 */
export const isModerator = (user: UserProfile | null): boolean => {
    return hasRole(user, 'MODERATOR');
};

// ═══════════════════════════════════════════════════════════
// Export all functions
// ═══════════════════════════════════════════════════════════
export const userService = {
    getCurrentUser,
    getUnreadNotificationCount,
    getUserStats,
    updateProfile,
    hasRole,
    isAdmin,
    isModerator,
};

export default userService;
