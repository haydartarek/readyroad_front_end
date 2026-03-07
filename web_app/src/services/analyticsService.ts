import { apiClient, isServiceUnavailable } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────

/**
 * Shape that the dashboard/WeakAreasPreview component expects.
 * Populated by transforming the backend WeakAreaRecommendationResponse list.
 */
export interface WeakArea {
  categoryCode:       string;
  categoryName:       string;
  correctCount:       number;
  /** Total questions attempted in this category (from backend questionsAttempted) */
  totalCount:         number;
  /** Accuracy 0-100 (mapped from backend currentAccuracy) */
  accuracy:           number;
  /** Estimated practice time (e.g., "11 min") — recommended time, not avg session time */
  estimatedTime:      string;
  commonMistakes:     string[];
  recommendedLessons: Array<{ code: string; title: string }>;
  /** Extra fields from backend for rich display */
  accuracyGap?:          number;
  recommendedQuestions?: number;
  estimatedTimeMinutes?: number;
  recommendedDifficulty?: string;
  priority?:             number;
  categoryId?:           number;
}

export interface WeakAreasData {
  weakAreas:        WeakArea[];
  overallAccuracy:  number;
  totalCategories:  number;
  recommendations?: string[];
}

/**
 * Raw shape returned by backend GET /users/me/analytics/weak-areas
 * The endpoint returns a WeakAreasOverviewResponse wrapper object.
 */
interface WeakAreaRecommendationResponse {
  categoryId:            number;
  categoryCode:          string;
  categoryName:          string;
  currentAccuracy:       number;
  targetAccuracy:        number;
  accuracyGap:           number;
  recommendedQuestions:  number;
  recommendedDifficulty: string;
  estimatedTimeMinutes:  number;
  priority:              number;
  questionsAttempted:    number;
}

/**
 * Wrapper returned by backend GET /users/me/analytics/weak-areas
 * Contains weak-area list plus accurate summary statistics.
 */
interface WeakAreasOverviewResponse {
  weakAreas:               WeakAreaRecommendationResponse[];
  totalPracticedCategories: number;
  overallAccuracy:         number;
}

export interface ErrorPattern {
  questionId:      number;
  questionText:    string;
  category:        string;
  timesAttempted:  number;
  timesIncorrect:  number;
  lastAttemptDate: string;
}

export interface ErrorPatternsData {
  patterns:    ErrorPattern[];
  totalErrors: number;
}

export interface AnalyticsSummary {
  weakAreas:     WeakAreasData;
  errorPatterns: ErrorPatternsData;
}

// ─── Constants ───────────────────────────────────────────

const ENDPOINTS = {
  WEAK_AREAS:     '/users/me/analytics/weak-areas',
  ERROR_PATTERNS: '/users/me/analytics/error-patterns',
} as const;

const WEAK_AREAS_FALLBACK: WeakAreasData = {
  weakAreas:       [],
  overallAccuracy: 0,
  totalCategories: 0,
  recommendations: [],
};

const ERROR_PATTERNS_FALLBACK: ErrorPatternsData = {
  patterns:    [],
  totalErrors: 0,
};

// ─── Helpers ─────────────────────────────────────────────

/**
 * Transform backend WeakAreasOverviewResponse into the WeakAreasData shape
 * that frontend components expect.
 *
 * Key mappings:
 *   backend.weakAreas[*].currentAccuracy    → frontend.accuracy
 *   backend.weakAreas[*].questionsAttempted → frontend.totalCount
 *   backend.overallAccuracy                 → WeakAreasData.overallAccuracy (real value)
 *   backend.totalPracticedCategories        → WeakAreasData.totalCategories  (real value)
 */
function transformWeakAreas(backend: WeakAreasOverviewResponse): WeakAreasData {
  if (!backend || !Array.isArray(backend.weakAreas)) {
    return WEAK_AREAS_FALLBACK;
  }

  const weakAreas: WeakArea[] = backend.weakAreas.map((item) => ({
    categoryCode:         item.categoryCode        ?? '',
    categoryName:         item.categoryName        ?? '',
    accuracy:             item.currentAccuracy     ?? 0,
    totalCount:           item.questionsAttempted  ?? 0,
    correctCount:         Math.round(
                            ((item.currentAccuracy ?? 0) / 100) *
                            (item.questionsAttempted ?? 0)
                          ),
    estimatedTime:        `${item.estimatedTimeMinutes ?? 0} min`,
    commonMistakes:       [],
    recommendedLessons:   [],
    accuracyGap:           item.accuracyGap,
    recommendedQuestions:  item.recommendedQuestions,
    estimatedTimeMinutes:  item.estimatedTimeMinutes,
    recommendedDifficulty: item.recommendedDifficulty,
    priority:              item.priority,
    categoryId:            item.categoryId,
  }));

  return {
    weakAreas,
    // Use the real overall accuracy supplied by the backend (all practiced categories)
    overallAccuracy: Math.round((backend.overallAccuracy ?? 0) * 10) / 10,
    // Use the real total from backend so "Strong Areas" = total - weak.length is correct
    totalCategories: backend.totalPracticedCategories ?? weakAreas.length,
    recommendations: [],
  };
}

// ─── Service ─────────────────────────────────────────────

/**
 * GET /api/users/me/analytics/weak-areas
 *
 * Backend returns: WeakAreasOverviewResponse { weakAreas[], totalPracticedCategories, overallAccuracy }
 * Frontend expects: WeakAreasData { weakAreas[], overallAccuracy, totalCategories }
 */
export async function getWeakAreas(): Promise<WeakAreasData> {
  try {
    const response = await apiClient.get<WeakAreasOverviewResponse>(ENDPOINTS.WEAK_AREAS);
    return transformWeakAreas(response.data);
  } catch (error) {
    if (isServiceUnavailable(error)) throw error;
    return WEAK_AREAS_FALLBACK;
  }
}

/** GET /api/users/me/analytics/error-patterns */
export async function getErrorPatterns(): Promise<ErrorPatternsData> {
  try {
    const response = await apiClient.get<ErrorPatternsData>(ENDPOINTS.ERROR_PATTERNS);
    return response.data;
  } catch (error) {
    if (isServiceUnavailable(error)) throw error;
    return ERROR_PATTERNS_FALLBACK;
  }
}

/** Fetch weak areas and error patterns in parallel */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [weakAreas, errorPatterns] = await Promise.all([
    getWeakAreas(),
    getErrorPatterns(),
  ]);
  return { weakAreas, errorPatterns };
}

// ─── Service Object ──────────────────────────────────────

export const analyticsService = {
  getWeakAreas,
  getErrorPatterns,
  getAnalyticsSummary,
};

export default analyticsService;
