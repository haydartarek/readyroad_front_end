"use client";

import Link from "@/components/localized-link";
import { useLanguage } from "@/contexts/language-context";
import type {
  HomeLessonCategory,
  HomeLessonOverviewItem,
} from "@/lib/home-lessons-overview";
import { ArrowRight } from "lucide-react";

type LangCode = "ar" | "en" | "fr" | "nl";

function getLessonTitle(
  lesson: HomeLessonOverviewItem,
  language: LangCode,
): string {
  const titles: Record<LangCode, string> = {
    ar: lesson.titleAr,
    en: lesson.titleEn,
    fr: lesson.titleFr,
    nl: lesson.titleNl,
  };

  return titles[language] || lesson.titleEn || lesson.lessonCode;
}

function getCategoryName(
  category: HomeLessonCategory,
  language: LangCode,
): string {
  const names: Record<LangCode, string> = {
    ar: category.nameAr,
    en: category.nameEn,
    fr: category.nameFr,
    nl: category.nameNl,
  };

  return names[language] || category.nameEn || category.categoryCode;
}

function formatQuestionCount(
  count: number,
  language: LangCode,
): string {
  const safeCount = Math.max(0, Math.trunc(count));

  if (language === "ar") {
    return `${safeCount} سؤال`;
  }

  if (language === "nl") {
    return `${safeCount} ${safeCount === 1 ? "vraag" : "vragen"}`;
  }

  if (language === "fr") {
    return `${safeCount} ${safeCount === 1 ? "question" : "questions"}`;
  }

  return `${safeCount} ${safeCount === 1 ? "question" : "questions"}`;
}

export function HomeLessonsOverview({
  lessons,
}: Readonly<{
  lessons: HomeLessonOverviewItem[];
}>) {
  const { language, t } = useLanguage();
  const lang = language as LangCode;
  const isRtl = lang === "ar";

  if (lessons.length === 0) {
    return null;
  }

  const orderedLessons = [...lessons].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  return (
    <section className="border-b border-border/60 bg-muted/20 py-14 sm:py-16 lg:py-20">
      <div className="rv-container">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
            <h2 className="text-balance text-3xl font-black leading-tight tracking-tight text-secondary sm:text-4xl">
              {t("lessons.page_title")}
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base font-semibold leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {t("lessons.page_subtitle")}
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border/70 bg-background shadow-sm">
            {orderedLessons.map((lesson, index) => {
              const categories = [...lesson.categories].sort(
                (a, b) => a.displayOrder - b.displayOrder,
              );

              return (
                <Link
                  key={lesson.id}
                  href={`/lessons/${lesson.lessonCode}`}
                  className="group grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 gap-y-3 border-b border-border/60 px-4 py-5 transition-colors last:border-b-0 hover:bg-primary/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:grid-cols-[3.5rem_minmax(0,1fr)_auto] sm:items-center sm:px-6"
                >
                  <span className="self-start pt-0.5 text-lg font-black tabular-nums text-primary sm:self-center sm:text-xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="min-w-0">
                    <span className="block text-base font-bold leading-6 text-foreground sm:text-lg">
                      {getLessonTitle(lesson, lang)}
                    </span>

                    {categories.length > 0 ? (
                      <span className="mt-2 flex flex-col gap-1.5 text-sm leading-6 text-muted-foreground">
                        {categories.map((category) => (
                          <span
                            key={category.categoryCode}
                            className="flex flex-wrap items-center gap-x-2"
                          >
                            <span
                              className={
                                category.primary
                                  ? "font-semibold text-foreground/80"
                                  : undefined
                              }
                            >
                              {getCategoryName(category, lang)}
                            </span>

                            <span aria-hidden="true">{"\u00B7"}</span>

                            <bdi className="font-medium text-primary">
                              {formatQuestionCount(
                                category.questionCount,
                                lang,
                              )}
                            </bdi>
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </span>

                  <span className="col-start-2 inline-flex items-center gap-2 text-sm font-bold text-primary sm:col-start-3 sm:row-start-1">
                    {t("lessons.read_lesson")}

                    <ArrowRight
                      className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${
                        isRtl ? "rotate-180 group-hover:-translate-x-0.5" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
