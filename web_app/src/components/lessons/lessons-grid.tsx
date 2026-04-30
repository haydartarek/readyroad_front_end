'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';
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
  const isRtl = lang === 'ar';

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {lessons.map((lesson) => {
        const title       = getLessonTitle(lesson, lang);
        const description = getLessonDescription(lesson, lang);

        return (
          <Card
            key={lesson.id}
            className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-border/50 bg-card/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-secondary/50 to-primary/20 opacity-70" />
            <CardContent className="flex flex-1 flex-col p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className="rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-bold text-primary"
                  >
                    {t('lessons.lesson')} {lesson.displayOrder}
                  </Badge>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {(lesson.totalPages ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <BookOpen className="h-3 w-3" />
                        {lesson.totalPages} {t('lessons.pages')}
                      </span>
                    )}
                    {lesson.estimatedMinutes > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <Clock className="h-3 w-3" />
                        {lesson.estimatedMinutes} {t('lessons.minutes_short')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl ring-1 ring-primary/15 transition-transform duration-300 group-hover:scale-105">
                  <span aria-hidden>{lesson.icon}</span>
                </div>
              </div>

              <h3 className="mb-3 line-clamp-2 text-xl font-black tracking-tight text-foreground">
                {title}
              </h3>

              <p className="mb-6 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
                {description}
              </p>

              <div className="mt-auto flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  {t('lessons.card_cta_hint')}
                </div>
                <Button className="rounded-full px-5 shadow-sm shadow-primary/15" asChild>
                  <Link href={`/lessons/${lesson.lessonCode}`} className="inline-flex items-center gap-2">
                    {t('lessons.read_lesson')}
                    <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
