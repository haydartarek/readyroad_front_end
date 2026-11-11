"use client";

import Link from "@/components/localized-link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { Lesson } from "@/lib/types";
import type { HomeLessonOverviewItem } from "@/lib/home-lessons-overview";
import { LessonCategoryExamLink } from "./lesson-category-exam-link";
import {
  LEARNING_CARD_ACCENT_CLASS,
  LEARNING_CARD_CLASS,
  LEARNING_CARD_TITLE_CLASS,
} from "@/components/ui/page-surface";

// ─── Types ───────────────────────────────────────────────

type LangCode = "en" | "ar" | "nl" | "fr";

// ─── Helpers ─────────────────────────────────────────────

function getLessonTitle(lesson: Lesson, lang: LangCode): string {
  const map: Record<LangCode, string> = {
    en: lesson.titleEn,
    ar: lesson.titleAr,
    nl: lesson.titleNl,
    fr: lesson.titleFr,
  };
  return map[lang] ?? lesson.titleEn;
}

function getLessonDescription(lesson: Lesson, lang: LangCode): string {
  const map: Record<LangCode, string> = {
    en: lesson.descriptionEn,
    ar: lesson.descriptionAr,
    nl: lesson.descriptionNl,
    fr: lesson.descriptionFr,
  };
  return map[lang] ?? lesson.descriptionEn ?? "";
}

// ─── Component ───────────────────────────────────────────

export function LessonsGrid({ lessons, theoryOverview = [] }: {
  lessons: Lesson[]; theoryOverview?: HomeLessonOverviewItem[];
}) {
  const { language, t } = useLanguage();
  const lang = language as LangCode;
  const isRtl = lang === "ar";

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {lessons.map((lesson) => {
        const title = getLessonTitle(lesson, lang);
        const description = getLessonDescription(lesson, lang);
        const category = theoryOverview.find((item) => item.id === lesson.id)?.categories
          .find((item) => item.primary);

        return (
          <Card
            key={lesson.id}
            className={LEARNING_CARD_CLASS}
          >
            <div className={LEARNING_CARD_ACCENT_CLASS} />
            <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-bold text-primary"
                  >
                    {t("lessons.lesson")} {lesson.displayOrder}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    {(lesson.totalPages ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                        <BookOpen className="h-3 w-3" />
                        {lesson.totalPages} {t("lessons.pages")}
                      </span>
                    )}
                    {lesson.estimatedMinutes > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                        <Clock className="h-3 w-3" />
                        {lesson.estimatedMinutes} {t("lessons.minutes_short")}
                      </span>
                    )}
                  </div>
                </div>

              </div>

              <h3 className={`${LEARNING_CARD_TITLE_CLASS} mb-2 line-clamp-2`}>
                {title}
              </h3>

              <p className="mb-4 line-clamp-3 min-h-[3.75rem] text-sm leading-5 text-muted-foreground">
                {description}
              </p>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                <Button
                  className="h-9 rounded-full px-4 text-sm shadow-sm shadow-primary/15"
                  asChild
                >
                  <Link
                    href={`/lessons/${lesson.lessonCode}`}
                    className="inline-flex items-center gap-2"
                  >
                    {t("lessons.read_lesson")}
                    <ArrowRight
                      className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`}
                    />
                  </Link>
                </Button>
                {category ? <LessonCategoryExamLink category={category} /> : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
