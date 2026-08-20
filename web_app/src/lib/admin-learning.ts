export type AdminLearningPage<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
};

export type CategoryPerformance = {
  categoryId: number;
  categoryCode: string;
  nameEn: string;
  nameNl: string;
  nameFr: string;
  nameAr: string;
  questionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
  lastPracticedAt: string | null;
};

export type StudentLearningSummary = {
  userId: number;
  username: string;
  displayName: string;
  email: string;
  preferredLanguage: string | null;
  accountCreatedAt: string;
  lastActiveAt: string | null;
  totalCompletedExams: number;
  totalCompletedPractices: number;
  averageExamScore: number | null;
  latestExamScore: number | null;
  strongestCategories: CategoryPerformance[];
  weakestCategories: CategoryPerformance[];
  learningTrend: "IMPROVING" | "STABLE" | "DECLINING" | "INSUFFICIENT_DATA";
  lastActivityType: string | null;
};

export type AdminExamSummary = {
  examId: number;
  userId: number;
  username: string;
  displayName: string;
  examType: "THEORY_EXAM" | "RANDOM_EXAM" | "TRAFFIC_SIGN_EXAM";
  subjectCode: string | null;
  startedAt: string;
  completedAt: string;
  durationSeconds: number | null;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredAnswers: number;
  scorePercentage: number;
  passed: boolean;
  languageCode: string | null;
};

export type ActivityAvailability = {
  trafficSignStudyTrackingAvailable: boolean;
  videoTrackingAvailable: boolean;
  trafficSignStudyReason: string;
  videoReason: string;
};

export type TheoryCoverageCategory = {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  eligibleQuestions: number;
  uniqueQuestionsSeen: number;
  unseenQuestions: number;
  coveragePercentage: number | null;
  timesPresented: number;
  timesAnswered: number;
  timesCorrect: number;
  timesIncorrect: number;
  accuracyPercentage: number | null;
};

export type TheoryCoverage = {
  languageCode: string;
  eligibleQuestions: number;
  uniqueQuestionsSeen: number;
  unseenQuestions: number;
  coveragePercentage: number | null;
  timesPresented: number;
  timesAnswered: number;
  timesCorrect: number;
  timesIncorrect: number;
  accuracyPercentage: number | null;
  categories: TheoryCoverageCategory[];
};

export type DifficultyPerformance = {
  difficulty: "EASY" | "MEDIUM" | "HARD";
  answeredQuestions: number;
  correctAnswers: number;
  accuracy: number;
};

export type DifficultyPerformanceResponse = {
  items: DifficultyPerformance[];
  snapshotBackedAnswers: number;
  legacyAnswersExcluded: number;
  evidenceStatus: "NO_DATA" | "LEGACY_ONLY" | "SNAPSHOT_COMPLETE" | "SNAPSHOT_PARTIAL";
};

export type HistoricalContentStatus =
  | "SNAPSHOT_COMPLETE"
  | "SNAPSHOT_PARTIAL"
  | "LEGACY_NO_SNAPSHOT"
  | "STORED_RESULT";

export type AdminExamDetailResponse = {
  userId: number;
  examType: AdminExamSummary["examType"];
  examId: number;
  summary: AdminExamSummary;
  historicalContentStatus: HistoricalContentStatus;
  result: Record<string, unknown>;
};

export type PracticeSummary = {
  sessionId: number;
  signCode: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  languageCode: string | null;
};

export type LessonActivity = {
  lessonId: number;
  lessonCode: string;
  titleEn: string;
  titleNl: string;
  titleFr: string;
  titleAr: string;
  status: string;
  pagesRead: number;
  openedAt: string;
  lastSeenAt: string | null;
  completedAt: string | null;
  languageCode: string | null;
};

export type SignPerformance = {
  signId: number;
  signCode: string;
  attempts: number;
  passedAttempts: number;
  averageScore: number;
  latestScore: number | null;
  lastAttemptAt: string;
};

export type LearningErrorPattern = {
  id: number;
  errorType: string;
  questionType: string;
  questionRefId: number | null;
  trafficSignCode: string | null;
  ruleCategory: string | null;
  occurredAt: string;
};

export function localizedCategoryName(
  category: CategoryPerformance,
  language: string,
): string {
  const suffix = language.charAt(0).toUpperCase() + language.slice(1);
  return (
    category[`name${suffix}` as keyof CategoryPerformance] ||
    category.nameEn ||
    category.categoryCode
  ).toString();
}

export function examTypeKey(type: AdminExamSummary["examType"]): string {
  return `admin.learning.exam_type.${type.toLowerCase()}`;
}

export function localizedLessonTitle(lesson: LessonActivity, language: string): string {
  const suffix = language.charAt(0).toUpperCase() + language.slice(1);
  return (lesson[`title${suffix}` as keyof LessonActivity] || lesson.titleEn || lesson.lessonCode).toString();
}
