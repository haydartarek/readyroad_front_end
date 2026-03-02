'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getLessonByCode, getAllLessons } from '@/services/lessonService';
import { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight,
  Clock, BookOpen, RefreshCw,
} from 'lucide-react';
import type { Lesson, LessonDetail, LessonPage } from '@/lib/types';

// ─── Helpers ────────────────────────────────────────────

type MultiLang = { titleEn: string; titleAr: string; titleNl: string; titleFr: string };

function getLangTitle(obj: MultiLang, lang: string): string {
  return ({ ar: obj.titleAr, nl: obj.titleNl, fr: obj.titleFr } as Record<string, string>)[lang] ?? obj.titleEn;
}

function getPageContent(page: LessonPage, lang: string) {
  const map: Record<string, { title: string; content: string; bullets: string[] }> = {
    en: { title: page.titleEn, content: page.contentEn, bullets: page.bulletPointsEn ?? [] },
    ar: { title: page.titleAr, content: page.contentAr, bullets: page.bulletPointsAr ?? [] },
    nl: { title: page.titleNl, content: page.contentNl, bullets: page.bulletPointsNl ?? [] },
    fr: { title: page.titleFr, content: page.contentFr, bullets: page.bulletPointsFr ?? [] },
  };
  return map[lang] ?? map.en;
}

// ─── Page ───────────────────────────────────────────────

