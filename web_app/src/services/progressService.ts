import { apiClient, isServiceUnavailable } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import {
  getPracticeHistory,
  getRandomPracticeHistory,
  getSignExamHistory,
} from "./signQuizService";

// ─── Types ───────────────────────────────────────────────

/** Category summary returned inside OverallProgress (weak/strong/mostStudied lists) */
export interface CategoryProgressSummary {
  categoryName: string;
  categoryCode: string | null;
  accuracy: number; // BigDecimal serializes as number in JSON
  attempted: number;
}

export interface SignWeaknessSummary {
  signCode: string;
  signNameEn?: string | null;
  signNameNl?: string | null;
  signNameFr?: string | null;
  signNameAr?: string | null;
  accuracy: number;
  attempted: number;
  wrongAnswers: number;
}

export interface OverallProgress {
  /** Total questions answered (matches backend field name) */
  totalAttempted: number;
  /** @deprecated alias – same value as totalAttempted, kept for backwards compat */
  totalAttempts?: number;

  totalCorrect: number;
  /** @deprecated alias – same value as totalCorrect */
  correctAnswers?: number;

  overallAccuracy: number;

  /** Categories where user is struggling (<70% accuracy, ≥5 attempts) */
  weakCategories: CategoryProgressSummary[];
  /** Categories where user excels (>85% accuracy, ≥5 attempts) */
  strongCategories: CategoryProgressSummary[];
  /** Top 3 most-studied categories by questions attempted */
  mostStudiedCategories: CategoryProgressSummary[];

  /** Consecutive study days (real streak from answered_at history) */
  studyStreak: number;
  /** ISO date of last practice (yyyy-MM-dd) or null */
  lastActivityDate: string | null;

  questionsRemaining?: number;
  recommendedDifficulty?: string;

  // Optional legacy / placeholder fields
  masteryLevel?: string;
  totalExamsTaken?: number;
  passedExams?: number;
  failedExams?: number;
  passRate?: number;
  averageScore?: number;
  totalPracticeQuestions?: number;
  correctPracticeAnswers?: number;
  practiceAccuracy?: number;
  totalStudyHours?: number;
  currentStreak?: number;
  longestStreak?: number;
  signPracticeCount?: number;
  signExamCount?: number;
  signPassedCount?: number;
  signRandomExamCount?: number;
  signRandomExamPassedCount?: number;
  lessonsStartedCount?: number;
  lessonsCompletedCount?: number;
  incompleteActivitiesCount?: number;
  activeTheoryExamCount?: number;
  incompleteSignPracticeCount?: number;
  activeRandomSignExamCount?: number;
  weakSigns?: SignWeaknessSummary[];
}

export interface CategoryProgress {
  categoryId?: number;
  categoryCode?: string;
  /** @deprecated alias for categoryCode, kept for backwards compatibility */
  category?: string;
  categoryName: string;
  questionsAttempted: number;
  correctAnswers: number;
  accuracyRate: number;
  /** @deprecated alias for accuracyRate, kept for older UI code */
  accuracy: number;
  masteryLevel?: string;
  lastPracticed: string | null;
  isWeakCategory?: boolean;
  isStrongCategory?: boolean;
  /** @deprecated backend alias */
  weakCategory?: boolean;
  /** @deprecated backend alias */
  strongCategory?: boolean;
  questionsRemaining?: number | null;
  recommendedDifficulty?: string | null;
}

export interface ProgressByCategory {
  categories: CategoryProgress[];
  overallAccuracy: number;
}

export interface RecentActivity {
  id: number | string;
  type: "EXAM" | "PRACTICE" | "exam" | "practice" | "sign-exam";
  date: string;
  status?: "COMPLETED" | "IN_PROGRESS" | "EXPIRED" | "ABANDONED";
  score?: number;
  passed?: boolean;
  category?: string;
  signNameEn?: string;
  signNameNl?: string;
  signNameFr?: string;
  signNameAr?: string;
  questionsAnswered?: number;
  totalQuestions?: number;
  link?: string;
}

