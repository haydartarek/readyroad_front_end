'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import apiClient from '@/lib/api';
import { EXAM_RULES } from '@/lib/constants';

export default function ExamRulesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartExam = async () => {
    try {
      setIsStarting(true);
      setError(null);

      // Check if user can start exam
      const canStartResponse = await apiClient.get<{ canStart: boolean; message?: string }>(
        `/exams/simulations/can-start?userId=${user?.id}`
      );

      if (!canStartResponse.data.canStart) {
        setError(canStartResponse.data.message || 'You cannot start an exam at this time.');
        setIsStarting(false);
        return;
      }

      // Create exam simulation via API
      const response = await apiClient.post<{ examId: number; questions: unknown[] }>(
        '/exams/simulations/start',
        { userId: user?.id }
      );

      const examId = response.data.examId;

      // Store exam data in localStorage for the exam page
      localStorage.setItem('current_exam', JSON.stringify(response.data));

      // Redirect to exam questions page
      router.push(`/exam/${examId}`);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error('Failed to start exam:', error);
      setError(error.response?.data?.message || 'Failed to start exam. Please try again.');
      setIsStarting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            {t('exam.rules.title')}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
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
                <p className="mt-1 text-gray-600">
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
                <p className="mt-1 text-gray-600">
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
                <p className="mt-1 text-gray-600">
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
                <p className="mt-1 text-gray-600">
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
                <p className="mt-1 text-gray-600">
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
                <p className="mt-1 text-gray-600">
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
