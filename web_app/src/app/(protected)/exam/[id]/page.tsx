'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ExamTimer } from '@/components/exam/exam-timer';
import { QuestionCard } from '@/components/exam/question-card';
import { ProgressBar } from '@/components/exam/progress-bar';
import { QuestionNavigator } from '@/components/exam/question-navigator';
import { OverviewDialog } from '@/components/exam/overview-dialog';
import { SubmitConfirmDialog } from '@/components/exam/submit-confirm-dialog';
import { ExitConfirmDialog } from '@/components/exam/exit-confirm-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { toast } from 'sonner';
import { RefreshCw, CheckCircle2, Circle, LayoutGrid } from 'lucide-react';

interface Question {
  id: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  imageUrl?: string;
  options: Array<{
    id: number;        // database ID from quiz_answer_options
    number: 1 | 2 | 3;
    textEn: string;
    textAr: string;
    textNl: string;
    textFr: string;
  }>;
}

interface ExamData {
  id: number;
  createdAt: string;
  expiresAt: string;
  questions: Question[];
}

interface BackendQuestion {
  questionId: number;
  questionOrder?: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  imageUrl?: string;
  options: Array<{
    optionId: number;
    optionTextEn: string;
    optionTextAr: string;
    optionTextNl: string;
    optionTextFr: string;
  }>;
}

interface BackendExamData {
  examId: number;
  startedAt?: string;
  startTime?: string;
  expiresAt: string;
  questions: BackendQuestion[];
}


function normalizeExamData(backendData: BackendExamData): ExamData {
  return {
    id: backendData.examId,
    createdAt: backendData.startedAt || backendData.startTime || new Date().toISOString(),
    expiresAt: backendData.expiresAt,
    questions: backendData.questions.map((q) => ({
      id: q.questionId,
      questionTextEn: q.questionTextEn,
      questionTextAr: q.questionTextAr,
      questionTextNl: q.questionTextNl,
      questionTextFr: q.questionTextFr,
      imageUrl: q.imageUrl,
      options: q.options.slice(0, 3).map((opt, optIndex) => ({
        id:     opt.optionId,                   // preserve DB option ID
        number: (optIndex + 1) as 1 | 2 | 3,
        textEn: opt.optionTextEn,
        textAr: opt.optionTextAr,
        textNl: opt.optionTextNl,
        textFr: opt.optionTextFr,
      })),
    })),
  };
}

function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">📝</div>
        </div>
        <p className="text-base text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