// ─── Constants ───────────────────────────────────────────

const ENDPOINTS = {
  OVERALL: "/users/me/progress/overall",
  BY_CATEGORY: "/users/me/progress/categories",
  EXAM_HISTORY: "/exams/simulations/history",
} as const;

const OVERALL_FALLBACK: OverallProgress = {
  totalAttempted: 0,
  totalAttempts: 0,
  totalCorrect: 0,
  correctAnswers: 0,
  overallAccuracy: 0,
  masteryLevel: "beginner",
  weakCategories: [],
  strongCategories: [],
  mostStudiedCategories: [],
  studyStreak: 0,
  lastActivityDate: null,
  questionsRemaining: 500,
  totalExamsTaken: 0,
  passedExams: 0,
  failedExams: 0,
  passRate: 0,
  averageScore: 0,
  totalPracticeQuestions: 0,
  correctPracticeAnswers: 0,
  practiceAccuracy: 0,
  totalStudyHours: 0,
  currentStreak: 0,
  longestStreak: 0,
  signPracticeCount: 0,
  signExamCount: 0,
  signPassedCount: 0,
  signRandomExamCount: 0,
  signRandomExamPassedCount: 0,
  lessonsStartedCount: 0,
  lessonsCompletedCount: 0,
  incompleteActivitiesCount: 0,
  activeTheoryExamCount: 0,
  incompleteSignPracticeCount: 0,
  activeRandomSignExamCount: 0,
  weakSigns: [],
};

const BY_CATEGORY_FALLBACK: ProgressByCategory = {
  categories: [],
  overallAccuracy: 0,
};

function normalizeCategoryProgress(
  item: Partial<CategoryProgress>,
): CategoryProgress {
  const accuracyRate = Number(item.accuracyRate ?? item.accuracy ?? 0);

  return {
    categoryId: item.categoryId,
    categoryCode: item.categoryCode ?? item.category ?? "",
    category: item.category ?? item.categoryCode ?? "",
    categoryName: item.categoryName ?? "",
    questionsAttempted: item.questionsAttempted ?? 0,
    correctAnswers: item.correctAnswers ?? 0,
    accuracyRate,
    accuracy: accuracyRate,
    masteryLevel: item.masteryLevel,
    lastPracticed: item.lastPracticed ?? null,
    isWeakCategory: item.isWeakCategory ?? item.weakCategory ?? false,
    isStrongCategory: item.isStrongCategory ?? item.strongCategory ?? false,
    weakCategory: item.weakCategory ?? item.isWeakCategory ?? false,
    strongCategory: item.strongCategory ?? item.isStrongCategory ?? false,
    questionsRemaining: item.questionsRemaining ?? null,
    recommendedDifficulty: item.recommendedDifficulty ?? null,
  };
}

function computeOverallCategoryAccuracy(
  categories: CategoryProgress[],
): number {
  const totalAttempted = categories.reduce(
    (sum, category) => sum + (category.questionsAttempted ?? 0),
    0,
  );
  if (totalAttempted === 0) return 0;

  const totalCorrect = categories.reduce(
    (sum, category) => sum + (category.correctAnswers ?? 0),
    0,
  );

  return Number(((totalCorrect * 100) / totalAttempted).toFixed(2));
}

// ─── Service ─────────────────────────────────────────────

