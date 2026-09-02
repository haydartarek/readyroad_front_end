import "server-only";

import type { SiteLocale } from "@/lib/site-copy";
import { getPublicBackendApiUrl } from "@/lib/server/public-catalog";

const ARTICLE_REVALIDATE_SECONDS = 15 * 60;

const API_LANGUAGE: Record<SiteLocale, "AR" | "NL" | "FR" | "EN"> = {
  ar: "AR",
  nl: "NL",
  fr: "FR",
  en: "EN",
};

export type PublicArticleSummary = Readonly<{
  language: string;
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  image: PublicArticleImage | null;
  alternateSlugs: Readonly<Record<string, string>>;
}>;

export type PublicArticleImage = Readonly<{
  assetId: number;
  heroUrl: string;
  cardUrl: string;
  mobileUrl: string;
  thumbnailUrl?: string;
  ogUrl: string;
  altText: string;
  caption?: string | null;
  sourcePlatform?: string | null;
  sourceUrl?: string | null;
  photographerName?: string | null;
  photographerUrl?: string | null;
  licenseName?: string | null;
  licenseUrl?: string | null;
}>;

export type PublicArticleInternalLink = Readonly<{
  type: "ARTICLE" | "LESSON" | "TRAFFIC_SIGN" | "PRACTICE" | "EXAM" | "VIDEO";
  targetPath: string;
  anchorText: string;
}>;

export type PublicArticleTypography = Readonly<{
  h1Size: "COMPACT" | "DEFAULT" | "LARGE";
  h2Size: "COMPACT" | "DEFAULT" | "LARGE";
  h3Size: "COMPACT" | "DEFAULT" | "LARGE";
  h4Size: "COMPACT" | "DEFAULT" | "LARGE";
  paragraphSize: "COMPACT" | "DEFAULT" | "LARGE";
  textColor: "DEFAULT" | "MUTED" | "PRIMARY" | "SECONDARY";
}>;

export type PublicArticle = PublicArticleSummary &
  Readonly<{
    body: string;
    metaTitle: string;
    metaDescription: string;
    internalLinks: ReadonlyArray<PublicArticleInternalLink>;
    typography: PublicArticleTypography;
    alternateSlugs: Readonly<Record<string, string>>;
  }>;

async function fetchArticleApi<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${getPublicBackendApiUrl()}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: ARTICLE_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getPublicArticles(
  locale: SiteLocale,
): Promise<PublicArticleSummary[]> {
  const articles = await fetchArticleApi<PublicArticleSummary[]>(
    `/articles?language=${API_LANGUAGE[locale]}`,
  );

  return Array.isArray(articles) ? articles : [];
}

export async function getPublicArticle(
  locale: SiteLocale,
  slug: string,
): Promise<PublicArticle | null> {
  return fetchArticleApi<PublicArticle>(
    `/articles/${encodeURIComponent(slug)}?language=${API_LANGUAGE[locale]}`,
  );
}

export async function getRelatedPublicArticles(
  locale: SiteLocale,
  targetPath: string,
): Promise<PublicArticleSummary[]> {
  const query = new URLSearchParams({
    language: API_LANGUAGE[locale],
    targetPath,
    limit: "3",
  });
  const articles = await fetchArticleApi<PublicArticleSummary[]>(
    `/articles/related?${query.toString()}`,
  );

  return Array.isArray(articles) ? articles : [];
}
