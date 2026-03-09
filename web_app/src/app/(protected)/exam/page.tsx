'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/language-context';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { cn } from '@/lib/utils';
import {
  Timer, Trophy, ClipboardList, CheckCircle2, XCircle,
  Clock, RotateCcw, Home, ChevronDown, ChevronUp, AlertTriangle,
  ArrowLeft, ArrowRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizOption {
  id: number;
  optionTextEn: string;
  optionTextAr: string;
  optionTextNl: string;
  optionTextFr: string;
  displayOrder: number;
}

interface QuizQuestion {
  id: number;
  questionEn: string;
  questionAr: string;
  questionNl: string;
  questionFr: string;
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD';
  categoryNameEn?: string;
  categoryNameAr?: string;
  categoryNameNl?: string;
  categoryNameFr?: string;
  contentImageUrl?: string;
  options: QuizOption[];
}

interface QuestionResult {
  questionId: number;
  questionEn: string;
  questionAr: string;
  questionNl: string;
  questionFr: string;
  selectedOptionId: number | null;
  correctOptionId: number | null;
  correctOptionEn: string | null;
  correctOptionAr: string | null;
  correctOptionNl: string | null;
  correctOptionFr: string | null;
  isCorrect: boolean;
  wasTimeout: boolean;
  explanationEn: string | null;
  explanationAr: string | null;
  explanationNl: string | null;
  explanationFr: string | null;
  categoryNameEn: string | null;
  categoryNameAr: string | null;
  categoryNameNl: string | null;
  categoryNameFr: string | null;
  difficultyLevel: string | null;
}

interface ExamResult {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  scorePercentage: number;
  passed: boolean;
  passingScore: number;
  questions: QuestionResult[];
}

type Phase = 'intro' | 'loading' | 'exam' | 'submitting' | 'results';

// ─── Constants ────────────────────────────────────────────────────────────────
const SECONDS_PER_QUESTION = 15;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TheoryExamPage() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const [phase, setPhase]                   = useState<Phase>('intro');
  const [questions, setQuestions]           = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex]     = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft]             = useState(SECONDS_PER_QUESTION);
  const [result, setResult]                 = useState<ExamResult | null>(null);
  const [serviceUnavailable, setSvcError]   = useState(false);
  const [showReview, setShowReview]         = useState(false);
  const [reviewFilter, setReviewFilter]     = useState<'all' | 'wrong' | 'correct'>('all');

  const answersRef      = useRef<(number | null)[]>([]);
  const isAdvancingRef  = useRef(false);  // true only after Next pressed or timer expired

  const localize = useCallback(
    (en?: string | null, ar?: string | null, nl?: string | null, fr?: string | null): string => {
      switch (language) {
        case 'ar': return ar || en || '';
        case 'nl': return nl || en || '';
        case 'fr': return fr || en || '';
        default:   return en || '';
      }
    },
    [language]
  );

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'EASY':   return t('practice_exam.difficulty_easy');
      case 'MEDIUM': return t('practice_exam.difficulty_medium');
      case 'HARD':   return t('practice_exam.difficulty_hard');
      default:       return level;
    }
  };

  const startExam = async () => {
    setSvcError(false);
    setPhase('loading');
    try {
      const res = await apiClient.get<QuizQuestion[]>('/quiz/theory-exam');
      if (res.data && res.data.length > 0) {
        answersRef.current = new Array(res.data.length).fill(null);
        setQuestions(res.data);
        setCurrentIndex(0);
        setSelectedOption(null);
        setTimeLeft(SECONDS_PER_QUESTION);
        isAdvancingRef.current = false;
        setPhase('exam');
      } else {
        setPhase('intro');
      }
    } catch (err) {
      logApiError('Failed to load theory exam questions', err);
      if (isServiceUnavailable(err)) setSvcError(true);
      setPhase('intro');
    }
  };

  // Just highlight an option — does NOT advance, user can change freely
  const selectOption = (optionId: number) => {
    if (isAdvancingRef.current) return;
    setSelectedOption(optionId);
  };

  // Lock and advance — called by Next button OR timer expiry
  const advanceToNext = useCallback(
    (answerToSave: number | null) => {
      if (isAdvancingRef.current) return;
      isAdvancingRef.current = true;

      answersRef.current[currentIndex] = answerToSave;

      const nextIndex = currentIndex + 1;
      if (nextIndex >= questions.length) {
        submitAll();
      } else {
        setCurrentIndex(nextIndex);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex, questions.length]
  );

  useEffect(() => {
    if (phase === 'exam') {
      setSelectedOption(null);
      setTimeLeft(SECONDS_PER_QUESTION);
      isAdvancingRef.current = false;
    }
  }, [currentIndex, phase]);

  useEffect(() => {
    if (phase !== 'exam') return;
    if (isAdvancingRef.current) return;

    if (timeLeft <= 0) {
      // Timer expired — advance with whatever is currently selected (may be null)
      advanceToNext(selectedOption);
      return;
    }

    const tick = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(tick);
  }, [phase, timeLeft, advanceToNext, selectedOption]);

  const submitAll = async () => {
    setPhase('submitting');
    const payload = questions.map((q, i) => ({
      questionId: q.id,
      selectedOptionId: answersRef.current[i] ?? null,
    }));
    try {
      const res = await apiClient.post<ExamResult>('/quiz/theory-exam/check', payload);
      setResult(res.data);
      setPhase('results');
    } catch (err) {
      logApiError('Failed to check theory exam answers', err);
      setPhase('intro');
    }
  };

  const handleRetry = () => {
    setResult(null);
    setShowReview(false);
    setReviewFilter('all');
    setPhase('intro');
  };

  // ─── Screens ──────────────────────────────────────────────────────────────

  if (serviceUnavailable) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <ServiceUnavailableBanner
          onRetry={() => { setSvcError(false); startExam(); }}
          className="max-w-md"
        />
      </div>
    );
  }

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-background via-primary/5 to-background overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Decorative blur orbs */}
        <div className="pointer-events-none absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 w-[22rem] h-[22rem] rounded-full bg-secondary/10 blur-3xl" />

        <div className="container mx-auto max-w-xl px-4 py-12 relative">

          {/* Hero header */}
          <div className="text-center space-y-5 mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-primary border border-primary/20 shadow-sm">
              <ClipboardList className="w-4 h-4" />
              <span className="font-semibold text-sm">{t('practice_exam.badge')}</span>
            </div>

            <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/30">
              <ClipboardList className="w-10 h-10 text-primary-foreground" />
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight">{t('practice_exam.intro_title')}</h1>
              <p className="text-muted-foreground text-lg max-w-sm mx-auto">{t('practice_exam.intro_subtitle')}</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { value: '50',  label: t('practice_exam.rule_questions').split(' ').slice(0,2).join(' '), color: 'text-primary' },
              { value: '15s', label: t('practice_exam.rule_time').split(' ').slice(0,2).join(' '),      color: 'text-orange-500' },
              { value: '41',  label: t('practice_exam.rule_pass').split(' ').slice(0,2).join(' '),      color: 'text-green-600' },
            ].map(stat => (
              <div key={stat.value} className="text-center rounded-2xl border border-border/50 bg-card shadow-sm py-4 px-2">
                <p className={`text-2xl font-black tabular-nums ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight line-clamp-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Rules card */}
          <div className="rounded-3xl border border-border/40 bg-card/80 backdrop-blur shadow-sm mb-6 overflow-hidden">
            <div className="px-5 py-5 space-y-2.5">
              {[
                { icon: <ClipboardList className="w-4 h-4 text-primary" />,         bg: 'bg-primary/10',     key: 'rule_questions' },
                { icon: <Timer className="w-4 h-4 text-orange-500" />,               bg: 'bg-orange-500/10',  key: 'rule_time' },
                { icon: <Trophy className="w-4 h-4 text-yellow-500" />,              bg: 'bg-yellow-500/10',  key: 'rule_pass' },
                { icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,        bg: 'bg-green-500/10',   key: 'rule_choices' },
                { icon: <AlertTriangle className="w-4 h-4 text-destructive" />,     bg: 'bg-destructive/10', key: 'rule_timer' },
              ].map(rule => (
                <div key={rule.key} className="flex items-center gap-3 rounded-2xl bg-muted/50 px-3.5 py-3">
                  <div className={`w-8 h-8 rounded-xl ${rule.bg} flex items-center justify-center flex-shrink-0`}>
                    {rule.icon}
                  </div>
                  <p className="text-sm font-medium leading-snug">{t(`practice_exam.${rule.key}`)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Button
            size="lg"
            className="w-full h-14 rounded-full text-base font-bold shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 transition-all active:translate-y-0"
            onClick={startExam}
          >
            <Timer className="w-5 h-5 mr-2" />
            {t('practice_exam.start_btn')}
          </Button>

          <div className="mt-5 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRTL ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
              {t('practice_exam.back_practice')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── LOADING / SUBMITTING ─────────────────────────────────────────────────
  if (phase === 'loading' || phase === 'submitting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              {phase === 'loading' ? t('practice_exam.loading') : t('practice_exam.submitting')}
            </p>
            <p className="text-sm text-muted-foreground">{t('practice_exam.badge')}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── EXAM ─────────────────────────────────────────────────────────────────
  if (phase === 'exam' && questions.length > 0) {
    const question    = questions[currentIndex];
    const progressPct = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;
    const timerPct    = (timeLeft / SECONDS_PER_QUESTION) * 100;
    const timerColor   = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f97316' : '#22c55e';
    const LABELS      = ['A', 'B', 'C', 'D'];

    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="relative min-h-screen bg-gradient-to-br from-background via-primary/5 to-background overflow-hidden">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-40 -right-40 w-[26rem] h-[26rem] rounded-full bg-primary/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 w-[20rem] h-[20rem] rounded-full bg-secondary/8 blur-3xl" />

        <div className="container mx-auto px-4 py-6 max-w-2xl relative">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <Button variant="ghost" size="sm" className="gap-2 rounded-full text-muted-foreground hover:text-foreground" onClick={handleRetry}>
              {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {t('practice_exam.back_practice')}
            </Button>
            <div className={cn(
              'flex items-center gap-1.5 text-sm font-bold tabular-nums px-3.5 py-1.5 rounded-full border transition-colors',
              timeLeft <= 5
                ? 'bg-destructive/10 border-destructive/30 text-destructive animate-pulse'
                : timeLeft <= 10
                  ? 'bg-orange-500/10 border-orange-400/30 text-orange-500'
                  : 'bg-muted border-border text-muted-foreground',
            )}>
              <Clock className="w-3.5 h-3.5" />
              {timeLeft}s
            </div>
          </div>

          {/* Progress section */}
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur px-4 py-3 mb-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {t('practice_exam.question_of')
                  .replace('{n}', String(currentIndex + 1))
                  .replace('{m}', String(questions.length))}
              </span>
              <span className="text-xs font-bold text-primary">{Math.round(progressPct)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {question && (
            <div className="rounded-3xl border border-border/40 bg-card/90 backdrop-blur shadow-md overflow-hidden">

              {/* Card header stripe */}
              <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/30" />

              <div className="px-5 pt-5 pb-4">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="inline-flex items-center justify-center text-xs font-black text-primary bg-primary/10 rounded-full w-7 h-7 flex-shrink-0">
                    {currentIndex + 1}
                  </span>
                  {(question.categoryNameEn || question.categoryNameAr) && (
                    <Badge variant="outline" className="text-xs rounded-full flex-shrink-0 text-muted-foreground">
                      {localize(question.categoryNameEn, question.categoryNameAr, question.categoryNameNl, question.categoryNameFr)}
                    </Badge>
                  )}
                  {/* Difficulty pill — solid colored, visually distinct */}
                  <span className={cn(
                    'inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0',
                    question.difficultyLevel === 'EASY'   && 'bg-green-500 text-white',
                    question.difficultyLevel === 'MEDIUM' && 'bg-orange-500 text-white',
                    question.difficultyLevel === 'HARD'   && 'bg-red-500 text-white',
                  )}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />
                    {getDifficultyLabel(question.difficultyLevel)}
                  </span>
                </div>

                {/* Image */}
                {question.contentImageUrl && (
                  <div className="flex justify-center mb-4">
                    <Image
                      src={question.contentImageUrl}
                      alt="Question illustration"
                      width={400}
                      height={176}
                      className="max-h-44 object-contain rounded-2xl border border-border/50"
                      unoptimized
                    />
                  </div>
                )}

                {/* Question text */}
                <p className={`text-base font-bold leading-snug mb-4 ${isRTL ? 'text-right' : ''}`}>
                  {localize(question.questionEn, question.questionAr, question.questionNl, question.questionFr)}
                </p>

                {/* Answer options */}
                <div className="space-y-2.5">
                  {question.options
                    .slice()
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((option, idx) => {
                      const isSelected  = selectedOption === option.id;
                      const isLocked    = isAdvancingRef.current;
                      const label       = LABELS[idx] ?? String(idx + 1);
                      return (
                        <button
                          key={option.id}
                          disabled={isLocked}
                          onClick={() => selectOption(option.id)}
                          className={cn(
                            'w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-sm font-medium text-start',
                            !isLocked && !isSelected && 'border-border bg-background/60 hover:border-primary/60 hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-sm',
                            isSelected && 'border-primary bg-primary/10 shadow-md shadow-primary/10',
                            isLocked && !isSelected && 'border-border/40 bg-muted/30 opacity-50',
                          )}
                        >
                          <span className={cn(
                            'w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 transition-colors',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground',
                          )}>
                            {label}
                          </span>
                          <span className={isRTL ? 'block text-right flex-1' : 'flex-1'}>
                            {localize(option.optionTextEn, option.optionTextAr, option.optionTextNl, option.optionTextFr)}
                          </span>
                        </button>
                      );
                    })}
                </div>

                {/* Timer bar — green > orange > red */}
                <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden mt-4">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${timerPct}%`,
                      transition: 'width 1s linear, background-color 0.5s ease',
                      backgroundColor: timerColor,
                    }}
                  />
                </div>

                {/* Next / Submit button */}
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => advanceToNext(selectedOption)}
                    disabled={isAdvancingRef.current}
                    className={cn(
                      'gap-2 rounded-full px-6 h-11 font-semibold shadow-md transition-all',
                      selectedOption !== null
                        ? 'shadow-primary/20 hover:-translate-y-0.5'
                        : 'opacity-70',
                    )}
                  >
                    {currentIndex + 1 === questions.length
                      ? t('practice_exam.submit_btn')
                      : t('practice_exam.next_btn')}
                    {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── RESULTS ──────────────────────────────────────────────────────────────
  if (phase === 'results' && result) {
    const filteredQs = result.questions.filter(q => {
      if (reviewFilter === 'correct') return q.isCorrect;
      if (reviewFilter === 'wrong')   return !q.isCorrect;
      return true;
    });

    return (
      <div className="relative min-h-screen bg-gradient-to-br from-background via-muted/10 to-background overflow-hidden pb-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="pointer-events-none absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 w-[22rem] h-[22rem] rounded-full bg-secondary/5 blur-3xl" />

        <div className="container mx-auto max-w-2xl px-4 py-8 space-y-5 relative">

          {/* Pass / Fail hero */}
          <div className={[
            'relative overflow-hidden rounded-3xl border px-6 py-8 text-center shadow-sm',
            result.passed
              ? 'bg-gradient-to-br from-green-500/10 via-green-500/5 to-background border-green-200 dark:border-green-900/50'
              : 'bg-gradient-to-br from-destructive/10 via-destructive/5 to-background border-destructive/20',
          ].join(' ')}>
            <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-current opacity-5 blur-2xl" />
            <div className={[
              'mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center shadow-md',
              result.passed ? 'bg-green-500/15' : 'bg-destructive/15',
            ].join(' ')}>
              {result.passed
                ? <CheckCircle2 className="w-8 h-8 text-green-600" />
                : <XCircle className="w-8 h-8 text-destructive" />}
            </div>
            <p className={`text-lg font-black mb-1 ${result.passed ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}>
              {result.passed ? t('practice_exam.score_passed') : t('practice_exam.score_failed')}
            </p>
            <p className="text-5xl font-black tabular-nums">
              {result.correctAnswers}
              <span className="text-2xl font-semibold text-muted-foreground"> / {result.totalQuestions}</span>
            </p>
            <p className="text-lg text-muted-foreground mt-1">{result.scorePercentage.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('practice_exam.score_pass_threshold').replace('{n}', String(result.passingScore))}
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, label: t('practice_exam.score_correct'), value: result.correctAnswers, cls: 'text-green-600' },
              { icon: <XCircle className="w-5 h-5 text-destructive" />,    label: t('practice_exam.score_wrong'),   value: result.wrongAnswers,   cls: 'text-destructive' },
              { icon: <Clock className="w-5 h-5 text-orange-400" />,       label: t('practice_exam.score_timeout'), value: result.unanswered,     cls: 'text-orange-600' },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border border-border/50 bg-card shadow-sm py-4 flex flex-col items-center gap-1">
                {stat.icon}
                <p className={`text-2xl font-black tabular-nums ${stat.cls}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground text-center px-1 leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleRetry} variant="outline" className="gap-2 rounded-full h-12 font-semibold">
              <RotateCcw className="w-4 h-4" />
              {t('practice_exam.retry_btn')}
            </Button>
            <Button asChild className="gap-2 rounded-full h-12 font-semibold shadow-md shadow-primary/20">
              <Link href="/">
                <Home className="w-4 h-4" />
                {t('practice_exam.home_btn')}
              </Link>
            </Button>
          </div>

          {/* Review accordion */}
          <div className="rounded-3xl border border-border/40 bg-card/80 backdrop-blur shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
              onClick={() => setShowReview(v => !v)}
            >
              <span className="font-bold text-base">{t('practice_exam.review_title')}</span>
              {showReview ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </button>

            {showReview && (
              <div className="px-5 pb-5 space-y-4 border-t border-border/30 pt-4">
                <div className="flex gap-2 flex-wrap">
                  {(['all', 'wrong', 'correct'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setReviewFilter(f)}
                      className={[
                        'text-xs px-3.5 py-1.5 rounded-full border transition-colors font-medium',
                        reviewFilter === f
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'border-border/50 text-muted-foreground hover:bg-muted',
                      ].join(' ')}
                    >
                      {t(`practice_exam.filter_${f}`)}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {filteredQs.map(qr => {
                    const qNum = result.questions.findIndex(q => q.questionId === qr.questionId) + 1;
                    return (
                      <TheoryReviewCard
                        key={qr.questionId}
                        qr={qr}
                        qNum={qNum}
                        localize={localize}
                        isRTL={isRTL}
                        t={t}
                        getDifficultyLabel={getDifficultyLabel}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Review sub-component ──────────────────────────────────────────────────

function TheoryReviewCard({
  qr, qNum, localize, isRTL, t, getDifficultyLabel,
}: {
  qr: QuestionResult;
  qNum: number;
  localize: (en?: string | null, ar?: string | null, nl?: string | null, fr?: string | null) => string;
  isRTL: boolean;
  t: (key: string) => string;
  getDifficultyLabel: (level: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  const questionText    = localize(qr.questionEn, qr.questionAr, qr.questionNl, qr.questionFr);
  const correctText     = localize(qr.correctOptionEn, qr.correctOptionAr, qr.correctOptionNl, qr.correctOptionFr);
  const explanationText = localize(qr.explanationEn, qr.explanationAr, qr.explanationNl, qr.explanationFr);
  const categoryText    = localize(qr.categoryNameEn, qr.categoryNameAr, qr.categoryNameNl, qr.categoryNameFr);

  // Status config
  const status = qr.isCorrect ? 'correct' : qr.wasTimeout ? 'timeout' : 'wrong';
  const statusConfig = {
    correct: {
      icon:       <CheckCircle2 className="w-4 h-4 text-green-600" />,
      accent:     '#22c55e',
      cardBg:     'bg-green-50/40 dark:bg-green-950/20',
      border:     'border-green-200/60 dark:border-green-900/40',
    },
    timeout: {
      icon:       <Clock className="w-4 h-4 text-orange-500" />,
      accent:     '#f97316',
      cardBg:     'bg-orange-50/40 dark:bg-orange-950/20',
      border:     'border-orange-200/60 dark:border-orange-900/40',
    },
    wrong: {
      icon:       <XCircle className="w-4 h-4 text-red-500" />,
      accent:     '#ef4444',
      cardBg:     'bg-red-50/40 dark:bg-red-950/20',
      border:     'border-red-200/60 dark:border-red-900/40',
    },
  }[status];

  // Difficulty pill (solid, identical to exam question screen)
  const diffPill = qr.difficultyLevel
    ? {
        EASY:   'bg-green-500 text-white',
        MEDIUM: 'bg-orange-500 text-white',
        HARD:   'bg-red-500 text-white',
      }[qr.difficultyLevel] ?? 'bg-muted text-muted-foreground'
    : null;

  return (
    <div className={`relative rounded-2xl border overflow-hidden ${statusConfig.cardBg} ${statusConfig.border}`}>
      {/* Left accent stripe */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
        style={{ backgroundColor: statusConfig.accent }}
      />

      <div className="pl-4 pr-4 py-3.5">
        {/* Row 1: Status icon + Q number + category + difficulty */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <div className="flex-shrink-0">{statusConfig.icon}</div>
          <span className="text-xs font-black text-foreground/70">Q{qNum}</span>
          {categoryText && (
            <span className="text-xs font-medium text-muted-foreground bg-background/60 rounded-full px-2 py-0.5 border border-border/40">
              {categoryText}
            </span>
          )}
          {diffPill && qr.difficultyLevel && (
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${diffPill}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
              {getDifficultyLabel(qr.difficultyLevel)}
            </span>
          )}
        </div>

        {/* Row 2: Question text */}
        <p className={`text-sm font-semibold text-foreground leading-snug ${isRTL ? 'text-right' : ''}`}>
          {questionText}
        </p>

        {/* Expand toggle — only for incorrect/timeout */}
        {!qr.isCorrect && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? t('practice_exam.review_hide') : t('practice_exam.review_show_answer')}
          </button>
        )}

        {/* Expanded: correct answer + explanation */}
        {expanded && !qr.isCorrect && (
          <div className="mt-3 space-y-2">
            {correctText && (
              <div className="flex items-start gap-2.5 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-0.5 uppercase tracking-wide">
                    {t('practice_exam.review_correct_answer')}
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-300 font-medium">{correctText}</p>
                </div>
              </div>
            )}
            {explanationText && (
              <div className="bg-muted/60 border border-border/30 rounded-xl px-3 py-2.5">
                <p className="text-xs font-bold text-muted-foreground mb-0.5 uppercase tracking-wide">
                  {t('practice_exam.review_explanation')}
                </p>
                <p className="text-sm text-foreground/80">{explanationText}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}