/** GET /api/users/me/progress/overall */
export async function getOverallProgress(): Promise<OverallProgress> {
  try {
    const response = await apiClient.get<OverallProgress>(ENDPOINTS.OVERALL);
    const data = response.data ?? {};

    // Normalise: add backward-compat aliases so older UI code still works
    return {
      ...OVERALL_FALLBACK, // fill any missing optional fields with safe defaults
      ...data,
      totalAttempted: data.totalAttempted ?? 0,
      totalAttempts: data.totalAttempted ?? 0, // alias
      totalCorrect: data.totalCorrect ?? 0,
      correctAnswers: data.totalCorrect ?? 0, // alias
      overallAccuracy: data.overallAccuracy ?? 0,
      studyStreak: data.studyStreak ?? 0,
      lastActivityDate: data.lastActivityDate ?? null,
      totalExamsTaken: data.totalExamsTaken ?? 0,
      passedExams: data.passedExams ?? 0,
      failedExams: data.failedExams ?? 0,
      passRate: data.passRate ?? 0,
      signPracticeCount: data.signPracticeCount ?? 0,
      signExamCount: data.signExamCount ?? 0,
      signPassedCount: data.signPassedCount ?? 0,
      signRandomExamCount: data.signRandomExamCount ?? 0,
      signRandomExamPassedCount: data.signRandomExamPassedCount ?? 0,
      lessonsStartedCount: data.lessonsStartedCount ?? 0,
      lessonsCompletedCount: data.lessonsCompletedCount ?? 0,
      incompleteActivitiesCount: data.incompleteActivitiesCount ?? 0,
      activeTheoryExamCount: data.activeTheoryExamCount ?? 0,
      incompleteSignPracticeCount: data.incompleteSignPracticeCount ?? 0,
      activeRandomSignExamCount: data.activeRandomSignExamCount ?? 0,
      weakSigns: Array.isArray(data.weakSigns) ? data.weakSigns : [],
      weakCategories: Array.isArray(data.weakCategories)
        ? data.weakCategories
        : [],
      strongCategories: Array.isArray(data.strongCategories)
        ? data.strongCategories
        : [],
      mostStudiedCategories: Array.isArray(data.mostStudiedCategories)
        ? data.mostStudiedCategories
        : [],
    };
  } catch (error) {
    if (isServiceUnavailable(error)) throw error;
    return OVERALL_FALLBACK;
  }
}

/** GET /api/users/me/progress/categories */
export async function getProgressByCategory(): Promise<ProgressByCategory> {
  try {
    const response = await apiClient.get<
      CategoryProgress[] | ProgressByCategory
    >(ENDPOINTS.BY_CATEGORY);
    const payload = response.data;

    const categories = Array.isArray(payload)
      ? payload.map(normalizeCategoryProgress)
      : Array.isArray(payload?.categories)
        ? payload.categories.map(normalizeCategoryProgress)
        : [];

    return {
      categories,
      overallAccuracy: Array.isArray(payload)
        ? computeOverallCategoryAccuracy(categories)
        : (payload?.overallAccuracy ??
          computeOverallCategoryAccuracy(categories)),
    };
  } catch (error) {
    if (isServiceUnavailable(error)) throw error;
    return BY_CATEGORY_FALLBACK;
  }
}

