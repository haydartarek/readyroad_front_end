// Analytics Service - Handles analytics and statistics API calls
// Location: src/services/analyticsService.ts

import { apiClient, isServiceUnavailable } from '@/lib/api';

// ═══════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════

/**
 * Weak area data structure
 */
export interface WeakArea {
    categoryCode: string;
    categoryName: string;
    correctCount: number;
    totalCount: number;
    accuracy: number;
    averageTime: string;
    commonMistakes: string[];
    recommendedLessons: Array<{
        code: string;
        title: string;
    }>;
}

/**
 * Weak areas response
 */
export interface WeakAreasData {
    weakAreas: WeakArea[];
    overallAccuracy: number;
    totalCategories: number;
    recommendations?: string[];
}

/**
 * Error pattern data
 */
export interface ErrorPattern {
    questionId: number;
    questionText: string;
    category: string;
    timesAttempted: number;
    timesIncorrect: number;
    lastAttemptDate: string;
}

/**
 * Error patterns response
 */
export interface ErrorPatternsData {
    patterns: ErrorPattern[];
    totalErrors: number;
}

// ═══════════════════════════════════════════════════════════
// Analytics Service Functions
// ═══════════════════════════════════════════════════════════

/**
 * Get weak areas for current user
 * ✅ Endpoint: GET /api/users/me/analytics/weak-areas
 * Status: Working
 */
export const getWeakAreas = async (): Promise<WeakAreasData> => {
    try {
        const response = await apiClient.get<WeakAreasData>(
            '/users/me/analytics/weak-areas'
        );
        return response.data;
    } catch (error) {
        if (isServiceUnavailable(error)) throw error;
        // Graceful fallback for non-503 errors
        return {
            weakAreas: [],
            overallAccuracy: 0,
            totalCategories: 0,
            recommendations: [],
        };
    }
};

/**
 * Get error patterns for current user
 * ✅ Endpoint: GET /api/users/me/analytics/error-patterns
 * Status: Working
 */
export const getErrorPatterns = async (): Promise<ErrorPatternsData> => {
    try {
        const response = await apiClient.get<ErrorPatternsData>(
            '/users/me/analytics/error-patterns'
        );
        return response.data;
    } catch (error) {
        if (isServiceUnavailable(error)) throw error;
        return {
            patterns: [],
            totalErrors: 0,
        };
    }
};

/**
 * Get analytics summary
 * This is a convenience function that combines multiple analytics data
 */
export const getAnalyticsSummary = async () => {
    try {
        const [weakAreas, errorPatterns] = await Promise.all([
            getWeakAreas(),
            getErrorPatterns(),
        ]);

        return {
            weakAreas,
            errorPatterns,
        };
    } catch (error) {
        if (isServiceUnavailable(error)) throw error;
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════
// Export all functions
// ═══════════════════════════════════════════════════════════
export const analyticsService = {
    getWeakAreas,
    getErrorPatterns,
    getAnalyticsSummary,
};

export default analyticsService;
