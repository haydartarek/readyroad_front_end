'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, isServiceUnavailable, logApiError } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { getAllSignProgress, type SignUserProgress } from '@/services';
import type { TrafficSign } from '@/lib/types';
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, RefreshCw, Trophy } from 'lucide-react';

interface CategoryDTO {
  id: number;
  code: string;
  nameEn: string;
  nameAr: string;
  nameNl: string;
  nameFr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  descriptionNl?: string;
  descriptionFr?: string;
}

interface CategoryCardData extends CategoryDTO {
  signCount: number;
  practiceCompleted: number;
  exam1Passed: number;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  A: '⚠️',
  B: '⚡',
  C: '⛔',
  D: '➡️',
  E: '🅿️',
  F: 'ℹ️',
  G: '➕',
  M: '🚲',
  T: '🛣️',
  Z: '🗺️',
};

function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🚦</div>
        </div>
        <p className="text-base text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

export default function PracticePage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { isAuthenticated } = useAuth();

  const [categories, setCategories] = useState<CategoryCardData[]>([]);
  const [totalSigns, setTotalSigns] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const requestIdRef = useRef(0);

  const fetchData = async () => {
    const requestId = ++requestIdRef.current;

    try {
      setIsLoading(true);
      setError(null);

      const [catResp, progressList] = await Promise.all([
        apiClient.get<CategoryDTO[]>(API_ENDPOINTS.CATEGORIES.LIST),
        isAuthenticated ? getAllSignProgress() : Promise.resolve<SignUserProgress[]>([]),
      ]);

      if (requestId !== requestIdRef.current) return;

      const progressMap = new Map(
        progressList.map((item) => [item.routeCode ?? item.signCode, item]),
      );

      const categoryCards = await Promise.all(
        catResp.data.map(async (cat) => {
          const signsResp = await apiClient.get<TrafficSign[]>(
            API_ENDPOINTS.TRAFFIC_SIGNS.BY_CATEGORY(cat.id),
          );
          const signs = signsResp.data;

          let practiceCompleted = 0;
          let exam1Passed = 0;

          signs.forEach((sign) => {
            const progressKey = sign.routeCode ?? sign.signCode;
            const signProgress = progressMap.get(progressKey);
            if (signProgress?.practiceCompleted) practiceCompleted += 1;
            if (signProgress?.exam1Passed) exam1Passed += 1;
          });

          return {
            ...cat,
            signCount: signs.length,
            practiceCompleted,
            exam1Passed,
          };
        }),
      );

      if (requestId !== requestIdRef.current) return;

      const filteredCards = categoryCards.filter((cat) => cat.signCount > 0);
      setCategories(filteredCards);
      setTotalSigns(filteredCards.reduce((sum, cat) => sum + cat.signCount, 0));
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      logApiError('Failed to load sign practice hub', err);
      if (isServiceUnavailable(err)) {
        setServiceUnavailable(true);
      } else {
        setError(t('practice.load_error'));
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      requestIdRef.current += 1;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, language]);

  const getCategoryName = (cat: CategoryDTO): string => {
    const map: Record<string, string> = {
      en: cat.nameEn,
      ar: cat.nameAr,
      nl: cat.nameNl,
      fr: cat.nameFr,
    };
    return map[language] || cat.nameEn;
  };

  const getCategoryDescription = (cat: CategoryDTO): string => {
    const map: Record<string, string | undefined> = {
      en: cat.descriptionEn,
      ar: cat.descriptionAr,
      nl: cat.descriptionNl,
      fr: cat.descriptionFr,
    };
    return map[language] || cat.descriptionEn || '';
  };

  if (isLoading) return <LoadingSpinner message={t('practice.loading')} />;

  const isRtl = language === 'ar';
  const ChevDir = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background"
    >
      <div className="container mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-primary border border-primary/20 shadow-sm">
            <BookOpen className="w-4 h-4" />
            <span className="font-semibold text-sm">{t('practice.mode_badge')}</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">{t('practice.title')}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
            {t('practice.hub.subtitle')}
          </p>
        </div>

        {serviceUnavailable && (
          <ServiceUnavailableBanner
            onRetry={() => {
              setServiceUnavailable(false);
              setError(null);
              fetchData();
            }}
          />
        )}

        {error && (
          <Alert variant="destructive" className="animate-in fade-in-50 duration-300">
            <AlertDescription className="flex items-center justify-between">
              <span>⚠️ {error}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchData}
                className={`gap-1 ${isRtl ? 'mr-4' : 'ml-4'}`}
              >
                <RefreshCw className="w-3 h-3" /> {t('practice.retry')}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15 px-6 py-7 shadow-sm">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black text-foreground">
                  {t('traffic_signs.category_all_signs')}
                </h2>
              </div>
              <p className="text-muted-foreground text-sm font-medium max-w-2xl">
                {t('practice.hub.all_signs_desc')}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                  {t('practice.signs.count', { count: totalSigns })}
                </Badge>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 border-0">
                  {t('practice.hub.per_sign_questions')}
                </Badge>
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-0">
                  {t('practice.hub.three_levels')}
                </Badge>
              </div>
            </div>
            <Button
              onClick={() => router.push('/traffic-signs')}
              className="font-bold flex-shrink-0 gap-2 hover:scale-[1.02] transition-all duration-200"
              size="lg"
            >
              <BookOpen className="w-4 h-4" />
              {t('practice.hub.browse_all')}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black tracking-tight">{t('practice.by_category')}</h2>

          {categories.length === 0 ? (
            <Card className="border border-border/50 shadow-sm bg-card/80">
              <CardContent className="py-14 text-center space-y-3">
                <div className="text-5xl">🔍</div>
                <p className="text-muted-foreground font-medium">{t('practice.signs.none')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {categories.map((cat) => {
                const practicePct = cat.signCount > 0
                  ? Math.round((cat.practiceCompleted / cat.signCount) * 100)
                  : 0;
                const emoji = CATEGORY_EMOJIS[cat.code] ?? '🚦';

                return (
                  <Card
                    key={cat.code}
                    className="group cursor-pointer border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 bg-card/80"
                    onClick={() => router.push(`/practice/${cat.code}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                            {emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-black leading-tight">
                              {getCategoryName(cat)}
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs line-clamp-2 font-medium">
                              {getCategoryDescription(cat) || t('practice.hub.all_signs_desc')}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-xs font-semibold border-0 bg-primary/10 text-primary"
                        >
                          {t('practice.signs.count', { count: cat.signCount })}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-4">
                      {isAuthenticated && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2">
                            <div className="flex items-center gap-2 text-emerald-700">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-xs font-semibold">{t('practice.hub.completed')}</span>
                            </div>
                            <p className="mt-1 text-lg font-black text-emerald-800">
                              {cat.practiceCompleted}
                            </p>
                          </div>
                          <div className="rounded-xl border border-amber-200/70 bg-amber-50/70 px-3 py-2">
                            <div className="flex items-center gap-2 text-amber-700">
                              <Trophy className="w-4 h-4" />
                              <span className="text-xs font-semibold">{t('practice.hub.passed_exam1')}</span>
                            </div>
                            <p className="mt-1 text-lg font-black text-amber-800">
                              {cat.exam1Passed}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/60 transition-all duration-500"
                            style={{ width: `${practicePct}%` }}
                          />
                        </div>
                        <span className="text-xs text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all whitespace-nowrap">
                          {t('practice.start_practice')}
                          <ChevDir className="w-3 h-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
