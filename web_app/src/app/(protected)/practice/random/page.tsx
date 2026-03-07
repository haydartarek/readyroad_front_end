'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/language-context';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { SignImage } from '@/components/traffic-signs/sign-image';
import { cn } from '@/lib/utils';
import {
  Timer, Trophy, ClipboardList, CheckCircle2, XCircle,
  Clock, RotateCcw, Home, ChevronDown, ChevronUp, AlertTriangle,
  ArrowLeft, ArrowRight,
} from 'lucide-react';

// --- Types ---

interface SignChoice {
  id:           number;
  displayOrder: number;
  textNl:       string;
  textEn:       string;
  textFr:       string;
  textAr:       string;
}

interface SignPracticeQuestion {
  id:            number;
  questionNl:    string;
  questionEn:    string;
  questionFr:    string;
  questionAr:    string;
  difficulty:    'EASY' | 'MEDIUM' | 'HARD';
  showSign:      boolean;
  signCode:      string | null;
  signImagePath: string | null;
  choices:       SignChoice[];
}

interface QuestionResult {
  questionId:       number;
  questionNl:       string;
  questionEn:       string;
  questionFr:       string;
  questionAr:       string;
  selectedChoiceId: number | null;
  correctChoiceId:  number | null;
  correctChoiceNl:  string | null;
  correctChoiceEn:  string | null;
  correctChoiceFr:  string | null;
  correctChoiceAr:  string | null;
  isCorrect:        boolean;
  wasTimeout:       boolean;
  explanationNl:    string | null;
  explanationEn:    string | null;
  explanationFr:    string | null;
  explanationAr:    string | null;
  signCode:         string | null;
  signImagePath:    string | null;
  difficulty:       string | null;
}

interface PracticeResult {
  totalQuestions:  number;
  correctAnswers:  number;
  wrongAnswers:    number;
  unanswered:      number;
  scorePercentage: number;
  passed:          boolean;
  passingScore:    number;
  questions:       QuestionResult[];
}

type Phase = 'intro' | 'loading' | 'exam' | 'submitting' | 'results';

const SECONDS_PER_QUESTION = 15;

// --- Main Component ---

