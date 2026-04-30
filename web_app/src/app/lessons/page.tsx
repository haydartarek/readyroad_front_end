'use client';

import { useEffect, useState } from 'react';
import { LessonsGrid } from '@/components/lessons/lessons-grid';
import { getAllLessons, searchLessons } from '@/services/lessonService';
import { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  PageHeroDescription,
  PageHeroTitle,
  PageHeroSurface,
  PageMetricCard,
  PageSectionSurface,
} from '@/components/ui/page-surface';
import {
  AlertTriangle,
  BookOpen,
  FileText,
  Languages,
  MapPinned,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import type { Lesson } from '@/lib/types';

export default function LessonsPage() {
  const { t, isRTL } = useLanguage();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      const query = searchValue.trim();
      const loader = query ? searchLessons(query) : getAllLessons();

      loader
        .then((data) => {
          if (!cancelled) {
            setLessons(data);
          }
        })
        .catch((err) => {
          logApiError('Failed to load lessons', err);
          if (!cancelled) {
            if (isServiceUnavailable(err)) {
              setServiceUnavailable(true);
            } else {
              setError(err?.message ?? t('common.load_error'));
            }
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [fetchKey, searchValue, t]);

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const totalPages = lessons.reduce((sum, lesson) => sum + (lesson.totalPages ?? 0), 0);
  const hasSearch = searchValue.trim().length > 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(223,88,48,0.10),_transparent_35%),linear-gradient(to_bottom,_hsl(var(--muted))_0%,_hsl(var(--background))_22%)]">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Breadcrumb
          items={[
            { label: t('nav.home'), href: '/' },
            { label: t('nav.lessons'), isCurrentPage: true },
          ]}
        />

        <PageHeroSurface>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)] lg:items-start">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {t('lessons.hero_badge')}
              </div>

              <div className="space-y-3">
                <PageHeroTitle className="max-w-3xl">
                  {t('lessons.page_title')}
                </PageHeroTitle>
                <PageHeroDescription className="max-w-3xl">
                  {t('lessons.page_subtitle')}
                </PageHeroDescription>
              </div>

              <div className="flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2">
                  <MapPinned className="h-3.5 w-3.5 text-primary" />
                  {t('lessons.hero_note')}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2">
                  <Languages className="h-3.5 w-3.5 text-primary" />
                  {t('lessons.languages')} 4
                </span>
              </div>
            </div>

            <div className="rounded-[28px] border border-border/50 bg-background/80 p-5 shadow-sm">
              <label htmlFor="lessons-search" className="mb-3 block text-sm font-bold text-foreground">
                {t('lessons.search_label')}
              </label>
              <div className="relative">
                <Search className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${isRTL ? 'right-4' : 'left-4'}`} />
                <Input
                  id="lessons-search"
                  name="lessons-search"
                  type="search"
                  autoComplete="off"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={t('lessons.search_placeholder')}
                  className={`h-12 rounded-2xl border-border/60 bg-card ${isRTL ? 'pr-11 pl-12 text-right' : 'pl-11 pr-12'}`}
                />
                {hasSearch && (
                  <button
                    type="button"
                    onClick={() => setSearchValue('')}
                    className={`absolute top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground ${isRTL ? 'left-3' : 'right-3'}`}
                    aria-label={t('lessons.search_clear')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {t('lessons.search_help')}
              </p>
            </div>
          </div>
        </PageHeroSurface>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <PageMetricCard
            value={lessons.length}
            label={t('lessons.total_lessons')}
            hint={t('lessons.total_lessons_hint')}
            icon={<BookOpen className="h-5 w-5" />}
          />
          <PageMetricCard
            value={4}
            label={t('lessons.languages')}
            hint={t('lessons.languages_hint')}
            icon={<Languages className="h-5 w-5" />}
          />
          <PageMetricCard
            value={totalPages}
            label={t('lessons.total_pages')}
            hint={t('lessons.total_pages_hint')}
            icon={<FileText className="h-5 w-5" />}
          />
        </section>

        <PageSectionSurface
          className="mt-8 rounded-[30px] border-border/50 bg-card/80 p-6"
          title={t('lessons.collection_title')}
          description={t('lessons.results_label', { count: lessons.length })}
          actions={
            hasSearch ? (
              <Button variant="outline" className="rounded-full" onClick={() => setSearchValue('')}>
                {t('lessons.search_clear')}
              </Button>
            ) : null
          }
        >
          {lessons.length > 0 ? (
            <LessonsGrid lessons={lessons} />
          ) : (
            <div className="rounded-[24px] border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-foreground">{t('lessons.empty_title')}</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                {t('lessons.empty_desc')}
              </p>
              {hasSearch && (
                <Button className="mt-5 rounded-full px-5" onClick={() => setSearchValue('')}>
                  {t('lessons.reset_filters')}
                </Button>
              )}
            </div>
          )}
        </PageSectionSurface>
      </div>
    </div>
  );
}
