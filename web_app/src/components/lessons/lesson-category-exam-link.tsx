"use client";

import Link from "@/components/localized-link";
import { useLanguage } from "@/contexts/language-context";
import type { HomeLessonCategory } from "@/lib/home-lessons-overview";
import { getLessonCategoryName } from "@/lib/home-lessons-overview";

export function LessonCategoryExamLink({ category }: { category: HomeLessonCategory }) {
  const { language, t } = useLanguage();
  if (!/^TH(?:0[1-9]|10)$/.test(category.categoryCode)) return null;
  const name = getLessonCategoryName(category, language);
  return (
    <Link href={`/exam?category=${category.categoryCode}`}
      aria-label={t("category_exam.start_named", { category: name })}
      className="inline-flex min-h-9 items-center justify-center rounded-full border border-primary/25 bg-primary/5 px-4 py-2 text-center text-sm font-bold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      {t("category_exam.start")}
    </Link>
  );
}
