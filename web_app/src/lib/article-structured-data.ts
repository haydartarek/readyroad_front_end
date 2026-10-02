import { buildLocalizedUrl } from "@/lib/i18n-routing";
import { buildAbsoluteUrl, normalizeSeoBrand } from "@/lib/seo";
import {
  DEFAULT_APP_URL,
  getSharedOgImage,
  type SiteLocale,
} from "@/lib/site-copy";
import type { PublicArticle } from "@/lib/server/articles";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

const ARTICLE_LANGUAGE: Record<SiteLocale, string> = {
  ar: "ar",
  en: "en",
  fr: "fr-BE",
  nl: "nl-BE",
};

function articlePath(slug: string): string {
  return `/blog/${encodeURIComponent(slug)}`;
}

export function createArticleStructuredData(
  article: PublicArticle,
  locale: SiteLocale,
  blogLabel: string,
) {
  const canonical = buildLocalizedUrl(articlePath(article.slug), locale, APP_URL);
  const organizationId = `${APP_URL.replace(/\/+$/, "")}/#organization`;
  const websiteId = `${APP_URL.replace(/\/+$/, "")}/#website`;
  const image = article.image
    ? { url: article.image.ogUrl, width: 1200, height: 630 }
    : getSharedOgImage(locale);
  const normalizedBlogLabel = normalizeSeoBrand(blogLabel)
    .replace(/\bRijvia\b[\s:|\-]*/iu, "")
    .trim() || "Blog";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${canonical}#article`,
        url: canonical,
        headline: article.title,
        description: normalizeSeoBrand(article.summary),
        inLanguage: ARTICLE_LANGUAGE[locale],
        mainEntityOfPage: canonical,
        image: {
          "@type": "ImageObject",
          url: buildAbsoluteUrl(image.url, APP_URL),
          width: image.width,
          height: image.height,
        },
        author: { "@id": organizationId },
        publisher: { "@id": organizationId },
        isPartOf: { "@id": websiteId },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Rijvia",
            item: buildLocalizedUrl("/", locale, APP_URL),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: normalizedBlogLabel,
            item: buildLocalizedUrl("/blog", locale, APP_URL),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: article.title,
            item: canonical,
          },
        ],
      },
    ],
  };
}
