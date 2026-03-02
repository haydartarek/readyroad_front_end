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
import { RefreshCw, LayoutDashboard, BookOpen, BarChart2, RotateCcw } from 'lucide-react';

// ─── Backend DTO interfaces (exact field names from ExamResultsDTO) ───────────

interface BackendCategoryBreakdown {
  categoryId: number;
  categoryCode: string;
  categoryNameEn: string;
  categoryNameAr: string;
  categoryNameNl: string;
  categoryNameFr: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracyPercentage: number;
  performanceLevel: string;
  isWeakArea: boolean;
}

interface BackendIncorrectQuestion {
  questionId: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  selectedOptionId: number;
  selectedOptionText: string;
  correctOptionId: number;
  correctOptionText: string;
  explanationEn: string;
  explanationAr: string;
  explanationNl: string;
  explanationFr: string;
  categoryName: string;
  categoryCode: string;
  contentImageUrl?: string;
  typicalErrorType?: string;
}

interface ExamResults {
  examId: number;
  userId: number;
  completedAt: string;
  // Score Summary
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  scorePercentage: number;
  passed: boolean;
  // Belgian Standard
  passingScore: number;
  passingThreshold: number;
  pointsToPass: number;
  // Time Stats
  timeTakenSeconds: number;
  averageTimePerQuestion: number;
  durationMinutes?: number;
  // Answer Stats
  answeredCount: number;
  unansweredCount: number;
  resultStatus: string;
  // Advice
  weakCategories: string[];
  recommendedAction: string;
  // Detailed breakdown
  categoryBreakdown: BackendCategoryBreakdown[];
  incorrectQuestions: BackendIncorrectQuestion[];
}

// ─── Props shape for ScoreBreakdown component ─────────────────────────────────

interface NormalizedCategory {
  categoryCode: string;
  categoryName: string;
  correct: number;
  total: number;
  percentage: number;
}

// ─── Props shape for QuestionReview component ─────────────────────────────────

interface ReviewQuestion {
  id: number;
  questionText: string;
  imageUrl?: string;
  selectedOption: number;
  correctOption: number;
  selectedOptionText?: string;
  correctOptionText?: string;
  isCorrect: boolean;
  categoryName: string;
  explanation?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">📊</div>
        </div>
        <p className="text-base text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExamResultsPage() {
  const params = useParams();

  const paramIdRaw = (params as Record<string, string | string[] | undefined>)?.id;
  const paramId = Array.isArray(paramIdRaw) ? paramIdRaw[0] : paramIdRaw;
  const fromParam = paramId ? parseInt(paramId, 10) : NaN;

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

