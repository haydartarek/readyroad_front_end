'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { toast } from 'sonner';
import { Shuffle, BookOpen, ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';

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

interface QuizStatsDTO {
  totalQuestions: number;
}

// Response from /smart-quiz/stats/category/{id}
interface SmartQuizCategoryStatsDTO {
  categoryId: number;
  // Authenticated users
  freshQuestionsAvailable?: number;
  userId?: number;
  cooldownHours?: number;
  // Guest users
  totalQuestionsAvailable?: number;
  guestMode?: boolean;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  signs: '🚦',
  rules: '📋',
  priority: '⚡',
  parking: '🅿️',
  highway: '🛣️',
  safety: '🛡️',
  default: '📚',
};

function getCategoryEmoji(code: string): string {
  const key = Object.keys(CATEGORY_EMOJIS).find(k => code.toLowerCase().includes(k));
  return key ? CATEGORY_EMOJIS[key] : CATEGORY_EMOJIS.default;
}

function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">📚</div>
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
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<number, number>>({});
  const [totalCounts, setTotalCounts] = useState<Record<number, number>>({}); // always total
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  // AbortController ref so we can cancel in-flight requests on unmount / re-fetch
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = async () => {
    // Cancel any previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    try {
      setIsLoading(true);
      setError(null);

      const catResp = await apiClient.get<CategoryDTO[]>('/categories');
      if (signal.aborted) return;
      setCategories(catResp.data);

      try {
        const statsResp = await apiClient.get<QuizStatsDTO>('/quiz/stats');
        if (!signal.aborted) setTotalQuestions(statsResp.data.totalQuestions);
      } catch { /* optional */ }

      const counts: Record<number, number> = {};
      const totals: Record<number, number> = {};
      await Promise.all(
        catResp.data.map(async (cat) => {
          try {
            // Always get total count for progress bar reference
            const totalResp = await apiClient.get<QuizStatsDTO>(`/quiz/stats/category/${cat.id}`);
            totals[cat.id] = totalResp.data.totalQuestions;

            // For authenticated users, also get fresh (non-cooldown) count
            if (isAuthenticated) {
              try {
                const freshResp = await apiClient.get<SmartQuizCategoryStatsDTO>(
                  `/smart-quiz/stats/category/${cat.id}`
                );
                // freshQuestionsAvailable comes from authenticated response
                counts[cat.id] = freshResp.data.freshQuestionsAvailable ?? totals[cat.id];
              } catch {
                counts[cat.id] = totals[cat.id];
              }
            } else {
              counts[cat.id] = totals[cat.id];
            }
          } catch {
            counts[cat.id] = 0;
            totals[cat.id] = 0;
          }
        })
      );
      if (signal.aborted) return;
      setQuestionCounts(counts);
      setTotalCounts(totals);
    } catch (err) {
      // Ignore calls cancelled by component unmount or re-fetch
      if (signal.aborted) return;
      logApiError('Failed to fetch categories', err);
      if (isServiceUnavailable(err)) {
        setServiceUnavailable(true);
      } else {
        const msg = t('practice.load_error');
        setError(msg);
        toast.error(msg);
      }
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => { abortRef.current?.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const getCategoryName = (cat: CategoryDTO): string => {
    const map: Record<string, string> = {
      en: cat.nameEn, ar: cat.nameAr, nl: cat.nameNl, fr: cat.nameFr,
    };
    return map[language] || cat.nameEn;
  };

  const getCategoryDescription = (cat: CategoryDTO): string => {
    const map: Record<string, string | undefined> = {
      en: cat.descriptionEn, ar: cat.descriptionAr,
      nl: cat.descriptionNl, fr: cat.descriptionFr,
    };
    return map[language] || cat.descriptionEn || '';
  };

  if (isLoading) return <LoadingSpinner message={t('practice.loading')} />;

  const isRtl = language === 'ar';
  const ChevDir = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="container mx-auto max-w-5xl px-4 py-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-primary border border-primary/20 shadow-sm">
            <BookOpen className="w-4 h-4" />
            <span className="font-semibold text-sm">Practice Mode</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">{t('practice.title')}</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto font-medium">
            {t('practice.subtitle')}
          </p>
        </div>

        {/* Banners */}
        {serviceUnavailable && (
          <ServiceUnavailableBanner
            onRetry={() => { setServiceUnavailable(false); setError(null); fetchData(); }}
          />
        )}
        {error && (
          <Alert variant="destructive" className="animate-in fade-in-50 duration-300">
            <AlertDescription className="flex items-center justify-between">
              <span>⚠️ {error}</span>
              <Button size="sm" variant="outline" onClick={fetchData} className={`gap-1 ${isRtl ? 'mr-4' : 'ml-4'}`}>
                <RefreshCw className="w-3 h-3" /> Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Random Practice Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15 px-6 py-7 shadow-sm">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black text-foreground">{t('practice.random')}</h2>
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                {t('practice.random_desc') || `${totalQuestions} ${t('practice.questions_available')}`}
              </p>
            </div>
            <Button
              onClick={() => router.push('/practice/random')}
              className="font-bold flex-shrink-0 gap-2 hover:scale-[1.02] transition-all duration-200"
              size="lg"
            >
              <Shuffle className="w-4 h-4" />
              {t('practice.start_random')}
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black tracking-tight">{t('practice.by_category')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {categories.map((cat) => {
              const freshCount = questionCounts[cat.id] ?? 0;
              const totalCount = totalCounts[cat.id] ?? freshCount;
              const emoji = getCategoryEmoji(cat.code);
              // isOnCooldown: authenticated and fresh < total
              const allOnCooldown = isAuthenticated && freshCount === 0 && totalCount > 0;
              const someOnCooldown = isAuthenticated && freshCount < totalCount && freshCount > 0;
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
                          {getCategoryDescription(cat) && (
                            <CardDescription className="mt-1 text-xs line-clamp-2 font-medium">
                              {getCategoryDescription(cat)}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge
                          variant="secondary"
                          className={`text-xs font-semibold border-0 ${
                            allOnCooldown
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {isAuthenticated ? `${freshCount}/${totalCount} Q` : `${totalCount} Q`}
                        </Badge>
                        {allOnCooldown && (
                          <span className="text-[10px] text-amber-500 font-medium">🔄 Review</span>
                        )}
                        {someOnCooldown && (
                          <span className="text-[10px] text-emerald-500 font-medium">✨ Fresh</span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      {/* Mini progress bar - shows fresh vs total */}
                      <div className={`flex-1 h-1.5 bg-muted rounded-full overflow-hidden ${isRtl ? 'ml-4' : 'mr-4'}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            allOnCooldown ? 'bg-amber-400/60' : 'bg-primary/50'
                          }`}
                          style={{ width: `${Math.min((totalCount / Math.max(totalQuestions / categories.length, 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        {t('practice.start_practice')}
                        <ChevDir className="w-3 h-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
