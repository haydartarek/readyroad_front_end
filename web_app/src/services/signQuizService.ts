/**
 * Sign Quiz Service
 * Wraps all /api/sign-quiz/** REST endpoints.
 */

import { apiClient } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface SignChoice {
  id: number;
  textNl: string;
  textEn: string;
  textFr: string;
  textAr: string;
}

export interface SignQuizQuestion {
  id: number;
  questionRef: string;
  questionType?: string;
  difficulty: Difficulty;
  isCritical?: boolean;
  showSign?: boolean;
  questionNl: string;
  questionEn: string;
  questionFr: string;
  questionAr: string;
  signCode?: string | null;
  imagePath?: string;
  signImagePath?: string; // path of the road sign this question belongs to
  choices: SignChoice[];
}

// ── Practice ─────────────────────────────────────────────

export interface SignPracticeSession {
  sessionId: number;
  signCode: string;
  status: "IN_PROGRESS" | "COMPLETED";
  totalQuestions: number;
  correctCount: number;
  startedAt: string;
  completedAt?: string;
  questions: SignQuizQuestion[];
}

export interface SubmitAnswerRequest {
  choiceId: number;
  timeTakenSeconds?: number;
}

export interface SignPracticeAnswerResponse {
  questionId: number;
  isCorrect: boolean;

  selectedChoiceId: number;
  selectedTextNl: string;
  selectedTextEn: string;
  selectedTextFr: string;
  selectedTextAr: string;

  correctChoiceId: number;
  correctTextNl: string;
  correctTextEn: string;
  correctTextFr: string;
  correctTextAr: string;

  explanationNl?: string;
  explanationEn?: string;
  explanationFr?: string;
  explanationAr?: string;

  questionsAnswered: number;
  totalQuestions: number;
  sessionCompleted: boolean;
  signAccuracyPercentage: number;
  signTotalAttempts: number;
}

export interface PracticeAnswerDetail {
  questionId: number;
  questionRef: string;
  difficulty: Difficulty;
  questionNl: string;
  questionEn: string;
  questionFr: string;
  questionAr: string;
  isCorrect: boolean;
  selectedChoiceId?: number;
  selectedTextNl?: string;
  selectedTextEn?: string;
  selectedTextFr?: string;
  selectedTextAr?: string;
  correctChoiceId: number;
  correctTextNl: string;
  correctTextEn: string;
  correctTextFr: string;
  correctTextAr: string;
  explanationNl?: string;
  explanationEn?: string;
  explanationFr?: string;
  explanationAr?: string;
}

export interface SignPracticeResult {
  sessionId: number;
  signCode: string;
  nameNl: string;
  nameEn: string;
  nameFr: string;
  nameAr: string;
  status: "IN_PROGRESS" | "COMPLETED";
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  scorePercentage: number;
  passed: boolean;
  startedAt: string;
  completedAt?: string;
  questionResults: PracticeAnswerDetail[];
}

export interface SignPracticeHistoryItem {
  sessionId: number;
  signCode: string;
  nameNl: string;
  nameEn: string;
  nameFr: string;
  nameAr: string;
  status: "IN_PROGRESS" | "COMPLETED";
  totalQuestions: number;
  answeredCount: number;
  correctAnswers: number;
  wrongAnswers: number;
  scorePercentage: number;
  passed: boolean;
  startedAt: string;
  completedAt?: string;
}

export interface SignPracticeHistoryResponse {
  totalSessions: number;
  sessions: SignPracticeHistoryItem[];
}

// ── Mixed Sign Exam (/practice/random) ──────────────────

export interface SignRandomPracticeSession {
  sessionId: number;
  status: "IN_PROGRESS" | "COMPLETED" | "EXPIRED" | "ABANDONED";
  totalQuestions: number;
  passingScore: number;
  startedAt: string;
  expiresAt?: string;
  questions: SignQuizQuestion[];
}

export interface SignRandomPracticeAnswerItem {
  questionId: number;
  selectedChoiceId: number | null;
}

export interface SignRandomPracticeQuestionResult {
  questionId: number;
  questionNl: string;
  questionEn: string;
  questionFr: string;
  questionAr: string;
  selectedChoiceId: number | null;
  correctChoiceId: number | null;
  correctChoiceNl: string | null;
  correctChoiceEn: string | null;
  correctChoiceFr: string | null;
  correctChoiceAr: string | null;
  isCorrect: boolean;
  wasTimeout: boolean;
  explanationNl: string | null;
  explanationEn: string | null;
  explanationFr: string | null;
  explanationAr: string | null;
  signCode: string | null;
  signImagePath: string | null;
  difficulty: Difficulty | null;
}

