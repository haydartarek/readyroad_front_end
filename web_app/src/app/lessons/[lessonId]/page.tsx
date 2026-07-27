import LessonDetailClient from "@/app/lessons/[lessonId]/lesson-detail-client";
import {
  getPublicLesson,
  getPublicLessons,
} from "@/lib/server/public-catalog";
import LessonStructuredData from "@/app/lessons/[lessonId]/lesson-structured-data";

type LessonDetailPageProps = Readonly<{
  params: Promise<{ lessonId: string }>;
}>;

export default async function LessonDetailPage({
  params,
}: LessonDetailPageProps) {
  const { lessonId } = await params;
  const [lesson, lessons] = await Promise.all([
    getPublicLesson(lessonId),
    getPublicLessons(),
  ]);

  return (
    <>
      {lesson && <LessonStructuredData lesson={lesson} />}
      <LessonDetailClient
        initialLesson={lesson}
        initialLessons={lessons}
        initialPageNumber={1}
      />
    </>
  );
}
