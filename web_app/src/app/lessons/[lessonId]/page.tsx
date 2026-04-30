'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  PageHeroDescription,
  PageHeroSurface,
  PageHeroTitle,
  PageMetricCard,
  PageSectionSurface,
} from '@/components/ui/page-surface';
import {
  getLessonByCode,
  getAllLessons,
  getLessonProgress,
  markLessonPageRead,
  type LessonProgress,
} from '@/services/lessonService';
import { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type { Lesson, LessonDetail, LessonPage } from '@/lib/types';

type MultiLang = {
  titleEn: string;
  titleAr: string;
  titleNl: string;
  titleFr: string;
};

type MultiLangDescription = {
  descriptionEn: string;
  descriptionAr: string;
  descriptionNl: string;
  descriptionFr: string;
};

function getLangTitle(obj: MultiLang, lang: string): string {
  return ({ ar: obj.titleAr, nl: obj.titleNl, fr: obj.titleFr } as Record<string, string>)[lang] ?? obj.titleEn;
}

function getLangDescription(obj: MultiLangDescription, lang: string): string {
  return ({ ar: obj.descriptionAr, nl: obj.descriptionNl, fr: obj.descriptionFr } as Record<string, string>)[lang] ?? obj.descriptionEn;
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

export default function LessonDetailPage() {
  const params = useParams();
  const lessonIdOrCode = params.lessonId as string;
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const trackedPagesRef = useRef<Set<number>>(new Set());

  const currentUserId = user?.userId ?? null;

  useEffect(() => {
    let cancelled = false;

    const buildTrackedPages = (pagesRead: number) =>
      new Set(Array.from({ length: Math.max(pagesRead, 0) }, (_, index) => index + 1));

    const loadLesson = async () => {
      setLoading(true);
      setError(null);

      try {
        const [detail, list] = await Promise.all([getLessonByCode(lessonIdOrCode), getAllLessons()]);
        const lessonPages = detail.pages?.length ?? 0;
        let progress: LessonProgress | null = null;

        if (currentUserId) {
          try {
            progress = await getLessonProgress(lessonIdOrCode);
          } catch (progressError) {
            logApiError('Failed to load lesson progress', progressError);
          }
        }

        if (!cancelled) {
          setLesson(detail);
          setAllLessons(list);
          setLessonProgress(progress);
          if (progress) {
            const safePagesRead = Math.min(progress.pagesRead ?? 0, lessonPages);
            trackedPagesRef.current = buildTrackedPages(safePagesRead);
            setActivePage(safePagesRead > 0 ? Math.min(safePagesRead - 1, Math.max(lessonPages - 1, 0)) : 0);
          } else {
            trackedPagesRef.current = new Set();
            setActivePage(0);
          }
          setServiceUnavailable(false);
        }
      } catch (err) {
        logApiError('Failed to load lesson', err);
        if (!cancelled) {
          if (isServiceUnavailable(err)) {
            setServiceUnavailable(true);
          } else {
            setError((err as Error)?.message ?? t('common.load_error'));
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadLesson();

    return () => {
      cancelled = true;
    };
  }, [lessonIdOrCode, fetchKey, t, currentUserId]);

  useEffect(() => {
    if (!user || !lesson || lesson.pages.length === 0) {
      return;
    }

    const pageNumber = activePage + 1;
    if (trackedPagesRef.current.has(pageNumber)) {
      return;
    }

    let cancelled = false;

    const persistProgress = async () => {
      try {
        const progress = await markLessonPageRead(
          lesson.lessonCode,
          lesson.pages.length,
          pageNumber,
        );

        if (!cancelled) {
          const trackedPages = new Set<number>();
          for (let index = 1; index <= (progress.pagesRead ?? pageNumber); index += 1) {
            trackedPages.add(index);
          }
          trackedPagesRef.current = trackedPages;
          setLessonProgress(progress);
        }
      } catch (progressError) {
        logApiError('Failed to persist lesson progress', progressError);
      }
    };

    void persistProgress();

    return () => {
      cancelled = true;
    };
  }, [user, lesson, activePage]);

  if (serviceUnavailable) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ServiceUnavailableBanner
          onRetry={() => {
            setServiceUnavailable(false);
            setFetchKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-card shadow-sm">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
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
          <Link href="/lessons">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('lessons.back_to_all')}
          </Link>
        </Button>
      </div>
    );
  }

  const totalLessons = allLessons.length;
  const currentIndex = allLessons.findIndex((item) => item.lessonCode === lesson.lessonCode);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < totalLessons - 1 ? allLessons[currentIndex + 1] : null;
  const currentPage = lesson.pages[activePage];
  const pagesRead = user
    ? Math.min(lessonProgress?.pagesRead ?? 0, lesson.pages.length)
    : Math.min(activePage + 1, lesson.pages.length);
  const readingCompletion = lesson.pages.length > 0 ? Math.round((pagesRead / lesson.pages.length) * 100) : 0;

  const isRtl = language === 'ar';
  const ArrowStart = isRtl ? ArrowRight : ArrowLeft;
  const ArrowEnd = isRtl ? ArrowLeft : ArrowRight;
  const ChevronStart = isRtl ? ChevronRight : ChevronLeft;
  const ChevronEnd = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(223,88,48,0.10),_transparent_34%),linear-gradient(to_bottom,_hsl(var(--muted))_0%,_hsl(var(--background))_22%)]">
      <div className="container mx-auto px-4 py-8 md:py-10">
        <Breadcrumb
          items={[
            { label: t('nav.home'), href: '/' },
            { label: t('nav.lessons'), href: '/lessons' },
            { label: getLangTitle(lesson, language), isCurrentPage: true },
          ]}
        />

        <Button variant="ghost" size="sm" className="mb-5 gap-2 rounded-full" asChild>
          <Link href="/lessons">
            <ArrowStart className="h-4 w-4" />
            {t('lessons.back_to_all')}
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_360px]">
          <div className="space-y-6">
            <PageHeroSurface>
              <div className="px-0 py-0">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/10">
                        {t('lessons.lesson')} {lesson.displayOrder}
                      </Badge>
                      <Badge variant="outline" className="rounded-full border-border/60 bg-background/80 px-3 py-1 text-xs font-semibold">
                        {lesson.pages.length} {t('lessons.pages')}
                      </Badge>
                      <Badge variant="outline" className="rounded-full border-border/60 bg-background/80 px-3 py-1 text-xs font-semibold">
                        {lesson.estimatedMinutes} {t('lessons.minutes_short')}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <PageHeroTitle className="max-w-3xl">
                        {getLangTitle(lesson, language)}
                      </PageHeroTitle>
                      <PageHeroDescription className="max-w-3xl">
                        {getLangDescription(lesson, language)}
                      </PageHeroDescription>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-4 py-2 text-xs font-medium text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      {t('lessons.detail_note')}
                    </div>
                  </div>

                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-[28px] bg-primary/10 text-5xl ring-1 ring-primary/20 shadow-sm">
                    <span aria-hidden>{lesson.icon}</span>
                  </div>
                </div>
              </div>
            </PageHeroSurface>

            {lesson.pages.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {lesson.pages.map((page, index) => (
                  <Button
                    key={page.pageNumber}
                    variant={activePage === index ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActivePage(index)}
                    className={cn(
                      'rounded-full px-4 transition-all',
                      activePage === index && 'shadow-md shadow-primary/20'
                    )}
                  >
                    {page.pageNumber}
                  </Button>
                ))}
              </div>
            )}

            {currentPage && (() => {
              const { title, content, bullets } = getPageContent(currentPage, language);
              const paragraphs = content
                .split(/\n+/)
                .map((item) => item.trim())
                .filter(Boolean);

              return (
                <PageSectionSurface className="overflow-hidden rounded-[30px] border-border/50 bg-card/90 p-0">
                  <div className="border-b border-border/40 bg-gradient-to-br from-primary/8 via-background to-transparent px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                          {t('lessons.page_label')} {currentPage.pageNumber}
                        </div>
                        <h2 className="mt-1 text-xl font-black text-foreground">{title}</h2>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 px-6 py-6">
                    <div className="space-y-4">
                      {paragraphs.map((paragraph, index) => {
                        const isBulletBlock = /^[•\-*]\s/.test(paragraph);
                        if (isBulletBlock) {
                          return (
                            <div key={index} className="rounded-2xl border border-border/50 bg-muted/20 px-5 py-4">
                              <ul className="space-y-2.5">
                                {paragraph
                                  .split(/(?=• )/)
                                  .map((item) => item.replace(/^[•\-*]\s*/, '').trim())
                                  .filter(Boolean)
                                  .map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary/70" />
                                      <span className="text-sm leading-6 text-foreground/90">{item}</span>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          );
                        }

                        return (
                          <p key={index} className="text-[0.98rem] leading-8 text-foreground/85">
                            {paragraph}
                          </p>
                        );
                      })}
                    </div>

                    {bullets.length > 0 && (
                      <div className="rounded-2xl border border-border/50 bg-muted/25 px-5 py-4">
                        <h3 className="mb-3 text-sm font-black text-foreground">{t('lessons.key_takeaways')}</h3>
                        <ul className="space-y-2.5">
                          {bullets.map((bullet) => (
                            <li key={bullet} className="flex items-start gap-3">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                              <span className="text-sm leading-6 text-foreground/90">{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </PageSectionSurface>
              );
            })()}

            {lesson.pages.length > 1 && (
              <PageSectionSurface className="rounded-[26px] border-border/50 bg-card/80 p-4">
                <Button
                  variant="outline"
                  onClick={() => setActivePage((page) => Math.max(0, page - 1))}
                  disabled={activePage === 0}
                  className="rounded-full px-5"
                >
                  <ChevronStart className="h-4 w-4" />
                  {t('lessons.previous_page')}
                </Button>

                <div className="text-sm font-medium text-muted-foreground">
                  {t('lessons.question_progress', { current: activePage + 1, total: lesson.pages.length })}
                </div>

                <Button
                  onClick={() => setActivePage((page) => Math.min(lesson.pages.length - 1, page + 1))}
                  disabled={activePage >= lesson.pages.length - 1}
                  className="rounded-full px-5 shadow-sm shadow-primary/15"
                >
                  {t('lessons.next_page')}
                  <ChevronEnd className="h-4 w-4" />
                </Button>
              </PageSectionSurface>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              {prevLesson ? (
                <Button variant="outline" className="justify-between rounded-[24px] px-5 py-6" asChild>
                  <Link href={`/lessons/${prevLesson.lessonCode}`}>
                    <span className="inline-flex items-center gap-2">
                      <ArrowStart className="h-4 w-4" />
                      {t('lessons.previous')}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {getLangTitle(prevLesson, language)}
                    </span>
                  </Link>
                </Button>
              ) : (
                <div />
              )}

              {nextLesson && (
                <Button className="justify-between rounded-[24px] px-5 py-6 shadow-sm shadow-primary/15" asChild>
                  <Link href={`/lessons/${nextLesson.lessonCode}`}>
                    <span className="truncate text-xs text-primary-foreground/80">
                      {getLangTitle(nextLesson, language)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      {t('lessons.next')}
                      <ArrowEnd className="h-4 w-4" />
                    </span>
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <PageSectionSurface
              className="rounded-[28px] border-border/50 bg-card/90"
              title={t('lessons.your_progress')}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                    <div className="text-sm text-muted-foreground">{t('lessons.lesson_progress')}</div>
                    <div className="mt-1 text-2xl font-black text-foreground">
                      {pagesRead} / {lesson.pages.length}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-primary/10 px-3 py-2 text-sm font-bold text-primary">
                    {readingCompletion}%
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${readingCompletion}%` }}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <PageMetricCard
                    icon={<FileText className="h-4 w-4" />}
                    label={t('lessons.pages')}
                    value={lesson.pages.length}
                  />
                  <PageMetricCard
                    icon={<BookOpen className="h-4 w-4" />}
                    label={t('lessons.lesson')}
                    value={`${lesson.displayOrder} / ${totalLessons || 1}`}
                  />
                </div>
            </PageSectionSurface>

            <PageSectionSurface
              className="rounded-[28px] border-border/50 bg-card/90"
              title={t('lessons.pages_overview')}
            >
                {lesson.pages.map((page, index) => (
                  <button
                    key={page.pageNumber}
                    onClick={() => setActivePage(index)}
                    className={cn(
                      'w-full rounded-2xl px-4 py-3 text-sm transition-all',
                      isRtl ? 'text-right' : 'text-left',
                      activePage === index
                        ? 'bg-primary/10 font-semibold text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-background text-[11px] font-bold text-muted-foreground shadow-sm">
                        {page.pageNumber}
                      </span>
                      <span className="line-clamp-2">{getLangTitle(page, language)}</span>
                    </div>
                  </button>
                ))}
            </PageSectionSurface>

            <div className="grid gap-3">
              <Button className="justify-between rounded-[24px] px-5 py-6 shadow-sm shadow-primary/15" asChild>
                <Link href="/exam">
                  <span>{t('lessons.take_exam')}</span>
                  <ArrowEnd className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="justify-between rounded-[24px] px-5 py-6" asChild>
                <Link href="/traffic-signs">
                  <span>{t('lessons.view_signs')}</span>
                  <BookOpen className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
