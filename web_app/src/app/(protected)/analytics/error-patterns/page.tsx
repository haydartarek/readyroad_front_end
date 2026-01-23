'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
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

export default function ErrorPatternsPage() {
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

  const severityConfig = {
    HIGH: {
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: '🔴',
      label: 'High Priority',
    },
    MEDIUM: {
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: '🟠',
      label: 'Medium Priority',
    },
    LOW: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: '🟡',
      label: 'Low Priority',
    },
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Error Pattern Analysis</h1>
          <p className="mt-2 text-lg text-gray-600">
            We analyzed your {data.totalErrors} incorrect answer{data.totalErrors > 1 ? 's' : ''} and
            identified these patterns:
          </p>
        </div>

        {/* Info Alert */}
        <Alert>
          <AlertDescription>
            <p className="font-semibold">💡 Understanding Error Patterns</p>
            <p className="mt-1 text-sm">
              Error patterns help you identify systematic mistakes in your understanding.
              Focus on high-priority patterns first for maximum improvement.
            </p>
          </AlertDescription>
        </Alert>

        {/* Pattern Cards */}
        <div className="space-y-6">
          {data.patterns.map((pattern, index) => {
            const config = severityConfig[pattern.severity];
            
            return (
              <Card key={index} className={cn('border-2', config.color)}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{config.icon}</span>
                        <Badge variant="outline" className={config.color}>
                          {config.label}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{pattern.pattern}</CardTitle>
                      <CardDescription className="mt-2">
                        {pattern.description}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{pattern.count}</div>
                      <div className="text-sm text-gray-600">errors</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Impact on total errors</span>
                      <span className="font-semibold">{pattern.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={pattern.percentage} />
                  </div>

                  {/* Affected Categories */}
                  {pattern.affectedCategories.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Affected Categories:</p>
                      <div className="flex flex-wrap gap-2">
                        {pattern.affectedCategories.map((category, idx) => (
                          <Badge key={idx} variant="secondary">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      💡 Recommendation:
                    </p>
                    <p className="text-sm text-blue-800">{pattern.recommendation}</p>
                  </div>

                  {/* Example Questions */}
                  {pattern.exampleQuestions.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">
                        Example Questions: {pattern.exampleQuestions.slice(0, 3).join(', ')}
                        {pattern.exampleQuestions.length > 3 && ` and ${pattern.exampleQuestions.length - 3} more`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Based on these patterns, we recommend:
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="flex-1">
                <Link href="/practice">Practice Weak Areas</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/analytics/weak-areas">View Weak Areas</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/lessons">Study Lessons</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