export default function RandomPracticePage() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const [phase, setPhase]                   = useState<Phase>('intro');
  const [questions, setQuestions]           = useState<SignPracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex]     = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft]             = useState(SECONDS_PER_QUESTION);
  const [result, setResult]                 = useState<PracticeResult | null>(null);
  const [serviceUnavailable, setSvcError]   = useState(false);
  const [showReview, setShowReview]         = useState(false);
  const [reviewFilter, setReviewFilter]     = useState<'all' | 'wrong' | 'correct'>('all');

  const answersRef     = useRef<(number | null)[]>([]);
  const isAnsweringRef = useRef(false);

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

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'EASY':   return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'HARD':   return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400';
      default:       return 'bg-muted text-muted-foreground';
    }
  };

  // --- Lifecycle ---

  const startExam = async () => {
    setSvcError(false);
    setPhase('loading');
    try {
      const res = await apiClient.get<SignPracticeQuestion[]>('/sign-quiz/random-practice');
      if (res.data && res.data.length > 0) {
        answersRef.current = new Array(res.data.length).fill(null);
        setQuestions(res.data);
        setCurrentIndex(0);
        setSelectedOption(null);
        setTimeLeft(SECONDS_PER_QUESTION);
        isAnsweringRef.current = false;
        setPhase('exam');
      } else {
        setPhase('intro');
      }
    } catch (err) {
      logApiError('Failed to load sign practice questions', err);
      if (isServiceUnavailable(err)) setSvcError(true);
      setPhase('intro');
    }
  };

  const handleAnswer = useCallback(
    (choiceId: number | null) => {
      if (isAnsweringRef.current) return;
      isAnsweringRef.current = true;
      setSelectedOption(choiceId);
      answersRef.current[currentIndex] = choiceId;
      const nextIndex = currentIndex + 1;
      setTimeout(() => {
        if (nextIndex >= questions.length) {
          submitAll();
        } else {
          setCurrentIndex(nextIndex);
        }
      }, 280);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex, questions.length]
  );

  useEffect(() => {
    if (phase === 'exam') {
      setSelectedOption(null);
      setTimeLeft(SECONDS_PER_QUESTION);
      isAnsweringRef.current = false;
    }
  }, [currentIndex, phase]);

  useEffect(() => {
    if (phase !== 'exam') return;
    if (isAnsweringRef.current) return;
    if (timeLeft <= 0) { handleAnswer(null); return; }
    const tick = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(tick);
  }, [phase, timeLeft, handleAnswer]);

  const submitAll = async () => {
    setPhase('submitting');
    const payload = questions.map((q, i) => ({
      questionId:       q.id,
      selectedChoiceId: answersRef.current[i] ?? null,
    }));
    try {
      const res = await apiClient.post<PracticeResult>('/sign-quiz/random-practice/check', payload);
      setResult(res.data);
      setPhase('results');
    } catch (err) {
      logApiError('Failed to check sign practice answers', err);
      setPhase('intro');
    }
  };

  const handleRetry = () => {
    setResult(null);
    setShowReview(false);
    setReviewFilter('all');
    setPhase('intro');
  };

  // --- Screens ---

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

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto max-w-2xl px-4 py-12">
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-primary border border-primary/20 shadow-sm">
              <ClipboardList className="w-4 h-4" />
              <span className="font-semibold text-sm">{t('sign_practice.badge')}</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">{t('sign_practice.intro_title')}</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">{t('sign_practice.intro_subtitle')}</p>
          </div>
          <Card className="rounded-2xl border-border/50 shadow-sm mb-6">
            <CardContent className="pt-6 pb-5 space-y-4">
              {[
                { icon: <ClipboardList className="w-5 h-5 text-primary flex-shrink-0" />,   key: 'sign_practice.rule_questions' },
                { icon: <Timer className="w-5 h-5 text-orange-500 flex-shrink-0" />,         key: 'practice_exam.rule_time' },
                { icon: <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />,        key: 'practice_exam.rule_pass' },
                { icon: <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />,  key: 'practice_exam.rule_choices' },
                { icon: <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />,   key: 'practice_exam.rule_timer' },
              ].map(rule => (
                <div key={rule.key} className="flex items-center gap-3">
                  {rule.icon}
                  <p className="text-sm">{t(rule.key)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Button
            size="lg"
            className="w-full rounded-xl text-base font-semibold shadow-md shadow-primary/20 hover:scale-[1.01] transition-transform"
            onClick={startExam}
          >
            <Timer className="w-5 h-5 mr-2" />
            {t('practice_exam.start_btn')}
          </Button>
          <div className="mt-4 text-center">
            <Link href="/practice" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              &larr; {t('practice_exam.back_practice')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'loading' || phase === 'submitting') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <RotateCcw className="w-7 h-7 text-primary animate-spin" />
          </div>
          <p className="text-muted-foreground">
            {phase === 'loading' ? t('practice_exam.loading') : t('practice_exam.submitting')}
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'exam' && questions.length > 0) {
    const question    = questions[currentIndex];
    const progressPct = (currentIndex / questions.length) * 100;
    const timerPct    = (timeLeft / SECONDS_PER_QUESTION) * 100;
    const timerCls    = timeLeft <= 5 ? 'text-red-500 animate-pulse' : timeLeft <= 10 ? 'text-orange-500' : 'text-muted-foreground';
    const timerBarCls = timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-orange-400' : 'bg-primary';

    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-b from-muted to-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" className="gap-2" onClick={handleRetry}>
              {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {t('practice_exam.back_practice')}
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-muted-foreground">
                {t('practice_exam.question_of')
                  .replace('{n}', String(currentIndex + 1))
                  .replace('{m}', String(questions.length))}
              </span>
              <span className={cn('flex items-center gap-1 text-sm font-bold tabular-nums', timerCls)}>
                <Clock className="w-4 h-4" />
                {timeLeft}s
              </span>
            </div>
          </div>
          <Progress value={progressPct} className="h-2 rounded-full mb-6" />
          {question && (
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-start gap-3 flex-wrap">
                  {question.signCode && (
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {question.signCode}
                    </Badge>
                  )}
                  <Badge className={cn('border text-xs flex-shrink-0', getDifficultyColor(question.difficulty))}>
                    {getDifficultyLabel(question.difficulty)}
                  </Badge>
                </div>
                {question.showSign && question.signImagePath && (
                  <div className="flex justify-center my-3">
                    <div className="relative w-32 h-32">
                      <SignImage
                        src={question.signImagePath}
                        alt={question.signCode ?? 'traffic sign'}
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}
                <CardTitle className="text-base font-bold leading-snug">
                  {localize(question.questionEn, question.questionAr, question.questionNl, question.questionFr)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {question.choices
                  .slice()
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map(choice => {
                    const isSelected = selectedOption === choice.id;
                    const locked     = isAnsweringRef.current || selectedOption !== null;
                    return (
                      <button
                        key={choice.id}
                        disabled={locked}
                        onClick={() => handleAnswer(choice.id)}
                        className={cn(
                          'w-full text-start p-4 rounded-xl border-2 transition-all font-medium text-sm',
                          !locked && !isSelected && 'border-border hover:border-primary/50 hover:bg-muted/50',
                          isSelected && 'border-primary bg-primary/10',
                          locked && !isSelected && 'border-border opacity-60',
                        )}
                      >
                        <span className={isRTL ? 'block text-right' : ''}>
                          {localize(choice.textEn, choice.textAr, choice.textNl, choice.textFr)}
                        </span>
                      </button>
                    );
                  })}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                  <div
                    className={cn('h-full rounded-full', timerBarCls)}
                    style={{ width: `${timerPct}%`, transitionDuration: '1000ms', transitionProperty: 'width' }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'results' && result) {
    const filteredQs = result.questions.filter(q => {
      if (reviewFilter === 'correct') return q.isCorrect;
      if (reviewFilter === 'wrong')   return !q.isCorrect;
      return true;
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background pb-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
          <div className="text-center space-y-4">
            <div className={[
              'inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-lg font-black',
              result.passed
                ? 'bg-green-500/10 text-green-600 border border-green-200'
                : 'bg-red-500/10 text-red-600 border border-red-200',
            ].join(' ')}>
              {result.passed
                ? <><CheckCircle2 className="w-6 h-6" />{t('practice_exam.score_passed')}</>
                : <><XCircle className="w-6 h-6" />{t('practice_exam.score_failed')}</>}
            </div>
            <div className="space-y-1">
              <p className="text-5xl font-black tabular-nums">
                {result.correctAnswers}
                <span className="text-2xl font-semibold text-muted-foreground"> / {result.totalQuestions}</span>
              </p>
              <p className="text-lg text-muted-foreground">{result.scorePercentage.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">
                {t('practice_exam.score_pass_threshold').replace('{n}', String(result.passingScore))}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, label: t('practice_exam.score_correct'), value: result.correctAnswers, cls: 'text-green-600' },
              { icon: <XCircle className="w-5 h-5 text-red-500" />,        label: t('practice_exam.score_wrong'),   value: result.wrongAnswers,   cls: 'text-red-600' },
              { icon: <Clock className="w-5 h-5 text-orange-400" />,       label: t('practice_exam.score_timeout'), value: result.unanswered,     cls: 'text-orange-600' },
            ].map(stat => (
              <Card key={stat.label} className="rounded-xl border-border/50 py-4">
                <div className="flex flex-col items-center gap-1">
                  {stat.icon}
                  <p className={`text-2xl font-black tabular-nums ${stat.cls}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground text-center px-1">{stat.label}</p>
                </div>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleRetry} variant="outline" className="gap-2 rounded-xl">
              <RotateCcw className="w-4 h-4" />
              {t('practice_exam.retry_btn')}
            </Button>
            <Button asChild className="gap-2 rounded-xl">
              <Link href="/practice">
                <Home className="w-4 h-4" />
                {t('practice_exam.home_btn')}
              </Link>
            </Button>
          </div>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <button
              className="w-full flex items-center justify-between p-5 text-left"
              onClick={() => setShowReview(v => !v)}
            >
              <span className="font-bold text-base">{t('practice_exam.review_title')}</span>
              {showReview ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </button>
            {showReview && (
              <div className="px-5 pb-5 space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {(['all', 'wrong', 'correct'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setReviewFilter(f)}
                      className={[
                        'text-xs px-3 py-1.5 rounded-full border transition-colors',
                        reviewFilter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:bg-muted',
                      ].join(' ')}
                    >
                      {t(`practice_exam.filter_${f}`)}
                    </button>
                  ))}
                </div>
                <div className="space-y-4">
                  {filteredQs.map(qr => {
                    const qNum = result.questions.findIndex(q => q.questionId === qr.questionId) + 1;
                    return (
                      <SignReviewCard
                        key={qr.questionId}
                        qr={qr}
                        qNum={qNum}
                        localize={localize}
                        isRTL={isRTL}
                        t={t}
                        getDifficultyColor={getDifficultyColor}
                        getDifficultyLabel={getDifficultyLabel}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return null;
}

// --- Review sub-component ---

function SignReviewCard({
  qr, qNum, localize, isRTL, t, getDifficultyColor, getDifficultyLabel,
}: {
  qr: QuestionResult;
  qNum: number;
  localize: (en?: string | null, ar?: string | null, nl?: string | null, fr?: string | null) => string;
  isRTL: boolean;
  t: (key: string) => string;
  getDifficultyColor: (level: string) => string;
  getDifficultyLabel: (level: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  const questionText    = localize(qr.questionEn, qr.questionAr, qr.questionNl, qr.questionFr);
  const correctText     = localize(qr.correctChoiceEn, qr.correctChoiceAr, qr.correctChoiceNl, qr.correctChoiceFr);
  const explanationText = localize(qr.explanationEn, qr.explanationAr, qr.explanationNl, qr.explanationFr);

  const statusIcon = qr.wasTimeout
    ? <Clock className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
    : qr.isCorrect
      ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
      : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />;

  const borderCls = qr.isCorrect
    ? 'border-green-200 bg-green-50/30 dark:border-green-900/50 dark:bg-green-900/10'
    : qr.wasTimeout
      ? 'border-orange-200 bg-orange-50/30 dark:border-orange-900/50 dark:bg-orange-900/10'
      : 'border-red-200 bg-red-50/30 dark:border-red-900/50 dark:bg-red-900/10';

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${borderCls}`}>
      <div className="flex items-start gap-2">
        {statusIcon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground">Q{qNum}</span>
            {qr.signCode && <span className="text-xs text-muted-foreground">{qr.signCode}</span>}
            {qr.difficulty && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getDifficultyColor(qr.difficulty)}`}>
                {getDifficultyLabel(qr.difficulty)}
              </span>
            )}
          </div>
          {qr.signImagePath && (
            <div className="flex items-center gap-3 mb-2">
              <div className="relative w-12 h-12 flex-shrink-0">
                <SignImage src={qr.signImagePath} alt={qr.signCode ?? 'sign'} className="object-contain" />
              </div>
            </div>
          )}
          <p className={`text-sm font-medium ${isRTL ? 'text-right' : ''}`}>{questionText}</p>
        </div>
      </div>
      {!qr.isCorrect && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-xs text-primary flex items-center gap-1 hover:underline"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? t('practice_exam.review_hide') : t('practice_exam.review_show_answer')}
        </button>
      )}
      {expanded && !qr.isCorrect && (
        <div className="space-y-2 text-sm">
          {correctText && (
            <div className="flex items-start gap-2 bg-green-100/60 dark:bg-green-900/20 rounded-lg p-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-0.5">
                  {t('practice_exam.review_correct_answer')}
                </p>
                <p className="text-green-800 dark:text-green-300">{correctText}</p>
              </div>
            </div>
          )}
          {explanationText && (
            <div className="bg-muted/50 rounded-lg p-2.5">
              <p className="text-xs font-semibold text-muted-foreground mb-0.5">
                {t('practice_exam.review_explanation')}
              </p>
              <p>{explanationText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}