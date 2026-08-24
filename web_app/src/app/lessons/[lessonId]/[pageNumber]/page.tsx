import { getRequestLocale } from "@/lib/server/request-locale";
import { notFound, permanentRedirect } from "next/navigation";
import LessonDetailClient from "@/app/lessons/[lessonId]/lesson-detail-client";
import LessonStructuredData from "@/app/lessons/[lessonId]/lesson-structured-data";
import {
  getPublicLesson,
  getPublicLessons,
} from "@/lib/server/public-catalog";
import { localizePathname } from "@/lib/i18n-routing";
import RelatedLearningArticles from "@/components/content/related-learning-articles";
import { getRelatedPublicArticles } from "@/lib/server/articles";

type LessonPageProps = Readonly<{
  params: Promise<{ lessonId: string; pageNumber: string }>;
}>;

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonId, pageNumber: rawPageNumber } = await params;
  const pageNumber = Number(rawPageNumber);
  const locale = await getRequestLocale();

  if (pageNumber === 1) {
    permanentRedirect(
      localizePathname(`/lessons/${encodeURIComponent(lessonId)}`, locale),
    );
  }

  const targetPath = localizePathname(
    `/lessons/${encodeURIComponent(lessonId)}/${pageNumber}`,
    locale,
  );
  const [lesson, lessons, relatedArticles] = await Promise.all([
    getPublicLesson(lessonId),
    getPublicLessons(),
    getRelatedPublicArticles(locale, targetPath),
  ]);
  const page = lesson?.pages.find((item) => item.pageNumber === pageNumber);

  if (!lesson || !Number.isInteger(pageNumber) || pageNumber < 2 || !page) {
    notFound();
  }

  return (
    <>
      <LessonStructuredData lesson={lesson} page={page} />
      <LessonDetailClient
        initialLesson={lesson}
        initialLessons={lessons}
        initialPageNumber={pageNumber}
      />
      <RelatedLearningArticles articles={relatedArticles} locale={locale} />
    </>
  );
}
