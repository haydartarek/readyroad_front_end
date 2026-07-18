import LessonsClient from "@/app/lessons/lessons-client";
import { getPublicLessons } from "@/lib/server/public-catalog";

export default async function LessonsPage() {
  const lessons = await getPublicLessons();

  return <LessonsClient initialLessons={lessons} />;
}
