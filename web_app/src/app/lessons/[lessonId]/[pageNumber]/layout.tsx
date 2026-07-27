import { getRequestLocale } from "@/lib/server/request-locale";
import type { Metadata } from "next";
import { buildLocalizedUrl } from "@/lib/i18n-routing";
import { getLocalizedLessonSeo } from "@/lib/learning-seo-copy";
import { getLocalizedAlternates } from "@/lib/localized-seo";
import { toMetadataDescription } from "@/lib/seo";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
  type SiteLocale,
} from "@/lib/site-copy";
import { getPublicLesson } from "@/lib/server/public-catalog";
import type { LessonPage } from "@/lib/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

function getPageField(
  page: LessonPage,
  locale: SiteLocale,
  field: "title" | "content",
): string {
  const suffix = { en: "En", nl: "Nl", fr: "Fr", ar: "Ar" }[locale];
  const key = `${field}${suffix}` as keyof LessonPage;
  const value = page[key];
  return typeof value === "string" ? value : "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string; pageNumber: string }>;
}): Promise<Metadata> {
  const { lessonId, pageNumber: rawPageNumber } = await params;
  const pageNumber = Number(rawPageNumber);
  const lesson = await getPublicLesson(lessonId);
  const page = lesson?.pages.find((item) => item.pageNumber === pageNumber);

  if (!lesson || !page || pageNumber < 2) {
    return { robots: { index: false, follow: false } };
  }

  const locale = await getRequestLocale();
  const lessonCopy = getLocalizedLessonSeo(lesson, locale);
  const pageTitle = getPageField(page, locale, "title");
  const title = `${pageTitle} | ${lessonCopy.name} | ReadyRoad`;
  const description = toMetadataDescription(
    getPageField(page, locale, "content"),
    lessonCopy.fallbackDescription,
  );
  const routePath = `/lessons/${encodeURIComponent(lesson.lessonCode)}/${pageNumber}`;
  const canonical = buildLocalizedUrl(routePath, locale, APP_URL);
  const image = buildLocalizedUrl("/opengraph-image", "en", APP_URL);

  return {
    title: { absolute: title },
    description,
    alternates: getLocalizedAlternates(routePath, locale, APP_URL),
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "ReadyRoad",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      type: "article",
      images: [{ url: image, width: 1200, height: 630, alt: pageTitle }],
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

export default function LessonPageLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