  const [results, setResults]               = useState<ExamResults | null>(null);
  const [isLoading, setIsLoading]           = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey]             = useState(0);

  useEffect(() => {
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
        if (isServiceUnavailable(err)) setServiceUnavailable(true);
        else {
          setError('Failed to load exam results');
          toast.error('Failed to load results');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [examId, fetchKey]);

  if (isLoading) return <LoadingSpinner message="Loading your results..." />;

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

  if (error || !results) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="text-6xl">⚠️</div>
          <Alert variant="destructive">
            <AlertDescription>{error || 'Results not found'}</AlertDescription>
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

  // ── Derive display values from backend fields ─────────────────────────────
  const safeScore         = Number.isFinite(results.correctAnswers)  ? results.correctAnswers  : 0;
  const safeTotalQuestions = Number.isFinite(results.totalQuestions) ? results.totalQuestions  : 50;
  const safePercentage    = Number.isFinite(results.scorePercentage) ? results.scorePercentage : 0;
  const passingScore      = results.passingScore ?? results.passingThreshold ?? 41;
  const scorePercent      = Math.round(safePercentage);

  // ── Normalize categoryBreakdown to match ScoreBreakdown component's interface
  const normalizedCategories: NormalizedCategory[] = (results.categoryBreakdown ?? []).map(cat => ({
    categoryCode: cat.categoryCode ?? '',
    categoryName: cat.categoryNameEn ?? '',
    correct:      cat.correctAnswers ?? 0,
    total:        cat.totalQuestions ?? 0,
    percentage:   cat.accuracyPercentage ?? 0,
  }));

  // ── Normalize incorrectQuestions to match QuestionReview interface ──────────
  const reviewQuestions: ReviewQuestion[] = (results.incorrectQuestions ?? []).map(q => ({
    id:                 q.questionId,
    questionText:       q.questionTextEn ?? '',
    imageUrl:           q.contentImageUrl,
    selectedOption:     Number(q.selectedOptionId),
    correctOption:      Number(q.correctOptionId),
    selectedOptionText: q.selectedOptionText,   // Full text of the user's selected answer
    correctOptionText:  q.correctOptionText,    // Full text of the correct answer
    isCorrect:          false,
    categoryName:       q.categoryName ?? '',
    explanation:        q.explanationEn,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="container mx-auto max-w-6xl px-4 py-12 space-y-8">

        {/* ── Result Hero ─────────────────────────────────────────────────── */}
        <div className={`relative overflow-hidden rounded-3xl px-6 py-10 text-center shadow-lg border ${
          results.passed
            ? 'bg-gradient-to-br from-green-500/10 via-green-500/5 to-background border-green-500/20'
            : 'bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-background border-orange-500/20'
        }`}>
          {/* decorative circles */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-current opacity-5 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-current opacity-5 translate-y-1/2 -translate-x-1/2" />

          <div className="relative space-y-3">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold border ${
              results.passed
                ? 'bg-green-500/15 text-green-600 border-green-500/25'
                : 'bg-orange-500/15 text-orange-600 border-orange-500/25'
            }`}>
              <span>{results.passed ? '✅' : '📝'}</span>
              <span>Exam Results</span>
            </div>

            {/* Score Circle */}
            <div className={`mx-auto w-28 h-28 rounded-full flex flex-col items-center justify-center border-4 shadow-lg ${
              results.passed
                ? 'border-green-500 bg-green-500/10'
                : 'border-orange-500 bg-orange-500/10'
            }`}>
              <span className={`text-3xl font-black ${results.passed ? 'text-green-600' : 'text-orange-600'}`}>
                {scorePercent}%
              </span>
              <span className="text-xs text-muted-foreground">{safeScore}/{safeTotalQuestions}</span>
            </div>

            <h1 className="text-4xl font-black tracking-tight">
              {results.passed ? '🎉 Congratulations!' : '💪 Keep Practicing!'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              {results.passed
                ? "You've passed the exam! You're ready for the real test."
                : `You need ${results.pointsToPass ?? 0} more correct answer${(results.pointsToPass ?? 0) !== 1 ? 's' : ''} to pass.`}
            </p>

            {/* Recommendation */}
            {results.recommendedAction && (
              <p className="text-sm text-muted-foreground italic max-w-lg mx-auto">
                {results.recommendedAction}
              </p>
            )}
          </div>
        </div>

        {/* ── Stats card ──────────────────────────────────────────────────── */}
        <ExamStats
          score={safeScore}
          totalQuestions={safeTotalQuestions}
          passed={results.passed}
          passingScore={passingScore}
          timeAnalysis={undefined}
        />

        {/* ── Category Breakdown ──────────────────────────────────────────── */}
        {normalizedCategories.length > 0 && (
          <ScoreBreakdown categoryBreakdown={normalizedCategories} />
        )}

        {/* ── Question Review Tabs ────────────────────────────────────────── */}
        {reviewQuestions.length > 0 && (
          <Tabs defaultValue="wrong" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl h-12">
              <TabsTrigger value="wrong" className="rounded-lg font-semibold">
                ❌ Wrong Answers ({reviewQuestions.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="rounded-lg font-semibold">
                📋 All Questions ({results.totalQuestions})
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

        {/* ── Action Buttons ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            size="lg"
            asChild
            className="h-12 shadow-md shadow-primary/20 hover:shadow-lg hover:scale-[1.01] transition-all duration-200"
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>

          {!results.passed && (
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 hover:bg-primary/5 hover:border-primary/30 hover:scale-[1.01] transition-all duration-200"
            >
              <Link href="/analytics/weak-areas" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Study Weak Areas
              </Link>
            </Button>
          )}

          {results.passed && (
            <Button
              size="lg"
              asChild
              className="h-12 shadow-md shadow-primary/20 hover:shadow-lg hover:scale-[1.01] transition-all duration-200"
            >
              <Link href="/exam" className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Take Another Exam
              </Link>
            </Button>
          )}

          <Button
            variant="outline"
            size="lg"
            asChild
            className="h-12 hover:bg-primary/5 hover:border-primary/30 hover:scale-[1.01] transition-all duration-200"
          >
            <Link href={`/analytics/error-patterns?examId=${examId}`} className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              View Error Patterns
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
}
