'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
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
        const preview     = description.length > 150
          ? `${description.substring(0, 150)}…`
          : description;

        return (
          <Card key={lesson.id} className="group transition-all hover:shadow-lg">
            <CardContent className="p-6">

              {/* Badge + icon */}
              <div className="mb-4 flex items-center justify-between">
                <Badge variant="secondary" className="text-sm">
                  {t('lessons.lesson')} {lesson.displayOrder}
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
              <p className="mb-4 line-clamp-3 text-base font-medium text-foreground/70">
                {preview}
              </p>

              {/* Meta */}
              <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
                {lesson.estimatedMinutes > 0 && (
                  <span>~{lesson.estimatedMinutes} min</span>
                )}
                {(lesson.totalPages ?? 0) > 0 && (
                  <span>{lesson.totalPages} {t('lessons.pages')}</span>
                )}
              </div>

              {/* CTA */}
              <Button className="w-full" asChild>
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
