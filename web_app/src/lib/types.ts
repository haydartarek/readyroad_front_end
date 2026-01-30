// Type definitions for ReadyRoad Next.js App

// User Types
export interface User {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  // Legacy fields (kept for backward compatibility)
  id?: number;
  firstName?: string;
  lastName?: string;
  preferredLanguage?: 'en' | 'ar' | 'nl' | 'fr';
  createdAt?: string;
}

// Auth Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  expiresIn?: number;
  // User data included in login response from backend
  userId?: number;
  username?: string;
  email?: string;
  fullName?: string;
  role?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  preferredLanguage: 'en' | 'ar' | 'nl' | 'fr';
}

// Exam Types
export interface Question {
  id: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  imagePath?: string;
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

// Analytics Types (Feature C)
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

// Progress Types
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

// Traffic Sign Types
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

// Lesson Types
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

// API Response Types
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
}

// Language Type
export type Language = 'en' | 'ar' | 'nl' | 'fr';

// Utility Types
export type LocalizedContent<T extends string> = {
  [K in `${T}${Capitalize<Language>}`]: string;
};