export default function LessonDetailPage() {
  const params         = useParams();
  const lessonIdOrCode = params.lessonId as string;
  const { t, language } = useLanguage();

  const [lesson, setLesson]         = useState<LessonDetail | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey]     = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true); setError(null);

    Promise.all([getLessonByCode(lessonIdOrCode), getAllLessons()])
      .then(([detail, list]) => {
        if (!cancelled) { setLesson(detail); setAllLessons(list); setActivePage(0); }
      })
      .catch(err => {
        logApiError('Failed to load lesson', err);
        if (!cancelled) {
          if (isServiceUnavailable(err)) setServiceUnavailable(true);
          else setError(err?.message ?? 'Failed to load lesson');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [lessonIdOrCode, fetchKey]);

  // ── States ──
  if (serviceUnavailable) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ServiceUnavailableBanner
          onRetry={() => { setServiceUnavailable(false); setFetchKey(k => k + 1); }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">{error ?? t('lessons.not_found')}</p>
        <Button variant="outline" asChild>
          <Link href="/lessons"><ArrowLeft className="w-4 h-4 mr-2" />{t('lessons.back_to_all')}</Link>
        </Button>
      </div>
    );
  }

  // ── Navigation ──
  const total      = allLessons.length;
  const currentIdx = allLessons.findIndex(l => l.lessonCode === lesson.lessonCode);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx >= 0 && currentIdx < total - 1 ? allLessons[currentIdx + 1] : null;
  const currentPage = lesson.pages[activePage];
  const progress   = total > 0 ? Math.round((lesson.displayOrder / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
      <div className="container mx-auto px-4 py-10">

        {/* Back */}
        <Button variant="ghost" size="sm" className="mb-6 gap-2" asChild>
          <Link href="/lessons"><ArrowLeft className="w-4 h-4" />{t('lessons.back_to_all')}</Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">

          {/* ── Main ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Lesson header */}
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-3xl">{lesson.icon}</span>
                  <Badge>{t('lessons.lesson')} {lesson.displayOrder}</Badge>
                  {lesson.estimatedMinutes > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="w-3 h-3" />~{lesson.estimatedMinutes} min
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1">
                    <BookOpen className="w-3 h-3" />{lesson.pages.length} {t('lessons.pages')}
                  </Badge>
                </div>
                <CardTitle className="text-2xl md:text-3xl font-black">
                  {getLangTitle(lesson, language)}
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Page selector */}
            {lesson.pages.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {lesson.pages.map((page, idx) => (
                  <Button
                    key={page.pageNumber}
                    variant={activePage === idx ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActivePage(idx)}
                    className={cn(
                      'rounded-xl transition-all',
                      activePage === idx && 'shadow-md shadow-primary/20'
                    )}
                  >
                    {page.pageNumber}
                  </Button>
                ))}
              </div>
            )}

            {/* Page content */}
            {currentPage && (
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-black">
                    {getLangTitle(currentPage, language)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={language} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 rounded-xl">
                      <TabsTrigger value="en">EN</TabsTrigger>
                      <TabsTrigger value="ar">AR</TabsTrigger>
                      <TabsTrigger value="nl">NL</TabsTrigger>
                      <TabsTrigger value="fr">FR</TabsTrigger>
                    </TabsList>
                    {(['en', 'ar', 'nl', 'fr'] as const).map(lang => {
                      const { title, content, bullets } = getPageContent(currentPage, lang);
                      return (
                        <TabsContent
                          key={lang} value={lang}
                          dir={lang === 'ar' ? 'rtl' : 'ltr'}
                          className="space-y-4 mt-4"
                        >
                          <h2 className="text-base font-black text-foreground">{title}</h2>
                          <div className="whitespace-pre-line text-foreground leading-relaxed">
                            {content}
                          </div>
                          {bullets.length > 0 && (
                            <ul className="mt-4 space-y-2">
                              {bullets.map((bullet, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                                  <span className="text-sm text-foreground">{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Within-lesson page nav */}
            {lesson.pages.length > 1 && (
              <div className="flex justify-between gap-4">
                {activePage > 0 ? (
                  <Button variant="outline" onClick={() => setActivePage(activePage - 1)} className="gap-2 rounded-xl">
                    <ChevronLeft className="w-4 h-4" />{t('lessons.previous_page')}
                  </Button>
                ) : <div />}
                {activePage < lesson.pages.length - 1 ? (
                  <Button onClick={() => setActivePage(activePage + 1)} className="gap-2 rounded-xl">
                    {t('lessons.next_page')}<ChevronRight className="w-4 h-4" />
                  </Button>
                ) : <div />}
              </div>
            )}

            {/* Lesson nav */}
            <div className="flex justify-between gap-4">
              {prevLesson ? (
                <Button variant="outline" className="flex-1 gap-2 rounded-xl" asChild>
                  <Link href={`/lessons/${prevLesson.lessonCode}`}>
                    <ArrowLeft className="w-4 h-4" />{t('lessons.previous')}
                  </Link>
                </Button>
              ) : <div className="flex-1" />}
              {nextLesson ? (
                <Button className="flex-1 gap-2 rounded-xl shadow-md shadow-primary/20" asChild>
                  <Link href={`/lessons/${nextLesson.lessonCode}`}>
                    {t('lessons.next')}<ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              ) : <div className="flex-1" />}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">

            {/* Progress */}
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-black">{t('lessons.your_progress')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">{t('lessons.lesson_progress')}</span>
                  <span className="font-bold">{lesson.displayOrder} / {total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">{progress}%</span> {t('lessons.complete')}
                </p>
              </CardContent>
            </Card>

            {/* Pages overview */}
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-black">{t('lessons.pages_overview')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {lesson.pages.map((page, idx) => (
                    <button
                      key={page.pageNumber}
                      onClick={() => setActivePage(idx)}
                      className={cn(
                        'w-full text-left rounded-xl px-3 py-2 text-sm transition-all',
                        activePage === idx
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <span className="font-mono text-xs mr-2 opacity-60">{page.pageNumber}.</span>
                      {getLangTitle(page, language)}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button className="w-full rounded-xl" variant="outline" asChild>
                <Link href="/exam">{t('lessons.take_exam')}</Link>
              </Button>
              <Button className="w-full rounded-xl" variant="outline" asChild>
                <Link href="/traffic-signs">{t('lessons.view_signs')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
