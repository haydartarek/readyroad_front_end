"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "@/components/localized-link";
import { LessonIcon } from "@/components/lessons/lesson-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  PageHeroDescription,
  PageHeroSurface,
  PageHeroTitle,
  PageMetricCard,
  PageSectionSurface,
} from "@/components/ui/page-surface";
import {
  getLessonByCode,
  getAllLessons,
  getLessonProgress,
  markLessonPageRead,
  type LessonProgress,
} from "@/services/lessonService";
import { isServiceUnavailable, logApiError } from "@/lib/api";
import { ServiceUnavailableBanner } from "@/components/ui/service-unavailable-banner";
import { LoadErrorState } from "@/components/ui/load-error-state";
import { PageLoading } from "@/components/ui/page-loading";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  CheckCircle2,
} from "lucide-react";
import type { Lesson, LessonDetail, LessonPage } from "@/lib/types";

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
  return (
    (
      { ar: obj.titleAr, nl: obj.titleNl, fr: obj.titleFr } as Record<
        string,
        string
      >
    )[lang] ?? obj.titleEn
  );
}

function getLangDescription(obj: MultiLangDescription, lang: string): string {
  return (
    (
      {
        ar: obj.descriptionAr,
        nl: obj.descriptionNl,
        fr: obj.descriptionFr,
      } as Record<string, string>
    )[lang] ?? obj.descriptionEn
  );
}

function getPageContent(page: LessonPage, lang: string) {
  const map: Record<
    string,
    { title: string; content: string; bullets: string[] }
  > = {
    en: {
      title: page.titleEn,
      content: page.contentEn,
      bullets: page.bulletPointsEn ?? [],
    },
    ar: {
      title: page.titleAr,
      content: page.contentAr,
      bullets: page.bulletPointsAr ?? [],
    },
    nl: {
      title: page.titleNl,
      content: page.contentNl,
      bullets: page.bulletPointsNl ?? [],
    },
    fr: {
      title: page.titleFr,
      content: page.contentFr,
      bullets: page.bulletPointsFr ?? [],
    },
  };
  return map[lang] ?? map.en;
}

