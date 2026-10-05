import "server-only";

import type { SiteLocale } from "@/lib/site-copy";
import { resolveRijviaMediaUrl } from "@/lib/image-utils";
import { getPublicBackendApiUrl } from "@/lib/server/public-catalog";

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

function normalizeArticleImage(
  image: PublicArticleImage | null | undefined,
): PublicArticleImage | null {
  if (!image) {
    return null;
  }

  return {
    ...image,
    heroUrl:
      resolveRijviaMediaUrl(image.heroUrl) ??
      image.heroUrl,
    cardUrl:
      resolveRijviaMediaUrl(image.cardUrl) ??
      image.cardUrl,
    mobileUrl:
      resolveRijviaMediaUrl(image.mobileUrl) ??
      image.mobileUrl,
    thumbnailUrl: image.thumbnailUrl
      ? (
          resolveRijviaMediaUrl(
            image.thumbnailUrl,
          ) ?? image.thumbnailUrl
        )
      : undefined,
    ogUrl:
      resolveRijviaMediaUrl(image.ogUrl) ??
      image.ogUrl,
  };
}

function normalizeArticleSummary(
  article: PublicArticleSummary,
): PublicArticleSummary {
  if (!article.image) {
    return article;
  }

  return {
    ...article,
    image: normalizeArticleImage(
      article.image,
    ),
  };
}
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
      cache: "no-store",
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

  return Array.isArray(articles)
    ? articles.map(normalizeArticleSummary)
    : [];
}

export async function getPublicArticle(
  locale: SiteLocale,
  slug: string,
): Promise<PublicArticle | null> {
  const article =
    await fetchArticleApi<PublicArticle>(
      `/articles/${encodeURIComponent(slug)}?language=${API_LANGUAGE[locale]}`,
    );

  if (!article) {
    return null;
  }

  if (!article.image) {
    return article;
  }

  return {
    ...article,
    image: normalizeArticleImage(
      article.image,
    ),
  };
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

  return Array.isArray(articles)
    ? articles.map(normalizeArticleSummary)
    : [];
}
