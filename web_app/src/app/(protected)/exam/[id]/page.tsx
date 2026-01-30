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

export default function ExamQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const examId = parseInt(params.id as string);

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

        // First try to get from localStorage (set when starting exam)
        const storedExam = localStorage.getItem('current_exam');
        if (storedExam) {
          const parsedExam = JSON.parse(storedExam);
          if (parsedExam.examId === examId) {
            setExamData({
              id: parsedExam.examId,
              createdAt: parsedExam.startTime || new Date().toISOString(),
              expiresAt: parsedExam.expiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
              questions: parsedExam.questions || [],
            });
            setError(null);
            setIsLoading(false);
            return;
          }
        }

        // If not in localStorage, fetch from API
        const response = await apiClient.get<ExamData>(`/exams/simulations/${examId}`);
        setExamData(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch exam data:', err);
        setError('Failed to load exam. Please try again.');
        toast.error('Failed to load exam');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExamData();
  }, [examId]);

  // Handle answer selection
  const handleAnswerSelect = useCallback(async (optionNumber: number) => {
    if (!examData) return;

    const currentQuestion = examData.questions[currentQuestionIndex];

    // Update local state immediately for UI responsiveness
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionNumber,
    }));

    // Submit answer to backend
    try {
      await apiClient.post(`/exams/simulations/${examId}/questions/${currentQuestion.id}/answer`, {
        answer: optionNumber,
      });
    } catch (err) {
      console.error('Failed to save answer:', err);
      // Don't show error toast for every answer - just log it
      // The final submission will handle any issues
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
