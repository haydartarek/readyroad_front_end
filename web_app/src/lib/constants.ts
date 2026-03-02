// ─── App Constants — ReadyRoad ────────────────────────────
// BFF proxy model: all API calls go through /api/proxy (see api.ts)

// ─── Exam Rules (Belgian Driving License) ────────────────

export const EXAM_RULES = {
  TOTAL_QUESTIONS:  50,
  DURATION_MINUTES: 30,  // ← Backend spec: timeLimitMinutes = 30 (وليس 45)
  PASS_PERCENTAGE:  82,
  PASSING_SCORE:    41,  // 82% of 50
} as const;

// ─── Question Categories ─────────────────────────────────

export const CATEGORIES = {
  DANGER_SIGNS:      'A',
  PRIORITY_RULES:    'B',
  PROHIBITION_SIGNS: 'C',
  MANDATORY_SIGNS:   'D',
  INFORMATION_SIGNS: 'F',
  SPEED_LIMITS:      'SPEED',
  PARKING:           'PARKING',
  OVERTAKING:        'OVERTAKING',
  ROAD_MARKINGS:     'MARKINGS',
  SPECIAL_ROADS:     'SPECIAL',
} as const;

// ─── Languages ───────────────────────────────────────────

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English',    flag: 'En', dir: 'ltr' },
  { code: 'ar', name: 'Arabic',  nativeName: 'العربية',    flag: 'Ar', dir: 'rtl' },
  { code: 'nl', name: 'Dutch',   nativeName: 'Nederlands', flag: 'Nl', dir: 'ltr' },
  { code: 'fr', name: 'French',  nativeName: 'Français',   flag: 'Fr', dir: 'ltr' },
] as const;

export const DEFAULT_LANGUAGE = 'en';

// ─── Routes ──────────────────────────────────────────────

export const ROUTES = {
  HOME:      '/',
  LOGIN:     '/login',
  REGISTER:  '/register',
  DASHBOARD: '/dashboard',
  PROFILE:   '/profile',
  PROGRESS:  '/progress',

  EXAM:           '/exam',
  EXAM_QUESTIONS: (id: number)      => `/exam/${id}`,
  EXAM_RESULTS:   (id: number)      => `/exam/results/${id}`,

  PRACTICE:          '/practice',
  PRACTICE_CATEGORY: (category: string) => `/practice/${category}`,

  ANALYTICS_ERROR_PATTERNS: '/analytics/error-patterns',
  ANALYTICS_WEAK_AREAS:     '/analytics/weak-areas',

  TRAFFIC_SIGNS:       '/traffic-signs',
  TRAFFIC_SIGN_DETAIL: (code: string) => `/traffic-signs/${code}`,

  LESSONS:       '/lessons',
  LESSON_DETAIL: (code: string) => `/lessons/${code}`,
} as const;

// ─── Storage Keys ────────────────────────────────────────

export const STORAGE_KEYS = {
  AUTH_COOKIE_NAME: 'token',
  LANGUAGE:         'readyroad_language',
  THEME:            'readyroad_theme',
  EXAM_STATE:       'readyroad_exam_state',
} as const;

// ─── Timer Warnings (seconds) ────────────────────────────

export const TIMER_WARNINGS = {
  TEN_MINUTES:  600,
  FIVE_MINUTES: 300,
  ONE_MINUTE:   60,
} as const;

// ─── Difficulty Levels ───────────────────────────────────

export const DIFFICULTY_LEVELS = {
  EASY:   'EASY',
  MEDIUM: 'MEDIUM',
  HARD:   'HARD',
} as const;

// ─── Simulation Status ───────────────────────────────────

export const SIMULATION_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED:   'COMPLETED',
  EXPIRED:     'EXPIRED',
} as const;

// ─── Pagination ──────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE_SIZE:       20,
  TRAFFIC_SIGNS_PAGE_SIZE: 24,
} as const;

// ─── Analytics Thresholds ────────────────────────────────

export const ANALYTICS_THRESHOLDS = {
  WEAK_AREA_ACCURACY:   60,
  STRONG_AREA_ACCURACY: 80,
  MIN_ATTEMPTS:          5,
} as const;

// ─── Chart Colors ────────────────────────────────────────

export const CHART_COLORS = {
  PRIMARY: '#DF5830',
  SUCCESS: '#27AE60',
  WARNING: '#F39C12',
  ERROR:   '#E74C3C',
  INFO:    '#3498DB',
  NEUTRAL: '#6C757D',
} as const;

