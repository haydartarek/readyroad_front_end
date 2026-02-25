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

export default function WeakAreasPage() {
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-lg text-muted-foreground">Analyzing your weak areas...</p>
        </div>
      </div>
    );
  }

  if (serviceUnavailable) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <ServiceUnavailableBanner onRetry={() => { setServiceUnavailable(false); setFetchKey(k => k + 1); }} className="max-w-md" />
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

  if (!data || !data.weakAreas || data.weakAreas.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="text-center">
          <div className="mb-4 text-6xl">💪</div>
          <h1 className="text-3xl font-bold">No Weak Areas Identified</h1>
          <p className="mt-2 text-muted-foreground">
            Take more exams to identify areas that need improvement
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
            <span className="text-2xl">📊</span>
            <span className="font-semibold">Weak Areas Analysis</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold">Areas for Improvement</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Focused analysis to help you target and strengthen weak categories
          </p>
        </div>

        {/* Summary Cards */}
        <WeakAreaSummary
          weakAreas={data.weakAreas}
          totalCategories={data.totalCategories}
          overallAccuracy={data.overallAccuracy}
        />

        {/* Info Alert */}
        <Alert>
          <AlertDescription>
            <p className="font-semibold">🎯 Smart Improvement Strategy</p>
            <p className="mt-1 text-sm">
              Focus on critical areas first (below 50% accuracy). Practice these categories daily
              and review related lessons. Track your progress and celebrate small improvements!
            </p>
          </AlertDescription>
        </Alert>

        {/* Weak Areas Details */}
        <WeakAreaDetails weakAreas={data.weakAreas} />

        {/* Overall Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Start Improving Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Choose your learning path based on your current needs:
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <Button asChild size="lg">
                <Link href="/practice">
                  <span className="mr-2">📝</span>
                  Practice Mode
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/lessons">
                  <span className="mr-2">📚</span>
                  Study Lessons
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/exam">
                  <span className="mr-2">🎯</span>
                  Take Full Exam
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
