'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

interface WeakArea {
  categoryCode: string;
  categoryName: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  rank: number;
  recommendations: string[];
  relatedTrafficSigns: string[];
  relatedLessons: number[];
}

interface WeakAreasData {
  weakAreas: WeakArea[];
  overallAccuracy: number;
  totalQuestionsAttempted: number;
}

export default function WeakAreasPage() {
  const [data, setData] = useState<WeakAreasData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeakAreas = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<WeakAreasData>('/users/me/analytics/weak-areas');
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch weak areas:', err);
        setError('Failed to load weak areas');
        toast.error('Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeakAreas();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-lg text-gray-600">Analyzing your weak areas...</p>
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

  if (!data || !data.weakAreas || data.weakAreas.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="text-center">
          <div className="mb-4 text-6xl">💪</div>
          <h1 className="text-3xl font-bold">No Weak Areas Identified</h1>
          <p className="mt-2 text-gray-600">
            Take more exams to identify areas that need improvement
          </p>
          <Button className="mt-6" asChild>
            <Link href="/exam">Take an Exam</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { label: '🥇 Priority #1', variant: 'destructive' as const };
    if (rank === 2) return { label: '🥈 Priority #2', variant: 'destructive' as const };
    if (rank === 3) return { label: '🥉 Priority #3', variant: 'secondary' as const };
    return { label: `Priority #${rank}`, variant: 'secondary' as const };
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Weak Areas Analysis</h1>
          <p className="mt-2 text-lg text-gray-600">
            Based on {data.totalQuestionsAttempted} questions attempted with {data.overallAccuracy.toFixed(1)}% overall accuracy
          </p>
        </div>

        {/* Overall Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Overall Accuracy</span>
                <span className="font-semibold">{data.overallAccuracy.toFixed(1)}%</span>
              </div>
              <Progress value={data.overallAccuracy} />
            </div>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert>
          <AlertDescription>
            <p className="font-semibold">🎯 Improvement Strategy</p>
            <p className="mt-1 text-sm">
              Focus on your top 3 weak areas first. Practice questions in these categories
              and study related lessons to improve your understanding.
            </p>
          </AlertDescription>
        </Alert>

        {/* Weak Areas Cards */}
        <div className="space-y-6">
          {data.weakAreas.map((area) => {
            const rankBadge = getRankBadge(area.rank);
            const isTopPriority = area.rank <= 3;
            
            return (
              <Card
                key={area.categoryCode}
                className={cn(
                  'border-2',
                  isTopPriority && 'border-red-300 bg-red-50/50'
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Badge variant={rankBadge.variant} className="mb-2">
                        {rankBadge.label}
                      </Badge>
                      <CardTitle className="text-xl">{area.categoryName}</CardTitle>
                      <CardDescription className="mt-1">
                        Category {area.categoryCode}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-3xl font-bold",
                        area.accuracy < 50 ? "text-red-600" :
                        area.accuracy < 70 ? "text-orange-600" : "text-yellow-600"
                      )}>
                        {area.accuracy.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">accuracy</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-sm text-gray-600">Total Questions</div>
                      <div className="text-xl font-bold">{area.totalQuestions}</div>
                    </div>
                    <div className="rounded-lg bg-green-50 p-3">
                      <div className="text-sm text-gray-600">Correct</div>
                      <div className="text-xl font-bold text-green-600">{area.correctAnswers}</div>
                    </div>
                    <div className="rounded-lg bg-red-50 p-3">
                      <div className="text-sm text-gray-600">Wrong</div>
                      <div className="text-xl font-bold text-red-600">{area.wrongAnswers}</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Accuracy</span>
                      <span className="font-semibold">{area.accuracy.toFixed(1)}%</span>
                    </div>
                    <Progress value={area.accuracy} />
                  </div>

                  {/* Recommendations */}
                  {area.recommendations.length > 0 && (
                    <div className="rounded-lg bg-blue-50 p-4">
                      <p className="text-sm font-semibold text-blue-900 mb-2">
                        💡 Recommendations:
                      </p>
                      <ul className="space-y-1">
                        {area.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-blue-800 flex gap-2">
                            <span>•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Related Resources */}
                  <div className="flex flex-wrap gap-2">
                    {area.relatedTrafficSigns.length > 0 && (
                      <Badge variant="outline">
                        🚦 {area.relatedTrafficSigns.length} Traffic Signs
                      </Badge>
                    )}
                    {area.relatedLessons.length > 0 && (
                      <Badge variant="outline">
                        📚 {area.relatedLessons.length} Lessons
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      asChild
                      className="flex-1"
                    >
                      <Link href={`/practice/${area.categoryCode}`}>
                        Practice This Category
                      </Link>
                    </Button>
                    {area.relatedLessons.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-1"
                      >
                        <Link href={`/lessons?category=${area.categoryCode}`}>
                          Study Lessons
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Overall Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Improve Your Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Ready to tackle your weak areas? Choose how you want to improve:
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Button asChild>
                <Link href="/practice">Practice Mode</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/lessons">Study Lessons</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/exam">Take Full Exam</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
