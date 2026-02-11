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
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface Question {
  id: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  imageUrl?: string;
  options: Array<{
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

// Backend API response types
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
  startTime?: string;  // Alternative field name from localStorage
  expiresAt: string;
  questions: BackendQuestion[];
}

// Helper type for mixed Question format (normalized or backend)
type MixedQuestion = Question | BackendQuestion;
type MixedOption = Question['options'][0] | BackendQuestion['options'][0];

// Normalize backend response to frontend format
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
        number: (optIndex + 1) as 1 | 2 | 3,  // Convert array index to option number (1-3)
        textEn: opt.optionTextEn,
        textAr: opt.optionTextAr,
        textNl: opt.optionTextNl,
        textFr: opt.optionTextFr,
      })),
    })),
  };
}

export default function ExamQuestionsPage() {
  const router = useRouter();
  const params = useParams();

  // Safe examId extraction with validation
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
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Track if exam is active (not submitted/expired)
  const isExamActive = useRef(true);
  // Track pending navigation for after exit confirmation
  const pendingNavigation = useRef<string | null>(null);

  // Handle browser back button and beforeunload
  useEffect(() => {
    // Warn before page unload (refresh/close tab)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isExamActive.current) {
        e.preventDefault();
        // Modern browsers require returnValue to be set
        e.returnValue = '';
        return '';
      }
    };

    // Handle browser back button via popstate
    const handlePopState = (e: PopStateEvent) => {
      if (isExamActive.current) {
        // Prevent the back navigation
        e.preventDefault();
        // Push current state back to prevent navigation
        window.history.pushState(null, '', window.location.href);
        // Show exit confirmation dialog
        setShowExitDialog(true);
      }
    };

    // Push initial state to enable popstate detection
    window.history.pushState(null, '', window.location.href);

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Fetch exam data
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setIsLoading(true);

        // Validate examId before proceeding
        if (!Number.isFinite(examId) || examId <= 0) {
          setIsLoading(false);
          setError('Invalid exam ID');
          toast.error('Invalid exam ID. Please start a new exam.');
          return;
        }

        // First try to get from localStorage (set when starting exam)
        const storedExam = localStorage.getItem('current_exam');
        if (storedExam) {
          const parsedExam = JSON.parse(storedExam) as BackendExamData;
          if (parsedExam.examId === examId) {
            // Normalize backend data to frontend format
            const normalized = normalizeExamData(parsedExam);
            setExamData(normalized);
            setError(null);
            setIsLoading(false);
            return;
          }
        }

        // If not in localStorage, fetch from API using /active endpoint
        // Note: /active returns the exam WITH questions, unlike /{examId}
        const response = await apiClient.get<{
          hasActiveExam: boolean;
          activeExam: BackendExamData;
        }>(`/exams/simulations/active`);

        if (response.data.hasActiveExam && response.data.activeExam) {
          const backendExam = response.data.activeExam;

          // Normalize backend data to frontend format
          const normalized = normalizeExamData(backendExam);

          // If the active exam ID differs from URL, sync the URL to reality
          if (normalized.id !== examId) {
            router.replace(`/exam/${normalized.id}`);
            // Don't return - let the component re-render with correct URL
          }

          setExamData(normalized);
          setError(null);
        } else {
          throw new Error('No active exam found');
        }
      } catch (err) {
        console.error('Failed to fetch exam data:', err);
        setError('Failed to load exam. Please try again.');
        toast.error('Failed to load exam');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExamData();
  }, [examId, router]);

  // Handle answer selection
  const handleAnswerSelect = useCallback(async (optionNumber: number) => {
    if (!examData) return;

    const currentQuestion = examData.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    // Guard: extract and validate questionId (support both normalized and backend format)
    const mixedQuestion = currentQuestion as MixedQuestion;
    const questionId = Number(
      ('id' in mixedQuestion ? mixedQuestion.id : null) ??
      ('questionId' in mixedQuestion ? mixedQuestion.questionId : null)
    );
    if (!Number.isFinite(questionId)) {
      console.error('Invalid question ID', { currentQuestion });
      toast.error('Invalid question ID');
      return;
    }

    const safeExamId = Number(examId);
    if (!Number.isFinite(safeExamId)) {
      console.error('Invalid exam ID', { examId });
      toast.error('Invalid exam ID');
      return;
    }

    // ✅ Normalize options numbers (same logic as QuestionCard)
    const normalizedOptions = (mixedQuestion.options as MixedOption[])?.map((opt: MixedOption, idx: number) => {
      const n = Number(
        ('number' in opt ? opt.number : null) ??
        ('optionId' in opt ? opt.optionId : null) ??
        idx + 1
      );
      return { ...opt, __n: n };
    }) ?? [];

    const selectedOption = normalizedOptions.find((opt) => opt.__n === optionNumber);
    if (!selectedOption) {
      console.error('Invalid option selected', { optionNumber, normalizedOptions });
      toast.error('Invalid option');
      return;
    }

    // Update local state immediately for UI responsiveness
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionNumber,
    }));

    // Submit answer to backend - keep original API contract
    try {
      await apiClient.post(`/exams/simulations/${safeExamId}/questions/${questionId}/answer`, {
        answer: optionNumber,
      });
    } catch (err) {
      console.error('Failed to save answer:', err);
      toast.error('Failed to save answer');
    }
  }, [examData, currentQuestionIndex, examId]);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    if (!examData) return;
    setCurrentQuestionIndex(prev => Math.min(examData.questions.length - 1, prev + 1));
  }, [examData]);

  const handleQuestionSelect = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
  }, []);

  // Time expired handler
  const handleTimeExpired = useCallback(async () => {
    // Mark exam as inactive to allow navigation
    isExamActive.current = false;
    toast.warning('Time is up! Exam completed.');
    if (!examData) return;

    // Clear stored exam data
    localStorage.removeItem('current_exam');

    // Redirect to results - the backend already has all the answers
    router.push(`/exam/results/${examId}`);
  }, [examId, examData, router]);

  // Handle exit dialog actions
  const handleExitStay = useCallback(() => {
    // User chose to stay - do nothing, dialog will close
    pendingNavigation.current = null;
  }, []);

  const handleExitLeave = useCallback(() => {
    // Mark exam as inactive to allow navigation
    isExamActive.current = false;
    // Navigate back
    router.back();
  }, [router]);

  // Submit exam
  const submitExam = async () => {
    if (!examData) return;

    try {
      setIsSubmitting(true);

      // Mark exam as inactive to allow navigation
      isExamActive.current = false;

      // Clear stored exam data
      localStorage.removeItem('current_exam');

      toast.success('Exam submitted successfully!');
      router.push(`/exam/results/${examId}`);
    } catch (err) {
      console.error('Failed to submit exam:', err);
      toast.error('Failed to submit exam. Please try again.');
      setIsSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  const handleSubmitClick = () => {
    setShowSubmitDialog(true);
  };

  const handleSubmitConfirm = async () => {
    await submitExam();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-lg text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !examData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            {error || 'Exam not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentQuestion = examData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === examData.questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Timer */}
            <ExamTimer
              expiresAt={new Date(examData.expiresAt)}
              onTimeExpired={handleTimeExpired}
            />

            {/* Question Counter */}
            <div className="rounded-full bg-white px-6 py-2 font-semibold shadow-sm">
              Question {currentQuestionIndex + 1} of {examData.questions.length}
            </div>
          </div>

          {/* Progress Bar */}
          <ProgressBar
            current={currentQuestionIndex + 1}
            total={examData.questions.length}
          />

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
            onSubmit={handleSubmitClick}
            isLastQuestion={isLastQuestion}
          />

          {/* Stats Bar */}
          <div className="flex justify-center gap-6 text-sm text-gray-600">
            <div>
              <span className="font-semibold text-green-600">{answeredCount}</span> Answered
            </div>
            <div>
              <span className="font-semibold text-gray-400">
                {examData.questions.length - answeredCount}
              </span>{' '}
              Unanswered
            </div>
          </div>
        </div>
      </div>

      {/* Overview Dialog */}
      <OverviewDialog
        open={showOverview}
        onOpenChange={setShowOverview}
        questions={examData.questions}
        answers={answers}
        currentIndex={currentQuestionIndex}
        onQuestionSelect={handleQuestionSelect}
      />

      {/* Submit Confirm Dialog */}
      <SubmitConfirmDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        answeredCount={answeredCount}
        totalQuestions={examData.questions.length}
        onConfirm={handleSubmitConfirm}
        isSubmitting={isSubmitting}
      />

      {/* Exit Confirm Dialog */}
      <ExitConfirmDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onStay={handleExitStay}
        onLeave={handleExitLeave}
      />
    </div>
  );
}
