'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PageHeroDescription,
  PageHeroSurface,
  PageHeroTitle,
  PageSectionSurface,
} from '@/components/ui/page-surface';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import { apiClient, isServiceUnavailable, logApiError } from '@/lib/api';
import { getCategoryVisual } from '@/lib/category-visuals';
import { API_ENDPOINTS } from '@/lib/constants';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { getAllSignProgress, type SignUserProgress } from '@/services';
import { getGroupInfo, getTrafficSignGroup, TRAFFIC_SIGN_GROUP_ORDER } from '@/lib/traffic-sign-presentation';
import type { TrafficSign } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Languages,
  RefreshCw,
  Shapes,
  Shuffle,
  Trophy,
} from 'lucide-react';

type Lang = 'en' | 'ar' | 'nl' | 'fr';

interface CategoryCardData {
  code: string;
  title: string;
  description: string;
  signCount: number;
  practiceCompleted: number;
  passedSigns: number;
}

function LoadingSpinner({ message }: { message?: string }) {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🚦</div>
        </div>
        <p className="text-base text-muted-foreground font-medium">
          {message ?? t('common.loading')}
        </p>
      </div>
    </div>
  );
}

export default function PracticePage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const lang = (['en', 'ar', 'nl', 'fr'] as Lang[]).includes(language as Lang)
    ? (language as Lang)
    : 'en';

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

      const [signsResp, progressList] = await Promise.all([
        apiClient.get<TrafficSign[]>(API_ENDPOINTS.TRAFFIC_SIGNS.LIST),
        isAuthenticated ? getAllSignProgress() : Promise.resolve<SignUserProgress[]>([]),
      ]);

      if (requestId !== requestIdRef.current) return;

      const allSigns = Array.isArray(signsResp.data) ? signsResp.data : [];
      const progressMap = new Map(
        progressList.map((item) => [item.routeCode ?? item.signCode, item]),
      );

      const groupedSigns = new Map<string, TrafficSign[]>();
      allSigns.forEach((sign) => {
        const group = getTrafficSignGroup(sign);
        const current = groupedSigns.get(group) ?? [];
        current.push(sign);
        groupedSigns.set(group, current);
      });

      const categoryCards: CategoryCardData[] = TRAFFIC_SIGN_GROUP_ORDER
        .map((group) => {
          const signs = groupedSigns.get(group) ?? [];
          if (signs.length === 0) {
            return null;
          }

          let practiceCompleted = 0;
          let passedSigns = 0;

          signs.forEach((sign) => {
            const progressKey = sign.routeCode ?? sign.signCode;
            const signProgress = progressMap.get(progressKey);
            if (signProgress?.practiceCompleted) practiceCompleted += 1;
            if (signProgress?.exam1Passed) passedSigns += 1;
          });

          const info = getGroupInfo(group).info;
          return {
            code: group,
            title: info.title[lang],
            description: info.description[lang],
            signCount: signs.length,
            practiceCompleted,
            passedSigns,
          };
        })
        .filter((card): card is CategoryCardData => card !== null);

      if (requestId !== requestIdRef.current) return;

      setCategories(categoryCards);
      setTotalSigns(categoryCards.reduce((sum, cat) => sum + cat.signCount, 0));
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

  if (isLoading) return <LoadingSpinner message={t('practice.loading')} />;

  const isRtl = language === 'ar';
  const ChevDir = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background"
    >
      <div className="container mx-auto max-w-6xl px-4 py-10 space-y-8">
        <PageHeroSurface contentClassName="space-y-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
                <BookOpen className="w-4 h-4" />
                {t('practice.mode_badge')}
                </div>

                <PageHeroTitle className="max-w-3xl text-balance">
                  {t('practice.title')}
                </PageHeroTitle>
                <PageHeroDescription className="max-w-3xl text-pretty">
                  {t('practice.hub.subtitle')}
                </PageHeroDescription>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full border-0 bg-primary/10 text-primary">
                    {t('practice.hub.per_sign_questions')}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full border-0 bg-amber-500/10 text-amber-700">
                    {t('practice.hub.three_levels')}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 xl:w-[360px]">
                {[
                  {
                    icon: <BookOpen className="h-4 w-4" />,
                    value: String(totalSigns),
                    label: t('practice.hub.metric_signs'),
                  },
                  {
                    icon: <Shapes className="h-4 w-4" />,
                    value: String(categories.length),
                    label: t('practice.hub.metric_categories'),
                  },
                  {
                    icon: <Languages className="h-4 w-4" />,
                    value: '4',
                    label: t('practice.hub.metric_languages'),
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-[1.35rem] border border-border/60 bg-background/80 px-3 py-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-muted/70 text-foreground/70 ring-1 ring-border/50 dark:bg-muted/40 dark:text-foreground/80">
                        {metric.icon}
                      </div>
                      <p className="text-2xl font-black tracking-tight text-foreground">
                        {metric.value}
                      </p>
                    </div>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PageHeroSurface>

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

        <PageSectionSurface>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
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
            <div className="flex flex-col gap-3 lg:w-[240px]">
              <Button
                onClick={() => router.push('/traffic-signs')}
                className="font-bold flex-shrink-0 gap-2 hover:scale-[1.02] transition-all duration-200"
                size="lg"
              >
                <BookOpen className="w-4 h-4" />
                {t('practice.hub.browse_all')}
              </Button>
              <Button
                onClick={() => router.push('/practice/random')}
                variant="outline"
                className="font-semibold flex-shrink-0 gap-2 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
                size="lg"
              >
                <Shuffle className="w-4 h-4" />
                {t('practice.start_random')}
              </Button>
            </div>
          </div>
        </PageSectionSurface>

        <PageSectionSurface
          title={t('practice.by_category')}
          description={t('practice.subtitle')}
        >
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
                const groupMeta = getGroupInfo(cat.code);
                const visual = getCategoryVisual(cat.code);
                const CategoryIcon = visual.icon;

                return (
                  <Card
                    key={cat.code}
                    className={cn(
                      "group relative overflow-hidden cursor-pointer border border-border/50 bg-card/80 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                      groupMeta.style.cardBorder,
                      groupMeta.style.cardGlow,
                    )}
                    onClick={() => router.push(`/practice/${cat.code}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div
                            className={cn(
                              "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 transition-transform duration-200 group-hover:scale-[1.03]",
                              visual.iconWrap,
                            )}
                          >
                            <CategoryIcon className={cn("h-5 w-5", visual.iconTone)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-1 flex items-center gap-2">
                              <span
                                className={cn(
                                  "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[10px] font-black uppercase tracking-[0.14em]",
                                  visual.countBadge,
                                )}
                              >
                                {cat.code}
                              </span>
                            </div>
                            <CardTitle className="text-base font-black leading-tight">
                              {cat.title}
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs line-clamp-2 font-medium">
                              {cat.description || t('practice.hub.all_signs_desc')}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "border-0 text-xs font-semibold",
                            visual.countBadge,
                          )}
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
                              <span className="text-xs font-semibold">{t('practice.hub.passed_signs')}</span>
                            </div>
                            <p className="mt-1 text-lg font-black text-amber-800">
                              {cat.passedSigns}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", visual.progressBar)}
                            style={{ width: `${practicePct}%` }}
                          />
                        </div>
                        <span className={cn("flex items-center gap-1 whitespace-nowrap text-xs font-semibold transition-all group-hover:gap-2", visual.actionTone)}>
                          {t('practice.start_practice')}
                          <ChevDir className="w-3 h-3" />
                        </span>
                      </div>
                    </CardContent>

                    <div
                      className={cn(
                        "pointer-events-none absolute -bottom-14 -end-12 h-36 w-36 rounded-full blur-3xl opacity-0 transition-opacity duration-200 group-hover:opacity-100",
                        visual.cardGlow,
                      )}
                    />
                  </Card>
                );
              })}
            </div>
          )}
        </PageSectionSurface>
      </div>
    </div>
  );
}