export interface SignRandomPracticeResult {
  sessionId: number;
  status: "IN_PROGRESS" | "COMPLETED" | "EXPIRED" | "ABANDONED";
  startedAt: string;
  completedAt?: string;
  totalQuestions: number;
  answeredCount: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  scorePercentage: number;
  passed: boolean;
  passingScore: number;
  questions: SignRandomPracticeQuestionResult[];
}

export interface SignRandomPracticeHistoryItem {
  sessionId: number;
  status: "COMPLETED" | "IN_PROGRESS" | "EXPIRED" | "ABANDONED";
  totalQuestions: number;
  answeredCount: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  scorePercentage: number;
  passed: boolean;
  passingScore: number;
  startedAt: string;
  completedAt?: string;
}

export interface SignRandomPracticeHistoryResponse {
  totalSessions: number;
  sessions: SignRandomPracticeHistoryItem[];
}

// ── Exam ─────────────────────────────────────────────────

export interface SignExamQuestions {
  signCode: string;
  examNumber: number;
  questions: SignQuizQuestion[];
}

export interface SignExamAnswerItem {
  questionId: number;
  choiceId: number;
}

export interface ExamQuestionResult {
  questionId: number;
  questionRef: string;
  difficulty: Difficulty;
  questionNl: string;
  questionEn: string;
  questionFr: string;
  questionAr: string;
  answered: boolean;
  isCorrect?: boolean;
  selectedChoiceId?: number;
  correctChoiceId?: number;
  correctTextNl?: string;
  correctTextEn?: string;
  correctTextFr?: string;
  correctTextAr?: string;
  explanationNl?: string;
  explanationEn?: string;
  explanationFr?: string;
  explanationAr?: string;
}

export interface SignExamResult {
  resultId?: number;
  signCode: string;
  routeCode?: string;
  signImagePath?: string;
  nameNl?: string;
  nameEn?: string;
  nameFr?: string;
  nameAr?: string;
  examNumber: number;
  completedAt?: string;
  totalLinked: number;
  answeredCount: number;
  unansweredCount: number;
  correctAnswers: number;
  wrongAnswers: number;
  scorePercentage: number;
  passingThreshold: number;
  passed: boolean;
  resultStatus: "PASSED" | "FAILED";
  questionResults: ExamQuestionResult[];
}

export interface SignExamHistoryItem {
  resultId: number;
  signCode: string;
  routeCode?: string;
  signImagePath?: string;
  nameNl?: string;
  nameEn?: string;
  nameFr?: string;
  nameAr?: string;
  examNumber: number;
  totalQuestions: number;
  answeredCount: number;
  correctAnswers: number;
  wrongAnswers: number;
  unansweredCount: number;
  scorePercentage: number;
  passingThreshold: number;
  passed: boolean;
  completedAt?: string;
}

export interface SignExamHistoryResponse {
  totalResults: number;
  results: SignExamHistoryItem[];
}

// ── Progress ─────────────────────────────────────────────

export interface SignUserProgress {
  signId: number;
  signCode: string;
  routeCode?: string;
  category: string;
  imagePath?: string;
  nameNl: string;
  nameEn: string;
  nameFr: string;
  nameAr: string;

  practiceStarted: boolean;
  practiceCompleted: boolean;
  practiceBestScorePct?: number;

