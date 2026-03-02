'use client';

import { useEffect, useState } from 'react';
import { LessonsGrid } from '@/components/lessons/lessons-grid';
import { getAllLessons } from '@/services/lessonService';
import { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { useLanguage } from '@/contexts/language-context';
import { RefreshCw, BookOpen, Languages, FileText, AlertTriangle } from 'lucide-react';
import type { Lesson } from '@/lib/types';

// ─── Stat Card ──────────────────────────────────────────

function StatCard({ value, label, icon, colorClass }: {
  value: number; label: string;
  icon: React.ReactNode; colorClass: string;
}) {
  return (
    <div className={`rounded-2xl border-2 p-6 text-center ${colorClass}`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-3xl font-black">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────

export default function LessonsPage() {
  const { t } = useLanguage();

  const [lessons, setLessons]   = useState<Lesson[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getAllLessons()
      .then(data  => { if (!cancelled) setLessons(data); })
      .catch(err  => {
        logApiError('Failed to load lessons', err);
        if (!cancelled) {
          if (isServiceUnavailable(err)) setServiceUnavailable(true);
          else setError(err?.message ?? 'Failed to load lessons');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetchKey]);

  // ── Service unavailable ──
  if (serviceUnavailable) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ServiceUnavailableBanner
          onRetry={() => { setServiceUnavailable(false); setFetchKey(k => k + 1); }}
        />
      </div>
    );
  }

  // ── Loading ──
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

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const totalPages = lessons.reduce((sum, l) => sum + (l.totalPages ?? 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
      <div className="container mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-12 text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            {t('lessons.page_title')}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t('lessons.page_subtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-12 grid gap-6 sm:grid-cols-3">
          <StatCard
            value={lessons.length}
            label={t('lessons.total_lessons')}
            icon={<BookOpen className="w-6 h-6 text-primary" />}
            colorClass="border-primary/20 bg-primary/5 text-primary"
          />
          <StatCard
            value={4}
            label={t('lessons.languages')}
            icon={<Languages className="w-6 h-6 text-emerald-600" />}
            colorClass="border-emerald-200 bg-emerald-50 text-emerald-600"
          />
          <StatCard
            value={totalPages}
            label={t('lessons.total_pages')}
            icon={<FileText className="w-6 h-6 text-blue-600" />}
            colorClass="border-blue-200 bg-blue-50 text-blue-600"
          />
        </div>

        {/* Lessons Grid */}
        <LessonsGrid lessons={lessons} />
      </div>
    </div>
  );
}
