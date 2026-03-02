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
  averageTime:        string;
  commonMistakes:     string[];
  recommendedLessons: Array<{ code: string; title: string }>;
  /** Extra fields from backend for rich display */
  accuracyGap?:          number;
  recommendedQuestions?: number;
  estimatedTimeMinutes?: number;
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
 * The endpoint returns a plain JSON array of these objects.
 */
interface WeakAreaRecommendationResponse {
  categoryId:           number;
  categoryCode:         string;
  categoryName:         string;
  currentAccuracy:      number;   // backend field name (NOT "accuracy")
  targetAccuracy:       number;
  accuracyGap:          number;
  recommendedQuestions: number;
  recommendedDifficulty: string;
  estimatedTimeMinutes: number;
  priority:             number;
  questionsAttempted:   number;   // added in latest backend fix
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
 * Transform backend WeakAreaRecommendationResponse[] (plain array)
 * into the WeakAreasData shape that frontend components expect.
 *
 * Key mappings:
 *   backend.currentAccuracy    → frontend.accuracy
 *   backend.questionsAttempted → frontend.totalCount
 */
function transformWeakAreas(backendList: WeakAreaRecommendationResponse[]): WeakAreasData {
  if (!Array.isArray(backendList) || backendList.length === 0) {
    return WEAK_AREAS_FALLBACK;
  }

  const weakAreas: WeakArea[] = backendList.map((item) => ({
    categoryCode:        item.categoryCode        ?? '',
    categoryName:        item.categoryName        ?? '',
    accuracy:            item.currentAccuracy     ?? 0,   // ← key fix
    totalCount:          item.questionsAttempted  ?? 0,   // ← key fix
    correctCount:        Math.round(
                           ((item.currentAccuracy ?? 0) / 100) *
                           (item.questionsAttempted ?? 0)
                         ),
    averageTime:         `${item.estimatedTimeMinutes ?? 0} min`,
    commonMistakes:      [],
    recommendedLessons:  [],
    accuracyGap:          item.accuracyGap,
    recommendedQuestions: item.recommendedQuestions,
    estimatedTimeMinutes: item.estimatedTimeMinutes,
    priority:             item.priority,
    categoryId:           item.categoryId,
  }));

  // Overall accuracy = average of weak-area accuracies
  const overallAccuracy =
    weakAreas.reduce((sum, a) => sum + a.accuracy, 0) / weakAreas.length;

  return {
    weakAreas,
    overallAccuracy: Math.round(overallAccuracy * 10) / 10,
    totalCategories: weakAreas.length,
    recommendations: [],
  };
}

// ─── Service ─────────────────────────────────────────────

/**
 * GET /api/users/me/analytics/weak-areas
 *
 * Backend returns: WeakAreaRecommendationResponse[] (plain JSON array)
 * Frontend expects: WeakAreasData { weakAreas[], overallAccuracy, totalCategories }
 */
export async function getWeakAreas(): Promise<WeakAreasData> {
  try {
    // Backend returns a plain array – type it correctly
    const response = await apiClient.get<WeakAreaRecommendationResponse[]>(ENDPOINTS.WEAK_AREAS);
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
