import { getRequestLocale } from "@/lib/server/request-locale";
import { notFound, permanentRedirect } from "next/navigation";
import { getPublicLesson } from "@/lib/server/public-catalog";
import { localizePathname } from "@/lib/i18n-routing";

export default async function LessonPage({
  params,
}: Readonly<{ params: Promise<{ lessonId: string; pageNumber: string }> }>) {
  const { lessonId, pageNumber: rawPageNumber } = await params;
  const pageNumber = Number(rawPageNumber);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) notFound();
  const lesson = await getPublicLesson(lessonId);
  if (!lesson) notFound();
  const locale = await getRequestLocale();
  permanentRedirect(localizePathname(`/lessons/${encodeURIComponent(lesson.lessonCode)}`, locale));
}
