'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SignImage } from '@/components/traffic-signs/sign-image';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, ArrowLeft, BookOpen, Trophy, Lock, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { getAllSignProgress, type SignUserProgress } from '@/services';
import type { TrafficSign } from '@/lib/types';

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

type Lang = 'en' | 'ar' | 'nl' | 'fr';

const CATEGORY_LABELS: Record<string, Record<Lang, string>> = {
  A: { en: 'Danger Signs',      ar: 'علامات الخطر',     nl: 'Gevaarsborden',        fr: 'Panneaux de danger' },
  B: { en: 'Priority Signs',    ar: 'علامات الأولوية',   nl: 'Voorrangsborden',      fr: 'Panneaux de priorité' },
  C: { en: 'Prohibition Signs', ar: 'علامات المنع',      nl: 'Verbodsborden',        fr: "Panneaux d'interdiction" },
  D: { en: 'Mandatory Signs',   ar: 'علامات الإلزام',    nl: 'Gebodsborden',         fr: "Panneaux d'obligation" },
  E: { en: 'Parking Signs',     ar: 'علامات الوقوف',     nl: 'Stilstaan en parkeren', fr: 'Stationnement' },
  F: { en: 'Information Signs', ar: 'علامات المعلومات',  nl: 'Aanwijzingsborden',    fr: "Panneaux d'indication" },
  G: { en: 'Zone Signs',        ar: 'علامات المناطق',    nl: 'Zoneborden',           fr: 'Panneaux de zone' },
  M: { en: 'Additional Signs',  ar: 'لوحات إضافية',      nl: 'Onderborden',          fr: 'Panneaux additionnels' },
  Z: { en: 'Delineation Signs', ar: 'علامات التحديد',    nl: 'Afbakeningsborden',    fr: 'Panneaux de délimitation' },
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

export default function PracticeSignsPage() {
  const params = useParams();
  const router = useRouter();
  const categoryCode = (params.category as string).toUpperCase();
  const { language, t } = useLanguage();
  const { isAuthenticated } = useAuth();

  const [category, setCategory]     = useState<CategoryDTO | null>(null);
  const [signs, setSigns]           = useState<TrafficSign[]>([]);
  const [progress, setProgress]     = useState<Record<string, SignUserProgress>>({});
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const sig = ctrl.signal;
    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch category info
      const catResp = await apiClient.get<CategoryDTO>(`/categories/${categoryCode}`);
      if (sig.aborted) return;
      setCategory(catResp.data);

      // 2. Fetch signs in this category
      const signsResp = await apiClient.get<TrafficSign[]>(
        `/traffic-signs/category/${catResp.data.id}`
      );
      if (sig.aborted) return;
      setSigns(signsResp.data);

      // 3. Optionally fetch user progress (only for logged-in users)
      if (isAuthenticated) {
        try {
          const progressList = await getAllSignProgress();
          if (!sig.aborted) {
            const map: Record<string, SignUserProgress> = {};
            progressList.forEach((p) => { map[p.signCode] = p; });
            setProgress(map);
          }
        } catch {
          // progress is optional — ignore failures
        }
      }
    } catch (err) {
      if (sig.aborted) return;
      if (isServiceUnavailable(err)) {
        setServiceUnavailable(true);
      } else {
        logApiError('Failed to load signs for category', err);
        setError('Failed to load signs. Please try again.');
      }
    } finally {
      if (!sig.aborted) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => { abortRef.current?.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryCode, isAuthenticated]);

  const getCategoryName = (): string => {
    if (category) {
      const map: Record<string, string | undefined> = {
        en: category.nameEn, ar: category.nameAr,
        nl: category.nameNl, fr: category.nameFr,
      };
      return map[language] || category.nameEn;
    }
    return CATEGORY_LABELS[categoryCode]?.[language as Lang] ?? categoryCode;
  };

  const getSignName = (sign: TrafficSign): string => {
    const map: Record<string, string> = {
      en: sign.nameEn, ar: sign.nameAr, nl: sign.nameNl, fr: sign.nameFr,
    };
    return map[language] || sign.nameEn || sign.signCode;
  };

  if (isLoading) return <LoadingSpinner message="Loading signs..." />;

  if (serviceUnavailable) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <ServiceUnavailableBanner
          onRetry={() => { setServiceUnavailable(false); fetchData(); }}
          className="max-w-md"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchData} className="gap-2 w-full">
            <RefreshCw className="w-4 h-4" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  const isRtl = language === 'ar';

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="container mx-auto max-w-6xl px-4 py-10 space-y-8">

        {/* Header */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/practice')}
            className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('practice.signs.back')}
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-black tracking-tight">{getCategoryName()}</h1>
            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              {t('practice.signs.count', { count: signs.length })}
            </span>
          </div>
          <p className="text-muted-foreground">
            {t('practice.signs.choose')}
          </p>
        </div>

        {/* Signs Grid */}
        {signs.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="text-6xl">🔍</div>
            <p className="text-muted-foreground">{t('practice.signs.none')}</p>
            <Button variant="outline" onClick={() => router.push('/practice')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> {t('practice.signs.none_back')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {signs.map((sign) => {
              const prog = progress[sign.signCode];
              const exam1Passed   = prog?.exam1Passed   ?? false;
              const exam2Unlocked = prog?.exam2Unlocked ?? false;
              const practiceCompleted = prog?.practiceCompleted ?? false;

              return (
                <Card
                  key={sign.signCode}
                  className="group flex flex-col rounded-2xl border border-border/40 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-primary/30 transition-all duration-200 bg-card overflow-hidden"
                >
                  {/* Sign image */}
                  <div className="relative flex items-center justify-center bg-muted/20 h-32">
                    <div className="w-24 h-24 flex items-center justify-center">
                      <SignImage
                        src={sign.imageUrl}
                        alt={getSignName(sign)}
                        className="object-contain w-full h-full drop-shadow-sm"
                      />
                    </div>
                    {practiceCompleted && isAuthenticated && (
                      <div className="absolute top-2.5 right-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                    )}
                  </div>

                  <CardContent className="flex flex-col flex-1 gap-4 p-4 pt-3">
                    {/* Sign name + code */}
                    <div className="space-y-1.5">
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 tracking-wide">
                        {sign.signCode}
                      </Badge>
                      <p className="text-sm font-semibold leading-snug line-clamp-2 text-foreground min-h-[2.75rem]">
                        {getSignName(sign)}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 mt-auto">
                      <Link href={`/traffic-signs/${sign.signCode}/practice`} className="w-full">
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full gap-2 text-sm h-9 rounded-xl font-semibold transition-all duration-150 hover:shadow-sm"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          {t('practice.signs.practice_btn')}
                        </Button>
                      </Link>

                      <div className="grid grid-cols-2 gap-2">
                        <Link href={`/traffic-signs/${sign.signCode}/exam/1`} className="w-full">
                          <Button
                            size="sm"
                            variant={exam1Passed ? 'outline' : 'secondary'}
                            className="w-full gap-1.5 text-xs h-8 rounded-xl font-semibold transition-all duration-150 hover:shadow-sm"
                          >
                            {exam1Passed
                              ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              : <Trophy className="w-3 h-3" />
                            }
                            {t('practice.signs.exam1')}
                          </Button>
                        </Link>

                        {exam2Unlocked ? (
                          <Link href={`/traffic-signs/${sign.signCode}/exam/2`} className="w-full">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-full gap-1.5 text-xs h-8 rounded-xl font-semibold transition-all duration-150 hover:shadow-sm"
                            >
                              <Trophy className="w-3 h-3" />
                              {t('practice.signs.exam2')}
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled
                            className="w-full gap-1.5 text-xs h-8 rounded-xl font-medium opacity-40 cursor-not-allowed"
                          >
                            <Lock className="w-3 h-3" />
                            {t('practice.signs.exam2')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
