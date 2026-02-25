'use client';

import { useEffect, useState } from 'react';
import { LessonsGrid } from '@/components/lessons/lessons-grid';
import { getAllLessons } from '@/services/lessonService';
import { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { useLanguage } from '@/contexts/language-context';
import type { Lesson } from '@/lib/types';

export default function LessonsPage() {
  const { t } = useLanguage();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAllLessons()
      .then((data) => { if (!cancelled) setLessons(data); })
      .catch((err) => {
        logApiError('Failed to load lessons', err);
        if (!cancelled) {
          if (isServiceUnavailable(err)) {
            setServiceUnavailable(true);
          } else {
            setError(err?.message ?? 'Failed to load lessons');
          }
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey]);

  if (serviceUnavailable) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ServiceUnavailableBanner onRetry={() => { setServiceUnavailable(false); setFetchKey(k => k + 1); }} className="mb-4" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const totalPages = lessons.reduce((sum, l) => sum + (l.totalPages ?? 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            {t('lessons.page_title')}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t('lessons.page_subtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 text-center">
            <div className="text-3xl font-bold text-primary">{lessons.length}</div>
            <div className="mt-1 text-sm text-muted-foreground">{t('lessons.total_lessons')}</div>
          </div>
          <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6 text-center">
            <div className="text-3xl font-bold text-green-600">4</div>
            <div className="mt-1 text-sm text-muted-foreground">{t('lessons.languages')}</div>
          </div>
          <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{totalPages}</div>
            <div className="mt-1 text-sm text-muted-foreground">{t('lessons.total_pages')}</div>
          </div>
        </div>

        {/* Lessons Grid */}
        <LessonsGrid lessons={lessons} />
      </div>
    </div>
  );
}
