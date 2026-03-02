'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import Link from 'next/link';
import {
  Trophy, Target, Flame, Star,
  TrendingUp, TrendingDown, Minus,
  BookOpen, PenLine, ExternalLink, RefreshCw, Rocket
} from 'lucide-react';

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

function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">📈</div>
        </div>
        <p className="text-base text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

function TrendIcon({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
  if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setIsLoading(true);
        const [overallResponse, categoriesResponse] = await Promise.all([
          apiClient.get<{
            totalAttempts: number;
            correctAnswers: number;
            overallAccuracy: number;
            masteryLevel: string;
            weakCategories: string[];
            strongCategories: string[];
            studyStreak: number;
            lastActivityDate: string | null;
          }>('/users/me/progress/overall'),
          apiClient.get<Array<{
            categoryCode: string;
            categoryName: string;
            totalAttempted: number;
            totalCorrect: number;
            accuracy: number;
            masteryLevel: string;
            lastPracticed: string | null;
          }>>('/users/me/progress/categories'),
        ]);

        const overall = overallResponse.data;
        const categories = categoriesResponse.data;

        setData({
          overallStats: {
            totalExams: overall.totalAttempts,
            totalQuestions: overall.totalAttempts,
            averageScore: overall.overallAccuracy,
            passRate: overall.overallAccuracy >= 82 ? 100 : (overall.overallAccuracy / 82) * 100,
            currentStreak: overall.studyStreak,
            bestScore: overall.overallAccuracy,
          },
          examHistory: [],
          categoryProgress: categories.map(cat => ({
            categoryCode: cat.categoryCode,
            categoryName: cat.categoryName,
            questionsAttempted: cat.totalAttempted,
            correctAnswers: cat.totalCorrect,
            accuracy: cat.accuracy,
            trend: cat.accuracy >= 70 ? 'improving' : cat.accuracy >= 50 ? 'stable' : 'declining',
          })),
        });
        setError(null);
      } catch (err) {
        logApiError('Failed to fetch progress', err);
        if (isServiceUnavailable(err)) {
          setServiceUnavailable(true);
        } else {
          setData({
            overallStats: { totalExams: 0, totalQuestions: 0, averageScore: 0, passRate: 0, currentStreak: 0, bestScore: 0 },
            examHistory: [],
            categoryProgress: [],
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProgress();
  }, [fetchKey]);

  if (isLoading) return <LoadingSpinner message="Loading your progress..." />;

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

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="text-6xl">⚠️</div>
          <Alert variant="destructive">
            <AlertDescription>{error || 'Progress data not found'}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => { setError(null); setFetchKey(k => k + 1); }} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { overallStats, examHistory, categoryProgress } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="container mx-auto max-w-6xl px-4 py-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-primary border border-primary/20 shadow-sm">
            <TrendingUp className="w-4 h-4" />
            <span className="font-semibold text-sm">Progress Tracker</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Your Progress</h1>
          <p className="text-lg text-muted-foreground">Track your improvement and stay motivated</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            {
              icon: <Trophy className="w-5 h-5" />,
              label: 'Exams Taken',
              value: overallStats.totalExams,
              sub: `${overallStats.totalQuestions} questions`,
              color: 'text-yellow-500', bg: 'bg-yellow-500/10',
            },
            {
              icon: <Target className="w-5 h-5" />,
              label: 'Average Score',
              value: `${overallStats.averageScore.toFixed(1)}%`,
              sub: `Best: ${overallStats.bestScore}%`,
              color: 'text-blue-500', bg: 'bg-blue-500/10',
            },
            {
              icon: <Star className="w-5 h-5" />,
              label: 'Pass Rate',
              value: `${overallStats.passRate.toFixed(0)}%`,
              sub: 'of all exams',
              color: 'text-green-500', bg: 'bg-green-500/10',
            },
            {
              icon: <Flame className="w-5 h-5" />,
              label: 'Study Streak',
              value: `${overallStats.currentStreak}`,
              sub: 'days in a row',
              color: 'text-orange-500', bg: 'bg-orange-500/10',
            },
          ].map((stat, i) => (
            <Card key={i} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.sub}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history" className="space-y-5">
          <TabsList className="grid w-full grid-cols-2 rounded-xl h-12">
            <TabsTrigger value="history" className="rounded-lg font-semibold">
              📋 Exam History
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg font-semibold">
              📊 Category Progress
            </TabsTrigger>
          </TabsList>

          {/* Exam History */}
          <TabsContent value="history" className="space-y-3">
            {examHistory.length === 0 ? (
              <Card className="border border-border/50">
                <CardContent className="py-14 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto text-4xl">
                    📋
                  </div>
                  <div>
                    <p className="font-bold text-lg">No exam history yet</p>
                    <p className="text-sm text-muted-foreground">Take your first exam to see your history here</p>
                  </div>
                  <Button asChild className="shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform">
                    <Link href="/exam">Take Your First Exam</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              examHistory.map((exam) => (
                <Card key={exam.id} className="border border-border/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${exam.passed ? 'bg-green-500' : 'bg-destructive'}`}>
                          {exam.percentage.toFixed(0)}%
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={exam.passed ? 'default' : 'destructive'} className="text-xs">
                              {exam.passed ? '✅ Passed' : '❌ Failed'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(exam.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="font-bold">
                            {exam.score}/{exam.totalQuestions}{' '}
                            <span className="font-normal text-muted-foreground text-sm">correct answers</span>
                          </p>
                          <p className="text-xs text-muted-foreground">⏱️ {exam.timeTaken}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild className="gap-1 flex-shrink-0">
                        <Link href={`/exam/results/${exam.id}`}>
                          <ExternalLink className="w-3.5 h-3.5" />
                          Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Category Progress */}
          <TabsContent value="categories" className="space-y-3">
            {categoryProgress.length === 0 ? (
              <Card className="border border-border/50">
                <CardContent className="py-14 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto text-4xl">
                    📊
                  </div>
                  <div>
                    <p className="font-bold text-lg">No category data yet</p>
                    <p className="text-sm text-muted-foreground">Start practicing to see your progress by category</p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href="/practice">Start Practicing</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              categoryProgress.map((cat) => (
                <Card key={cat.categoryCode} className="border border-border/40 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-black">{cat.categoryName}</CardTitle>
                          <TrendIcon trend={cat.trend} />
                        </div>
                        <CardDescription className="text-xs mt-0.5">
                          {cat.categoryCode} • {cat.questionsAttempted} questions attempted
                        </CardDescription>
                      </div>
                      <span className={cn(
                        'text-2xl font-black',
                        cat.accuracy >= 80 ? 'text-green-600' :
                        cat.accuracy >= 60 ? 'text-orange-500' : 'text-destructive'
                      )}>
                        {cat.accuracy.toFixed(1)}%
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-1">
                      <Progress
                        value={cat.accuracy}
                        className={cn(
                          'h-2',
                          cat.accuracy >= 80 ? '[&>div]:bg-green-500' :
                          cat.accuracy >= 60 ? '[&>div]:bg-orange-500' : '[&>div]:bg-destructive'
                        )}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{cat.correctAnswers} correct</span>
                        <span>{cat.questionsAttempted - cat.correctAnswers} wrong</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1 gap-1 hover:bg-primary/5 hover:border-primary/30 transition-all">
                        <Link href={`/practice/${cat.categoryCode}`}>
                          <PenLine className="w-3.5 h-3.5" />
                          Practice
                        </Link>
                      </Button>
                      {cat.accuracy < 70 && (
                        <Button variant="outline" size="sm" asChild className="flex-1 gap-1 hover:bg-primary/5 hover:border-primary/30 transition-all">
                          <Link href={`/lessons?category=${cat.categoryCode}`}>
                            <BookOpen className="w-3.5 h-3.5" />
                            Study
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Motivation Card */}
        {overallStats.totalExams > 0 && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-6 text-white shadow-lg shadow-primary/25">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5" />
                  <h2 className="text-xl font-black">Keep Going!</h2>
                </div>
                <p className="text-white/80 text-sm max-w-md">
                  {overallStats.averageScore >= 82
                    ? "Great job! You're consistently passing. Keep practicing to maintain your skills!"
                    : "You're making progress! Keep practicing and you'll reach the pass threshold soon."}
                </p>
              </div>
              <Button
                asChild
                className="bg-white text-primary hover:bg-white/90 font-bold shadow-md flex-shrink-0 hover:scale-[1.02] transition-all duration-200"
                size="lg"
              >
                <Link href="/exam">Take Another Exam</Link>
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
