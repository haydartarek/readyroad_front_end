import type { Metadata } from "next";
import { cookies } from "next/headers";
import { STORAGE_KEYS } from "@/lib/constants";
import { getLocalizedLessonSeo } from "@/lib/learning-seo-copy";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
  resolveSiteLocale,
} from "@/lib/site-copy";
import { buildAbsoluteUrl, serializeJsonLd, toMetadataDescription } from "@/lib/seo";
import { getPublicLesson } from "@/lib/server/public-catalog";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

type LessonLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ lessonId: string }>;
}>;

export async function generateMetadata({
  params,
}: Pick<LessonLayoutProps, "params">): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = await getPublicLesson(lessonId);

  if (!lesson) {
    return {
      title: { absolute: "Lesson Not Found | ReadyRoad" },
      robots: { index: false, follow: false },
    };
  }

  const cookieStore = await cookies();
  const locale = resolveSiteLocale(
    cookieStore.get(STORAGE_KEYS.LANGUAGE)?.value,
  );
  const copy = getLocalizedLessonSeo(lesson, locale);

  const canonical = buildAbsoluteUrl(
    `/lessons/${encodeURIComponent(lesson.lessonCode)}`,
    APP_URL,
  );
  const description = toMetadataDescription(
    copy.description,
    copy.fallbackDescription,
  );
  const title = copy.title;
  const image = buildAbsoluteUrl("/opengraph-image", APP_URL);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "ReadyRoad",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      type: "article",
      images: [
        { url: image, width: 1200, height: 630, alt: copy.imageAlt },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export default async function LessonLayout({
  children,
  params,
}: LessonLayoutProps) {
  const { lessonId } = await params;
  const lesson = await getPublicLesson(lessonId);

  if (!lesson) {
    return children;
  }

  const cookieStore = await cookies();
  const locale = resolveSiteLocale(
    cookieStore.get(STORAGE_KEYS.LANGUAGE)?.value,
  );
  const copy = getLocalizedLessonSeo(lesson, locale);

  const canonical = buildAbsoluteUrl(
    `/lessons/${encodeURIComponent(lesson.lessonCode)}`,
    APP_URL,
  );
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: copy.homeLabel,
          item: APP_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: copy.indexLabel,
          item: buildAbsoluteUrl("/lessons", APP_URL),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: copy.name,
          item: canonical,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: copy.name,
      description: toMetadataDescription(
        copy.description,
        copy.fallbackDescription,
      ),
      url: canonical,
      inLanguage: ["en", "nl", "fr", "ar"],
      learningResourceType: copy.learningResourceType,
      educationalUse: copy.educationalUse,
      timeRequired: `PT${lesson.estimatedMinutes}M`,
      isPartOf: { "@id": `${APP_URL}/#website` },
    },
  ];

  return (
    <>
      {schemas.map((schema) => (
        <script
          key={schema["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}
      {children}
    </>
  );
}
