import { getPublicBackendApiUrl } from "@/lib/server/public-catalog";

const ARTICLE_REVALIDATE_SECONDS = 15 * 60;

export async function isMissingPublishedArticle(
  pathname: string,
  locale: "en" | "nl" | "fr" | "ar",
): Promise<boolean> {
  const match = pathname.match(/^\/blog\/([^/]+)\/?$/);
  if (!match) return false;

  let slug: string;
  try {
    slug = decodeURIComponent(match[1]);
  } catch {
    slug = match[1];
  }

  try {
    const response = await fetch(
      `${getPublicBackendApiUrl()}/articles/${encodeURIComponent(slug)}?language=${locale.toUpperCase()}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: ARTICLE_REVALIDATE_SECONDS },
      },
    );
    return response.status === 404;
  } catch {
    return false;
  }
}
