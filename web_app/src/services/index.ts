// ─── User ────────────────────────────────────────────────

export { updateProfile } from "./userService";

// ─── Analytics ───────────────────────────────────────────

export { getWeakAreas, type WeakAreasData } from "./analyticsService";

// ─── Progress ────────────────────────────────────────────

export {
  getOverallProgress,
  getStudentIntelligence,
  getProgressByCategory,
  getRecentActivity,
  getTheoryTimeoutAnalysis,
} from "./progressService";

// ─── Sign Quiz ────────────────────────────────────────────

export {
  startPracticeSession,
  submitPracticeAnswer,
  getPracticeResults,
  abandonPracticeSession,
  getExamQuestions,
  submitExam,
  getSignStatus,
  getAllSignProgress,
  type SignChoice,
  type SignQuizQuestion,
  type SignPracticeSession,
  type SignPracticeAnswerResponse,
  type PracticeAnswerDetail,
  type SignExamQuestions,
  type SignExamResult,
  type SignUserProgress,
} from "./signQuizService";
