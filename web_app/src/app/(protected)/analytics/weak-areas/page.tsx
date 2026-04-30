'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WeakAreaSummary } from '@/components/analytics/weak-area-summary';
import { WeakAreaDetails } from '@/components/analytics/weak-area-details';
import { getWeakAreas, type WeakAreasData } from '@/services';
import { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import {
  PageHeroDescription,
  PageHeroEyebrow,
  PageHeroSurface,
  PageHeroTitle,
} from '@/components/ui/page-surface';
import { toast } from 'sonner';
import Link from 'next/link';
import { PenLine, BookOpen, Target, RefreshCw, Trophy, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

export function WeakAreasPageContent() {
  const { t } = useLanguage();
  const [data, setData] = useState<WeakAreasData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    const fetchWeakAreas = async () => {
      try {
        setIsLoading(true);
        const weakAreasData = await getWeakAreas();
        setData(weakAreasData);
        setError(null);
      } catch (err) {
        logApiError('Failed to fetch weak areas', err);
        if (isServiceUnavailable(err)) {
          setServiceUnavailable(true);
        } else {
          setError(t('common.load_error'));
          toast.error(t('common.load_error'));
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchWeakAreas();
  }, [fetchKey, t]);

  // ── Loading ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">{t('weak_areas.loading')}</p>
      </div>
    );
  }

  // ── Service unavailable ──────────────────────────
  if (serviceUnavailable) {
    return (
      <div className="flex justify-center py-24">
        <ServiceUnavailableBanner
          onRetry={() => { setServiceUnavailable(false); setFetchKey(k => k + 1); }}
          className="max-w-md"
        />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 max-w-md mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-destructive" />
        </div>
        <Alert variant="destructive" className="text-left">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => { setError(null); setFetchKey(k => k + 1); }}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  // ── Shared page header ───────────────────────────
  const pageHeader = (
    <PageHeroSurface>
      <div className="space-y-1">
        <PageHeroEyebrow>{t('weak_areas.badge')}</PageHeroEyebrow>
        <PageHeroTitle>{t('weak_areas.title')}</PageHeroTitle>
        <PageHeroDescription className="max-w-xl">
          {t('weak_areas.subtitle')}
        </PageHeroDescription>
      </div>
    </PageHeroSurface>
  );

  // ── Empty state ──────────────────────────────────
  if (!data || !data.weakAreas || data.weakAreas.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 py-4">
        {pageHeader}

        {/* Success card */}
        <Card className="rounded-3xl border-2 border-green-200 dark:border-green-900/40 bg-gradient-to-br from-green-50/80 to-emerald-50/40 dark:from-green-950/20 dark:to-emerald-950/10 shadow-sm overflow-hidden">
          <CardContent className="pt-12 pb-10 flex flex-col items-center text-center space-y-6">

            {/* Icon */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-sm border-2 border-background">
                <span className="text-white text-xs font-black leading-none">✓</span>
              </div>
            </div>

            {/* Text */}
            <div className="space-y-2 max-w-sm">
              <h2 className="text-3xl font-black tracking-tight">
                {t('weak_areas.no_weak_areas_title')}
              </h2>
              <p className="text-muted-foreground">
                {t('weak_areas.no_weak_areas_desc')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center pt-1">
              <Button
                size="lg"
                asChild
                className="gap-2 rounded-xl shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform"
              >
                <Link href="/exam">
                  <Target className="w-4 h-4" />
                  {t('weak_areas.take_exam')}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-2 rounded-xl">
                <Link href="/practice">
                  <PenLine className="w-4 h-4" />
                  {t('weak_areas.practice_mode')}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-2 rounded-xl">
                <Link href="/lessons">
                  <BookOpen className="w-4 h-4" />
                  {t('weak_areas.study_lessons')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Data state ───────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">

      {pageHeader}

      {/* Summary Cards */}
      <WeakAreaSummary
        weakAreas={data.weakAreas}
        totalCategories={data.totalCategories}
        overallAccuracy={data.overallAccuracy}
      />

      {/* Info Alert */}
      <Alert className="border border-primary/20 bg-primary/5">
        <AlertDescription className="space-y-1">
          <p className="font-semibold text-foreground">🎯 {t('weak_areas.strategy_title')}</p>
          <p className="text-sm text-muted-foreground">
            {t('weak_areas.strategy_desc')}
          </p>
        </AlertDescription>
      </Alert>

      {/* Weak Areas Details */}
      <WeakAreaDetails weakAreas={data.weakAreas} />

      {/* Actions Card */}
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              🚀
            </div>
            <div>
              <CardTitle className="text-xl font-black">{t('weak_areas.start_improving_title')}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t('weak_areas.start_improving_desc')}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button asChild className="gap-2 rounded-xl shadow-sm shadow-primary/20">
              <Link href="/practice">
                <PenLine className="w-4 h-4" />
                {t('weak_areas.practice_mode')}
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2 rounded-xl">
              <Link href="/lessons">
                <BookOpen className="w-4 h-4" />
                {t('weak_areas.study_lessons')}
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2 rounded-xl">
              <Link href="/exam">
                <Target className="w-4 h-4" />
                {t('weak_areas.take_full_exam')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

export default function WeakAreasPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard?section=weak-areas');
  }, [router]);

  return null;
}
