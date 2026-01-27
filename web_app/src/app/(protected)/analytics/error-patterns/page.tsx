'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/analytics/error-summary';
import { ErrorPatternList } from '@/components/analytics/error-pattern-list';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

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

function ErrorPatternsContent() {
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId');

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.error('Failed to fetch analytics:', err);
        setError('Failed to load error patterns');
        toast.error('Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [examId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-lg text-gray-600">Analyzing your errors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data || !data.patterns || data.patterns.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="text-center">
          <div className="mb-4 text-6xl">📊</div>
          <h1 className="text-3xl font-bold">No Error Patterns Yet</h1>
          <p className="mt-2 text-gray-600">
            Take an exam first to see your error patterns
          </p>
          <Button className="mt-6" asChild>
            <Link href="/exam">Take an Exam</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
            <span className="text-2xl">🔍</span>
            <span className="font-semibold">Error Analysis</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold">Your Error Patterns</h1>
          <p className="mt-2 text-lg text-gray-600">
            We analyzed {data.totalErrors} errors and identified these patterns to help you improve
          </p>
        </div>

        {/* Summary Cards */}
        <ErrorSummary totalErrors={data.totalErrors} patterns={data.patterns} />

        {/* Info Alert */}
        <Alert>
          <AlertDescription>
            <p className="font-semibold">💡 How to Use This Analysis</p>
            <p className="mt-1 text-sm">
              Focus on critical patterns first. Each pattern shows affected categories,
              recommendations, and example questions to practice. Click on any pattern to expand details.
            </p>
          </AlertDescription>
        </Alert>

        {/* Pattern List */}
        <ErrorPatternList patterns={data.patterns} />

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
            <CardDescription>
              Based on your error patterns, here's what we recommend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button asChild size="lg">
                <Link href="/practice">
                  <span className="mr-2">📝</span>
                  Practice Weak Areas
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/analytics/weak-areas">
                  <span className="mr-2">📊</span>
                  View Weak Categories
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/lessons">
                  <span className="mr-2">📚</span>
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
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ErrorPatternsContent />
    </Suspense>
  );
}
