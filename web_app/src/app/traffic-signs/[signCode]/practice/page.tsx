'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, BookOpen, Trophy } from 'lucide-react';
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

type AnswerHistoryEntry = {
  question: SignQuizQuestion;
  selectedChoiceId: number;
  response: SignPracticeAnswerResponse;
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
  const [answerHistory, setAnswerHistory] = useState<AnswerHistoryEntry[]>([]);
  const [showReview, setShowReview] = useState(false);
  const reviewRef       = useRef<HTMLDivElement | null>(null);
  const actionButtonRef = useRef<HTMLDivElement | null>(null);

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

  const questions   = session?.questions ?? [];
  const total       = questions.length;
  const current     = questions[currentIdx];
  const answeredCnt = currentIdx + (answerState ? 1 : 0);

  // Handle answer submission
  const handleSubmit = useCallback(async () => {
    if (!session || selectedChoice === null || !current || submitting) return;
    const timeTaken = Math.round((Date.now() - startedAt) / 1000);
    setSubmitting(true);
    try {
      const resp = await submitPracticeAnswer(session.sessionId, current.id, selectedChoice, timeTaken);
      setAnswerState({ response: resp, selectedChoiceId: selectedChoice, timeTaken });
      setAnswerHistory(prev => [...prev, { question: current, selectedChoiceId: selectedChoice, response: resp }]);
      if (resp.correct) setCorrectTotal(c => c + 1);
      if (resp.sessionCompleted) setDone(true);
      // Scroll the action button into view so the user sees "Next Question"
      setTimeout(() => actionButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
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
    setAnswerHistory([]);
    setShowReview(false);
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

  // ── Completed Screen — identical layout to exam result page ──
  if (done) {
    const scoreAns = answerHistory.length > 0
      ? answerHistory.filter(e => e.response.correct).length
      : correctTotal;
    const scorePct = total > 0 ? Math.round((scoreAns / total) * 100) : 0;

    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-12 max-w-lg">

          {/* Result card — same as exam */}
          <Card className="rounded-3xl border border-green-200 shadow-md mb-6 text-center bg-white overflow-hidden">
            <div className="h-1 w-full bg-green-400" />
            <CardContent className="px-8 pt-8 pb-7 space-y-5">

              {/* Sign image */}
              <div className="flex justify-center">
                <div className="relative w-20 h-20 rounded-2xl bg-muted/40 border border-border/30 p-2.5 flex items-center justify-center shadow-sm">
                  <SignImage src={sign.imageUrl} alt={sign.nameEn} />
                </div>
              </div>

              {/* Trophy + title */}
              <div className="space-y-2">
                <div className="flex justify-center">
                  <Trophy className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-green-700">
                  {t('sign_quiz.practice.session_complete')}
                </h2>
              </div>

              {/* Score hero */}
              <div className="text-6xl font-black tabular-nums text-green-600">{scorePct}%</div>

              {/* Progress bar */}
              <div className="space-y-1.5 px-2">
                <Progress
                  value={scorePct}
                  className="h-2 rounded-full [&>div]:bg-green-500 [&>div]:transition-all [&>div]:duration-700"
                />
                <p className="text-xs text-muted-foreground/80">
                  {t('sign_quiz.practice.session_score')
                    .replace('{n}', String(scoreAns))
                    .replace('{m}', String(total))}
                </p>
              </div>

              {/* Action buttons — same hierarchy as exam */}
              <div className="flex flex-col gap-2.5 pt-1">
                <Button className="w-full rounded-xl h-10 font-semibold" onClick={handleRestart}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  {t('sign_quiz.practice.try_again')}
                </Button>
                {answerHistory.length > 0 && (
                  <Button
                    variant="secondary"
                    className="w-full rounded-xl h-10 font-medium"
                    onClick={() => {
                      setShowReview(r => !r);
                      setTimeout(() => reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                    }}
                  >
                    {t('sign_quiz.exam.review_answers')}
                  </Button>
                )}
                <Button variant="ghost" className="w-full rounded-xl h-9 text-muted-foreground font-normal" asChild>
                  <Link href={`/traffic-signs/${signCode}`}>
                    {isRTL ? <ArrowRight className="w-4 h-4 mr-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
                    {t('sign_quiz.practice.back_to_sign')}
                  </Link>
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* Answer Review — identical to exam review section */}
          {showReview && (
            <div ref={reviewRef} className="space-y-4 pb-10">
              {answerHistory.map((entry, idx) => {
                const { question, response } = entry;
                const correctChoice = question.choices.find(c => c.id === response.correctChoiceId);
                const correctText   = correctChoice ? cText(correctChoice, lang) : '';
                const expl          = explanationFor(response, lang);

                return (
                  <Card key={question.id} className={cn(
                    'rounded-xl border',
                    response.correct ? 'border-green-300' : 'border-red-300',
                  )}>
                    <CardContent className="pt-4 space-y-2">

                      {/* Sign image + question header */}
                      <div className="flex items-start gap-3">
                        <div className="relative w-10 h-10 rounded-lg bg-white border border-border/40 p-1 flex items-center justify-center flex-shrink-0">
                          <SignImage src={sign.imageUrl} alt={sign.nameEn} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs text-muted-foreground font-semibold">
                              {t('sign_quiz.exam.question_x').replace('{n}', String(idx + 1))}
                            </span>
                            <Badge className={cn('border text-xs', DIFF_COLORS[question.difficulty] || 'bg-muted text-foreground border-border')}>
                              {t(`sign_quiz.${question.difficulty.toLowerCase()}`)}
                            </Badge>
                            {response.correct
                              ? <Badge className="bg-green-100 text-green-800 border-green-200 border text-xs">{t('sign_quiz.exam.correct_label')}</Badge>
                              : <Badge className="bg-red-100 text-red-800 border-red-200 border text-xs">{t('sign_quiz.exam.wrong_label')}</Badge>}
                          </div>
                          <p className="text-sm font-medium">{qText(question, lang)}</p>
                        </div>
                      </div>

                      {correctText && (
                        <p className="text-sm text-green-700 font-medium">
                          ✓ {t('sign_quiz.exam.correct_answer')}: {correctText}
                        </p>
                      )}
                      {expl && <p className="text-xs text-muted-foreground">{expl}</p>}

                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

        </div>
      </div>
    );
  }

  // ── Question Screen — uses exam visual template ──
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">
              {t('sign_quiz.practice_mode')}
            </span>
            <Badge variant="outline" className="text-xs">
              {answeredCnt}/{total}
            </Badge>
          </div>
        </div>

        {/* Progress bar — same style as exam */}
        <Progress
          value={(answeredCnt / total) * 100}
          className="h-2.5 rounded-full mb-5 [&>div]:transition-all [&>div]:duration-500"
        />

        {/* Sign image — large, prominent (same as exam template: w-52 h-52) */}
        <div className="flex justify-center mb-4">
          <div className="relative w-52 h-52 rounded-2xl bg-white border border-border/50 shadow-lg p-5 flex items-center justify-center">
            <SignImage src={sign.imageUrl} alt={sign.nameEn} />
          </div>
        </div>

        {/* Current question */}
        {current && (
          <Card className="rounded-2xl border-border/50 shadow-sm mb-4">
            <CardHeader>
              <div className="flex items-start gap-3 flex-wrap">
                <Badge className={cn('border text-[10px] font-normal flex-shrink-0 opacity-75', DIFF_COLORS[current.difficulty] || 'bg-muted text-foreground border-border')}>
                  {t(`sign_quiz.${current.difficulty.toLowerCase()}`)}
                </Badge>
                <CardTitle className="text-lg font-semibold leading-snug flex-1">
                  {t('sign_quiz.exam.question_x').replace('{n}', String(currentIdx + 1))}
                  &nbsp;&mdash;&nbsp;
                  {qText(current, lang)}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">

              {/* Choices — radio button style (same as exam) */}
              {current.choices.map(choice => {
                const isSelected = selectedChoice === choice.id;
                const isCorrect  = isAnswered && answerState?.response.correctChoiceId === choice.id;
                const isWrong    = isAnswered && isSelected && !answerState?.response.correct;
                const isNeutral  = isAnswered && !isCorrect && !isWrong;

                return (
                  <button
                    key={choice.id}
                    disabled={isAnswered}
                    onClick={() => !isAnswered && setSelectedChoice(choice.id)}
                    className={cn(
                      'w-full text-start p-4 rounded-xl border-2 transition-all duration-150 font-medium text-sm group flex items-center gap-3',
                      !isAnswered && !isSelected && 'border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm active:scale-[0.99]',
                      !isAnswered && isSelected  && 'border-primary bg-primary/10 shadow-sm scale-[1.01]',
                      isAnswered  && isCorrect   && 'border-green-500 bg-green-50',
                      isAnswered  && isWrong     && 'border-red-400 bg-red-50',
                      isAnswered  && isNeutral   && 'border-border opacity-60',
                    )}
                  >
                    {/* Radio indicator / result icon */}
                    {!isAnswered ? (
                      <span className={cn(
                        'w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all duration-150',
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/40 group-hover:border-primary/60',
                      )} />
                    ) : isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : isWrong ? (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border-2 border-border/40 flex-shrink-0" />
                    )}
                    <span className={cn(
                      'flex-1',
                      isAnswered && isCorrect && 'text-green-800 font-semibold',
                      isAnswered && isWrong   && 'text-red-800',
                    )}>
                      {cText(choice, lang)}
                    </span>
                  </button>
                );
              })}

              {/* Immediate feedback — practice mode differentiator (not in exam) */}
              {isAnswered && (
                <div className={cn(
                  'mt-2 p-4 rounded-xl border',
                  answerState.response.correct
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50',
                )}>
                  <p className={cn('font-bold text-sm mb-1', answerState.response.correct ? 'text-green-700' : 'text-red-700')}>
                    {answerState.response.correct
                      ? `✓ ${t('sign_quiz.exam.correct_label')}`
                      : `✗ ${t('sign_quiz.exam.wrong_label')}`}
                  </p>
                  {explanationFor(answerState.response, lang) && (
                    <p className="text-sm text-muted-foreground">{explanationFor(answerState.response, lang)}</p>
                  )}
                </div>
              )}

              {/* Action button */}
              <div ref={actionButtonRef} className="pt-2">
                {!isAnswered ? (
                  <Button
                    className="w-full rounded-xl shadow-md shadow-primary/20"
                    disabled={selectedChoice === null || submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? t('sign_quiz.exam.submitting') : t('sign_quiz.practice.select_answer')}
                  </Button>
                ) : (
                  <Button
                    className="w-full rounded-xl transition-all duration-200 hover:shadow-md"
                    onClick={handleNext}
                  >
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
