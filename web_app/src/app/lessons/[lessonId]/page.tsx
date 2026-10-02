import LessonDetailClient from "@/app/lessons/[lessonId]/lesson-detail-client";
import { notFound } from "next/navigation";
import {
  getPublicLesson,
  getPublicLessons,
} from "@/lib/server/public-catalog";
import LessonStructuredData from "@/app/lessons/[lessonId]/lesson-structured-data";
import LessonKeywordSupport from "@/components/lessons/lesson-keyword-support";
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
  const [lesson, lessons] = await Promise.all([
    getPublicLesson(lessonId),
    getPublicLessons(),
  ]);

  // Only declare a missing lesson when the active catalog loaded successfully.
  // Keep the client retry path for temporary failures loading lesson details.
  if (
    !lesson &&
    lessons.length > 0 &&
    !lessons.some(
      (item) => item.lessonCode === lessonId || String(item.id) === lessonId,
    )
  ) {
    return <MissingLesson />;
  }

  const relatedArticles = await getRelatedPublicArticles(locale, targetPath);

  return (
    <>
      {lesson && <LessonStructuredData lesson={lesson} />}
      <LessonDetailClient
        initialLesson={lesson}
        initialLessons={lessons}
      />
      {lesson && (
        <LessonKeywordSupport lessonCode={lesson.lessonCode} locale={locale} />
      )}
      <RelatedLearningArticles articles={relatedArticles} locale={locale} />
    </>
  );
}

// Resolve asynchronous catalog reads before throwing the HTTP fallback.
// This keeps React's development timing instrumentation out of the rejected
// async page while retaining Next's not-found handling in every environment.
function MissingLesson(): null {
  notFound();
  return null;
}
