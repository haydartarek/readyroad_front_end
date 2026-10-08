import type { Metadata } from "next";
import { buildLocalizedUrl } from "@/lib/i18n-routing";
import {
  buildAbsoluteUrl,
  normalizeSeoBrand,
  toBrandedMetadataTitle,
  toMetadataDescription,
} from "@/lib/seo";
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

export function createArticleLanguageAlternates(
  alternateSlugs: Readonly<Record<string, string>>,
  appUrl: string = APP_URL,
): Record<string, string> {
  const languages = Object.fromEntries(
    (Object.keys(ARTICLE_LANGUAGE) as SiteLocale[]).flatMap((targetLocale) => {
      const slug = alternateSlugs[ARTICLE_LANGUAGE[targetLocale]];
      return slug
        ? [[HREFLANG[targetLocale], buildLocalizedUrl(articlePath(slug), targetLocale, appUrl)]]
        : [];
    }),
  );
  const englishSlug = alternateSlugs.EN;
  if (englishSlug) {
    languages["x-default"] = buildLocalizedUrl(articlePath(englishSlug), "en", appUrl);
  }
  return languages;
}

export function createArticleMetadata(
  article: PublicArticle,
  locale: SiteLocale,
): Metadata {
  const canonical = buildLocalizedUrl(articlePath(article.slug), locale, APP_URL);
  const title = toBrandedMetadataTitle(article.title);
  const description = toMetadataDescription(
    normalizeSeoBrand(article.summary),
    normalizeSeoBrand(article.title),
  );
  const image = article.image
    ? {
        url: buildAbsoluteUrl(article.image.ogUrl, APP_URL),
        width: 1200,
        height: 630,
        alt: article.image.altText,
      }
    : { ...getSharedOgImage(locale), alt: article.title };

  return {
    title: { absolute: title },
    description: description,
    alternates: {
      canonical,
      languages: createArticleLanguageAlternates(article.alternateSlugs),
    },
    openGraph: {
      type: "article",
      title,
      description: description,
      url: canonical,
      siteName: "Rijvia",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description,
      images: [image.url],
    },
    robots: { index: true, follow: true },
  };
}
