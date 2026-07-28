import { apiClient } from "@/lib/api";
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

export interface StudentLearningPriority {
  categoryId: number;
  categoryCode: string;
  categoryNameEn?: string | null;
  categoryNameNl?: string | null;
  categoryNameFr?: string | null;
  categoryNameAr?: string | null;
  accuracy: number;
  questionsAttempted: number;
  priorityScore: number;
  confidenceScore: number;
  trend: "IMPROVING" | "STABLE" | "DECLINING" | "INSUFFICIENT_DATA";
  trendChange: number | null;
  daysSincePractice: number | null;
}

export interface StudentIntelligence {
  dataStatus: "NO_DATA" | "LIMITED" | "SUFFICIENT";
  studentLevel:
    | "BEGINNER"
    | "BASIC"
    | "INTERMEDIATE"
    | "ADVANCED"
    | "EXAM_READY"
    | "EXPERT";
  examReadinessScore: number | null;
  confidenceScore: number | null;
  learningConsistencyScore: number | null;
  knowledgeRetentionScore: number | null;
  estimatedPassProbability: number | null;
  weeklyProgress: number | null;
  monthlyProgress: number | null;
  overallLearningTrend:
    "IMPROVING" | "STABLE" | "DECLINING" | "INSUFFICIENT_DATA";
  totalLearningActivities: number;
  activeDaysLast28: number;
  evidenceQuestions: number;
  examAnalytics: {
    totalExams: number;
    completedExams: number;
    passedExams: number;
    failedExams: number;
    passRate: number | null;
    averageScore: number | null;
    highestScore: number | null;
    lowestScore: number | null;
    averageCompletionTimeSeconds: number | null;
    fastestCompletionTimeSeconds: number | null;
    slowestCompletionTimeSeconds: number | null;
    scoreTrend: number | null;
    passTrend: number | null;
    recentScores: number[];
  };
  timingAnalytics: {
    averageAnswerTimeSeconds: number | null;
    answerTimeTrendSeconds: number | null;
    examTimeTrendSeconds: number | null;
    answerTimingSamples: number;
    answerTimingScope: "UNAVAILABLE" | "LATEST_RECORDED_PER_QUESTION";
    categoryTimings: Array<{
      categoryId: number;
      categoryCode: string;
      categoryNameEn?: string | null;
      categoryNameNl?: string | null;
      categoryNameFr?: string | null;
      categoryNameAr?: string | null;
      averageAnswerTimeSeconds: number;
      samples: number;
    }>;
  };
  progressJourney: {
    lessonsStarted: number;
    lessonsCompleted: number;
    lessonRevisitCount: number | null;
    currentStudyStreak: number;
    activeToday: boolean;
    activeDaysLast7: number;
    activeDaysLast30: number;
    completedPracticeSessions: number;
    completedOfficialExams: number;
    masteredCategories: number;
    masteredSigns: number;
  };
  learningPriorities: StudentLearningPriority[];
  strongestCategories: StudentLearningPriority[];
  recommendations: Array<{
    key: string;
    categoryCode: string | null;
    actionPath: string;
    priority: number;
  }>;
}

export interface OverallProgress {
  /** Total questions answered (matches backend field name) */
  totalAttempted: number;
  totalCorrect: number;
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

  questionsRemaining: number;
  recommendedDifficulty: string;

  totalExamsTaken: number;
  passedExams: number;
  failedExams: number;
  passRate: number;
  signPracticeCount: number;
  signExamCount: number;
  signPassedCount: number;
  signRandomExamCount: number;
  signRandomExamPassedCount: number;
  lessonsStartedCount: number;
  lessonsCompletedCount: number;
  incompleteActivitiesCount: number;
  activeTheoryExamCount: number;
  incompleteSignPracticeCount: number;
  activeRandomSignExamCount: number;
  weakSigns: SignWeaknessSummary[];
}

export interface CategoryProgress {
  categoryId?: number;
  categoryCode: string;
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
  INTELLIGENCE: "/users/me/progress/intelligence",
  BY_CATEGORY: "/users/me/progress/categories",
  EXAM_HISTORY: "/exams/simulations/history",
} as const;

