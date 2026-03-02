'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { EXAM_RULES } from '@/lib/constants';
import {
  ClipboardList, Timer, Trophy, Navigation,
  SendHorizonal, AlarmClock, Wifi, RefreshCw,
  XCircle, Play, ArrowLeft,
} from 'lucide-react';

interface CanStartResponse {
  canStart: boolean;
  message?: string;
  activeExamId?: number;
  startedAt?: string;
  expiresAt?: string;
}

interface ActiveExamResponse {
  hasActiveExam: boolean;
  activeExam: { id: number };
}

interface ExamOption {
  optionId: number;
  optionTextEn: string;
  optionTextAr: string;
  optionTextNl: string;
  optionTextFr: string;
}

interface ExamQuestion {
  questionId: number;
  questionOrder?: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  imageUrl?: string;
  options: ExamOption[];
}

interface StartExamResponse {
  examId: number;
  questions: ExamQuestion[];
  expiresAt: string;
  startedAt: string;
}

interface RuleItem {
  icon: ReactNode;
  key: string;
  content: () => ReactNode;
}

interface NoteItem {
  icon: ReactNode;
  text: string;
}

const rules: RuleItem[] = [
  {
    icon: <ClipboardList className="w-5 h-5" />,
    key: 'totalQuestions',
    content: () => (
      <>The exam consists of exactly <strong>{EXAM_RULES.TOTAL_QUESTIONS} multiple-choice questions</strong>.</>
    ),
  },
  {
    icon: <Timer className="w-5 h-5" />,
    key: 'timeLimit',
    content: () => (
      <>You have <strong>{EXAM_RULES.DURATION_MINUTES} minutes</strong> to complete the exam. The timer starts immediately.</>
    ),
  },
  {
    icon: <Trophy className="w-5 h-5" />,
    key: 'passScore',
    content: () => (
      <>To pass, score at least <strong>{EXAM_RULES.PASS_PERCENTAGE}%</strong> ({EXAM_RULES.PASSING_SCORE} correct answers or more).</>
    ),
  },
  {
    icon: <Navigation className="w-5 h-5" />,
    key: 'navigation',
    content: () => (
      <>Navigate with <strong>Previous</strong> and <strong>Next</strong>. Use <strong>Overview</strong> to see all questions at once.</>
    ),
  },
  {
    icon: <SendHorizonal className="w-5 h-5" />,
    key: 'submission',
    content: () => (
      <>
        Click <strong>Submit Exam</strong> when done. Unanswered questions are marked incorrect.{' '}
        <span className="text-destructive font-semibold">You cannot change answers after submission.</span>
      </>
    ),
  },
  {
    icon: <AlarmClock className="w-5 h-5" />,
    key: 'autoSubmit',
    content: () => (
      <>The exam will be <strong>automatically submitted</strong> when the time expires.</>
    ),
  },
];

const importantNotes: NoteItem[] = [
  { icon: <Wifi className="w-4 h-4" />,         text: 'Make sure you have a stable internet connection' },
  { icon: <RefreshCw className="w-4 h-4" />,    text: 'Do not refresh the page during the exam' },
  { icon: <XCircle className="w-4 h-4" />,      text: 'Close other applications to avoid distractions' },
  { icon: <ClipboardList className="w-4 h-4" />, text: 'You can only take the exam once per session' },
];

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

      const canStartResponse = await apiClient.get<CanStartResponse>(
        `/exams/simulations/can-start?userId=${user?.userId}`
      );

      if (!canStartResponse.data.canStart) {
        const activeExamId = canStartResponse.data.activeExamId;

        if (activeExamId) {
          localStorage.removeItem('current_exam');
          router.push(`/exam/${activeExamId}`);
          return;
        }

        try {
          const active = await apiClient.get<ActiveExamResponse>('/exams/simulations/active');
          if (active.data.hasActiveExam && active.data.activeExam?.id) {
            localStorage.removeItem('current_exam');
            router.push(`/exam/${active.data.activeExam.id}`);
            return;
          }
        } catch {
          void 0;
        }

        setError(canStartResponse.data.message ?? 'You cannot start an exam at this time.');
        setIsStarting(false);
        return;
      }

      const startResponse = await apiClient.post<StartExamResponse>(
        '/exams/simulations/start',
        { userId: user?.userId }
      );

      localStorage.setItem('current_exam', JSON.stringify({
        examId:    startResponse.data.examId,
        questions: startResponse.data.questions,
        expiresAt: startResponse.data.expiresAt,
        startedAt: startResponse.data.startedAt,
      }));

      router.push(`/exam/${startResponse.data.examId}`);
    } catch (err) {
      logApiError('Failed to start exam', err);
      if (isServiceUnavailable(err)) {
        setServiceUnavailable(true);
      } else {
        const apiErr = err as { response?: { data?: { message?: string } } };
        setError(apiErr.response?.data?.message ?? 'Failed to start exam. Please try again.');
      }
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="container mx-auto max-w-3xl px-4 py-10 space-y-8">

        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-primary border border-primary/20 shadow-sm">
            <ClipboardList className="w-4 h-4" />
            <span className="font-semibold text-sm">Before You Begin</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            {t('exam.rules.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('exam.rules.subtitle')}
          </p>
        </div>

        <Card className="border border-border/50 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-black">
                  {t('exam.rules.examRules')}
                </CardTitle>
                <CardDescription>{t('exam.rules.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {rules.map((rule, index) => (
              <div
                key={rule.key}
                className="flex items-start gap-4 rounded-xl p-4 bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors duration-200"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm shadow-primary/30">
                  {rule.icon}
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-sm">
                    {t(`exam.rules.${rule.key}`)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {rule.content()}
                  </p>
                </div>
                <div className="ml-auto flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-black text-muted-foreground">
                  {index + 1}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
          <p className="font-bold text-foreground flex items-center gap-2">
            <span>⚡</span> Important Notes
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {importantNotes.map((note, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl bg-background/60 border border-border/30 px-3 py-2.5 text-sm text-muted-foreground"
              >
                <span className="text-primary flex-shrink-0">{note.icon}</span>
                {note.text}
              </div>
            ))}
          </div>
        </div>

        {serviceUnavailable && (
          <ServiceUnavailableBanner
            onRetry={() => { setServiceUnavailable(false); setError(null); }}
          />
        )}
        {error && (
          <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-2 duration-300">
            <AlertDescription>⚠️ {error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            disabled={isStarting}
            className="h-12 px-6 gap-2 hover:bg-muted/50 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            size="lg"
            onClick={handleStartExam}
            disabled={isStarting}
            className="h-12 px-8 gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-200"
          >
            {isStarting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Starting...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Exam
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}
