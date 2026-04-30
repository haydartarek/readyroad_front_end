// ─── App Constants — ReadyRoad ────────────────────────────
// BFF proxy model: all API calls go through /api/proxy (see api.ts)

// ─── Exam Rules (Belgian Driving License) ────────────────

export const EXAM_RULES = {
  TOTAL_QUESTIONS: 50,
  DURATION_MINUTES: 30, // ← Backend spec: timeLimitMinutes = 30 (وليس 45)
  PASS_PERCENTAGE: 82,
  PASSING_SCORE: 41, // 82% of 50
} as const;

// ─── Question Categories ─────────────────────────────────

export const CATEGORIES = {
  DANGER_SIGNS: "A",
  PRIORITY_RULES: "B",
  PROHIBITION_SIGNS: "C",
  MANDATORY_SIGNS: "D",
  INFORMATION_SIGNS: "F",
  SPEED_LIMITS: "SPEED",
  PARKING: "PARKING",
  OVERTAKING: "OVERTAKING",
  ROAD_MARKINGS: "MARKINGS",
  SPECIAL_ROADS: "SPECIAL",
} as const;

// ─── Languages ───────────────────────────────────────────

export const LANGUAGES = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "En",
    dir: "ltr",
  },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "Ar", dir: "rtl" },
  {
    code: "nl",
    name: "Dutch",
    nativeName: "Nederlands",
    flag: "Nl",
    dir: "ltr",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "Fr",
    dir: "ltr",
  },
] as const;

export const DEFAULT_LANGUAGE = "en";

// ─── Routes ──────────────────────────────────────────────

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",
  PROFILE: "/dashboard?section=profile",

  EXAM: "/exam",
  EXAM_QUESTIONS: (id: number) => `/exam/${id}`,
  EXAM_RESULTS: (id: number) => `/exam/results/${id}`,

  PRACTICE: "/practice",
  PRACTICE_CATEGORY: (category: string) => `/practice/${category}`,
  PRACTICE_RANDOM: "/practice/random",

  ANALYTICS_ERROR_PATTERNS: "/dashboard?section=error-patterns",
  ANALYTICS_WEAK_AREAS: "/dashboard?section=weak-areas",

  TRAFFIC_SIGNS: "/traffic-signs",
  TRAFFIC_SIGN_DETAIL: (code: string) => `/traffic-signs/${code}`,

  LESSONS: "/lessons",
  LESSON_DETAIL: (code: string) => `/lessons/${code}`,
} as const;

const LEGACY_TRAFFIC_SIGN_CODE_ALIASES: Record<string, string> = {
  c11a: "C11",
  c11b: "C11",
  c22a: "C22",
  c43_10: "C43",
  c43_30: "C43",
  c43_50: "C43",
  c43_70: "C43",
  c43_90: "C43",
};

const LEGACY_TRAFFIC_SIGN_CODES_WITHOUT_DIRECT_REPLACEMENT = new Set([
  "c28a",
]);

export function resolveLegacyTrafficSignCode(code: string): string {
  const raw = code.trim();
  if (!raw) {
    return raw;
  }

  return LEGACY_TRAFFIC_SIGN_CODE_ALIASES[raw.toLowerCase()] ?? raw;
}

export function isRemovedLegacyTrafficSignCode(code: string): boolean {
  return LEGACY_TRAFFIC_SIGN_CODES_WITHOUT_DIRECT_REPLACEMENT.has(
    code.trim().toLowerCase(),
  );
}

// ─── Storage Keys ────────────────────────────────────────

export const STORAGE_KEYS = {
  AUTH_COOKIE_NAME: "token",
  LANGUAGE: "readyroad_locale",
  THEME: "readyroad_theme",
  EXAM_STATE: "readyroad_exam_state",
} as const;

// ─── Timer Warnings (seconds) ────────────────────────────

export const TIMER_WARNINGS = {
  TEN_MINUTES: 600,
  FIVE_MINUTES: 300,
  ONE_MINUTE: 60,
} as const;

// ─── Difficulty Levels ───────────────────────────────────

export const DIFFICULTY_LEVELS = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
} as const;

// ─── Simulation Status ───────────────────────────────────

export const SIMULATION_STATUS = {
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  EXPIRED: "EXPIRED",
} as const;

// ─── Pagination ──────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  TRAFFIC_SIGNS_PAGE_SIZE: 24,
} as const;

// ─── Analytics Thresholds ────────────────────────────────

export const ANALYTICS_THRESHOLDS = {
  WEAK_AREA_ACCURACY: 60,
  STRONG_AREA_ACCURACY: 80,
  MIN_ATTEMPTS: 5,
} as const;

// ─── Chart Colors ────────────────────────────────────────

export const CHART_COLORS = {
  PRIMARY: "#DF5830",
  SUCCESS: "#27AE60",
  WARNING: "#F39C12",
  ERROR: "#E74C3C",
  INFO: "#3498DB",
  NEUTRAL: "#6C757D",
} as const;

// ─── API Endpoints ───────────────────────────────────────
// baseURL = /api/proxy — paths are relative to /api

