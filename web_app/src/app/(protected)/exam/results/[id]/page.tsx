'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExamStats } from '@/components/exam/exam-stats';
import { ScoreBreakdown } from '@/components/exam/score-breakdown';
import { QuestionReview } from '@/components/exam/question-review';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { toast } from 'sonner';

interface CategoryBreakdown {
  categoryCode: string;
  categoryName: string;
  correct: number;
  total: number;
  percentage: number;
}

interface IncorrectQuestion {
  questionId: number;
  questionText: string;
  userAnswer: number;
  correctAnswer: number;
  categoryName: string;
}

interface ExamResults {
  examId: number;
  userId: number;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  timeTaken: string;
  categoryBreakdown: CategoryBreakdown[];
  incorrectQuestions: IncorrectQuestion[];
}

interface ReviewQuestion {
  id: number;
  questionText: string;
  imageUrl?: string;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  categoryName: string;
  explanation?: string;
}

export default function ExamResultsPage() {
  const params = useParams();

  // Safe examId extraction with fallback to localStorage
  const paramIdRaw = (params as Record<string, string | string[] | undefined>)?.id;
  const paramId = Array.isArray(paramIdRaw) ? paramIdRaw[0] : paramIdRaw;
  const fromParam = paramId ? parseInt(paramId, 10) : NaN;

  // ✅ Use useMemo to avoid re-reading localStorage on every render
  const fromStorage = useMemo(() => {
    if (typeof window === 'undefined') return NaN;
    try {
      const raw = localStorage.getItem('current_exam');
      if (!raw) return NaN;
      const parsed = JSON.parse(raw);
      return typeof parsed?.examId === 'number' ? parsed.examId : NaN;
    } catch {
      return NaN;
    }
  }, []);

  const examId = Number.isFinite(fromParam) ? fromParam : fromStorage;

  const [results, setResults] = useState<ExamResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    // Guard: validate examId before fetching
    if (!Number.isFinite(examId) || examId <= 0) {
      setIsLoading(false);
      setError('Invalid exam ID');
      return;
    }

    const fetchResults = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<ExamResults>(`/exams/simulations/${examId}/results`);
        setResults(response.data);
        setError(null);
      } catch (err) {
        logApiError('Failed to fetch results', err);
        if (isServiceUnavailable(err)) {
          setServiceUnavailable(true);
        } else {
          setError('Failed to load exam results');
          toast.error('Failed to load results');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [examId, fetchKey]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-lg text-muted-foreground">Loading results...</p>
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

  if (error || !results) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error || 'Results not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // ✅ Normalize numeric values from API to prevent NaN in calculations/display
  const safeScore = Number.isFinite(Number(results.score)) ? Number(results.score) : 0;
  const safeTotalQuestions = Number.isFinite(Number(results.totalQuestions)) ? Number(results.totalQuestions) : 50;
  const passingScore = 41; // 82% of 50 questions
  const remainingToPass = Math.max(0, passingScore - safeScore);

  // Transform incorrect questions to review format
  const reviewQuestions: ReviewQuestion[] = results.incorrectQuestions.map(q => ({
    id: q.questionId,
    questionText: q.questionText,
    selectedOption: q.userAnswer,
    correctOption: q.correctAnswer,
    isCorrect: false,
    categoryName: q.categoryName,
  }));

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
            <span className="text-2xl">📝</span>
            <span className="font-semibold">Exam Results</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-foreground md:text-4xl">
            {results.passed ? '🎉 Congratulations!' : '💪 Keep Practicing!'}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {results.passed
              ? "You've passed the exam! You're ready for the real test."
              : `You need ${remainingToPass} more correct answers to pass.`}
          </p>
        </div>

        {/* Stats Cards */}
        <ExamStats
          score={safeScore}
          totalQuestions={safeTotalQuestions}
          passed={results.passed}
          passingScore={passingScore}
          timeAnalysis={undefined}
        />

        {/* Category Breakdown */}
        <ScoreBreakdown categoryBreakdown={results.categoryBreakdown} />

        {/* Question Review Tabs */}
        {reviewQuestions.length > 0 && (
          <Tabs defaultValue="wrong" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="wrong">
                Wrong Answers ({reviewQuestions.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All Questions ({results.totalQuestions})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="wrong" className="mt-6">
              <QuestionReview questions={reviewQuestions} showOnlyWrong={true} />
            </TabsContent>
            <TabsContent value="all" className="mt-6">
              <QuestionReview questions={reviewQuestions} showOnlyWrong={false} />
            </TabsContent>
          </Tabs>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>

          {!results.passed && (
            <Button size="lg" variant="outline" asChild>
              <Link href="/analytics/weak-areas">Study Weak Areas</Link>
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
