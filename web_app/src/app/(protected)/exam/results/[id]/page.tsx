'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

interface CategoryBreakdown {
  categoryCode: string;
  categoryName: string;
  correct: number;
  total: number;
  percentage: number;
}

interface ExamResults {
  id: number;
  passed: boolean;
  score: number;
  totalQuestions: number;
  percentage: number;
  passingScore: number;
  timeTaken: string;
  categoryBreakdown: CategoryBreakdown[];
}

export default function ExamResultsPage() {
  const params = useParams();
  const examId = parseInt(params.id as string);

  const [results, setResults] = useState<ExamResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<ExamResults>(`/exams/${examId}/results`);
        setResults(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch results:', err);
        setError('Failed to load exam results');
        toast.error('Failed to load results');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [examId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-lg text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error || 'Results not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="space-y-8">
        {/* Result Header */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              {/* Status Badge */}
              <div
                className={cn(
                  'mb-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-2xl font-bold',
                  results.passed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                )}
              >
                {results.passed ? '✅ PASSED' : '❌ NOT PASSED'}
              </div>

              {/* Score */}
              <div className="mb-6">
                <div className="text-6xl font-bold text-gray-900">
                  {results.score}
                  <span className="text-3xl text-gray-500">/{results.totalQuestions}</span>
                </div>
                <div className="mt-2 text-3xl font-semibold text-primary">
                  {results.percentage.toFixed(1)}%
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                {results.passed ? (
                  <p className="text-xl text-gray-700">
                    🎉 Congratulations! You&apos;re ready for the real exam!
                  </p>
                ) : (
                  <p className="text-xl text-gray-700">
                    💪 Keep practicing! You need {results.passingScore - results.score} more correct
                    answer{results.passingScore - results.score > 1 ? 's' : ''}.
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border-2 border-gray-200 p-4">
                  <div className="text-sm text-gray-600">Passing Score</div>
                  <div className="text-2xl font-bold">
                    {results.passingScore}/{results.totalQuestions} (82%)
                  </div>
                </div>
                <div className="rounded-[24px] border-2 border-gray-200 p-4">
                  <div className="text-sm text-gray-600">Time Taken</div>
                  <div className="text-2xl font-bold">{results.timeTaken}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.categoryBreakdown.map((category) => {
                const status =
                  category.percentage >= 80 ? 'strong' : category.percentage >= 60 ? 'average' : 'weak';

                return (
                  <div key={category.categoryCode} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{category.categoryName}</span>
                        <Badge
                          variant={status === 'strong' ? 'default' : status === 'average' ? 'secondary' : 'destructive'}
                        >
                          {status === 'strong' && '✅ Strong'}
                          {status === 'average' && '🟡 Average'}
                          {status === 'weak' && '⚠️ Weak'}
                        </Badge>
                      </div>
                      <div className="font-semibold">
                        {category.correct}/{category.total} ({category.percentage.toFixed(1)}%)
                      </div>
                    </div>
                    <Progress value={category.percentage} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button variant="outline" size="lg" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>

          {!results.passed && (
            <Button size="lg" asChild>
              <Link href="/practice">Practice More</Link>
            </Button>
          )}

          {results.passed && (
            <Button size="lg" asChild>
              <Link href="/exam">Take Another Exam</Link>
            </Button>
          )}

          <Button variant="outline" size="lg" asChild>
            <Link href={`/analytics/error-patterns?examId=${examId}`}>
              View Error Patterns
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