const REQUIRED_INTELLIGENCE_FIELDS = [
  "dataStatus",
  "studentLevel",
  "overallLearningTrend",
  "totalLearningActivities",
  "activeDaysLast28",
  "evidenceQuestions",
] as const;

const REQUIRED_OVERALL_NUMERIC_FIELDS = [
  "totalAttempted",
  "totalCorrect",
  "overallAccuracy",
  "studyStreak",
  "questionsRemaining",
  "totalExamsTaken",
  "passedExams",
  "failedExams",
  "passRate",
  "signPracticeCount",
  "signExamCount",
  "signPassedCount",
  "signRandomExamCount",
  "signRandomExamPassedCount",
  "lessonsStartedCount",
  "lessonsCompletedCount",
  "incompleteActivitiesCount",
  "activeTheoryExamCount",
  "incompleteSignPracticeCount",
  "activeRandomSignExamCount",
] as const;

function assertOverallProgressContract(data: OverallProgress): void {
  const values = data as unknown as Record<string, unknown>;
  const missingField = REQUIRED_OVERALL_NUMERIC_FIELDS.find(
    (field) => typeof values[field] !== "number",
  );

  if (missingField) {
    throw new Error(`Overall progress response is missing ${missingField}`);
  }
  for (const field of [
    "weakSigns",
    "weakCategories",
    "strongCategories",
    "mostStudiedCategories",
  ] as const) {
    if (!Array.isArray(values[field])) {
      throw new Error(`Overall progress response is missing ${field}`);
    }
  }

  for (const category of [
    ...data.weakCategories,
    ...data.strongCategories,
    ...data.mostStudiedCategories,
  ]) {
    if (
      typeof category.categoryName !== "string" ||
      typeof category.accuracy !== "number" ||
      !Number.isFinite(category.accuracy) ||
      typeof category.attempted !== "number" ||
      !Number.isFinite(category.attempted)
    ) {
      throw new Error("Overall progress contains an invalid category summary");
    }
  }

  for (const sign of data.weakSigns) {
    if (
      typeof sign.signCode !== "string" ||
      typeof sign.accuracy !== "number" ||
      !Number.isFinite(sign.accuracy) ||
      typeof sign.attempted !== "number" ||
      !Number.isFinite(sign.attempted) ||
      typeof sign.wrongAnswers !== "number" ||
      !Number.isFinite(sign.wrongAnswers)
    ) {
      throw new Error("Overall progress contains an invalid weak sign");
    }
  }
}

function normalizeCategoryProgress(
  item: Partial<CategoryProgress>,
): CategoryProgress {
  const categoryCode = item.categoryCode ?? item.category;
  const accuracyValue = item.accuracyRate ?? item.accuracy;
  if (
    !categoryCode ||
    !item.categoryName ||
    typeof item.questionsAttempted !== "number" ||
    !Number.isFinite(item.questionsAttempted) ||
    typeof item.correctAnswers !== "number" ||
    !Number.isFinite(item.correctAnswers) ||
    typeof accuracyValue !== "number" ||
    !Number.isFinite(accuracyValue)
  ) {
    throw new Error("Category progress item is missing required data");
  }
  const accuracyRate = Number(accuracyValue);

  return {
    categoryId: item.categoryId,
    categoryCode,
    category: categoryCode,
    categoryName: item.categoryName,
    questionsAttempted: item.questionsAttempted,
    correctAnswers: item.correctAnswers,
    accuracyRate,
    accuracy: accuracyRate,
    masteryLevel: item.masteryLevel,
    lastPracticed: item.lastPracticed ?? null,
    isWeakCategory: item.isWeakCategory ?? item.weakCategory,
    isStrongCategory: item.isStrongCategory ?? item.strongCategory,
    weakCategory: item.weakCategory ?? item.isWeakCategory,
    strongCategory: item.strongCategory ?? item.isStrongCategory,
    questionsRemaining: item.questionsRemaining ?? null,
    recommendedDifficulty: item.recommendedDifficulty ?? null,
  };
}

function computeOverallCategoryAccuracy(
  categories: CategoryProgress[],
): number {
  const totalAttempted = categories.reduce(
    (sum, category) => sum + category.questionsAttempted,
    0,
  );
  if (totalAttempted === 0) return 0;

  const totalCorrect = categories.reduce(
    (sum, category) => sum + category.correctAnswers,
    0,
  );

  return Number(((totalCorrect * 100) / totalAttempted).toFixed(2));
}

