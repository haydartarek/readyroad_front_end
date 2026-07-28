import { apiClient } from "@/lib/api";
import type { Language } from "@/lib/constants";

// ─── Types ───────────────────────────────────────────────

/**
 * Shape that the dashboard/WeakAreasPreview component expects.
 * Populated by transforming the backend WeakAreaRecommendationResponse list.
 */
export interface WeakArea {
  categoryCode: string;
  categoryName: string;
  categoryNameEn?: string | null;
  categoryNameNl?: string | null;
  categoryNameFr?: string | null;
  categoryNameAr?: string | null;
  correctCount: number;
  /** Total questions attempted in this category (from backend questionsAttempted) */
  totalCount: number;
  /** Accuracy 0-100 (mapped from backend currentAccuracy) */
  accuracy: number;
  /** Estimated practice time (e.g., "11 min") — recommended time, not avg session time */
  estimatedTime: string;
  commonMistakes: string[];
  recommendedLessons: Array<{ code: string; title: string }>;
  /** Extra fields from backend for rich display */
  accuracyGap?: number;
  recommendedQuestions?: number;
  estimatedTimeMinutes?: number;
  recommendedDifficulty?: string;
  priority?: number;
  categoryId?: number;
  priorityScore?: number;
  confidenceScore?: number;
  trend?: string;
  daysSincePractice?: number | null;
}

export interface WeakAreasData {
  weakAreas: WeakArea[];
  overallAccuracy: number | null;
  totalCategories: number;
  recommendations?: string[];
}

/**
 * Raw shape returned by backend GET /users/me/analytics/weak-areas
 * The endpoint returns a WeakAreasOverviewResponse wrapper object.
 */
interface WeakAreaRecommendationResponse {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  categoryNameEn?: string | null;
  categoryNameNl?: string | null;
  categoryNameFr?: string | null;
  categoryNameAr?: string | null;
  currentAccuracy: number;
  targetAccuracy: number;
  accuracyGap: number;
  recommendedQuestions: number;
  recommendedDifficulty: string;
  estimatedTimeMinutes: number;
  priority: number;
  questionsAttempted: number;
  priorityScore?: number;
  confidenceScore?: number;
  trend?: string;
  daysSincePractice?: number | null;
}

/**
 * Wrapper returned by backend GET /users/me/analytics/weak-areas
 * Contains weak-area list plus accurate summary statistics.
 */
interface WeakAreasOverviewResponse {
  weakAreas: WeakAreaRecommendationResponse[];
  totalPracticedCategories: number;
  overallAccuracy: number | null;
}

// ─── Constants ───────────────────────────────────────────

const WEAK_AREAS_ENDPOINT = "/users/me/analytics/weak-areas";

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
function localizedCategoryName(
  item: WeakAreaRecommendationResponse,
  language: Language,
): string {
  if (language === "ar")
    return item.categoryNameAr || item.categoryNameEn || item.categoryName;
  if (language === "nl")
    return item.categoryNameNl || item.categoryNameEn || item.categoryName;
  if (language === "fr")
    return item.categoryNameFr || item.categoryNameEn || item.categoryName;
  return item.categoryNameEn || item.categoryName;
}

function transformWeakAreas(
  backend: WeakAreasOverviewResponse,
  language: Language,
): WeakAreasData {
  if (!backend || !Array.isArray(backend.weakAreas)) {
    throw new Error("Weak areas response is invalid");
  }

  const weakAreas: WeakArea[] = backend.weakAreas.map((item) => {
    const requiredNumbers = [
      item.categoryId,
      item.currentAccuracy,
      item.questionsAttempted,
      item.estimatedTimeMinutes,
    ];
    if (
      !item.categoryCode ||
      requiredNumbers.some((value) => !Number.isFinite(value))
    ) {
      throw new Error("Weak area item is missing required analytics data");
    }

    return {
      categoryCode: item.categoryCode,
      categoryName: localizedCategoryName(item, language),
      categoryNameEn: item.categoryNameEn,
      categoryNameNl: item.categoryNameNl,
      categoryNameFr: item.categoryNameFr,
      categoryNameAr: item.categoryNameAr,
      accuracy: item.currentAccuracy,
      totalCount: item.questionsAttempted,
      correctCount: Math.round(
        (item.currentAccuracy / 100) * item.questionsAttempted,
      ),
      estimatedTime: `${item.estimatedTimeMinutes} min`,
      commonMistakes: [],
      recommendedLessons: [],
      accuracyGap: item.accuracyGap,
      recommendedQuestions: item.recommendedQuestions,
      estimatedTimeMinutes: item.estimatedTimeMinutes,
      recommendedDifficulty: item.recommendedDifficulty,
      priority: item.priority,
      categoryId: item.categoryId,
      priorityScore: item.priorityScore,
      confidenceScore: item.confidenceScore,
      trend: item.trend,
      daysSincePractice: item.daysSincePractice,
    };
  });

  if (!Number.isFinite(backend.totalPracticedCategories)) {
    throw new Error(
      "Weak areas response is missing the practiced category count",
    );
  }
  if (
    backend.overallAccuracy !== null &&
    !Number.isFinite(backend.overallAccuracy)
  ) {
    throw new Error("Weak areas response contains an invalid overall accuracy");
  }

  return {
    weakAreas,
    overallAccuracy:
      backend.overallAccuracy === null
        ? null
        : Math.round(backend.overallAccuracy * 10) / 10,
    totalCategories: backend.totalPracticedCategories,
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
export async function getWeakAreas(
  language: Language = "en",
): Promise<WeakAreasData> {
  const response =
    await apiClient.get<WeakAreasOverviewResponse>(WEAK_AREAS_ENDPOINT);
  return transformWeakAreas(response.data, language);
}
