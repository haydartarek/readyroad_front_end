// App Constants for ReadyRoad

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8890',
  TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
} as const;

// Exam Rules (Belgian Driving License)
export const EXAM_RULES = {
  TOTAL_QUESTIONS: 50,
  DURATION_MINUTES: 45,
  PASS_PERCENTAGE: 82,
  PASSING_SCORE: 41, // 82% of 50
  MIN_CORRECT_ANSWERS: 41, // Same as PASSING_SCORE
} as const;

// Question Categories
export const CATEGORIES = {
  DANGER_SIGNS: 'A',
  PRIORITY_RULES: 'B',
  PROHIBITION_SIGNS: 'C',
  MANDATORY_SIGNS: 'D',
  INFORMATION_SIGNS: 'F',
  SPEED_LIMITS: 'SPEED',
  PARKING: 'PARKING',
  OVERTAKING: 'OVERTAKING',
  ROAD_MARKINGS: 'MARKINGS',
  SPECIAL_ROADS: 'SPECIAL',
} as const;

// Languages
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
] as const;

export const DEFAULT_LANGUAGE = 'en';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  EXAM: '/exam',
  EXAM_RULES: '/exam',
  EXAM_QUESTIONS: (id: number) => `/exam/${id}`,
  EXAM_RESULTS: (id: number) => `/exam/results/${id}`,
  PRACTICE: '/practice',
  PRACTICE_CATEGORY: (category: string) => `/practice/${category}`,
  ANALYTICS_ERROR_PATTERNS: '/analytics/error-patterns',
  ANALYTICS_WEAK_AREAS: '/analytics/weak-areas',
  PROGRESS: '/progress',
  PROFILE: '/profile',
  TRAFFIC_SIGNS: '/traffic-signs',
  TRAFFIC_SIGN_DETAIL: (code: string) => `/traffic-signs/${code}`,
  LESSONS: '/lessons',
  LESSON_DETAIL: (code: string) => `/lessons/${code}`,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'readyroad_auth_token',
  USER_DATA: 'readyroad_user',
  LANGUAGE: 'readyroad_language',
  THEME: 'readyroad_theme',
  EXAM_STATE: 'readyroad_exam_state',
} as const;

// Timer Warnings
export const TIMER_WARNINGS = {
  TEN_MINUTES: 600, // 10 minutes in seconds
  FIVE_MINUTES: 300, // 5 minutes in seconds
  ONE_MINUTE: 60,   // 1 minute in seconds
} as const;

// Difficulty Levels
export const DIFFICULTY_LEVELS = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const;

// Status
export const SIMULATION_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  TRAFFIC_SIGNS_PAGE_SIZE: 24,
  LESSONS_PAGE_SIZE: 12,
} as const;

// Analytics Thresholds
export const ANALYTICS_THRESHOLDS = {
  WEAK_AREA_ACCURACY: 60, // Below 60% is considered weak
  STRONG_AREA_ACCURACY: 80, // Above 80% is considered strong
  MIN_ATTEMPTS: 5, // Minimum attempts to calculate accuracy
} as const;

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#DF5830',
  SUCCESS: '#27AE60',
  WARNING: '#F39C12',
  ERROR: '#E74C3C',
  INFO: '#3498DB',
  NEUTRAL: '#6C757D',
} as const;