// ─── API Endpoints ───────────────────────────────────────
// baseURL = /api/proxy — paths are relative to /api

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN:    '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT:   '/auth/logout',
    ME:       '/auth/me',
  },

  USERS: {
    ME:                   '/users/me',
    NOTIFICATIONS:        '/users/me/notifications',
    NOTIFICATIONS_COUNT:  '/users/me/notifications/unread-count',
    NOTIFICATIONS_READ_ALL: '/users/me/notifications/read-all',
    NOTIFICATION_READ:    (id: number) => `/users/me/notifications/${id}/read`,
    PROGRESS_OVERALL:     '/users/me/progress/overall',
    PROGRESS_CATEGORIES:  '/users/me/progress/categories',
    ANALYTICS_WEAK:       '/users/me/analytics/weak-areas',
    ANALYTICS_ERRORS:     '/users/me/analytics/error-patterns',
  },

  TRAFFIC_SIGNS: {
    LIST:        '/traffic-signs',
    DETAIL:      (code: string) => `/traffic-signs/${code}`,
    SEARCH:      '/traffic-signs/search',
    BY_CATEGORY: (categoryId: number) => `/traffic-signs/category/${categoryId}`, // ← مضاف
  },

  EXAMS: {
    START:         '/exams/simulations/start',   // ← صحيح من Spec
    ACTIVE:        '/exams/simulations/active',  // ← مضاف
    CAN_START:     '/exams/simulations/can-start', // ← مضاف
    HISTORY:       '/exams/simulations/history', // ← مضاف
    DETAIL:        (id: number) => `/exams/simulations/${id}`,
    RESULTS:       (id: number) => `/exams/simulations/${id}/results`,
    SUBMIT_ANSWER: (examId: number, questionId: number) =>
      `/exams/simulations/${examId}/questions/${questionId}/answer`, // ← مضاف
  },

  SMART_QUIZ: {
    RANDOM:      '/smart-quiz/random',
    BY_CATEGORY: (categoryId: number) => `/smart-quiz/category/${categoryId}`,
    STATS:       '/smart-quiz/stats',
  },

  QUIZ: {
    STATS:          '/quiz/stats',
    CATEGORY_STATS: (categoryId: number) => `/quiz/stats/category/${categoryId}`,
    SUBMIT_ANSWER:  (questionId: number) => `/quiz/questions/${questionId}/answer`,
  },

  CATEGORIES: {
    LIST:    '/categories',
    BY_CODE: (code: string) => `/categories/${code}`,
  },

  ANALYTICS: {
    ERROR_PATTERNS: '/analytics/error-patterns',
    WEAK_AREAS:     '/analytics/weak-areas',
    PROGRESS:       '/analytics/progress',
  },

  LESSONS: {
    LIST:   '/lessons',
    DETAIL: (code: string) => `/lessons/${code}`,
    SEARCH: '/lessons/search',
    COUNT:  '/lessons/count',
  },

  HEALTH: '/actuator/health',

  ADMIN: {
    DASHBOARD:       '/admin/dashboard',
    USERS:           '/admin/users',
    UPLOAD_IMAGE:    '/admin/upload/image',
    RESET_TEST_DATA: '/admin/reset-test-data',

    SIGNS: {
      LIST:   '/admin/signs',
      DETAIL: (id: number | string) => `/admin/signs/${id}`,
      CREATE: '/admin/signs',
      UPDATE: (id: number | string) => `/admin/signs/${id}`,
      DELETE: (id: number | string) => `/admin/signs/${id}`,
    },

    QUIZ_QUESTIONS: {
      LIST:   '/admin/quiz/questions',
      DETAIL: (id: number | string) => `/admin/quiz/questions/${id}`,
      CREATE: '/admin/quiz/questions',
      UPDATE: (id: number | string) => `/admin/quiz/questions/${id}`,
      DELETE: (id: number | string) => `/admin/quiz/questions/${id}`,
    },

    DATA_IMPORT: {
      PREVIEW:        (type: string) => `/admin/import/${type}/preview`,
      EXECUTE:        (type: string) => `/admin/import/${type}/execute`,
      HISTORY:        '/admin/import/history',
      HISTORY_DETAIL: (id: number)  => `/admin/import/history/${id}`,
    },
  },
} as const;

// ─── Error Messages ──────────────────────────────────────

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED:  'You are not authorized. Please login again.',
  FORBIDDEN:     'You do not have permission to access this resource.',
  NOT_FOUND:     'The requested resource was not found.',
  SERVER_ERROR:  'Server error. Please try again later.',
  TIMEOUT:       'Request timeout. Please try again.',
  UNKNOWN:       'An unknown error occurred.',
} as const;

// ─── Success Messages ────────────────────────────────────

export const SUCCESS_MESSAGES = {
  LOGIN:           'Login successful!',
  REGISTER:        'Registration successful!',
  EXAM_SUBMITTED:  'Exam submitted successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
} as const;

// ─── Types ───────────────────────────────────────────────

/** Language code: 'en' | 'ar' | 'nl' | 'fr' */
export type Language = typeof LANGUAGES[number]['code'];

/** Category value for traffic signs and questions */
export type Category = typeof CATEGORIES[keyof typeof CATEGORIES];

/** Difficulty level: 'EASY' | 'MEDIUM' | 'HARD' */
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[keyof typeof DIFFICULTY_LEVELS];

/** Simulation status */
export type SimulationStatus = typeof SIMULATION_STATUS[keyof typeof SIMULATION_STATUS];

/** localStorage key */
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/** Chart color hex value */
export type ChartColor = typeof CHART_COLORS[keyof typeof CHART_COLORS];
