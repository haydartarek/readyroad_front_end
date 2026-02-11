// Type definitions for ReadyRoad Next.js App
// Unified and cleaned up to match backend contract

// ═══════════════════════════════════════════════════════════
// Auth Types
// ═══════════════════════════════════════════════════════════

/**
 * Login request - supports both username and email for flexibility
 * Backend expects "username", but we support "email" as fallback
 */
export interface LoginRequest {
  username?: string;  // Backend field (preferred)
  email?: string;     // Frontend field (fallback, will be sent as username)
  password: string;
}

/**
 * Login response from backend
 * Contains JWT token and user information
 */
export interface LoginResponse {
  token: string;
  type?: string;
  expiresIn?: number;
  // User data included in login response
  userId?: number;
  username?: string;
  email?: string;
  fullName?: string;
  role?: string;
}

/**
 * Registration request
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  preferredLanguage: 'en' | 'ar' | 'nl' | 'fr';
}

// ═══════════════════════════════════════════════════════════
// User Types
// ═══════════════════════════════════════════════════════════

export interface User {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  preferredLanguage?: 'en' | 'ar' | 'nl' | 'fr';
  createdAt?: string;
}

// ═══════════════════════════════════════════════════════════
// Exam Types
// ═══════════════════════════════════════════════════════════

export interface Question {
  id: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  imagePath?: string; // Legacy field
  contentImageUrl?: string; // Backend field name
  option1En: string;
  option1Ar: string;
  option1Nl: string;
  option1Fr: string;
  option2En: string;
  option2Ar: string;
  option2Nl: string;
  option2Fr: string;
  option3En: string;
  option3Ar: string;
  option3Nl: string;
  option3Fr: string;
  correctAnswer: number;
  categoryCode: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface ExamSimulation {
  simulationId: number;
  type: 'FULL_EXAM' | 'PRACTICE';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
  questions: Question[];
}

export interface Answer {
  questionId: number;
  answer: number;
}

export interface ExamResult {
  simulationId: number;
  passed: boolean;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: string;
  completedAt: string;
  categoryBreakdown: CategoryScore[];
}

export interface CategoryScore {
  categoryCode: string;
  categoryName: string;
  correct: number;
  total: number;
  percentage: number;
}

// ═══════════════════════════════════════════════════════════
// Analytics Types (Feature C)
// ═══════════════════════════════════════════════════════════

export interface ErrorPattern {
  pattern: string;
  frequency: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  affectedCategories: string[];
  recommendation: string;
  exampleQuestions: number[];
}

export interface WeakArea {
  categoryCode: string;
  categoryName: string;
  accuracy: number;
  questionsAttempted: number;
  questionsCorrect: number;
  improvementPotential: number;
  recommendation: string;
  topMistakes: string[];
}

// ═══════════════════════════════════════════════════════════
// Progress Types (Feature B)
// ═══════════════════════════════════════════════════════════

export interface ProgressOverview {
  totalExamsTaken: number;
  averageScore: number;
  passRate: number;
  currentStreak: number;
  totalQuestionsSolved: number;
  lastExamDate?: string;
}

export interface CategoryProgress {
  categoryCode: string;
  categoryName: string;
  questionsAttempted: number;
  questionsCorrect: number;
  accuracy: number;
  averageTime: number;
}

// ═══════════════════════════════════════════════════════════
// Traffic Sign Types
// ═══════════════════════════════════════════════════════════

export interface TrafficSign {
  id?: number; // From backend
  signCode: string;
  category: string; // Mapped from categoryCode
  categoryCode?: string; // Backend field
  nameEn: string;
  nameAr: string;
  nameNl: string;
  nameFr: string;
  descriptionEn: string;
  descriptionAr: string;
  descriptionNl: string;
  descriptionFr: string;
  imageUrl: string;
  meaning?: string; // Not in backend response
  penalties?: string; // Not in backend response
}

// ═══════════════════════════════════════════════════════════
// Lesson Types
// ═══════════════════════════════════════════════════════════

export interface Lesson {
  id: number;
  lessonCode: string;
  titleEn: string;
  titleAr: string;
  titleNl: string;
  titleFr: string;
  contentEn: string;
  contentAr: string;
  contentNl: string;
  contentFr: string;
  pdfPathEn?: string;
  pdfPathAr?: string;
  pdfPathNl?: string;
  pdfPathFr?: string;
  orderIndex: number;
}

// ═══════════════════════════════════════════════════════════
// Notification Types
// ═══════════════════════════════════════════════════════════

export interface Notification {
  id: number;
  userId: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationCount {
  unreadCount: number;
}

// ═══════════════════════════════════════════════════════════
// API Response Types
// ═══════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  message: string;
  timestamp: string;
  path: string;
  status?: number;
}

// ═══════════════════════════════════════════════════════════
// Language Type
// ═══════════════════════════════════════════════════════════

export type Language = 'en' | 'ar' | 'nl' | 'fr';

// ═══════════════════════════════════════════════════════════
// Utility Types
// ═══════════════════════════════════════════════════════════

export type LocalizedContent<T extends string> = {
  [K in `${T}${Capitalize<Language>}`]: string;
};

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

/**
 * Generic list response
 */
export interface ListResponse<T> {
  data: T[];
  total: number;
}
