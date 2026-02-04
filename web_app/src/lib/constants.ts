// App Constants for ReadyRoad
// Updated: 2026-02-08 - Fixed API configuration and TypeScript types

// ═══════════════════════════════════════════════════════════
// API Configuration
// ═══════════════════════════════════════════════════════════
export const API_CONFIG = {
<<<<<<< HEAD
  // Base URL includes /api prefix - all endpoints are relative to this
=======
>>>>>>> 16d6022 (update frontend)
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8890/api',
  TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
} as const;

// ═══════════════════════════════════════════════════════════
// Exam Rules (Belgian Driving License)
// ═══════════════════════════════════════════════════════════
export const EXAM_RULES = {
  TOTAL_QUESTIONS: 50,
  DURATION_MINUTES: 45,
  PASS_PERCENTAGE: 82,
  PASSING_SCORE: 41, // 82% of 50
  MIN_CORRECT_ANSWERS: 41, // Same as PASSING_SCORE
} as const;

// ═══════════════════════════════════════════════════════════
// Question Categories
// ═══════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════
// Languages
// ═══════════════════════════════════════════════════════════
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: 'En', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: 'Ar', dir: 'rtl' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: 'Nl', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: 'Fr', dir: 'ltr' },
] as const;

export const DEFAULT_LANGUAGE = 'en';

// ═══════════════════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════
// Local Storage Keys
// ═══════════════════════════════════════════════════════════
export const STORAGE_KEYS = {
  // Authentication - IMPORTANT: Must match cookie name in middleware.ts!
  AUTH_TOKEN: 'token', // Used for both localStorage AND cookie
  USER_DATA: 'readyroad_user',

  // App Settings
  LANGUAGE: 'readyroad_language',
  THEME: 'readyroad_theme',

  // Exam State
  EXAM_STATE: 'readyroad_exam_state',
} as const;

// ═══════════════════════════════════════════════════════════
// Timer Warnings
// ═══════════════════════════════════════════════════════════
export const TIMER_WARNINGS = {
  TEN_MINUTES: 600, // 10 minutes in seconds
  FIVE_MINUTES: 300, // 5 minutes in seconds
  ONE_MINUTE: 60,   // 1 minute in seconds
} as const;

// ═══════════════════════════════════════════════════════════
// Difficulty Levels
// ═══════════════════════════════════════════════════════════
export const DIFFICULTY_LEVELS = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const;

// ═══════════════════════════════════════════════════════════
// Simulation Status
// ═══════════════════════════════════════════════════════════
export const SIMULATION_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
} as const;

// ═══════════════════════════════════════════════════════════
// Pagination
// ═══════════════════════════════════════════════════════════
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  TRAFFIC_SIGNS_PAGE_SIZE: 24,
  LESSONS_PAGE_SIZE: 12,
} as const;

// ═══════════════════════════════════════════════════════════
// Analytics Thresholds
// ═══════════════════════════════════════════════════════════
export const ANALYTICS_THRESHOLDS = {
  WEAK_AREA_ACCURACY: 60, // Below 60% is considered weak
  STRONG_AREA_ACCURACY: 80, // Above 80% is considered strong
  MIN_ATTEMPTS: 5, // Minimum attempts to calculate accuracy
} as const;

// ═══════════════════════════════════════════════════════════
// Chart Colors
// ═══════════════════════════════════════════════════════════
export const CHART_COLORS = {
  PRIMARY: '#DF5830',
  SUCCESS: '#27AE60',
  WARNING: '#F39C12',
  ERROR: '#E74C3C',
  INFO: '#3498DB',
  NEUTRAL: '#6C757D',
} as const;

// ═══════════════════════════════════════════════════════════
// API Endpoints (for reference and type safety)
// Note: baseURL already includes /api, so paths are relative to /api
// ═══════════════════════════════════════════════════════════
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
  },

  // User Management
  USERS: {
    ME: '/users/me', // ✅ Exists and works
    NOTIFICATIONS_COUNT: '/users/me/notifications/unread-count', // ✅ Exists and works
  },

  // Traffic Signs
  TRAFFIC_SIGNS: {
    LIST: '/traffic-signs',
    DETAIL: (code: string) => `/traffic-signs/${code}`,
    SEARCH: '/traffic-signs/search',
  },

  // Lessons
  LESSONS: {
    LIST: '/lessons',
    DETAIL: (code: string) => `/lessons/${code}`,
    BY_CATEGORY: (category: string) => `/lessons/category/${category}`,
  },

  // Exams
  EXAMS: {
    START: '/exams/start',
    SUBMIT: (id: number) => `/exams/${id}/submit`,
    RESULTS: (id: number) => `/exams/${id}/results`,
  },

  // Practice
  PRACTICE: {
    START: '/practice/start',
    BY_CATEGORY: (category: string) => `/practice/category/${category}`,
  },

  // Analytics
  ANALYTICS: {
    ERROR_PATTERNS: '/analytics/error-patterns',
    WEAK_AREAS: '/analytics/weak-areas',
    PROGRESS: '/analytics/progress',
  },

  // Health Check
  HEALTH: '/actuator/health',
} as const;

// ═══════════════════════════════════════════════════════════
// Error Messages
// ═══════════════════════════════════════════════════════════
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized. Please login again.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT: 'Request timeout. Please try again.',
  UNKNOWN: 'An unknown error occurred.',
} as const;

// ═══════════════════════════════════════════════════════════
// Success Messages
// ═══════════════════════════════════════════════════════════
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful!',
  REGISTER: 'Registration successful!',
  EXAM_SUBMITTED: 'Exam submitted successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
} as const;

// ═══════════════════════════════════════════════════════════
// Type Exports (for TypeScript type inference)
// ═══════════════════════════════════════════════════════════

/**
 * Language code type (en, ar, nl, fr)
 */
export type Language = typeof LANGUAGES[number]['code'];

/**
 * Route type - accepts both static routes and route functions
 * Use string for simple paths like '/login' or '/dashboard'
 */
export type Route = string;

/**
 * Category type for traffic signs and questions
 */
export type Category = typeof CATEGORIES[keyof typeof CATEGORIES];

/**
 * Difficulty level type
 */
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[keyof typeof DIFFICULTY_LEVELS];

/**
 * Simulation status type
 */
export type SimulationStatus = typeof SIMULATION_STATUS[keyof typeof SIMULATION_STATUS];

/**
 * Storage key type
 */
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * Chart color type
 */
export type ChartColor = typeof CHART_COLORS[keyof typeof CHART_COLORS];