/** Returns recent exam activity from persisted exam history */
export async function getRecentActivity(limit = 10): Promise<RecentActivity[]> {
  try {
    const [
      officialResult,
      activeExamResult,
      randomResult,
      signExamResult,
      signPracticeResult,
    ] = await Promise.allSettled([
      apiClient.get<{
        totalExams?: number;
        exams?: Array<{
          examId: number;
          startedAt: string;
          completedAt: string | null;
          status?: "COMPLETED" | "IN_PROGRESS" | "EXPIRED" | "ABANDONED";
          totalQuestions?: number;
          correctAnswers?: number;
          scorePercentage: number;
          passed: boolean;
        }>;
      }>(ENDPOINTS.EXAM_HISTORY),
      apiClient.get<{
        hasActiveExam: boolean;
        activeExam: {
          examId: number;
          startedAt: string;
          expiresAt?: string;
          totalQuestions?: number;
        } | null;
      }>(API_ENDPOINTS.EXAMS.ACTIVE),
      getRandomPracticeHistory(),
      getSignExamHistory(),
      getPracticeHistory(),
    ]);

    const officialExams =
      officialResult.status === "fulfilled"
        ? (officialResult.value.data.exams ?? [])
        : [];

    const randomSessions =
      randomResult.status === "fulfilled"
        ? (randomResult.value.sessions ?? [])
        : [];

    const signExamSessions =
      signExamResult.status === "fulfilled"
        ? (signExamResult.value.results ?? [])
        : [];

    const signPracticeSessions =
      signPracticeResult.status === "fulfilled"
        ? (signPracticeResult.value.sessions ?? [])
        : [];

    const activeExam =
      activeExamResult.status === "fulfilled" &&
      activeExamResult.value.data.hasActiveExam
        ? activeExamResult.value.data.activeExam
        : null;

    const officialExamActivity: RecentActivity[] = officialExams.map(
      (exam) => ({
        id: exam.examId,
        type: "exam",
        date: exam.completedAt ?? exam.startedAt,
        status: exam.status ?? "COMPLETED",
        score:
          exam.status === "COMPLETED"
            ? Math.round(exam.scorePercentage ?? 0)
            : undefined,
        passed: exam.status === "COMPLETED" ? exam.passed : undefined,
        questionsAnswered:
          exam.status === "COMPLETED" ? exam.totalQuestions : undefined,
        totalQuestions: exam.totalQuestions,
        link: `/exam/results/${exam.examId}`,
      }),
    );

    const activeTheoryExamActivity: RecentActivity[] = activeExam
      ? [
          {
            id: activeExam.examId,
            type: "exam",
            date: activeExam.startedAt,
            status: "IN_PROGRESS",
            totalQuestions: activeExam.totalQuestions,
            link: `/exam/${activeExam.examId}`,
          },
        ]
      : [];

    const randomSignExamActivity: RecentActivity[] = randomSessions.map(
      (session) => ({
        id: session.sessionId,
        type: "sign-exam",
        date: session.completedAt ?? session.startedAt,
        status: session.status,
        score:
          session.status === "COMPLETED"
            ? Math.round(session.scorePercentage ?? 0)
            : undefined,
        passed: session.status === "COMPLETED" ? session.passed : undefined,
        questionsAnswered: session.answeredCount,
        totalQuestions: session.totalQuestions,
        link:
          session.status === "IN_PROGRESS"
            ? "/practice/random"
            : `/dashboard?section=exam-results&randomSignExamId=${session.sessionId}`,
      }),
    );

    const signSpecificExamActivity: RecentActivity[] = signExamSessions
      .filter((result): result is typeof result & { completedAt: string } =>
        Boolean(result.completedAt),
      )
      .map((result) => ({
        id: result.resultId,
        type: "sign-exam",
        date: result.completedAt,
        status: "COMPLETED",
        score: Math.round(result.scorePercentage ?? 0),
        passed: result.passed,
        category:
          result.nameEn ?? result.nameNl ?? result.routeCode ?? result.signCode,
        signNameEn: result.nameEn,
        signNameNl: result.nameNl,
        signNameFr: result.nameFr,
        signNameAr: result.nameAr,
        questionsAnswered: result.answeredCount,
        totalQuestions: result.totalQuestions,
        link: `/dashboard?section=exam-results&signExamResultId=${result.resultId}`,
      }));

    const signPracticeActivity: RecentActivity[] = signPracticeSessions.map(
      (session) => ({
        id: session.sessionId,
        type: "practice",
        date: session.completedAt ?? session.startedAt,
        status: session.status,
        score:
          session.status === "COMPLETED"
            ? Math.round(session.scorePercentage ?? 0)
            : undefined,
        passed: session.status === "COMPLETED" ? session.passed : undefined,
        category: session.signCode,
        signNameEn: session.nameEn,
        signNameNl: session.nameNl,
        signNameFr: session.nameFr,
        signNameAr: session.nameAr,
        questionsAnswered: session.answeredCount,
        totalQuestions: session.totalQuestions,
        link:
          session.status === "IN_PROGRESS"
            ? `/traffic-signs/${session.signCode}/practice`
            : `/traffic-signs/${session.signCode}`,
      }),
    );

    return [
      ...activeTheoryExamActivity,
      ...officialExamActivity,
      ...randomSignExamActivity,
      ...signSpecificExamActivity,
      ...signPracticeActivity,
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
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
