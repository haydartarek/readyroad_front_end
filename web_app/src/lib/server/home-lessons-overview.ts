import type { HomeLessonOverviewItem } from "@/lib/home-lessons-overview";
import { getPublicBackendApiUrl } from "@/lib/server/public-catalog";
import { getRequestLocale } from "@/lib/server/request-locale";

export async function getHomeLessonsOverview(): Promise<
  HomeLessonOverviewItem[]
> {
  try {
    const locale = await getRequestLocale();
    const response = await fetch(
      `${getPublicBackendApiUrl()}/lessons/home-overview?lang=${locale}`,
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
