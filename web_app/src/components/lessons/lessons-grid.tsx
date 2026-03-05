'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { Clock, BookOpen } from 'lucide-react';
import { Lesson } from '@/lib/types';

// ─── Types ───────────────────────────────────────────────

type LangCode = 'en' | 'ar' | 'nl' | 'fr';

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
  return map[lang] ?? lesson.descriptionEn ?? '';
}

// ─── Component ───────────────────────────────────────────

export function LessonsGrid({ lessons }: { lessons: Lesson[] }) {
  const { language, t } = useLanguage();
  const lang = language as LangCode;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {lessons.map((lesson) => {
        const title       = getLessonTitle(lesson, lang);
        const description = getLessonDescription(lesson, lang);

        return (
          <Card key={lesson.id} className="group rounded-2xl border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/20 flex flex-col h-full">
            <CardContent className="p-6 flex flex-col flex-1">

              {/* Badge + icon */}
              <div className="mb-4 flex items-center justify-between">
                <Badge variant="secondary" className="text-sm">
                  {t('lessons.lesson')} {lesson.displayOrder + 1}
                </Badge>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl ring-1 ring-primary/20">
                  <span aria-hidden>{lesson.icon}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="mb-3 line-clamp-2 text-lg font-black text-foreground">
                {title}
              </h3>

              {/* Preview */}
              <p className="mb-4 line-clamp-2 min-h-[3rem] text-base font-medium text-foreground/70">
                {description}
              </p>

              {/* Meta */}
              <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                {lesson.estimatedMinutes > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />~{lesson.estimatedMinutes} min
                  </span>
                )}
                {lesson.estimatedMinutes > 0 && (lesson.totalPages ?? 0) > 0 && (
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                )}
                {(lesson.totalPages ?? 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />{lesson.totalPages} {t('lessons.pages')}
                  </span>
                )}
              </div>

              {/* CTA */}
              <Button className="w-full mt-auto" asChild>
                <Link href={`/lessons/${lesson.lessonCode}`}>
                  {t('lessons.read_lesson')}
                </Link>
              </Button>

            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
