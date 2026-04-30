'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/analytics/error-summary';
import { ErrorPatternList } from '@/components/analytics/error-pattern-list';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import {
  PageHeroDescription,
  PageHeroEyebrow,
  PageHeroTitle,
} from '@/components/ui/page-surface';
import { toast } from 'sonner';
import Link from 'next/link';
import { BookOpen, BarChart2, PenLine, RefreshCw, AlertCircle, Target, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

interface ErrorPattern {
  pattern: string;
  patternKey: string;
  count: number;
  percentage: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  affectedCategories: string[];
  recommendation: string;
  recommendationKey: string;
  exampleQuestions: number[];
}

interface AnalyticsData {
  totalErrors: number;
  patterns: ErrorPattern[];
}

/** Shape returned by GET /api/users/me/analytics/error-patterns */
interface BackendPattern {
  patternType: string;
  count: number;
  percentage: number;
  description: string;
  exampleQuestions?: Array<{
    questionId: number;
    categoryName?: string;
    timesWrong?: number;
  }>;
}

// ─── Helpers ────────────────────────────────────────────

function formatPatternKey(patternType: string): string {
  const keys: Record<string, string> = {
    SIGN_CONFUSION:             'error_patterns.pattern_sign_confusion',
    SUPPLEMENTARY_IGNORED:      'error_patterns.pattern_supplementary_ignored',
    PRIORITY_MISUNDERSTANDING:  'error_patterns.pattern_priority_misunderstanding',
    SPEED_LIMIT_ERROR:          'error_patterns.pattern_speed_limit_error',
    ZONE_CONFUSION:             'error_patterns.pattern_zone_confusion',
    RULE_OVERGENERALIZATION:    'error_patterns.pattern_rule_overgeneralization',
  };
  return keys[patternType] ?? 'error_patterns.pattern_sign_confusion';
}

function formatPatternFallback(patternType: string): string {
  const names: Record<string, string> = {
    SIGN_CONFUSION:             'Sign Confusion',
    SUPPLEMENTARY_IGNORED:      'Supplementary Signs Ignored',
    PRIORITY_MISUNDERSTANDING:  'Priority & Right-of-Way',
    SPEED_LIMIT_ERROR:          'Speed Limit Errors',
    ZONE_CONFUSION:             'Zone Confusion',
    RULE_OVERGENERALIZATION:    'Rule Overgeneralization',
  };
  return names[patternType]
    ?? patternType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function getRecommendationKey(patternType: string): string {
  const keys: Record<string, string> = {
    SIGN_CONFUSION:             'error_patterns.rec_sign_confusion',
    SUPPLEMENTARY_IGNORED:      'error_patterns.rec_supplementary_ignored',
    PRIORITY_MISUNDERSTANDING:  'error_patterns.rec_priority_misunderstanding',
    SPEED_LIMIT_ERROR:          'error_patterns.rec_speed_limit_error',
    ZONE_CONFUSION:             'error_patterns.rec_zone_confusion',
    RULE_OVERGENERALIZATION:    'error_patterns.rec_rule_overgeneralization',
  };
  return keys[patternType] ?? 'error_patterns.rec_default';
}

function computeSeverity(percentage: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (percentage >= 30) return 'HIGH';
  if (percentage >= 10) return 'MEDIUM';
  return 'LOW';
}

function transformBackendPatterns(raw: BackendPattern[]): AnalyticsData {
  // Keep only patterns where at least one wrong answer occurred
  const active = raw.filter(p => (p.count ?? 0) > 0);

  const totalErrors = active.reduce((sum, p) => sum + (p.count ?? 0), 0);

  const patterns: ErrorPattern[] = active.map(p => ({
    pattern:            formatPatternFallback(p.patternType),
    patternKey:         formatPatternKey(p.patternType),
    count:              p.count,
    percentage:         p.percentage ?? 0,
    severity:           computeSeverity(p.percentage ?? 0),
    description:        p.description ?? '',
    affectedCategories: [...new Set(
      (p.exampleQuestions ?? []).map(q => q.categoryName).filter((c): c is string => Boolean(c)),
    )],
    recommendation:     '',
    recommendationKey:  getRecommendationKey(p.patternType),
    exampleQuestions:   (p.exampleQuestions ?? []).map(q => q.questionId),
  }));

  return { totalErrors, patterns };
}

function LoadingSpinner({ message }: { message?: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground">{message ?? t('common.loading')}</p>
    </div>
  );
}

export function ErrorPatternsContent() {
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId');
  const { t } = useLanguage();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const url = examId
          ? `/users/me/analytics/error-patterns?simulationId=${examId}`
          : '/users/me/analytics/error-patterns';
        // Backend returns BackendPattern[] (array), not the AnalyticsData wrapper
        const response = await apiClient.get<BackendPattern[]>(url);
        const raw = Array.isArray(response.data) ? response.data : [];
        setData(transformBackendPatterns(raw));
        setError(null);
      } catch (err) {
        logApiError('Failed to fetch analytics', err);
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
    fetchAnalytics();
  }, [examId, fetchKey, t]);

  if (isLoading) return <LoadingSpinner message={t('error_patterns.loading_analyzing')} />;

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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 max-w-md mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-destructive" />
        </div>
        <p className="text-destructive font-medium">{error}</p>
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

  if (!data || !data.patterns || data.patterns.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header card — matches dashboard GreetingHeader pattern */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15 px-6 py-7 shadow-sm">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-0.5">
              <PageHeroEyebrow>{t('error_patterns.badge')}</PageHeroEyebrow>
              <PageHeroTitle>{t('error_patterns.title')}</PageHeroTitle>
              <PageHeroDescription>{t('error_patterns.empty_desc')}</PageHeroDescription>
            </div>
          </div>
        </div>

        {/* Empty state card */}
        <Card className="rounded-2xl border border-border/50 shadow-sm">
          <CardContent className="pt-12 pb-10 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center">
              <BarChart2 className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">{t('error_patterns.empty_title')}</h2>
              <p className="text-sm font-medium text-muted-foreground max-w-sm">
                {t('error_patterns.empty_desc')}
              </p>
            </div>
            <Button size="lg" asChild className="shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform">
              <Link href="/exam">{t('error_patterns.empty_cta')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header card — matches dashboard GreetingHeader pattern */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15 px-6 py-7 shadow-sm">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-0.5">
            <PageHeroEyebrow>{t('error_patterns.badge')}</PageHeroEyebrow>
            <PageHeroTitle>{t('error_patterns.title')}</PageHeroTitle>
            <PageHeroDescription>
              {t('error_patterns.subtitle_before')}{' '}
              <span className="font-bold text-foreground">{data.totalErrors}</span>{' '}
              {t('error_patterns.subtitle_after')}
            </PageHeroDescription>
          </div>
        </div>
      </div>

        {/* Summary Cards */}
        <ErrorSummary totalErrors={data.totalErrors} patterns={data.patterns} />

        {/* Info Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15 px-6 py-7 shadow-sm">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex items-start gap-4">
            <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-primary/15 flex items-center justify-center mt-0.5">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-black text-foreground">{t('error_patterns.how_title')}</p>
              <p className="text-sm font-medium text-muted-foreground">
                {t('error_patterns.how_body_prefix')}{' '}
                <span className="font-bold text-foreground">{t('error_patterns.how_body_highlight')}</span>
                {t('error_patterns.how_body_suffix')}
              </p>
            </div>
          </div>
        </div>

        {/* Pattern List */}
        <ErrorPatternList patterns={data.patterns} />

        {/* Recommended Actions */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-black">{t('error_patterns.actions_title')}</CardTitle>
                <CardDescription>
                  {t('error_patterns.actions_desc')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button asChild className="gap-2 rounded-xl shadow-sm shadow-primary/20">
                <Link href="/practice">
                  <PenLine className="w-4 h-4" />
                  {t('error_patterns.action_practice')}
                </Link>
              </Button>
              <Button variant="outline" asChild className="gap-2 rounded-xl">
                <Link href="/dashboard?section=weak-areas">
                  <BarChart2 className="w-4 h-4" />
                  {t('error_patterns.action_weak_areas')}
                </Link>
              </Button>
              <Button variant="outline" asChild className="gap-2 rounded-xl">
                <Link href="/lessons">
                  <BookOpen className="w-4 h-4" />
                  {t('error_patterns.action_lessons')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

    </div>
  );
}

function ErrorPatternsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', 'error-patterns');
    router.replace(`/dashboard?${params.toString()}`);
  }, [router, searchParams]);

  return <LoadingSpinner />;
}

export default function ErrorPatternsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ErrorPatternsRedirect />
    </Suspense>
  );
}
