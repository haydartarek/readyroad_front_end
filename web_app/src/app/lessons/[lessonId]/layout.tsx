import type { Metadata } from "next";
import { DEFAULT_APP_URL } from "@/lib/site-copy";
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

  const canonical = buildAbsoluteUrl(
    `/lessons/${encodeURIComponent(lesson.lessonCode)}`,
    APP_URL,
  );
  const description = toMetadataDescription(
    lesson.descriptionEn,
    `Study lesson ${lesson.titleEn} for the Belgian driving theory exam.`,
  );
  const title = `${lesson.titleEn} | Belgian Driving Theory | ReadyRoad`;
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
      locale: "en_BE",
      alternateLocale: ["nl_BE", "fr_BE", "ar_BE"],
      type: "article",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
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
          name: "Home",
          item: APP_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Belgian Driving Theory Lessons",
          item: buildAbsoluteUrl("/lessons", APP_URL),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: lesson.titleEn,
          item: canonical,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: lesson.titleEn,
      description: lesson.descriptionEn,
      url: canonical,
      inLanguage: ["en", "nl", "fr", "ar"],
      learningResourceType: "Driving theory lesson",
      educationalUse: "Study and revision",
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
