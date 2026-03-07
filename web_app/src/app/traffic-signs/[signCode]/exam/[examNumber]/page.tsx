'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
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
import { ArrowLeft, ArrowRight, Lock, CheckCircle2, XCircle, Trophy, AlertCircle } from 'lucide-react';
import {
  getExamQuestions,
  submitExam,
  type SignExamQuestions,
  type SignQuizQuestion,
  type SignChoice,
  type SignExamResult,
} from '@/services';

// ─── Types ──────────────────────────────────────────────

type Lang = 'en' | 'ar' | 'nl' | 'fr';

// ─── Helpers ────────────────────────────────────────────

function qText(q: SignQuizQuestion, lang: Lang) {
  return q[`question${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof SignQuizQuestion] as string
    || q.questionEn || '';
}

function cText(c: SignChoice, lang: Lang) {
  const key = `text${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof SignChoice;
  return (c[key] as string) || c.textEn || '';
}

const DIFF_COLORS: Record<string, string> = {
  EASY:   'bg-green-100 text-green-800 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  HARD:   'bg-red-100 text-red-800 border-red-200',
};

const QUESTION_TIME = 10; // seconds per question

// ─── Page ───────────────────────────────────────────────

export default function ExamPage() {
  const { signCode, examNumber } = useParams<{ signCode: string; examNumber: string }>();
  const examNum = Number(examNumber) as 1 | 2;
  const { t, language, isRTL } = useLanguage();
  const lang = language as Lang;

  const [sign, setSign]                 = useState<TrafficSign | null>(null);
  const [examData, setExamData]         = useState<SignExamQuestions | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [locked, setLocked]             = useState(false);

  // answers: questionId → choiceId
  const [answers, setAnswers]           = useState<Map<number, number>>(new Map());
  const [currentIdx, setCurrentIdx]     = useState(0);
  const [warnUnanswered, setWarnUnanswered] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [result, setResult]             = useState<SignExamResult | null>(null);
  const [showReview, setShowReview]     = useState(false);
  const [timeLeft, setTimeLeft]         = useState(QUESTION_TIME);
  const timerRef                        = useRef<ReturnType<typeof setInterval> | null>(null);
  const reviewRef                       = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLocked(false);

    Promise.all([
      apiClient.get<TrafficSign>(API_ENDPOINTS.TRAFFIC_SIGNS.DETAIL(signCode)),
      getExamQuestions(signCode, examNum),
    ])
      .then(([signRes, exam]) => {
        if (!cancelled) {
          setSign(signRes.data);
          setExamData(exam);
        }
      })
      .catch(err => {
        logApiError('Exam load error', err);
        if (!cancelled) {
          if (err?.response?.status === 423) setLocked(true);
          else setError(t('sign_quiz.error_load'));
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [signCode, examNum]);  // eslint-disable-line react-hooks/exhaustive-deps

  const questions   = examData?.questions ?? [];
  const total       = questions.length;
  const current     = questions[currentIdx];
  const answeredCnt = answers.size;
  const unanswered  = total - answeredCnt;

  const handleSelect = useCallback((questionId: number, choiceId: number) => {
    setAnswers(prev => {
      const next = new Map(prev);
      next.set(questionId, choiceId);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (unanswered > 0) { setWarnUnanswered(true); return; }
    if (!examData || submitting) return;
    setWarnUnanswered(false);
    setSubmitting(true);
    const payload = questions.map(q => ({
      questionId: q.id,
      choiceId:   answers.get(q.id)!,
    }));
    try {
      const res = await submitExam(signCode, examNum, payload);
      setResult(res);
    } catch (err) {
      logApiError('Submit exam error', err);
      setError(t('sign_quiz.error_load'));
    } finally {
      setSubmitting(false);
    }
  }, [unanswered, examData, submitting, questions, answers, signCode, examNum, t]);

  const handleForceSubmit = useCallback(async () => {
    if (!examData || submitting) return;
    setWarnUnanswered(false);
    setSubmitting(true);
    const payload = questions.map(q => ({
      questionId: q.id,
      choiceId:   answers.get(q.id) ?? -1,
    })).filter(a => a.choiceId !== -1);
    try {
      const res = await submitExam(signCode, examNum, payload);
      setResult(res);
    } catch (err) {
      logApiError('Submit exam error', err);
    } finally {
      setSubmitting(false);
    }
  }, [examData, submitting, questions, answers, signCode, examNum]);

  // ── Per-question countdown timer ─────────────────────────────────────────
  useEffect(() => {
    if (!examData || result) return;
    setTimeLeft(QUESTION_TIME);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [currentIdx, examData, result]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (timeLeft !== 0) return;
    if (currentIdx < total - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      handleForceSubmit();
    }
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">{t('sign_quiz.loading')}</p>
      </div>
    );
  }

  // ── Locked ──
  if (locked) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <Lock className="w-16 h-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black">{t('sign_quiz.locked')}</h2>
          <p className="text-muted-foreground">{t('sign_quiz.exam_locked_desc')}</p>
        </div>
        {sign && (
          <div className="relative w-24 h-24 rounded-xl bg-white border border-border/40 p-2 shadow-md flex items-center justify-center">
            <SignImage src={sign.imageUrl} alt={sign.nameEn} />
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl" asChild>
            <Link href={`/traffic-signs/${signCode}`}>
              {isRTL ? <ArrowRight className="w-4 h-4 mr-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
              {t('sign_quiz.exam.back_to_sign')}
            </Link>
          </Button>
          <Button className="rounded-xl" asChild>
            <Link href={`/traffic-signs/${signCode}/exam/1`}>{t('sign_quiz.start_exam')} 1</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !sign || !examData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground text-center">{error || t('sign_quiz.error_load')}</p>
        <Button variant="outline" asChild>
          <Link href={`/traffic-signs/${signCode}`}>
            {isRTL ? <ArrowRight className="w-4 h-4 mr-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
            {t('sign_quiz.exam.back_to_sign')}
          </Link>
        </Button>
      </div>
    );
  }

  // ── Result Screen ──
  if (result) {
    const scorePct = Math.round(result.scorePercentage);
    const reqPct   = result.totalLinked > 0 ? Math.round((result.passingThreshold / result.totalLinked) * 100) : 80;

    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-12 max-w-lg">

          {/* Result card */}
          <Card className={cn(
            'rounded-3xl border shadow-md mb-6 text-center bg-white overflow-hidden',
            result.passed ? 'border-green-200' : 'border-red-200/70',
          )}>
            {/* Top accent bar */}
            <div className={cn('h-1 w-full', result.passed ? 'bg-green-400' : 'bg-red-400')} />

            <CardContent className="px-8 pt-8 pb-7 space-y-5">

              {/* Sign image */}
              <div className="flex justify-center">
                <div className="relative w-20 h-20 rounded-2xl bg-muted/40 border border-border/30 p-2.5 flex items-center justify-center shadow-sm">
                  <SignImage src={sign.imageUrl} alt={sign.nameEn} />
                </div>
              </div>

              {/* Status icon + title */}
              <div className="space-y-2">
                <div className="flex justify-center">
                  {result.passed
                    ? <CheckCircle2 className="w-10 h-10 text-green-500" />
                    : <XCircle       className="w-10 h-10 text-red-400"   />}
                </div>
                <h2 className={cn(
                  'text-xl font-bold tracking-tight',
                  result.passed ? 'text-green-700' : 'text-red-500',
                )}>
                  {result.passed ? t('sign_quiz.exam.passed') : t('sign_quiz.exam.failed')}
                </h2>
              </div>

              {/* Score — hero number */}
              <div className={cn(
                'text-6xl font-black tabular-nums',
                result.passed ? 'text-green-600' : 'text-foreground',
              )}>
                {scorePct}%
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 px-2">
                <Progress
                  value={scorePct}
                  className={cn(
                    'h-2 rounded-full bg-muted/50',
                    result.passed ? '[&>div]:bg-green-500 [&>div]:transition-all [&>div]:duration-700' : '[&>div]:bg-red-400 [&>div]:transition-all [&>div]:duration-700',
                  )}
                />
                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                  {t('sign_quiz.exam.correct_of').replace('{n}', String(result.correctAnswers)).replace('{total}', String(result.totalLinked))}
                  {' · '}
                  {t('sign_quiz.exam.required_to_pass')}: {reqPct}%
                </p>
              </div>

              {/* Action buttons — clear hierarchy */}
              <div className="flex flex-col gap-2.5 pt-1">
                {/* Primary CTA */}
                {result.passed && examNum === 1 ? (
                  <Button className="w-full rounded-xl h-10 font-semibold" asChild>
                    <Link href={`/traffic-signs/${signCode}/exam/2`}>
                      <Trophy className="w-4 h-4 mr-2" />
                      {t('sign_quiz.exam.go_to_exam_2')}
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full rounded-xl h-10 font-semibold" asChild>
                    <Link href={`/traffic-signs/${signCode}/exam/${examNum}`}>
                      {t('sign_quiz.exam.retake')}
                    </Link>
                  </Button>
                )}
                {/* Secondary */}
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
                {/* Ghost */}
                <Button variant="ghost" className="w-full rounded-xl h-9 text-muted-foreground font-normal" asChild>
                  <Link href={`/traffic-signs/${signCode}`}>
                    {isRTL ? <ArrowRight className="w-4 h-4 mr-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
                    {t('sign_quiz.exam.back_to_sign')}
                  </Link>
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* Answer Review */}
          {showReview && (
            <div ref={reviewRef} className="space-y-4 pb-10">
              {result.questionResults.map((qRes, idx) => {
                const q = questions.find(q => q.id === qRes.questionId);
                const correctText = qRes[`correctText${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof typeof qRes] as string
                  || qRes.correctTextEn || '';
                const expl = qRes[`explanation${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof typeof qRes] as string
                  || qRes.explanationEn || '';

                return (
                  <Card key={qRes.questionId} className={cn(
                    'rounded-xl border',
                    !qRes.answered ? 'border-muted' : qRes.isCorrect ? 'border-green-300' : 'border-red-300',
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
                            {q && (
                              <Badge className={cn('border text-xs', DIFF_COLORS[q.difficulty] || 'bg-muted text-foreground border-border')}>
                                {t(`sign_quiz.${q.difficulty.toLowerCase()}`)}
                              </Badge>
                            )}
                            {!qRes.answered
                              ? <Badge variant="outline" className="text-xs">{t('sign_quiz.exam.not_answered')}</Badge>
                              : qRes.isCorrect
                                ? <Badge className="bg-green-100 text-green-800 border-green-200 border text-xs">{t('sign_quiz.exam.correct_label')}</Badge>
                                : <Badge className="bg-red-100 text-red-800 border-red-200 border text-xs">{t('sign_quiz.exam.wrong_label')}</Badge>}
                          </div>
                          <p className="text-sm font-medium">
                            {q ? qText(q, lang) : `Question ${idx + 1}`}
                          </p>
                        </div>
                      </div>

                      {correctText && (
                        <p className="text-sm text-green-700 font-medium">
                          ✓ {t('sign_quiz.exam.correct_answer')}: {correctText}
                        </p>
                      )}
                      {expl && (
                        <p className="text-xs text-muted-foreground">{expl}</p>
                      )}
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

  // ── Exam Screen ──
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-b from-muted to-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" className="gap-2" asChild>
            <Link href={`/traffic-signs/${signCode}`}>
              {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {t('sign_quiz.exam.back_to_sign')}
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">
              {t('sign_quiz.exam.title').replace('{n}', String(examNum))}
            </span>
            <Badge variant="outline" className="text-xs">
              {answeredCnt}/{total}
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={(answeredCnt / total) * 100} className="h-2.5 rounded-full mb-5 [&>div]:transition-all [&>div]:duration-500" />

        {/* Question navigator dots */}
        <div className="flex flex-wrap gap-1.5 mb-5 justify-center">
          {questions.map((q, i) => {
            // A dot is reachable if every question before it has been answered
            const reachable = questions.slice(0, i).every(prev => answers.has(prev.id));
            return (
              <button
                key={q.id}
                onClick={() => reachable && setCurrentIdx(i)}
                disabled={!reachable}
                className={cn(
                  'w-7 h-7 rounded-full text-xs font-bold transition-all border',
                  i === currentIdx
                    ? 'bg-primary text-primary-foreground border-primary'
                    : answers.has(q.id)
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : reachable
                        ? 'bg-muted text-muted-foreground border-border'
                        : 'bg-muted/40 text-muted-foreground/40 border-border/40 cursor-not-allowed',
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Sign image */}
        <div className="flex justify-center mb-4">
          <div className="relative w-52 h-52 rounded-2xl bg-white border border-border/50 shadow-lg p-5 flex items-center justify-center">
            <SignImage src={sign.imageUrl} alt={sign.nameEn} />
          </div>
        </div>

        {/* Per-question countdown timer */}
        <div className="flex items-center gap-3 mb-6">
          <div className={cn(
            'flex-1 h-2.5 rounded-full overflow-hidden',
            timeLeft >= 7 ? 'bg-green-100' : timeLeft >= 4 ? 'bg-yellow-100' : 'bg-red-100',
          )}>
            <div
              className={cn(
                'h-full rounded-full',
                timeLeft >= 7 ? 'bg-green-500' : timeLeft >= 4 ? 'bg-yellow-400' : 'bg-red-500',
              )}
              style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%`, transition: 'width 0.95s linear' }}
            />
          </div>
          <span className={cn(
            'text-sm font-bold tabular-nums w-7 text-end shrink-0',
            timeLeft >= 7 ? 'text-green-600' : timeLeft >= 4 ? 'text-yellow-600' : 'text-red-500',
          )}>
            {timeLeft}s
          </span>
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
              {current.choices.map(choice => {
                const isSelected = answers.get(current.id) === choice.id;
                return (
                  <button
                    key={choice.id}
                    onClick={() => handleSelect(current.id, choice.id)}
                    className={cn(
                      'w-full text-start p-4 rounded-xl border-2 transition-all duration-150 font-medium text-sm group flex items-center gap-3',
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm scale-[1.01]'
                        : 'border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm active:scale-[0.99]',
                    )}
                  >
                    <span className={cn(
                      'w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all duration-150',
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/40 group-hover:border-primary/60',
                    )} />
                    <span className="flex-1">{cText(choice, lang)}</span>
                  </button>
                );
              })}

              {/* Next (no going back) */}
              {currentIdx < total - 1 && (
                <div className="flex justify-end pt-1">
                  <Button
                    size="sm" className="rounded-xl transition-all duration-200 hover:shadow-md"
                    disabled={!answers.has(current.id)}
                    onClick={() => setCurrentIdx(i => i + 1)}
                  >
                    Next
                    {isRTL ? <ArrowLeft className="w-4 h-4 ml-1" /> : <ArrowRight className="w-4 h-4 ml-1" />}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submit — only visible on last question */}
        {currentIdx === total - 1 && (
          <>
            <Button
              className="w-full rounded-xl shadow-md shadow-primary/20 mt-2"
              disabled={submitting}
              onClick={handleForceSubmit}
            >
              {submitting
                ? t('sign_quiz.exam.submitting')
                : `${t('sign_quiz.exam.submit_exam')} (${answeredCnt}/${total})`}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">{t('sign_quiz.exam.instructions')}</p>
          </>
        )}

      </div>
    </div>
  );
}
