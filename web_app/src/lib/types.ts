// ─── Shared Primitives ───────────────────────────────────

export type Language   = 'en' | 'ar' | 'nl' | 'fr';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type UserRole   = 'USER' | 'ADMIN' | 'MODERATOR';

export type LocalizedContent<T extends string> = {
  [K in `${T}${Capitalize<Language>}`]: string;
};

// ─── Auth ────────────────────────────────────────────────

/**
 * Supports both username and email login.
 * Backend expects `username` — `email` is sent as fallback.
 */
export interface LoginRequest {
  username?: string;
  email?:    string;
  password:  string;
}

/**
 * BFF auth route: token is NOT included (HttpOnly cookie).
 * Direct backend call: token is included in the response body.
 */
export interface LoginResponse {
  token?:     string;
  type?:      string;
  expiresIn?: number;
  userId?:    number;
  username?:  string;
  email?:     string;
  fullName?:  string;
  role?:      string;
}

export interface RegisterRequest {
  username:          string;
  email:             string;
  password:          string;
  firstName:         string;
  lastName:          string;
  preferredLanguage: Language;
}

// ─── User ────────────────────────────────────────────────

export interface User {
  userId:             number;
  username:           string;
  email:              string;
  fullName:           string;
  firstName?:         string;
  lastName?:          string;
  role:               string;
  isActive:           boolean;
  preferredLanguage?: Language;
  createdAt?:         string;
}

// ─── Exam ────────────────────────────────────────────────

export interface Question {
  id:                number;
  questionTextEn:    string;
  questionTextAr:    string;
  questionTextNl:    string;
  questionTextFr:    string;
  imagePath?:        string; // Legacy field
  contentImageUrl?:  string; // Backend field name
  option1En: string; option1Ar: string; option1Nl: string; option1Fr: string;
  option2En: string; option2Ar: string; option2Nl: string; option2Fr: string;
  option3En: string; option3Ar: string; option3Nl: string; option3Fr: string;
  correctAnswer: number;
  categoryCode:  string;
  difficulty:    Difficulty;
}

export interface ExamSimulation {
  simulationId: number;
  type:         'FULL_EXAM' | 'PRACTICE';
  status:       'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  createdAt:    string;
  expiresAt:    string;
  questions:    Question[];
}

export interface Answer {
  questionId: number;
  answer:     number;
}

export interface ExamResult {
  simulationId:      number;
  passed:            boolean;
  score:             number;
  correctAnswers:    number;
  totalQuestions:    number;
  timeTaken:         string;
  completedAt:       string;
  categoryBreakdown: CategoryScore[];
}

export interface CategoryScore {
  categoryCode: string;
  categoryName: string;
  correct:      number;
  total:        number;
  percentage:   number;
}

// ─── Analytics ───────────────────────────────────────────

export interface ErrorPattern {
  pattern:             string;
  frequency:           number;
  severity:            'HIGH' | 'MEDIUM' | 'LOW';
  affectedCategories:  string[];
  recommendation:      string;
  exampleQuestions:    number[];
}

export interface WeakArea {
  categoryCode:          string;
  categoryName:          string;
  accuracy:              number;
  questionsAttempted:    number;
  questionsCorrect:      number;
  improvementPotential:  number;
  recommendation:        string;
  topMistakes:           string[];
}

// ─── Progress ────────────────────────────────────────────

export interface ProgressOverview {
  totalExamsTaken:      number;
  averageScore:         number;
  passRate:             number;
  currentStreak:        number;
  totalQuestionsSolved: number;
  lastExamDate?:        string;
}

export interface CategoryProgress {
  categoryCode:      string;
  categoryName:      string;
  questionsAttempted: number;
  questionsCorrect:  number;
  accuracy:          number;
  averageTime:       number;
}

// ─── Traffic Signs ───────────────────────────────────────

export interface TrafficSign {
  id?:                       number;
  signCode:                  string;
  category:                  string;
  categoryCode?:             string;
  nameEn:                    string;
  nameAr:                    string;
  nameNl:                    string;
  nameFr:                    string;
  descriptionEn:             string;
  descriptionAr:             string;
  descriptionNl:             string;
  descriptionFr:             string;
  longDescriptionEn?:        string;
  longDescriptionNl?:        string;
  longDescriptionFr?:        string;
  longDescriptionAr?:        string;
  isLongDescriptionComplete?: boolean;
  imageUrl:                  string;
  meaning?:                  string;
  penalties?:                string;
}

// ─── Lessons ─────────────────────────────────────────────

export interface LessonPage {
  id:              number;
  pageNumber:      number;
  titleEn:         string; titleAr: string; titleNl: string; titleFr: string;
  contentEn:       string; contentAr: string; contentNl: string; contentFr: string;
  bulletPointsEn:  string[];
  bulletPointsAr:  string[];
  bulletPointsNl:  string[];
  bulletPointsFr:  string[];
}

/** Lesson summary — returned by GET /api/lessons (no pages). */
export interface Lesson {
  id:               number;
  lessonCode:       string;
  icon:             string;
  titleEn:          string; titleAr: string; titleNl: string; titleFr: string;
  descriptionEn:    string; descriptionAr: string; descriptionNl: string; descriptionFr: string;
  displayOrder:     number;
  estimatedMinutes: number;
  totalPages:       number;
}

/** Full lesson with pages — returned by GET /api/lessons/{code}. */
export interface LessonDetail extends Omit<Lesson, 'totalPages'> {
  pages: LessonPage[];
}

// ─── Notifications ───────────────────────────────────────

export interface Notification {
  id:        number;
  userId:    number;
  type:      string;
  message:   string;
  isRead:    boolean;
  createdAt: string;
  readAt?:   string;
}

export interface NotificationCount {
  unreadCount: number;
}

// ─── API Responses ───────────────────────────────────────

export interface ApiResponse<T> {
  data:       T;
  message?:   string;
  timestamp:  string;
}

export interface ApiError {
  error:     string;
  message:   string;
  timestamp: string;
  path:      string;
  status?:   number;
}

export interface PaginatedResponse<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  size:          number;
  number:        number;
  first:         boolean;
  last:          boolean;
}

export interface ListResponse<T> {
  data:  T[];
  total: number;
}
