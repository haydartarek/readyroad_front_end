'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SignImage } from '@/components/traffic-signs/sign-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrafficSign } from '@/lib/types';
import { apiClient, logApiError } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import {
  startPracticeSession,
  submitPracticeAnswer,
  type SignPracticeSession,
  type SignQuizQuestion,
  type SignChoice,
  type SignPracticeAnswerResponse,
} from '@/services';

// ─── Types ──────────────────────────────────────────────

type Lang = 'en' | 'ar' | 'nl' | 'fr';

type AnswerState = {
  response: SignPracticeAnswerResponse;
  selectedChoiceId: number;
  timeTaken: number;
};

// ─── Helpers ────────────────────────────────────────────

function qText(q: SignQuizQuestion, lang: Lang) {
  return q[`question${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof SignQuizQuestion] as string
    || q.questionEn || '';
}

function cText(c: SignChoice, lang: Lang) {
  const key = `text${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof SignChoice;
  return (c[key] as string) || c.textEn || '';
}

function explanationFor(resp: SignPracticeAnswerResponse, lang: Lang): string {
  return resp[`explanation${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof SignPracticeAnswerResponse] as string
    || resp.explanationEn || '';
}

const DIFF_COLORS: Record<string, string> = {
  EASY:   'bg-green-100 text-green-800 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  HARD:   'bg-red-100 text-red-800 border-red-200',
};

// ─── Page ───────────────────────────────────────────────

export default function PracticePage() {
  const { signCode } = useParams<{ signCode: string }>();
  const router = useRouter();
  const { t, language, isRTL } = useLanguage();
  const lang = language as Lang;

  const [sign, setSign]           = useState<TrafficSign | null>(null);
  const [session, setSession]     = useState<SignPracticeSession | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [startedAt, setStartedAt] = useState<number>(Date.now());
  const [correctTotal, setCorrectTotal] = useState(0);
  const [done, setDone]           = useState(false);

  // Init: load sign + start session in parallel
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      apiClient.get<TrafficSign>(API_ENDPOINTS.TRAFFIC_SIGNS.DETAIL(signCode)),
      startPracticeSession(signCode),
    ])
      .then(([signRes, sess]) => {
        if (!cancelled) {
          setSign(signRes.data);
          setSession(sess);
          setStartedAt(Date.now());
        }
      })
      .catch(err => {
        logApiError('Practice session error', err);
        if (!cancelled) setError(t('sign_quiz.error_load'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [signCode]);  // eslint-disable-line react-hooks/exhaustive-deps

  const questions = session?.questions ?? [];
  const total     = questions.length;
  const current   = questions[currentIdx];
  const progress  = total > 0 ? ((currentIdx) / total) * 100 : 0;

  // Handle answer submission
  const handleSubmit = useCallback(async () => {
    if (!session || selectedChoice === null || !current || submitting) return;
    const timeTaken = Math.round((Date.now() - startedAt) / 1000);
    setSubmitting(true);
    try {
      const resp = await submitPracticeAnswer(session.sessionId, current.id, selectedChoice, timeTaken);
      setAnswerState({ response: resp, selectedChoiceId: selectedChoice, timeTaken });
      if (resp.correct) setCorrectTotal(c => c + 1);
      if (resp.sessionCompleted) setDone(true);
    } catch (err) {
      logApiError('Submit answer error', err);
    } finally {
      setSubmitting(false);
      setStartedAt(Date.now()); // reset timer for next question
    }
  }, [session, selectedChoice, current, submitting, startedAt]);

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= total) {
      setDone(true);
    } else {
      setCurrentIdx(i => i + 1);
      setSelectedChoice(null);
      setAnswerState(null);
    }
  }, [currentIdx, total]);

  const handleRestart = useCallback(() => {
    setCurrentIdx(0);
    setSelectedChoice(null);
    setAnswerState(null);
    setCorrectTotal(0);
    setDone(false);
    // Re-init session
    setLoading(true);
    startPracticeSession(signCode)
      .then(sess => { setSession(sess); setStartedAt(Date.now()); })
      .catch(() => setError(t('sign_quiz.error_load')))
      .finally(() => setLoading(false));
  }, [signCode, t]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">{t('sign_quiz.loading')}</p>
      </div>
    );
  }

  // ── Error ──
  if (error || !sign || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground text-center">{error || t('sign_quiz.error_load')}</p>
        <Button variant="outline" onClick={() => router.back()}>
          {isRTL ? <ArrowRight className="w-4 h-4 mr-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
          {t('sign_quiz.practice.back_to_sign')}
        </Button>
      </div>
    );
  }

  // ── Completed Screen ──
  if (done) {
    const finalCorrect = answerState?.response.correct
      ? correctTotal
      : correctTotal;
    const scoreAns = session.correctCount > 0 ? session.correctCount : finalCorrect;
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-b from-muted to-background">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="rounded-2xl border-border/50 text-center shadow-lg">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="relative w-24 h-24 mx-auto rounded-full bg-muted/50 p-3 flex items-center justify-center">
                  <SignImage src={sign.imageUrl} alt={sign.nameEn} />
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-green-700">
                🎉 {t('sign_quiz.practice.session_complete')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-muted-foreground">
                {t('sign_quiz.practice.session_score')
                  .replace('{n}', String(scoreAns))
                  .replace('{m}', String(total))}
              </p>
              <div className="flex items-center justify-center gap-2 text-3xl font-black">
                {Math.round((scoreAns / total) * 100)}%
              </div>
              <Progress value={(scoreAns / total) * 100} className="h-3 rounded-full" />
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button variant="outline" className="rounded-xl" asChild>
                  <Link href={`/traffic-signs/${signCode}`}>
                    {isRTL ? <ArrowRight className="w-4 h-4 mr-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
                    {t('sign_quiz.practice.back_to_sign')}
                  </Link>
                </Button>
                <Button className="rounded-xl" onClick={handleRestart}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  {t('sign_quiz.practice.try_again')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Question Screen ──
  const isAnswered = answerState !== null;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-b from-muted to-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" className="gap-2" asChild>
            <Link href={`/traffic-signs/${signCode}`}>
              {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {t('sign_quiz.practice.back_to_sign')}
            </Link>
          </Button>
          <span className="text-sm font-semibold text-muted-foreground">
            {t('sign_quiz.practice.question_of')
              .replace('{n}', String(currentIdx + 1))
              .replace('{m}', String(total))}
          </span>
        </div>

        {/* Progress bar */}
        <Progress value={progress} className="h-2 rounded-full mb-6" />

        {/* Sign image prominent */}
        <div className="flex justify-center mb-6">
          <div className="relative w-32 h-32 rounded-2xl bg-white border border-border/50 shadow-md p-3 flex items-center justify-center">
            <SignImage src={sign.imageUrl} alt={sign.nameEn} />
          </div>
        </div>

        {/* Question card */}
        {current && (
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-start gap-3 flex-wrap">
                <Badge className={cn('border text-xs flex-shrink-0', DIFF_COLORS[current.difficulty] || 'bg-muted text-foreground border-border')}>
                  {t(`sign_quiz.${current.difficulty.toLowerCase()}`)}
                </Badge>
                <CardTitle className="text-base font-bold leading-snug flex-1">
                  {qText(current, lang)}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">

              {/* Choices */}
              {current.choices.map(choice => {
                const isSelected = selectedChoice === choice.id;
                const isCorrect  = answerState?.response.correctChoiceId === choice.id;
                const isWrong    = isAnswered && isSelected && !answerState?.response.correct;

                return (
                  <button
                    key={choice.id}
                    disabled={isAnswered}
                    onClick={() => !isAnswered && setSelectedChoice(choice.id)}
                    className={cn(
                      'w-full text-start p-4 rounded-xl border-2 transition-all font-medium text-sm',
                      !isAnswered && !isSelected && 'border-border hover:border-primary/50 hover:bg-muted/50',
                      !isAnswered && isSelected && 'border-primary bg-primary/10',
                      isAnswered && isCorrect && 'border-green-500 bg-green-50 text-green-800',
                      isAnswered && isWrong && 'border-red-400 bg-red-50 text-red-800',
                      isAnswered && !isCorrect && !isWrong && 'border-border opacity-60',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />}
                      {isAnswered && isWrong   && <XCircle     className="w-5 h-5 text-red-500 flex-shrink-0" />}
                      <span>{cText(choice, lang)}</span>
                    </div>
                  </button>
                );
              })}

              {/* Feedback after answering */}
              {isAnswered && (
                <div className={cn(
                  'mt-4 p-4 rounded-xl border',
                  answerState.response.correct
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50',
                )}>
                  <p className={cn('font-bold text-sm mb-1', answerState.response.correct ? 'text-green-700' : 'text-red-700')}>
                    {answerState.response.correct ? `✓ ${t('sign_quiz.exam.correct_label')}` : `✗ ${t('sign_quiz.exam.wrong_label')}`}
                  </p>
                  {explanationFor(answerState.response, lang) && (
                    <p className="text-sm text-muted-foreground">{explanationFor(answerState.response, lang)}</p>
                  )}
                  {/* Sign image again in feedback */}
                  <div className="flex justify-center mt-3">
                    <div className="relative w-16 h-16 rounded-lg bg-white border border-border/40 p-1.5 flex items-center justify-center">
                      <SignImage src={sign.imageUrl} alt={sign.nameEn} />
                    </div>
                  </div>
                </div>
              )}

              {/* Action button */}
              <div className="pt-2">
                {!isAnswered ? (
                  <Button
                    className="w-full rounded-xl"
                    disabled={selectedChoice === null || submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? t('sign_quiz.exam.submitting') : t('sign_quiz.practice.select_answer')}
                  </Button>
                ) : (
                  <Button className="w-full rounded-xl" onClick={handleNext}>
                    {currentIdx + 1 < total
                      ? t('sign_quiz.practice.next_question')
                      : t('sign_quiz.practice.session_complete')}
                    {isRTL ? <ArrowLeft className="w-4 h-4 ml-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                )}
              </div>

            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
