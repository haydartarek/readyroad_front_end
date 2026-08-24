import LessonDetailClient from "@/app/lessons/[lessonId]/lesson-detail-client";
import {
  getPublicLesson,
  getPublicLessons,
} from "@/lib/server/public-catalog";
import LessonStructuredData from "@/app/lessons/[lessonId]/lesson-structured-data";
import RelatedLearningArticles from "@/components/content/related-learning-articles";
import { localizePathname } from "@/lib/i18n-routing";
import { getRelatedPublicArticles } from "@/lib/server/articles";
import { getRequestLocale } from "@/lib/server/request-locale";

type LessonDetailPageProps = Readonly<{
  params: Promise<{ lessonId: string }>;
}>;

export default async function LessonDetailPage({
  params,
}: LessonDetailPageProps) {
  const { lessonId } = await params;
  const locale = await getRequestLocale();
  const targetPath = localizePathname(`/lessons/${encodeURIComponent(lessonId)}`, locale);
  const [lesson, lessons, relatedArticles] = await Promise.all([
    getPublicLesson(lessonId),
    getPublicLessons(),
    getRelatedPublicArticles(locale, targetPath),
  ]);

  return (
    <>
      {lesson && <LessonStructuredData lesson={lesson} />}
      <LessonDetailClient
        initialLesson={lesson}
        initialLessons={lessons}
        initialPageNumber={1}
      />
      <RelatedLearningArticles articles={relatedArticles} locale={locale} />
    </>
  );
}
