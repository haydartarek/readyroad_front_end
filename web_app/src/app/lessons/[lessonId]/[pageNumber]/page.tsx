import { getRequestLocale } from "@/lib/server/request-locale";
import { notFound, permanentRedirect } from "next/navigation";
import LessonDetailClient from "@/app/lessons/[lessonId]/lesson-detail-client";
import LessonStructuredData from "@/app/lessons/[lessonId]/lesson-structured-data";
import {
  getPublicLesson,
  getPublicLessons,
} from "@/lib/server/public-catalog";
import { localizePathname } from "@/lib/i18n-routing";

type LessonPageProps = Readonly<{
  params: Promise<{ lessonId: string; pageNumber: string }>;
}>;

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonId, pageNumber: rawPageNumber } = await params;
  const pageNumber = Number(rawPageNumber);

  if (pageNumber === 1) {
    const locale = await getRequestLocale();
    permanentRedirect(
      localizePathname(`/lessons/${encodeURIComponent(lessonId)}`, locale),
    );
  }

  const [lesson, lessons] = await Promise.all([
    getPublicLesson(lessonId),
    getPublicLessons(),
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
    </>
  );
}
