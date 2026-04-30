// Lesson Service — reads lessons from the backend REST API (database-backed).
// No direct JSON loading; the frontend is a thin client.

import apiClient from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import type { Lesson, LessonDetail } from '@/lib/types';

export interface LessonProgress {
  lessonId: number;
  pagesRead: number;
  totalPages?: number;
  currentPage?: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  completed: boolean;
  completedAt?: string | null;
  lastSeenAt?: string | null;
}

// ─── Service ─────────────────────────────────────────────

/** Fetch all active lessons (summary list, no pages). */
export async function getAllLessons(): Promise<Lesson[]> {
  const { data } = await apiClient.get<Lesson[]>(API_ENDPOINTS.LESSONS.LIST);
  return data;
}

/** Fetch a single lesson with all pages by code or numeric id. */
export async function getLessonByCode(code: string): Promise<LessonDetail> {
  const { data } = await apiClient.get<LessonDetail>(
    API_ENDPOINTS.LESSONS.DETAIL(code),
  );
  return data;
}

/** Search lessons by keyword. */
export async function searchLessons(query: string): Promise<Lesson[]> {
  const { data } = await apiClient.get<Lesson[]>(API_ENDPOINTS.LESSONS.SEARCH, {
    q: query,
  });
  return data;
}

/** Get total active lesson count. */
export async function getLessonsCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>(API_ENDPOINTS.LESSONS.COUNT);
  return data.count;
}

/** Get the authenticated user's progress for one lesson. */
export async function getLessonProgress(code: string): Promise<LessonProgress> {
  const { data } = await apiClient.get<LessonProgress>(
    API_ENDPOINTS.LESSONS.PROGRESS(code),
  );
  return data;
}

/** Mark one lesson page as read for the authenticated user. */
export async function markLessonPageRead(
  code: string,
  totalPages: number,
  pageNumber: number,
): Promise<LessonProgress> {
  const { data } = await apiClient.post<LessonProgress>(
    API_ENDPOINTS.LESSONS.PROGRESS(code),
    { totalPages, pageNumber },
  );
  return data;
}

// ─── Service Object ──────────────────────────────────────

export const lessonService = {
  getAllLessons,
  getLessonByCode,
  searchLessons,
  getLessonsCount,
  getLessonProgress,
  markLessonPageRead,
};

export default lessonService;
