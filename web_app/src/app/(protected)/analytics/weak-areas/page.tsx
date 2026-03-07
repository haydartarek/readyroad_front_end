'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WeakAreaSummary } from '@/components/analytics/weak-area-summary';
import { WeakAreaDetails } from '@/components/analytics/weak-area-details';
import { getWeakAreas, type WeakAreasData } from '@/services';
import { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { toast } from 'sonner';
import Link from 'next/link';
import { PenLine, BookOpen, Target, RefreshCw, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export default function WeakAreasPage() {
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
          setError('Failed to load weak areas');
          toast.error('Failed to load analytics');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchWeakAreas();
  }, [fetchKey]);

  if (isLoading) return <LoadingSpinner message={t('weak_areas.loading')} />;

  if (serviceUnavailable) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <ServiceUnavailableBanner
          onRetry={() => { setServiceUnavailable(false); setFetchKey(k => k + 1); }}
          className="max-w-md"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="text-6xl">⚠️</div>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => { setError(null); setFetchKey(k => k + 1); }}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t('weak_areas.try_again')}
          </Button>
        </div>
      </div>
    );
  }

  if (!data || !data.weakAreas || data.weakAreas.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-24 h-24 bg-green-500/10 rounded-3xl flex items-center justify-center mx-auto text-5xl">
            💪
          </div>
          <h1 className="text-3xl font-black tracking-tight">{t('weak_areas.no_weak_areas_title')}</h1>
          <p className="text-muted-foreground">
            {t('weak_areas.no_weak_areas_desc')}
          </p>
          <Button
            size="lg"
            asChild
            className="shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform"
          >
            <Link href="/exam">{t('weak_areas.take_exam')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="container mx-auto max-w-6xl px-4 py-12 space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-primary border border-primary/20 shadow-sm">
            <TrendingUp className="w-4 h-4" />
            <span className="font-semibold text-sm">{t('weak_areas.badge')}</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">{t('weak_areas.title')}</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t('weak_areas.subtitle')}
          </p>
        </div>

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
    </div>
  );
}