export default function ExamQuestionsPage() {
  const router = useRouter();
  const params = useParams();

  const paramIdRaw = (params as Record<string, string | string[] | undefined>)?.id;
  const paramId = Array.isArray(paramIdRaw) ? paramIdRaw[0] : paramIdRaw;
  const examId = paramId ? parseInt(paramId, 10) : NaN;

  const [examData, setExamData] = useState<ExamData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showOverview, setShowOverview] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const isExamActive = useRef(true);
  const pendingNavigation = useRef<string | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isExamActive.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    const handlePopState = (e: PopStateEvent) => {
      if (isExamActive.current) {
        e.preventDefault();
        window.history.pushState(null, '', window.location.href);
        setShowExitDialog(true);
      }
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setIsLoading(true);
        if (!Number.isFinite(examId) || examId <= 0) {
          setIsLoading(false);
          setError('Invalid exam ID');
          toast.error('Invalid exam ID. Please start a new exam.');
          return;
        }
        const storedExam = localStorage.getItem('current_exam');
        if (storedExam) {
          const parsedExam = JSON.parse(storedExam) as BackendExamData;
          if (parsedExam.examId === examId) {
            setExamData(normalizeExamData(parsedExam));
            setError(null);
            setIsLoading(false);
            return;
          }
        }
        const response = await apiClient.get<{
          hasActiveExam: boolean;
          activeExam: BackendExamData;
        }>(`/exams/simulations/active`);

        if (response.data.hasActiveExam && response.data.activeExam) {
          const normalized = normalizeExamData(response.data.activeExam);
          if (normalized.id !== examId) router.replace(`/exam/${normalized.id}`);
          setExamData(normalized);
          setError(null);
        } else {
          throw new Error('No active exam found');
        }
      } catch (err) {
        logApiError('Failed to fetch exam data', err);
        if (isServiceUnavailable(err)) setServiceUnavailable(true);
        else {
          setError('Failed to load exam. Please try again.');
          toast.error('Failed to load exam');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchExamData();
  }, [examId, router, fetchKey]);

  const handleAnswerSelect = useCallback(async (optionNumber: number) => {
    if (!examData) return;
    const currentQuestion = examData.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const questionId = currentQuestion.id;
    if (!Number.isFinite(questionId)) { toast.error('Invalid question ID'); return; }

    const safeExamId = Number(examId);
    if (!Number.isFinite(safeExamId)) { toast.error('Invalid exam ID'); return; }

    // Find the selected option to get its real database ID (required by backend)
    const selectedOption = currentQuestion.options.find(opt => opt.number === optionNumber);
    if (!selectedOption) { toast.error('Invalid option'); return; }

    const selectedOptionId = selectedOption.id;
    if (!selectedOptionId) { toast.error('Option ID not found'); return; }

    // Optimistically update local UI state
    setAnswers(prev => ({ ...prev, [questionId]: optionNumber }));

    try {
      // Backend expects { selectedOptionId: Long } — the actual DB row ID
      await apiClient.post(`/exams/simulations/${safeExamId}/questions/${questionId}/answer`, {
        selectedOptionId,
      });
    } catch (err) {
      logApiError('Failed to save answer', err);
      if (!isServiceUnavailable(err)) toast.error('Failed to save answer');
    }
  }, [examData, currentQuestionIndex, examId]);

  const handlePrevious = useCallback(() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1)), []);
  const handleNext = useCallback(() => {
    if (!examData) return;
    setCurrentQuestionIndex(prev => Math.min(examData.questions.length - 1, prev + 1));
  }, [examData]);
  const handleQuestionSelect = useCallback((index: number) => setCurrentQuestionIndex(index), []);

  const handleTimeExpired = useCallback(async () => {
    isExamActive.current = false;
    toast.warning('Time is up! Exam completed.');
    if (!examData) return;
    localStorage.removeItem('current_exam');
    router.push(`/exam/results/${examId}`);
  }, [examId, examData, router]);

  const handleExitStay = useCallback(() => { pendingNavigation.current = null; }, []);
  const handleExitLeave = useCallback(() => { isExamActive.current = false; router.back(); }, [router]);

  const submitExam = async () => {
    if (!examData) return;
    try {
      setIsSubmitting(true);
      isExamActive.current = false;

      // Mark exam as COMPLETED in backend — calculates & persists final score
      await apiClient.post(`/exams/simulations/${examId}/submit`);

      localStorage.removeItem('current_exam');
      toast.success('Exam submitted successfully!');
      router.push(`/exam/results/${examId}`);
    } catch (err) {
      logApiError('Failed to submit exam', err);
      isExamActive.current = true; // re-enable guard so user can retry
      if (!isServiceUnavailable(err)) toast.error('Failed to submit exam. Please try again.');
      setIsSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading your exam..." />;

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

  if (error || !examData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="text-6xl">⚠️</div>
          <Alert variant="destructive">
            <AlertDescription>{error || 'Exam not found'}</AlertDescription>
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

  const currentQuestion = examData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === examData.questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = examData.questions.length - answeredCount;
  const progressPercent = Math.round((answeredCount / examData.questions.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="space-y-5">

          {/* Top Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ExamTimer
              expiresAt={new Date(examData.expiresAt)}
              onTimeExpired={handleTimeExpired}
            />

            {/* Question counter badge */}
            <div className="flex items-center gap-2 rounded-2xl bg-card border border-border/50 px-5 py-2 shadow-sm">
              <span className="text-sm text-muted-foreground">Question</span>
              <span className="text-lg font-black text-primary">{currentQuestionIndex + 1}</span>
              <span className="text-sm text-muted-foreground">of</span>
              <span className="text-lg font-black">{examData.questions.length}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <ProgressBar
            current={currentQuestionIndex + 1}
            total={examData.questions.length}
          />

          {/* Stats Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-card border border-border/40 px-4 py-2.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Answered</p>
                <p className="text-base font-black text-green-600">{answeredCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-card border border-border/40 px-4 py-2.5 shadow-sm">
              <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="text-base font-black text-muted-foreground">{unansweredCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-card border border-border/40 px-4 py-2.5 shadow-sm">
              <LayoutGrid className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-base font-black text-primary">{progressPercent}%</p>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={answers[currentQuestion.id]}
            onAnswerSelect={handleAnswerSelect}
          />

          {/* Navigation */}
          <QuestionNavigator
            currentIndex={currentQuestionIndex}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onOverview={() => setShowOverview(true)}
            onSubmit={() => setShowSubmitDialog(true)}
            isLastQuestion={isLastQuestion}
          />

        </div>
      </div>

      <OverviewDialog
        open={showOverview}
        onOpenChange={setShowOverview}
        questions={examData.questions}
        answers={answers}
        currentIndex={currentQuestionIndex}
        onQuestionSelect={handleQuestionSelect}
      />

      <SubmitConfirmDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        answeredCount={answeredCount}
        totalQuestions={examData.questions.length}
        onConfirm={submitExam}
        isSubmitting={isSubmitting}
      />

      <ExitConfirmDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onStay={handleExitStay}
        onLeave={handleExitLeave}
      />
    </div>
  );
}