  exam1Attempted: boolean;
  exam1Passed: boolean;
  exam1BestScorePct?: number;
  exam1Attempts: number;
  exam1TotalQuestions?: number | null;
  exam1PassingScore?: number | null;
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Get all active road signs (lightweight summary list).
 */
export async function getActiveSigns() {
  const res = await apiClient.get<import("@/lib/types").TrafficSign[]>(
    API_ENDPOINTS.SIGN_QUIZ.SIGNS,
  );
  return res.data;
}

/**
 * Start (or resume) a practice session for a sign.
 */
export async function startPracticeSession(
  signCode: string,
): Promise<SignPracticeSession> {
  const res = await apiClient.post<SignPracticeSession>(
    API_ENDPOINTS.SIGN_QUIZ.START_PRACTICE(signCode),
  );
  return res.data;
}

/**
 * Submit one answer within a practice session.
 */
export async function submitPracticeAnswer(
  sessionId: number,
  questionId: number,
  choiceId: number,
  timeTakenSeconds?: number,
): Promise<SignPracticeAnswerResponse> {
  const body: SubmitAnswerRequest = { choiceId, timeTakenSeconds };
  const res = await apiClient.post<SignPracticeAnswerResponse>(
    API_ENDPOINTS.SIGN_QUIZ.SUBMIT_ANSWER(sessionId, questionId),
    body,
  );
  return res.data;
}

/**
 * Get full results for a completed (or in-progress) practice session.
 */
export async function getPracticeResults(
  sessionId: number,
): Promise<SignPracticeResult> {
  const res = await apiClient.get<SignPracticeResult>(
    API_ENDPOINTS.SIGN_QUIZ.PRACTICE_RESULTS(sessionId),
  );
  return res.data;
}

/** Get sign-specific practice history, including in-progress sessions. */
export async function getPracticeHistory(): Promise<SignPracticeHistoryResponse> {
  const res = await apiClient.get<SignPracticeHistoryResponse>(
    API_ENDPOINTS.SIGN_QUIZ.PRACTICE_HISTORY,
  );
  return res.data;
}

/**
 * Fetch exam questions (stateless — no DB session created).
 * Throws 423 LOCKED when the follow-up exam is requested before the default exam is passed.
 */
export async function getExamQuestions(
  signCode: string,
  examNumber: 1 | 2,
): Promise<SignExamQuestions> {
  const res = await apiClient.get<SignExamQuestions>(
    API_ENDPOINTS.SIGN_QUIZ.EXAM_QUESTIONS(signCode, examNumber),
  );
  return res.data;
}

/**
 * Submit all exam answers in one request.
 */
export async function submitExam(
  signCode: string,
  examNumber: 1 | 2,
  answers: SignExamAnswerItem[],
): Promise<SignExamResult> {
  const res = await apiClient.post<SignExamResult>(
    API_ENDPOINTS.SIGN_QUIZ.SUBMIT_EXAM(signCode, examNumber),
    { answers },
  );
  return res.data;
}

export async function getSignExamHistory(): Promise<SignExamHistoryResponse> {
  const res = await apiClient.get<SignExamHistoryResponse>(
    API_ENDPOINTS.SIGN_QUIZ.EXAM_HISTORY,
  );
  return res.data;
}

export async function getSignExamResultById(
  resultId: number,
): Promise<SignExamResult> {
  const res = await apiClient.get<SignExamResult>(
    API_ENDPOINTS.SIGN_QUIZ.EXAM_RESULT_BY_ID(resultId),
  );
  return res.data;
}

/** Get the progress snapshot (practice + sign exam progress) for a single sign. */
export async function getSignStatus(
  signCode: string,
): Promise<SignUserProgress> {
  const res = await apiClient.get<SignUserProgress>(
    API_ENDPOINTS.SIGN_QUIZ.SIGN_STATUS(signCode),
  );
  return res.data;
}

/**
 * Get the progress snapshot for every active sign in one call.
 */
export async function getAllSignProgress(): Promise<SignUserProgress[]> {
  const res = await apiClient.get<SignUserProgress[]>(
    API_ENDPOINTS.SIGN_QUIZ.USER_PROGRESS,
  );
  return res.data;
}

/** Start or resume the persisted mixed traffic-sign exam shown in /practice/random. */
export async function startRandomPracticeSession(): Promise<SignRandomPracticeSession> {
  const res = await apiClient.get<SignRandomPracticeSession>(
    API_ENDPOINTS.SIGN_QUIZ.RANDOM_PRACTICE,
  );
  return res.data;
}

/** Submit all answers for the mixed traffic-sign exam. */
export async function submitRandomPracticeSession(
  sessionId: number,
  answers: SignRandomPracticeAnswerItem[],
): Promise<SignRandomPracticeResult> {
  const res = await apiClient.post<SignRandomPracticeResult>(
    API_ENDPOINTS.SIGN_QUIZ.RANDOM_PRACTICE_CHECK,
    { sessionId, answers },
  );
  return res.data;
}

/** Get completed mixed-sign exam history for the current user. */
export async function getRandomPracticeHistory(): Promise<SignRandomPracticeHistoryResponse> {
  const res = await apiClient.get<SignRandomPracticeHistoryResponse>(
    API_ENDPOINTS.SIGN_QUIZ.RANDOM_PRACTICE_HISTORY,
  );
  return res.data;
}

/** Get one persisted mixed-sign exam result by session ID. */
export async function getRandomPracticeResult(
  sessionId: number,
): Promise<SignRandomPracticeResult> {
  const res = await apiClient.get<SignRandomPracticeResult>(
    API_ENDPOINTS.SIGN_QUIZ.RANDOM_PRACTICE_RESULTS(sessionId),
  );
  return res.data;
}
