import { getRequestLocale } from "@/lib/server/request-locale";
import type { Metadata } from "next";
import { getLocalizedLessonSeo } from "@/lib/learning-seo-copy";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
} from "@/lib/site-copy";
import { buildAbsoluteUrl, toMetadataDescription } from "@/lib/seo";
import { getPublicLesson } from "@/lib/server/public-catalog";
import { buildLocalizedUrl } from "@/lib/i18n-routing";
import { getLocalizedAlternates } from "@/lib/localized-seo";

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
      title: { absolute: "Lesson Not Found | RijVia" },
      robots: { index: false, follow: false },
    };
  }

  const locale = await getRequestLocale();
  const copy = getLocalizedLessonSeo(lesson, locale);

  const routePath = `/lessons/${encodeURIComponent(lesson.lessonCode)}`;
  const canonical = buildLocalizedUrl(routePath, locale, APP_URL);
  const description = toMetadataDescription(
    copy.description,
    copy.fallbackDescription,
  );
  const title = copy.title;
  const image = buildAbsoluteUrl("/opengraph-image", APP_URL);

  return {
    title: { absolute: title },
    description,
    alternates: getLocalizedAlternates(routePath, locale, APP_URL),
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "RijVia",
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
}: LessonLayoutProps) {
  return children;
}
