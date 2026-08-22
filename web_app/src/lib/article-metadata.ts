import type { Metadata } from "next";
import { buildLocalizedUrl } from "@/lib/i18n-routing";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
  getSharedOgImage,
  type SiteLocale,
} from "@/lib/site-copy";
import type { PublicArticle } from "@/lib/server/articles";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

const ARTICLE_LANGUAGE: Record<SiteLocale, "AR" | "NL" | "FR" | "EN"> = {
  ar: "AR",
  nl: "NL",
  fr: "FR",
  en: "EN",
};

const HREFLANG: Record<SiteLocale, string> = {
  en: "en",
  nl: "nl-BE",
  fr: "fr-BE",
  ar: "ar",
};

function articlePath(slug: string): string {
  return `/blog/${encodeURIComponent(slug)}`;
}

export function createArticleMetadata(
  article: PublicArticle,
  locale: SiteLocale,
): Metadata {
  const canonical = buildLocalizedUrl(articlePath(article.slug), locale, APP_URL);
  const languages = Object.fromEntries(
    (Object.keys(ARTICLE_LANGUAGE) as SiteLocale[]).flatMap((targetLocale) => {
      const slug = article.alternateSlugs[ARTICLE_LANGUAGE[targetLocale]];
      return slug
        ? [[HREFLANG[targetLocale], buildLocalizedUrl(articlePath(slug), targetLocale, APP_URL)]]
        : [];
    }),
  );
  const englishSlug = article.alternateSlugs.EN;
  if (englishSlug) {
    languages["x-default"] = buildLocalizedUrl(articlePath(englishSlug), "en", APP_URL);
  }
  const image = { ...getSharedOgImage(locale), alt: article.metaTitle };

  return {
    title: { absolute: article.metaTitle },
    description: article.metaDescription,
    alternates: { canonical, languages },
    openGraph: {
      type: "article",
      title: article.metaTitle,
      description: article.metaDescription,
      url: canonical,
      siteName: "RijVia",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      publishedTime: article.publishedAt,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: article.metaTitle,
      description: article.metaDescription,
      images: [image.url],
    },
    robots: { index: true, follow: true },
  };
}
