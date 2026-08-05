// ─── Shared Primitives ───────────────────────────────────

export type Language = "en" | "ar" | "nl" | "fr";

// ─── Auth ────────────────────────────────────────────────

/**
 * Supports both username and email login.
 * Backend expects `username` — `email` is sent as fallback.
 */
export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
}

// ─── User ────────────────────────────────────────────────

export interface User {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  emailVerified?: boolean;
  preferredLanguage?: Language;
  createdAt?: string;
  linkedProviders?: string[];
  googleLinked?: boolean;
}

// ─── Traffic Signs ───────────────────────────────────────

export interface TrafficSign {
  id?: number;
  signCode: string;
  routeCode: string;
  categoryCode: string;
  exam1TotalQuestions?: number | null;
  exam1PassingScore?: number | null;
  nameEn: string;
  nameAr: string;
  nameNl: string;
  nameFr: string;
  summaryEn: string;
  summaryAr: string;
  summaryNl: string;
  summaryFr: string;
  descriptionEn: string;
  descriptionAr: string;
  descriptionNl: string;
  descriptionFr: string;
  driverGuidanceEn: string;
  driverGuidanceAr: string;
  driverGuidanceNl: string;
  driverGuidanceFr: string;
  exceptionsEn: string[];
  exceptionsAr: string[];
  exceptionsNl: string[];
  exceptionsFr: string[];
  imageUrl: string;
  penalties?: string;
}

export type TrafficSignCatalogItem = Pick<
  TrafficSign,
  | "signCode"
  | "routeCode"
  | "categoryCode"
  | "nameEn"
  | "nameAr"
  | "nameNl"
  | "nameFr"
  | "descriptionEn"
  | "descriptionAr"
  | "descriptionNl"
  | "descriptionFr"
  | "imageUrl"
>;

// ─── Lessons ─────────────────────────────────────────────

export interface LessonPage {
  id: number;
  pageNumber: number;
  titleEn: string;
  titleAr: string;
  titleNl: string;
  titleFr: string;
  contentEn: string;
  contentAr: string;
  contentNl: string;
  contentFr: string;
  bulletPointsEn: string[];
  bulletPointsAr: string[];
  bulletPointsNl: string[];
  bulletPointsFr: string[];
}

/** Lesson summary — returned by GET /api/lessons (no pages). */
export interface Lesson {
  id: number;
  lessonCode: string;
  icon: string;
  titleEn: string;
  titleAr: string;
  titleNl: string;
  titleFr: string;
  descriptionEn: string;
  descriptionAr: string;
  descriptionNl: string;
  descriptionFr: string;
  displayOrder: number;
  estimatedMinutes: number;
  totalPages: number;
}

/** Full lesson with pages — returned by GET /api/lessons/{code}. */
export interface LessonDetail extends Omit<Lesson, "totalPages"> {
  pages: LessonPage[];
}
