'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { EXAM_RULES } from '@/lib/constants';

export default function ExamRulesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  const handleStartExam = async () => {
    try {
      setIsStarting(true);
      setError(null);

      // Check if user can start exam
      const canStartResponse = await apiClient.get<{
        canStart: boolean;
        message?: string;
        activeExamId?: number;
        startedAt?: string;
        expiresAt?: string;
      }>(
        `/exams/simulations/can-start?userId=${user?.userId}`
      );

      if (!canStartResponse.data.canStart) {
        // If an exam is already active, go to it instead of blocking the user
        const activeExamId = canStartResponse.data.activeExamId;

        if (activeExamId) {
          // Clear any stale cached exam before redirecting to active one
          localStorage.removeItem('current_exam');
          setIsStarting(false);
          router.push(`/exam/${activeExamId}`);
          return;
        }

        // Fallback: ask backend for the active exam
        try {
          const active = await apiClient.get<{ hasActiveExam: boolean; activeExam: { id: number } }>(
            `/exams/simulations/active`
          );

          if (active.data.hasActiveExam && active.data.activeExam?.id) {
            // Clear any stale cached exam before redirecting to active one
            localStorage.removeItem('current_exam');
            setIsStarting(false);
            router.push(`/exam/${active.data.activeExam.id}`);
            return;
          }
        } catch {
          // ignore and show error below
        }

        setError(canStartResponse.data.message || 'You cannot start an exam at this time.');
        setIsStarting(false);
        return;
      }

      // Create exam simulation via API
      // The /start endpoint returns the full exam data including questions array
      const startResponse = await apiClient.post<{
        examId: number;
        questions: Array<{
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
        }>;
        expiresAt: string;
        startedAt: string;
      }>('/exams/simulations/start', { userId: user?.userId });

      const examId = startResponse.data.examId;

      // Store complete exam data in localStorage (keep backend format for compatibility with [id]/page.tsx normalizer)
      localStorage.setItem('current_exam', JSON.stringify({
        examId: startResponse.data.examId,
        questions: startResponse.data.questions,
        expiresAt: startResponse.data.expiresAt,
        startedAt: startResponse.data.startedAt
      }));

      // Redirect to exam questions page
      router.push(`/exam/${examId}`);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      logApiError('Failed to start exam', err);
      if (isServiceUnavailable(err)) {
        setServiceUnavailable(true);
      } else {
        setError(error.response?.data?.message || 'Failed to start exam. Please try again.');
      }
      setIsStarting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">
            {t('exam.rules.title')}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t('exam.rules.subtitle')}
          </p>
        </div>

        {/* Rules Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              📋 {t('exam.rules.examRules')}
            </CardTitle>
            <CardDescription>
              {t('exam.rules.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Total Questions */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white">
                1
              </div>
              <div>
                <h3 className="font-semibold">
                  {t('exam.rules.totalQuestions')}
                </h3>
                <p className="mt-1 text-muted-foreground">
                  The exam consists of exactly <strong>{EXAM_RULES.TOTAL_QUESTIONS} multiple-choice questions</strong>.
                </p>
              </div>
            </div>

            {/* Time Limit */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white">
                2
              </div>
              <div>
                <h3 className="font-semibold">
                  {t('exam.rules.timeLimit')}
                </h3>
                <p className="mt-1 text-muted-foreground">
                  You have <strong>{EXAM_RULES.DURATION_MINUTES} minutes</strong> to complete the exam.
                  The timer will start immediately when you begin.
                </p>
              </div>
            </div>

            {/* Pass Score */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white">
                3
              </div>
              <div>
                <h3 className="font-semibold">
                  {t('exam.rules.passScore')}
                </h3>
                <p className="mt-1 text-muted-foreground">
                  To pass, you must score at least <strong>{EXAM_RULES.PASS_PERCENTAGE}%</strong>
                  ({EXAM_RULES.MIN_CORRECT_ANSWERS} correct answers or more).
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white">
                4
              </div>
              <div>
                <h3 className="font-semibold">
                  {t('exam.rules.navigation')}
                </h3>
                <p className="mt-1 text-muted-foreground">
                  You can navigate between questions using the <strong>Previous</strong> and <strong>Next</strong> buttons.
                  Use the <strong>Overview</strong> button to see all questions at once.
                </p>
              </div>
            </div>

            {/* Submission */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white">
                5
              </div>
              <div>
                <h3 className="font-semibold">
                  {t('exam.rules.submission')}
                </h3>
                <p className="mt-1 text-muted-foreground">
                  Click <strong>Submit Exam</strong> when you&apos;re done.
                  Unanswered questions will be marked as incorrect.
                  <strong className="text-red-600"> You cannot change answers after submission.</strong>
                </p>
              </div>
            </div>

            {/* Auto Submit */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white">
                6
              </div>
              <div>
                <h3 className="font-semibold">
                  {t('exam.rules.autoSubmit')}
                </h3>
                <p className="mt-1 text-muted-foreground">
                  The exam will be <strong>automatically submitted</strong> when the time expires.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes Alert */}
        <Alert>
          <AlertDescription>
            <p className="font-semibold">⚡ Important Notes:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              <li>Make sure you have a stable internet connection</li>
              <li>Do not refresh the page during the exam</li>
              <li>Close other applications to avoid distractions</li>
              <li>You can only take the exam once per session</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Service Unavailable Banner */}
        {serviceUnavailable && (
          <ServiceUnavailableBanner onRetry={() => { setServiceUnavailable(false); setError(null); }} className="mb-4" />
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            disabled={isStarting}
          >
            Cancel
          </Button>
          <Button
            size="lg"
            onClick={handleStartExam}
            disabled={isStarting}
          >
            {isStarting ? 'Starting...' : 'Start Exam'}
          </Button>
        </div>
      </div>
    </div>
  );
}

