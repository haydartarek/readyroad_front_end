import type { Lesson, LessonDetail, TrafficSign } from "@/lib/types";

const DEFAULT_BACKEND_API_URL = "http://localhost:8890/api";
const CATALOG_REVALIDATE_SECONDS = 60 * 60;

export function getPublicBackendApiUrl(): string {
  const configured =
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_BACKEND_API_URL;
  const normalized = configured.replace(/\/+$/, "");

  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
}

async function fetchPublicCatalog<T>(path: string): Promise<T | null> {
  const url = `${getPublicBackendApiUrl()}/${path.replace(/^\/+/, "")}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: CATALOG_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getPublicTrafficSigns(): Promise<TrafficSign[]> {
  return (await fetchPublicCatalog<TrafficSign[]>("traffic-signs")) ?? [];
}

export async function getPublicTrafficSign(
  signCode: string,
): Promise<TrafficSign | null> {
  return fetchPublicCatalog<TrafficSign>(
    `traffic-signs/${encodeURIComponent(signCode)}`,
  );
}

export async function getPublicLessons(): Promise<Lesson[]> {
  return (await fetchPublicCatalog<Lesson[]>("lessons")) ?? [];
}

export async function getPublicLesson(
  lessonCode: string,
): Promise<LessonDetail | null> {
  return fetchPublicCatalog<LessonDetail>(
    `lessons/${encodeURIComponent(lessonCode)}`,
  );
}
