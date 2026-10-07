import LessonsClient from "@/app/lessons/lessons-client";
import { getPublicLessons } from "@/lib/server/public-catalog";
import { getHomeLessonsOverview } from "@/lib/server/home-lessons-overview";

export default async function LessonsPage() {
  const [lessons, overview] = await Promise.all([getPublicLessons(), getHomeLessonsOverview()]);

  return <LessonsClient initialLessons={lessons} initialOverview={overview} />;
}
