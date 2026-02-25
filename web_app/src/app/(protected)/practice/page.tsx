'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { toast } from 'sonner';

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

export default function PracticePage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<number, number>>({});
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const catResp = await apiClient.get<CategoryDTO[]>('/categories');
        setCategories(catResp.data);

        // Fetch total question stats
        try {
          const statsResp = await apiClient.get<QuizStatsDTO>('/quiz/stats');
          setTotalQuestions(statsResp.data.totalQuestions);
        } catch {
          // stats endpoint optional
        }

        // Fetch per-category question counts in parallel
        const counts: Record<number, number> = {};
        await Promise.all(
          catResp.data.map(async (cat) => {
            try {
              const r = await apiClient.get<QuizStatsDTO>(`/quiz/stats/category/${cat.id}`);
              counts[cat.id] = r.data.totalQuestions;
            } catch {
              counts[cat.id] = 0;
            }
          })
        );
        setQuestionCounts(counts);

        setError(null);
      } catch (err) {
        logApiError('Failed to fetch categories', err);
        if (isServiceUnavailable(err)) {
          setServiceUnavailable(true);
        } else {
          const msg = t('practice.load_error');
          setError(msg);
          toast.error(msg);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [t]);

  const getCategoryName = (cat: CategoryDTO): string => {
    const map: Record<string, string> = {
      en: cat.nameEn, ar: cat.nameAr, nl: cat.nameNl, fr: cat.nameFr,
    };
    return map[language] || cat.nameEn;
  };

  const getCategoryDescription = (cat: CategoryDTO): string => {
    const map: Record<string, string | undefined> = {
      en: cat.descriptionEn, ar: cat.descriptionAr, nl: cat.descriptionNl, fr: cat.descriptionFr,
    };
    return map[language] || cat.descriptionEn || '';
  };

  const handleCategorySelect = (code: string) => {
    router.push(`/practice/${code}`);
  };

  const handleRandomPractice = () => {
    router.push('/practice/random');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-lg text-muted-foreground">{t('practice.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">
            {t('practice.title')}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t('practice.subtitle')}
          </p>
        </div>

        {/* Service Unavailable Banner */}
        {serviceUnavailable && (
          <ServiceUnavailableBanner
            onRetry={() => {
              setServiceUnavailable(false);
              setError(null);
              setIsLoading(true);
              const fetchData = async () => {
                try {
                  const catResp = await apiClient.get<CategoryDTO[]>('/categories');
                  setCategories(catResp.data);
                  try {
                    const statsResp = await apiClient.get<QuizStatsDTO>('/quiz/stats');
                    setTotalQuestions(statsResp.data.totalQuestions);
                  } catch { /* optional */ }
                  const counts: Record<number, number> = {};
                  await Promise.all(
                    catResp.data.map(async (cat) => {
                      try {
                        const r = await apiClient.get<QuizStatsDTO>(`/quiz/stats/category/${cat.id}`);
                        counts[cat.id] = r.data.totalQuestions;
                      } catch { counts[cat.id] = 0; }
                    })
                  );
                  setQuestionCounts(counts);
                  setError(null);
                } catch (err) {
                  logApiError('Failed to fetch categories', err);
                  if (isServiceUnavailable(err)) {
                    setServiceUnavailable(true);
                  } else {
                    const msg = t('practice.load_error');
                    setError(msg);
                    toast.error(msg);
                  }
                } finally {
                  setIsLoading(false);
                }
              };
              fetchData();
            }}
          />
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Random Practice Option */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="text-xl">🎲 {t('practice.random')}</CardTitle>
            <CardDescription>
              {t('practice.random_desc') || `${totalQuestions} ${t('practice.questions_available')}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handleRandomPractice}>
              {t('practice.start_random')}
            </Button>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">{t('practice.by_category')}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {categories.map((cat) => (
              <Card
                key={cat.code}
                className="cursor-pointer transition-all hover:shadow-lg"
                onClick={() => handleCategorySelect(cat.code)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {getCategoryName(cat)}
                      </CardTitle>
                      {getCategoryDescription(cat) && (
                        <CardDescription className="mt-1">
                          {getCategoryDescription(cat)}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {questionCounts[cat.id] ?? 0} {t('practice.questions_label')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    {t('practice.start_practice')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
