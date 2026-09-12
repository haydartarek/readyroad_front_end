import { getRequestLocale } from "@/lib/server/request-locale";
import { buildLocalizedUrl } from "@/lib/i18n-routing";
import { getLocalizedLessonSeo } from "@/lib/learning-seo-copy";
import { serializeJsonLd, toMetadataDescription } from "@/lib/seo";
import {
  DEFAULT_APP_URL,
} from "@/lib/site-copy";
import type { LessonDetail } from "@/lib/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

export default async function LessonStructuredData({
  lesson,
}: Readonly<{
  lesson: LessonDetail;
}>) {
  const locale = await getRequestLocale();
  const copy = getLocalizedLessonSeo(lesson, locale);
  const lessonPath = `/lessons/${encodeURIComponent(lesson.lessonCode)}`;
  const canonical = buildLocalizedUrl(lessonPath, locale, APP_URL);
  const description = toMetadataDescription(copy.description, copy.fallbackDescription);
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

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    },
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: copy.name,
      description,
      url: canonical,
      inLanguage: locale,
      learningResourceType: copy.learningResourceType,
      educationalUse: copy.educationalUse,
      timeRequired: `PT${lesson.estimatedMinutes}M`,
      isPartOf: { "@id": `${APP_URL}/#website` },
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
