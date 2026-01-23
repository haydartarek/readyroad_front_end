'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

interface ExamHistory {
  id: number;
  date: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  timeTaken: string;
}

interface CategoryProgress {
  categoryCode: string;
  categoryName: string;
  questionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface ProgressData {
  overallStats: {
    totalExams: number;
    totalQuestions: number;
    averageScore: number;
    passRate: number;
    currentStreak: number;
    bestScore: number;
  };
  examHistory: ExamHistory[];
  categoryProgress: CategoryProgress[];
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<ProgressData>('/users/me/progress');
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch progress:', err);
        setError('Failed to load progress data');
        toast.error('Failed to load progress');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-lg text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error || 'Progress data not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { overallStats, examHistory, categoryProgress } = data;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Your Progress</h1>
          <p className="mt-2 text-lg text-gray-600">
            Track your improvement and stay motivated
          </p>
        </div>

        {/* Overall Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Exams Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{overallStats.totalExams}</div>
              <p className="text-sm text-gray-600 mt-1">
                {overallStats.totalQuestions} questions attempted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {overallStats.averageScore.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Best: {overallStats.bestScore}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pass Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">
                {overallStats.passRate.toFixed(0)}%
              </div>
              <p className="text-sm text-gray-600 mt-1">
                🔥 {overallStats.currentStreak} day streak
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Exam History</TabsTrigger>
            <TabsTrigger value="categories">Category Progress</TabsTrigger>
          </TabsList>

          {/* Exam History Tab */}
          <TabsContent value="history" className="space-y-4">
            {examHistory.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600">No exam history yet</p>
                  <Button className="mt-4" asChild>
                    <Link href="/exam">Take Your First Exam</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              examHistory.map((exam) => (
                <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={exam.passed ? 'default' : 'destructive'}>
                            {exam.passed ? '✅ Passed' : '❌ Failed'}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {new Date(exam.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-2xl font-bold">
                              {exam.score}/{exam.totalQuestions}
                            </span>
                            <span className="ml-2 text-lg text-gray-600">
                              ({exam.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            ⏱️ {exam.timeTaken}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/exam/results/${exam.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Category Progress Tab */}
          <TabsContent value="categories" className="space-y-4">
            {categoryProgress.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600">No category data yet</p>
                </CardContent>
              </Card>
            ) : (
              categoryProgress.map((category) => {
                const trendIcon = 
                  category.trend === 'improving' ? '📈' :
                  category.trend === 'declining' ? '📉' : '➡️';
                
                return (
                  <Card key={category.categoryCode}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">
                              {category.categoryName}
                            </CardTitle>
                            <span className="text-xl">{trendIcon}</span>
                          </div>
                          <CardDescription>
                            Code: {category.categoryCode} • {category.questionsAttempted} questions attempted
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "text-2xl font-bold",
                            category.accuracy >= 80 ? "text-green-600" :
                            category.accuracy >= 60 ? "text-orange-600" : "text-red-600"
                          )}>
                            {category.accuracy.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Progress value={category.accuracy} />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild className="flex-1">
                          <Link href={`/practice/${category.categoryCode}`}>
                            Practice
                          </Link>
                        </Button>
                        {category.accuracy < 70 && (
                          <Button variant="outline" size="sm" asChild className="flex-1">
                            <Link href={`/lessons?category=${category.categoryCode}`}>
                              Study
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>

        {/* Motivation Card */}
        {overallStats.totalExams > 0 && (
          <Card className="border-2 border-primary bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle>Keep Going! 🚀</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                {overallStats.averageScore >= 82
                  ? "Great job! You're consistently passing. Keep practicing to maintain your skills!"
                  : "You're making progress! Keep practicing and you'll reach the pass threshold soon."}
              </p>
              <Button asChild>
                <Link href="/exam">Take Another Exam</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