export const API_ENDPOINTS = {
  HOME: {
    STATS: "/home/stats",
  },

  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },

  USERS: {
    ME: "/users/me",
    NOTIFICATIONS: "/users/me/notifications",
    NOTIFICATIONS_COUNT: "/users/me/notifications/unread-count",
    NOTIFICATIONS_READ_ALL: "/users/me/notifications/read-all",
    NOTIFICATION_READ: (id: number) => `/users/me/notifications/${id}/read`,
    PROGRESS_OVERALL: "/users/me/progress/overall",
    PROGRESS_CATEGORIES: "/users/me/progress/categories",
    ANALYTICS_WEAK: "/users/me/analytics/weak-areas",
    ANALYTICS_ERRORS: "/users/me/analytics/error-patterns",
  },

  TRAFFIC_SIGNS: {
    LIST: "/traffic-signs",
    DETAIL: (code: string) => `/traffic-signs/${code}`,
    SEARCH: "/traffic-signs/search",
    BY_CATEGORY: (categoryId: number) =>
      `/traffic-signs/category/${categoryId}`, // ← مضاف
  },

  EXAMS: {
    START: "/exams/simulations/start", // ← صحيح من Spec
    ACTIVE: "/exams/simulations/active", // ← مضاف
    CAN_START: "/exams/simulations/can-start", // ← مضاف
    HISTORY: "/exams/simulations/history", // ← مضاف
    DETAIL: (id: number) => `/exams/simulations/${id}`,
    RESULTS: (id: number) => `/exams/simulations/${id}/results`,
    SUBMIT_ANSWER: (examId: number, questionId: number) =>
      `/exams/simulations/${examId}/questions/${questionId}/answer`, // ← مضاف
  },

  QUIZ: {
    STATS: "/quiz/stats",
    CATEGORY_STATS: (categoryId: number) =>
      `/quiz/stats/category/${categoryId}`,
    SUBMIT_ANSWER: (questionId: number) =>
      `/quiz/questions/${questionId}/answer`,
  },

  CATEGORIES: {
    LIST: "/categories",
    BY_CODE: (code: string) => `/categories/${code}`,
  },

  ANALYTICS: {
    ERROR_PATTERNS: "/users/me/analytics/error-patterns",
    WEAK_AREAS: "/users/me/analytics/weak-areas",
    PROGRESS: "/users/me/progress/overall",
  },

  LESSONS: {
    LIST: "/lessons",
    DETAIL: (code: string) => `/lessons/${code}`,
    PROGRESS: (code: string) => `/lessons/${code}/progress`,
    SEARCH: "/lessons/search",
    COUNT: "/lessons/count",
  },

  SIGN_QUIZ: {
    SIGNS: "/sign-quiz/signs",
    START_PRACTICE: (signCode: string) => `/sign-quiz/practice/${signCode}`,
    PRACTICE_HISTORY: "/sign-quiz/practice/history",
    SUBMIT_ANSWER: (sessionId: number, questionId: number) =>
      `/sign-quiz/practice/${sessionId}/questions/${questionId}/answer`,
    PRACTICE_RESULTS: (sessionId: number) =>
      `/sign-quiz/practice/${sessionId}/results`,
    EXAM_QUESTIONS: (signCode: string, examNumber: number) =>
      `/sign-quiz/exam/${signCode}/${examNumber}`,
    SUBMIT_EXAM: (signCode: string, examNumber: number) =>
      `/sign-quiz/exam/${signCode}/${examNumber}/submit`,
    SIGN_STATUS: (signCode: string) => `/sign-quiz/signs/${signCode}/status`,
    USER_PROGRESS: "/sign-quiz/user-progress",
    EXAM_HISTORY: "/sign-quiz/exam-history",
    EXAM_RESULT_BY_ID: (resultId: number) =>
      `/sign-quiz/exam-results/${resultId}`,
    RANDOM_PRACTICE: "/sign-quiz/random-practice",
    RANDOM_PRACTICE_CHECK: "/sign-quiz/random-practice/check",
    RANDOM_PRACTICE_HISTORY: "/sign-quiz/random-practice/history",
    RANDOM_PRACTICE_RESULTS: (sessionId: number) =>
      `/sign-quiz/random-practice/${sessionId}/results`,
  },

  HEALTH: "/actuator/health",

  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    SETTINGS: "/admin/settings",
    UPLOAD_IMAGE: "/admin/upload/image",

    SIGNS: {
      LIST: "/admin/signs",
      DETAIL: (id: number | string) => `/admin/signs/${id}`,
      CREATE: "/admin/signs",
      UPDATE: (id: number | string) => `/admin/signs/${id}`,
      DELETE: (id: number | string) => `/admin/signs/${id}`,
    },

    QUIZ_QUESTIONS: {
      LIST: "/admin/quiz/questions",
      DETAIL: (id: number | string) => `/admin/quiz/questions/${id}`,
      CREATE: "/admin/quiz/questions",
      UPDATE: (id: number | string) => `/admin/quiz/questions/${id}`,
      DELETE: (id: number | string) => `/admin/quiz/questions/${id}`,
    },

    DATA_IMPORT: {
      PREVIEW: (type: string) => `/admin/import/${type}/preview`,
      EXECUTE: (type: string) => `/admin/import/${type}/execute`,
      HISTORY: "/admin/import/history",
      HISTORY_DETAIL: (id: number) => `/admin/import/history/${id}`,
    },
  },
} as const;

// ─── Types ───────────────────────────────────────────────

/** Language code: 'en' | 'ar' | 'nl' | 'fr' */
export type Language = (typeof LANGUAGES)[number]["code"];

/** Category value for traffic signs and questions */
export type Category = (typeof CATEGORIES)[keyof typeof CATEGORIES];

/** Difficulty level: 'EASY' | 'MEDIUM' | 'HARD' */
export type DifficultyLevel =
  (typeof DIFFICULTY_LEVELS)[keyof typeof DIFFICULTY_LEVELS];

/** Simulation status */
export type SimulationStatus =
  (typeof SIMULATION_STATUS)[keyof typeof SIMULATION_STATUS];

/** localStorage key */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** Chart color hex value */
export type ChartColor = (typeof CHART_COLORS)[keyof typeof CHART_COLORS];
