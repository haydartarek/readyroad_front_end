'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/analytics/error-summary';
import { ErrorPatternList } from '@/components/analytics/error-pattern-list';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { toast } from 'sonner';
import Link from 'next/link';
import { BookOpen, BarChart2, PenLine, RefreshCw } from 'lucide-react';

interface ErrorPattern {
  pattern: string;
  count: number;
  percentage: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  affectedCategories: string[];
  recommendation: string;
  exampleQuestions: number[];
}

interface AnalyticsData {
  totalErrors: number;
  patterns: ErrorPattern[];
}

function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🔍</div>
        </div>
        <p className="text-base text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

function ErrorPatternsContent() {
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId');

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
        const response = await apiClient.get<AnalyticsData>(url);
        setData(response.data);
        setError(null);
      } catch (err) {
        logApiError('Failed to fetch analytics', err);
        if (isServiceUnavailable(err)) {
          setServiceUnavailable(true);
        } else {
          setError('Failed to load error patterns');
          toast.error('Failed to load analytics');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [examId, fetchKey]);

  if (isLoading) return <LoadingSpinner message="Analyzing your errors..." />;

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
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data || !data.patterns || data.patterns.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-5xl">
            📊
          </div>
          <h1 className="text-3xl font-black tracking-tight">No Error Patterns Yet</h1>
          <p className="text-muted-foreground">
            Take an exam first to see your error patterns and improve your performance.
          </p>
          <Button size="lg" asChild className="shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform">
            <Link href="/exam">Take an Exam</Link>
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
            <span className="text-xl">🔍</span>
            <span className="font-semibold text-sm">Error Analysis</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Your Error Patterns</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            We analyzed{' '}
            <span className="font-bold text-foreground">{data.totalErrors}</span>{' '}
            errors and identified these patterns to help you improve
          </p>
        </div>

        {/* Summary Cards */}
        <ErrorSummary totalErrors={data.totalErrors} patterns={data.patterns} />

        {/* Info Alert */}
        <Alert className="border border-primary/20 bg-primary/5">
          <AlertDescription className="space-y-1">
            <p className="font-semibold text-foreground">💡 How to Use This Analysis</p>
            <p className="text-sm text-muted-foreground">
              Focus on critical patterns first. Each pattern shows affected categories,
              recommendations, and example questions to practice. Click on any pattern to expand details.
            </p>
          </AlertDescription>
        </Alert>

        {/* Pattern List */}
        <ErrorPatternList patterns={data.patterns} />

        {/* Recommended Actions */}
        <Card className="border border-border/50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                🎯
              </div>
              <div>
                <CardTitle className="text-xl font-black">Recommended Actions</CardTitle>
                <CardDescription>
                  Based on your error patterns, here&apos;s what we recommend
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button
                asChild
                size="lg"
                className="h-14 shadow-md shadow-primary/20 hover:shadow-lg hover:scale-[1.01] transition-all duration-200"
              >
                <Link href="/practice" className="flex items-center gap-2">
                  <PenLine className="w-4 h-4" />
                  Practice Weak Areas
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                size="lg"
                className="h-14 hover:bg-primary/5 hover:border-primary/30 hover:scale-[1.01] transition-all duration-200"
              >
                <Link href="/analytics/weak-areas" className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" />
                  View Weak Categories
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                size="lg"
                className="h-14 hover:bg-primary/5 hover:border-primary/30 hover:scale-[1.01] transition-all duration-200"
              >
                <Link href="/lessons" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Study Lessons
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default function ErrorPatternsPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading..." />}>
      <ErrorPatternsContent />
    </Suspense>
  );
}