export default function LessonDetailClient({
  initialLesson,
  initialLessons,
}: Readonly<{
  initialLesson: LessonDetail | null;
  initialLessons: Lesson[];
}>) {
  const params = useParams();
  const lessonIdOrCode = params.lessonId as string;
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [lesson, setLesson] = useState<LessonDetail | null>(initialLesson);
  const [allLessons, setAllLessons] = useState<Lesson[]>(initialLessons);
  const [loading, setLoading] = useState(initialLesson === null);
  const [error, setError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress | null>(
    null,
  );
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const trackedPagesRef = useRef<Set<number>>(new Set());

  const currentUserId = user?.userId ?? null;

  useEffect(() => {
    let cancelled = false;

    const buildTrackedPages = (pagesRead: number) =>
      new Set(
        Array.from({ length: Math.max(pagesRead, 0) }, (_, index) => index + 1),
      );

    const loadLesson = async () => {
      const useInitialData =
        fetchKey === 0 && initialLesson?.lessonCode === lessonIdOrCode;

      if (!useInitialData) {
        setLoading(true);
      }
      setError(null);

      try {
        const [detail, list] = useInitialData
          ? [initialLesson, initialLessons]
          : await Promise.all([
              getLessonByCode(lessonIdOrCode),
              getAllLessons(),
            ]);
        const lessonPages = detail.pages?.length ?? 0;
        let progress: LessonProgress | null = null;

        if (currentUserId) {
          try {
            progress = await getLessonProgress(lessonIdOrCode);
          } catch (progressError) {
            logApiError("Failed to load lesson progress", progressError);
          }
        }

        if (!cancelled) {
          setLesson(detail);
          setAllLessons(list);
          setLessonProgress(progress);
          if (progress) {
            const safePagesRead = Math.min(
              progress.pagesRead ?? 0,
              lessonPages,
            );
            trackedPagesRef.current = buildTrackedPages(safePagesRead);
          } else {
            trackedPagesRef.current = new Set();
          }
          setServiceUnavailable(false);
        }
      } catch (err) {
        logApiError("Failed to load lesson", err);
        if (!cancelled) {
          if (isServiceUnavailable(err)) {
            setServiceUnavailable(true);
          } else {
            setError((err as Error)?.message ?? t("common.load_error"));
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
  }, [
    lessonIdOrCode,
    fetchKey,
    t,
    currentUserId,
    initialLesson,
    initialLessons,
  ]);

  useEffect(() => {
    if (loading || !lesson || !contentRef.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      const section = visible[0]?.target as HTMLElement | undefined;
      if (section) setActivePage(Number(section.dataset.lessonPage) - 1);
    }, { rootMargin: "-80px 0px -50% 0px", threshold: 0 });
    contentRef.current.querySelectorAll("[data-lesson-page]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [lesson, loading]);

  useEffect(() => {
    if (loading || !user || !lesson || lesson.pages.length === 0) {
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
          for (
            let index = 1;
            index <= (progress.pagesRead ?? pageNumber);
            index += 1
          ) {
            trackedPages.add(index);
          }
          trackedPagesRef.current = trackedPages;
          setLessonProgress(progress);
        }
      } catch (progressError) {
        logApiError("Failed to persist lesson progress", progressError);
      }
    };

    void persistProgress();

    return () => {
      cancelled = true;
    };
  }, [user, lesson, activePage, loading]);

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
    return <PageLoading />;
  }

  if (error) {
    return (
      <LoadErrorState
        message={error}
        onRetry={() => {
          setError(null);
          setFetchKey((current) => current + 1);
        }}
        secondaryAction={
          <Button variant="outline" asChild>
            <Link href="/lessons">{t("lessons.back_to_all")}</Link>
          </Button>
        }
      />
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">
          {error ?? t("lessons.not_found")}
        </p>
        <Button variant="outline" asChild>
          <Link href="/lessons">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("lessons.back_to_all")}
          </Link>
        </Button>
      </div>
    );
  }

  const totalLessons = allLessons.length;
  const currentIndex = allLessons.findIndex(
    (item) => item.lessonCode === lesson.lessonCode,
  );
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < totalLessons - 1
      ? allLessons[currentIndex + 1]
      : null;
  const pageHref = (pageNumber: number) => `#section-${pageNumber}`;
  const pagesRead = user
    ? Math.min(lessonProgress?.pagesRead ?? 0, lesson.pages.length)
    : Math.min(activePage + 1, lesson.pages.length);
  const readingCompletion =
    lesson.pages.length > 0
      ? Math.round((pagesRead / lesson.pages.length) * 100)
      : 0;

  const isRtl = language === "ar";
  const ArrowStart = isRtl ? ArrowRight : ArrowLeft;
  const ArrowEnd = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div
      ref={contentRef}
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(223,88,48,0.10),_transparent_34%),linear-gradient(to_bottom,_hsl(var(--muted))_0%,_hsl(var(--background))_22%)]"
    >
      <div className="container mx-auto px-4 py-8 md:py-10">
        <Breadcrumb
          items={[
            { label: t("nav.home"), href: "/" },
            { label: t("nav.lessons"), href: "/lessons" },
            { label: getLangTitle(lesson, language), isCurrentPage: true },
          ]}
        />

        <Button
          variant="ghost"
          size="sm"
          className="mb-5 gap-2 rounded-full"
          asChild
        >
          <Link href="/lessons">
            <ArrowStart className="h-4 w-4" />
            {t("lessons.back_to_all")}
          </Link>
        </Button>

        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.6fr)_360px]">
          <div className="min-w-0 space-y-6">
            <PageHeroSurface>
              <div className="min-w-0 px-0 py-0">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/10">
                        {t("lessons.lesson")} {lesson.displayOrder}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="rounded-full border-border/60 bg-background/80 px-3 py-1 text-xs font-semibold"
                      >
                        {lesson.pages.length} {t("lessons.pages")}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="rounded-full border-border/60 bg-background/80 px-3 py-1 text-xs font-semibold"
                      >
                        {lesson.estimatedMinutes} {t("lessons.minutes_short")}
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
                  </div>

                  <LessonIcon icon={lesson.icon} />
                </div>
              </div>
            </PageHeroSurface>

            {[...lesson.pages].sort((a, b) => a.pageNumber - b.pageNumber).map((currentPage) => {
                const { title, content, bullets } = getPageContent(
                  currentPage,
                  language,
                );
                const paragraphs = content
                  .split(/\n+/)
                  .map((item) => item.trim())
                  .filter(Boolean);

                return (
                  <section key={currentPage.pageNumber} id={`section-${currentPage.pageNumber}`}
                    data-lesson-page={currentPage.pageNumber} className="scroll-mt-24">
                  <PageSectionSurface className="p-0">
                    <div className="border-b border-border/40 bg-primary/[0.035] px-4 py-5 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                            {t("lessons.page_label")} {currentPage.pageNumber}
                          </div>
                          <h2 className="mt-1 break-words text-xl font-black text-foreground">
                            {title}
                          </h2>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 space-y-6 px-4 py-5 sm:px-6 sm:py-6">
                      <div className="space-y-4">
                        {paragraphs.map((paragraph, index) => {
                          const isBulletBlock = /^[•\-*]\s/.test(paragraph);
                          if (isBulletBlock) {
                            return (
                              <div
                                key={index}
                                className="rounded-2xl border border-border/50 bg-muted/20 px-5 py-4"
                              >
                                <ul className="space-y-2.5">
                                  {paragraph
                                    .split(/(?=• )/)
                                    .map((item) =>
                                      item.replace(/^[•\-*]\s*/, "").trim(),
                                    )
                                    .filter(Boolean)
                                    .map((item) => (
                                      <li
                                        key={item}
                                        className="flex items-start gap-3"
                                      >
                                        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary/70" />
                                        <span className="min-w-0 break-words text-sm leading-6 text-foreground/90">
                                          {item}
                                        </span>
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            );
                          }

                          return (
                            <p
                              key={index}
                              className="break-words text-[0.98rem] leading-8 text-foreground/85"
                            >
                              {paragraph}
                            </p>
                          );
                        })}
                      </div>

                      {bullets.length > 0 && (
                        <div className="rounded-2xl border border-border/50 bg-muted/25 px-5 py-4">
                          <h3 className="mb-3 text-sm font-black text-foreground">
                            {t("lessons.key_takeaways")}
                          </h3>
                          <ul className="space-y-2.5">
                            {bullets.map((bullet) => (
                              <li
                                key={bullet}
                                className="flex items-start gap-3"
                              >
                                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                                <span className="min-w-0 break-words text-sm leading-6 text-foreground/90">
                                  {bullet}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </PageSectionSurface>
                  </section>
                );
              })}

            <div className="grid gap-3 md:grid-cols-2">
              {prevLesson ? (
                <Button
                  variant="outline"
                  className="w-full min-w-0 justify-between rounded-2xl px-4 py-6 sm:px-5"
                  asChild
                >
                  <Link href={`/lessons/${prevLesson.lessonCode}`}>
                    <span className="inline-flex shrink-0 items-center gap-2">
                      <ArrowStart className="h-4 w-4" />
                      {t("lessons.previous")}
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
                <Button
                  className="w-full min-w-0 justify-between rounded-2xl px-4 py-6 shadow-sm shadow-primary/15 sm:px-5"
                  asChild
                >
                  <Link href={`/lessons/${nextLesson.lessonCode}`}>
                    <span className="truncate text-xs text-primary-foreground">
                      {getLangTitle(nextLesson, language)}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-2">
                      {t("lessons.next")}
                      <ArrowEnd className="h-4 w-4" />
                    </span>
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <PageSectionSurface title={t("lessons.your_progress")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">
                    {t("lessons.lesson_progress")}
                  </div>
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
                  label={t("lessons.pages")}
                  value={lesson.pages.length}
                />
                <PageMetricCard
                  icon={<BookOpen className="h-4 w-4" />}
                  label={t("lessons.lesson")}
                  value={`${lesson.displayOrder} / ${totalLessons || 1}`}
                />
              </div>
            </PageSectionSurface>

            <PageSectionSurface title={t("lessons.pages_overview")}>
              {lesson.pages.map((page, index) => (
                <a
                  key={page.pageNumber}
                  href={pageHref(page.pageNumber)}
                  className={cn(
                    "w-full rounded-2xl px-4 py-3 text-sm transition-all",
                    isRtl ? "text-right" : "text-left",
                    activePage === index
                      ? "bg-muted/70 font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-background text-[11px] font-bold text-muted-foreground shadow-sm">
                      {page.pageNumber}
                    </span>
                    <span className="line-clamp-2">
                      {getLangTitle(page, language)}
                    </span>
                  </div>
                </a>
              ))}
            </PageSectionSurface>

            <div className="grid gap-3">
              <Button
                className="justify-between px-5 py-6 shadow-sm shadow-primary/15"
                asChild
              >
                <Link href="/exam">
                  <span>{t("lessons.take_exam")}</span>
                  <ArrowEnd className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="justify-between px-5 py-6"
                asChild
              >
                <Link href="/traffic-signs">
                  <span>{t("lessons.view_signs")}</span>
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
