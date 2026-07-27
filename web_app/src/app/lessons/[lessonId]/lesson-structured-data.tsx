import { getRequestLocale } from "@/lib/server/request-locale";
import { buildLocalizedUrl } from "@/lib/i18n-routing";
import { getLocalizedLessonSeo } from "@/lib/learning-seo-copy";
import { serializeJsonLd, toMetadataDescription } from "@/lib/seo";
import {
  DEFAULT_APP_URL,
  type SiteLocale,
} from "@/lib/site-copy";
import type { LessonDetail, LessonPage } from "@/lib/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

function getPageTitle(page: LessonPage, locale: SiteLocale): string {
  return (
    {
      en: page.titleEn,
      nl: page.titleNl,
      fr: page.titleFr,
      ar: page.titleAr,
    }[locale] || page.titleEn
  );
}

function getPageDescription(page: LessonPage, locale: SiteLocale): string {
  return (
    {
      en: page.contentEn,
      nl: page.contentNl,
      fr: page.contentFr,
      ar: page.contentAr,
    }[locale] || page.contentEn
  );
}

export default async function LessonStructuredData({
  lesson,
  page,
}: Readonly<{
  lesson: LessonDetail;
  page?: LessonPage;
}>) {
  const locale = await getRequestLocale();
  const copy = getLocalizedLessonSeo(lesson, locale);
  const lessonPath = `/lessons/${encodeURIComponent(lesson.lessonCode)}`;
  const pagePath =
    page && page.pageNumber > 1
      ? `${lessonPath}/${page.pageNumber}`
      : lessonPath;
  const canonical = buildLocalizedUrl(pagePath, locale, APP_URL);
  const pageName = page ? getPageTitle(page, locale) : copy.name;
  const description = toMetadataDescription(
    page ? getPageDescription(page, locale) : copy.description,
    copy.fallbackDescription,
  );
  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: copy.homeLabel,
      item: buildLocalizedUrl("/", locale, APP_URL),
    },
    {
      "@type": "ListItem",
      position: 2,
      name: copy.indexLabel,
      item: buildLocalizedUrl("/lessons", locale, APP_URL),
    },
    {
      "@type": "ListItem",
      position: 3,
      name: copy.name,
      item: buildLocalizedUrl(lessonPath, locale, APP_URL),
    },
  ];

  if (page && page.pageNumber > 1) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 4,
      name: pageName,
      item: canonical,
    });
  }

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    },
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: pageName,
      description,
      url: canonical,
      inLanguage: locale,
      learningResourceType: copy.learningResourceType,
      educationalUse: copy.educationalUse,
      timeRequired: `PT${lesson.estimatedMinutes}M`,
      isPartOf:
        page && page.pageNumber > 1
          ? {
              "@type": "LearningResource",
              name: copy.name,
              url: buildLocalizedUrl(lessonPath, locale, APP_URL),
            }
          : { "@id": `${APP_URL}/#website` },
    },
  ];

  return schemas.map((schema) => (
    <script
      key={schema["@type"]}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  ));
}