// ─── Service ─────────────────────────────────────────────

/** GET /api/users/me/progress/overall */
export async function getOverallProgress(): Promise<OverallProgress> {
  const response = await apiClient.get<OverallProgress>(ENDPOINTS.OVERALL);
  const data = response.data;
  if (!data || typeof data !== "object") {
    throw new Error("Overall progress response is missing");
  }
  assertOverallProgressContract(data);

  return data;
}

/** Complete, read-only learning intelligence calculated from persisted history. */
export async function getStudentIntelligence(): Promise<StudentIntelligence> {
  const response = await apiClient.get<StudentIntelligence>(
    ENDPOINTS.INTELLIGENCE,
  );
  const data = response.data;
  if (!data || typeof data !== "object") {
    throw new Error("Student intelligence response is missing");
  }
  const values = data as unknown as Record<string, unknown>;
  const missingField = REQUIRED_INTELLIGENCE_FIELDS.find(
    (field) => values[field] === null || values[field] === undefined,
  );
  if (
    missingField ||
    !data.examAnalytics ||
    !data.timingAnalytics ||
    !data.progressJourney ||
    !Array.isArray(data.learningPriorities) ||
    !Array.isArray(data.strongestCategories) ||
    !Array.isArray(data.recommendations)
  ) {
    throw new Error(
      `Student intelligence response is invalid${missingField ? `: ${missingField}` : ""}`,
    );
  }
  return data;
}

/** GET /api/users/me/progress/categories */
export async function getProgressByCategory(): Promise<ProgressByCategory> {
  const response = await apiClient.get<CategoryProgress[] | ProgressByCategory>(
    ENDPOINTS.BY_CATEGORY,
  );
  const payload = response.data;

  if (!Array.isArray(payload) && !Array.isArray(payload?.categories)) {
    throw new Error("Category progress response is invalid");
  }

  const categories = Array.isArray(payload)
    ? payload.map(normalizeCategoryProgress)
    : payload.categories.map(normalizeCategoryProgress);

  return {
    categories,
    overallAccuracy: Array.isArray(payload)
      ? computeOverallCategoryAccuracy(categories)
      : requireFiniteMetric(
          payload.overallAccuracy,
          "category progress overallAccuracy",
        ),
  };
}

function requireFiniteMetric(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Progress response is missing ${field}`);
  }
  return value;
}

/** Returns recent exam activity from persisted exam history */
export async function getRecentActivity(limit = 10): Promise<RecentActivity[]> {
  const [
    officialResult,
    activeExamResult,
    randomResult,
    signExamResult,
    signPracticeResult,
  ] = await Promise.all([
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

  const officialExams = officialResult.data.exams ?? [];
  const randomSessions = randomResult.sessions ?? [];
  const signExamSessions = signExamResult.results ?? [];
  const signPracticeSessions = signPracticeResult.sessions ?? [];
  const activeExam = activeExamResult.data.hasActiveExam
    ? activeExamResult.data.activeExam
    : null;

  const officialExamActivity: RecentActivity[] = officialExams.map((exam) => ({
    id: exam.examId,
    type: "exam",
    date: exam.completedAt ?? exam.startedAt,
    status: exam.status ?? "COMPLETED",
    score:
      exam.status === "COMPLETED"
        ? Math.round(
            requireFiniteMetric(
              exam.scorePercentage,
              "official exam scorePercentage",
            ),
          )
        : undefined,
    passed: exam.status === "COMPLETED" ? exam.passed : undefined,
    questionsAnswered:
      exam.status === "COMPLETED" ? exam.totalQuestions : undefined,
    totalQuestions: exam.totalQuestions,
    link: `/exam/results/${exam.examId}`,
  }));

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
          ? Math.round(
              requireFiniteMetric(
                session.scorePercentage,
                "random sign exam scorePercentage",
              ),
            )
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
      score: Math.round(
        requireFiniteMetric(
          result.scorePercentage,
          "sign exam scorePercentage",
        ),
      ),
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
          ? Math.round(
              requireFiniteMetric(
                session.scorePercentage,
                "sign practice scorePercentage",
              ),
            )
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
}
