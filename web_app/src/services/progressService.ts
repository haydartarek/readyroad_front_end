// Progress Service - Handles user progress and statistics
// Location: src/services/progressService.ts

import { apiClient } from '@/lib/api';

// ═══════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════

/**
 * Overall progress data
 */
export interface OverallProgress {
    totalAttempts: number;
    correctAnswers: number;
    overallAccuracy: number;
    masteryLevel: string;
    weakCategories: string[];
    strongCategories: string[];
    studyStreak: number;
    lastActivityDate: string | null;
    totalExamsTaken?: number;
    passedExams?: number;
    failedExams?: number;
    averageScore?: number;
    totalPracticeQuestions?: number;
    correctPracticeAnswers?: number;
    practiceAccuracy?: number;
    totalStudyHours?: number;
    currentStreak?: number;
    longestStreak?: number;
}

/**
 * Category progress data
 */
export interface CategoryProgress {
    category: string;
    categoryName: string;
    questionsAttempted: number;
    correctAnswers: number;
    accuracy: number;
    lastPracticed: string;
}

/**
 * Progress by category response
 */
export interface ProgressByCategory {
    categories: CategoryProgress[];
    overallAccuracy: number;
}

/**
 * Recent activity item
 */
export interface RecentActivity {
    id: number | string;
    type: 'EXAM' | 'PRACTICE' | 'exam' | 'practice';
    date: string;
    score?: number;
    passed?: boolean;
    category?: string;
    questionsAnswered?: number;
}

// ═══════════════════════════════════════════════════════════
// Progress Service Functions
// ═══════════════════════════════════════════════════════════

/**
 * Get overall progress for current user
 * ✅ Endpoint: GET /api/users/me/progress/overall
 * Status: Working
 */
export const getOverallProgress = async (): Promise<OverallProgress> => {
    try {
        const response = await apiClient.get<OverallProgress>(
            '/users/me/progress/overall'
        );
        return response.data;
    } catch (error) {
        console.error('[ProgressService] Failed to fetch overall progress:', error);
        // Return default data instead of throwing
        return {
            totalAttempts: 0,
            correctAnswers: 0,
            overallAccuracy: 0,
            masteryLevel: 'beginner',
            weakCategories: [],
            strongCategories: [],
            studyStreak: 0,
            lastActivityDate: null,
            totalExamsTaken: 0,
            passedExams: 0,
            failedExams: 0,
            averageScore: 0,
            totalPracticeQuestions: 0,
            correctPracticeAnswers: 0,
            practiceAccuracy: 0,
            totalStudyHours: 0,
            currentStreak: 0,
            longestStreak: 0,
        };
    }
};

/**
 * Get progress by category
 * ✅ Endpoint: GET /api/users/me/progress/by-category
 */
export const getProgressByCategory = async (): Promise<ProgressByCategory> => {
    try {
        const response = await apiClient.get<ProgressByCategory>(
            '/users/me/progress/by-category'
        );
        return response.data;
    } catch (error) {
        console.error('[ProgressService] Failed to fetch category progress:', error);
        return {
            categories: [],
            overallAccuracy: 0,
        };
    }
};

/**
 * Get recent activity
 * ✅ Endpoint: GET /api/users/me/progress/recent-activity
 */
export const getRecentActivity = async (limit: number = 10): Promise<RecentActivity[]> => {
    try {
        const response = await apiClient.get<RecentActivity[]>(
            '/users/me/progress/recent-activity',
            { limit }
        );
        return response.data;
    } catch (error) {
        console.error('[ProgressService] Failed to fetch recent activity:', error);
        return [];
    }
};

// ═══════════════════════════════════════════════════════════
// Export all functions
// ═══════════════════════════════════════════════════════════
export const progressService = {
    getOverallProgress,
    getProgressByCategory,
    getRecentActivity,
};

export default progressService;
