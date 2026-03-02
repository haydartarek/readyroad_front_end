import { apiClient, isServiceUnavailable } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────

/** Category summary returned inside OverallProgress (weak/strong/mostStudied lists) */
export interface CategoryProgressSummary {
  categoryName: string;
  categoryCode: string | null;
  accuracy:     number;   // BigDecimal serializes as number in JSON
  attempted:    number;
}

export interface OverallProgress {
  /** Total questions answered (matches backend field name) */
  totalAttempted:          number;
  /** @deprecated alias – same value as totalAttempted, kept for backwards compat */
  totalAttempts?:          number;

  totalCorrect:            number;
  /** @deprecated alias – same value as totalCorrect */
  correctAnswers?:         number;

  overallAccuracy:         number;

  /** Categories where user is struggling (<70% accuracy, ≥5 attempts) */
  weakCategories:          CategoryProgressSummary[];
  /** Categories where user excels (>85% accuracy, ≥5 attempts) */
  strongCategories:        CategoryProgressSummary[];
  /** Top 3 most-studied categories by questions attempted */
  mostStudiedCategories:   CategoryProgressSummary[];

  /** Consecutive study days (real streak from answered_at history) */
  studyStreak:             number;
  /** ISO date of last practice (yyyy-MM-dd) or null */
  lastActivityDate:        string | null;

  questionsRemaining?:     number;
  recommendedDifficulty?:  string;

  // Optional legacy / placeholder fields
  masteryLevel?:           string;
  totalExamsTaken?:        number;
  passedExams?:            number;
  failedExams?:            number;
  averageScore?:           number;
  totalPracticeQuestions?: number;
  correctPracticeAnswers?: number;
  practiceAccuracy?:       number;
  totalStudyHours?:        number;
  currentStreak?:          number;
  longestStreak?:          number;
}

export interface CategoryProgress {
  category:           string;
  categoryName:       string;
  questionsAttempted: number;
  correctAnswers:     number;
  accuracy:           number;
  lastPracticed:      string;
}

export interface ProgressByCategory {
  categories:      CategoryProgress[];
  overallAccuracy: number;
}

export interface RecentActivity {
  id:                  number | string;
  type:                'EXAM' | 'PRACTICE' | 'exam' | 'practice';
  date:                string;
  score?:              number;
  passed?:             boolean;
  category?:           string;
  questionsAnswered?:  number;
}

// ─── Constants ───────────────────────────────────────────

const ENDPOINTS = {
  OVERALL:         '/users/me/progress/overall',
  BY_CATEGORY:     '/users/me/progress/by-category',
  RECENT_ACTIVITY: '/users/me/progress/recent-activity',
} as const;

const OVERALL_FALLBACK: OverallProgress = {
  totalAttempted:         0,
  totalAttempts:          0,
  totalCorrect:           0,
  correctAnswers:         0,
  overallAccuracy:        0,
  masteryLevel:           'beginner',
  weakCategories:         [],
  strongCategories:       [],
  mostStudiedCategories:  [],
  studyStreak:            0,
  lastActivityDate:       null,
  questionsRemaining:     500,
  totalExamsTaken:        0,
  passedExams:            0,
  failedExams:            0,
  averageScore:           0,
  totalPracticeQuestions: 0,
  correctPracticeAnswers: 0,
  practiceAccuracy:       0,
  totalStudyHours:        0,
  currentStreak:          0,
  longestStreak:          0,
};

const BY_CATEGORY_FALLBACK: ProgressByCategory = {
  categories:      [],
  overallAccuracy: 0,
};

// ─── Service ─────────────────────────────────────────────

/** GET /api/users/me/progress/overall */
export async function getOverallProgress(): Promise<OverallProgress> {
  try {
    const response = await apiClient.get<OverallProgress>(ENDPOINTS.OVERALL);
    const data = response.data ?? {};

    // Normalise: add backward-compat aliases so older UI code still works
    return {
      ...OVERALL_FALLBACK,     // fill any missing optional fields with safe defaults
      ...data,
      totalAttempted:   data.totalAttempted   ?? 0,
      totalAttempts:    data.totalAttempted   ?? 0,   // alias
      totalCorrect:     data.totalCorrect     ?? 0,
      correctAnswers:   data.totalCorrect     ?? 0,   // alias
      overallAccuracy:  data.overallAccuracy  ?? 0,
      studyStreak:      data.studyStreak      ?? 0,
      lastActivityDate: data.lastActivityDate ?? null,
      weakCategories:      Array.isArray(data.weakCategories)      ? data.weakCategories      : [],
      strongCategories:    Array.isArray(data.strongCategories)    ? data.strongCategories    : [],
      mostStudiedCategories: Array.isArray(data.mostStudiedCategories) ? data.mostStudiedCategories : [],
    };
  } catch (error) {
    if (isServiceUnavailable(error)) throw error;
    return OVERALL_FALLBACK;
  }
}

/** GET /api/users/me/progress/by-category */
export async function getProgressByCategory(): Promise<ProgressByCategory> {
  try {
    const response = await apiClient.get<ProgressByCategory>(ENDPOINTS.BY_CATEGORY);
    return response.data;
  } catch (error) {
    if (isServiceUnavailable(error)) throw error;
    return BY_CATEGORY_FALLBACK;
  }
}

/** GET /api/users/me/progress/recent-activity */
export async function getRecentActivity(limit = 10): Promise<RecentActivity[]> {
  try {
    const response = await apiClient.get<RecentActivity[]>(
      ENDPOINTS.RECENT_ACTIVITY,
      { limit },
    );
    return response.data;
  } catch (error) {
    if (isServiceUnavailable(error)) throw error;
    return [];
  }
}

// ─── Service Object ──────────────────────────────────────

export const progressService = {
  getOverallProgress,
  getProgressByCategory,
  getRecentActivity,
};

export default progressService;
