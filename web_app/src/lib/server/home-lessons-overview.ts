import type { HomeLessonOverviewItem } from "@/lib/home-lessons-overview";
import { getPublicBackendApiUrl } from "@/lib/server/public-catalog";

export async function getHomeLessonsOverview(): Promise<
  HomeLessonOverviewItem[]
> {
  try {
    const response = await fetch(
      `${getPublicBackendApiUrl()}/lessons/home-overview`,
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return [];
    }

    const data: unknown = await response.json();

    return Array.isArray(data)
      ? (data as HomeLessonOverviewItem[])
      : [];
  } catch {
    return [];
  }
}
