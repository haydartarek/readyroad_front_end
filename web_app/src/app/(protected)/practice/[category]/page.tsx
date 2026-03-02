'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { PracticeQuestionCard, AnswerFeedback } from '@/components/practice/practice-question-card';
import { PracticeStats } from '@/components/practice/practice-stats';
import { PracticeComplete } from '@/components/practice/practice-complete';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { toast } from 'sonner';

interface QuizAnswerOptionDTO {
  id: number;
  optionTextEn: string;
  optionTextAr: string;
  optionTextNl: string;
  optionTextFr: string;
  displayOrder: number;
}

interface QuizQuestionDTO {
  id: number;
  questionEn: string;
  questionAr: string;
  questionNl: string;
  questionFr: string;
  questionType: string;
  difficultyLevel: string;
  categoryId: number;
  categoryCode: string;
  categoryNameEn: string;
  categoryNameAr: string;
  categoryNameNl: string;
  categoryNameFr: string;
  contentImageUrl: string | null;
  options: QuizAnswerOptionDTO[];
}

interface CategoryDTO {
  id: number;
  code: string;
  nameEn: string;
  nameAr: string;
  nameNl: string;
  nameFr: string;
}

interface SubmitAnswerResponse {
  questionId: number;
  isCorrect: boolean;
  selectedOptionId: number;
  correctOptionId: number;
  correctOptionTextEn: string;
  correctOptionTextAr: string;
  correctOptionTextNl: string;
  correctOptionTextFr: string;
  explanationEn: string | null;
  explanationAr: string | null;
  explanationNl: string | null;
  explanationFr: string | null;
  updatedAccuracy: number | null;
  totalAttempts: number | null;
  correctAttempts: number | null;
  masteryLevel: string | null;
}

function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🧠</div>
        </div>
        <p className="text-base text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

export default function PracticeQuestionsPage() {
  const params = useParams();
  const categoryCode = params.category as string;
  const { language, t } = useLanguage();
  const { isAuthenticated } = useAuth();

  const [questions, setQuestions] = useState<QuizQuestionDTO[]>([]);
  const [category, setCategory] = useState<CategoryDTO | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      let endpoint: string;
      if (categoryCode === 'random') {
        endpoint = '/smart-quiz/random?count=20';
      } else {
        const catResp = await apiClient.get<CategoryDTO>(`/categories/${categoryCode}`);
        setCategory(catResp.data);
        endpoint = `/smart-quiz/category/${catResp.data.id}?count=20`;
      }
      const resp = await apiClient.get<QuizQuestionDTO[]>(endpoint);
      setQuestions(resp.data);
      setError(null);
    } catch (err) {
      logApiError('Failed to fetch quiz data', err);
      if (isServiceUnavailable(err)) {
        setServiceUnavailable(true);
      } else {
        const msg = t('practice.load_error');
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryCode, t]);

  const getQuestionText = (q: QuizQuestionDTO): string => {
    const map: Record<string, string> = {
      en: q.questionEn, ar: q.questionAr, nl: q.questionNl, fr: q.questionFr,
    };
    return map[language] || q.questionEn || '';
  };

  const getOptionText = (opt: QuizAnswerOptionDTO): string => {
    const map: Record<string, string> = {
      en: opt.optionTextEn, ar: opt.optionTextAr, nl: opt.optionTextNl, fr: opt.optionTextFr,
    };
    return map[language] || opt.optionTextEn || '';
  };

  const getExplanationFromResponse = (resp: SubmitAnswerResponse): string | undefined => {
    const map: Record<string, string | null> = {
      en: resp.explanationEn, ar: resp.explanationAr,
      nl: resp.explanationNl, fr: resp.explanationFr,
    };
    return (map[language] || resp.explanationEn) ?? undefined;
  };

  const getCategoryName = (): string => {
    if (categoryCode === 'random') return t('practice.random');
    const src = category ?? (questions[0] ? {
      nameEn: questions[0].categoryNameEn, nameAr: questions[0].categoryNameAr,
      nameNl: questions[0].categoryNameNl, nameFr: questions[0].categoryNameFr,
    } : null);
    if (!src) return categoryCode;
    const map: Record<string, string> = {
      en: src.nameEn, ar: src.nameAr, nl: src.nameNl, fr: src.nameFr,
    };
    return map[language] || src.nameEn;
  };

  const getCategoryCode = (): string =>
    category?.code ?? questions[0]?.categoryCode ?? categoryCode;

  const submitAnswer = useCallback(async (
    questionId: number,
    selectedOptionId: number,
  ): Promise<AnswerFeedback> => {
    const resp = await apiClient.post<SubmitAnswerResponse>(
      `/quiz/questions/${questionId}/answer`,
      { selectedOptionId },
    );
    const data = resp.data;
    if (data.isCorrect) setCorrectCount((prev) => prev + 1);
    else setWrongCount((prev) => prev + 1);
    setTimeout(() => {
      if (currentIndex < questions.length - 1) setCurrentIndex((prev) => prev + 1);
      else setIsComplete(true);
    }, 2000);
    return {
      isCorrect: data.isCorrect,
      correctOptionId: String(data.correctOptionId),
      explanation: getExplanationFromResponse(data),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, questions.length, language]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    setIsComplete(false);
  }, []);

  if (isLoading) return <LoadingSpinner message={t('practice.loading')} />;

  if (serviceUnavailable) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <ServiceUnavailableBanner
          onRetry={() => { setServiceUnavailable(false); setError(null); fetchData(); }}
          className="max-w-md"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchData} className="gap-2 w-full">
            <RefreshCw className="w-4 h-4" />
            {t('practice.retry') || 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center mx-auto">
            <span className="text-4xl">🔄</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {t('practice.no_questions_title') || 'No Questions Available'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('practice.no_questions_hint') || 'There are no deliverable questions in this category right now. Please try another category or check back later.'}
          </p>
          <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-left">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              💡 <strong>Tip:</strong> Try the <strong>Random Practice</strong> for questions across all categories, or come back after 24 hours for fresh questions.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => window.location.href = '/practice/random'}
              className="gap-2 w-full"
            >
              <RefreshCw className="w-4 h-4" />
              {'Try Random Practice'}
            </Button>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="gap-2 w-full"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('practice.go_back') || 'Go Back'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalAttempted = correctCount + wrongCount;
  const accuracy = totalAttempted > 0 ? (correctCount / totalAttempted) * 100 : 0;

  if (isComplete) {
    return (
      <PracticeComplete
        categoryName={getCategoryName()}
        totalQuestions={questions.length}
        correctAnswers={correctCount}
        wrongAnswers={wrongCount}
        accuracy={accuracy}
        onRestart={handleRestart}
      />
    );
  }

  const currentQuestion = questions[currentIndex];

  const mappedQuestion = {
    id: String(currentQuestion.id),
    text: getQuestionText(currentQuestion),
    imageUrl: currentQuestion.contentImageUrl ?? undefined,
    options: (currentQuestion.options || [])
      .map((opt) => ({ id: String(opt.id), text: getOptionText(opt) }))
      .filter((opt) => opt.text.trim() !== ''),
    categoryCode: getCategoryCode(),
    categoryName: getCategoryName(),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="space-y-5">

          {/* Guest Banner */}
          {!isAuthenticated && (
            <div className="rounded-2xl border border-amber-300/50 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
              <span className="text-xl flex-shrink-0">👋</span>
              <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                {t('practice.guest_banner')}
              </p>
            </div>
          )}

          {/* Progress Header */}
          <div className="flex items-center justify-between rounded-2xl bg-card border border-border/40 px-5 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧠</span>
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-sm font-bold leading-tight">{getCategoryName()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="font-black text-primary text-lg">{currentIndex + 1}</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-semibold text-muted-foreground">{questions.length}</span>
            </div>
          </div>

          {/* Stats */}
          <PracticeStats
            totalQuestions={questions.length}
            currentQuestion={currentIndex + 1}
            correctAnswers={correctCount}
            wrongAnswers={wrongCount}
            accuracy={accuracy}
          />

          {/* Question Card */}
          <PracticeQuestionCard
            key={currentQuestion.id}
            question={mappedQuestion}
            onSubmitAnswer={(selectedOptionId) =>
              submitAnswer(currentQuestion.id, Number(selectedOptionId))
            }
          />

        </div>
      </div>
    </div>
  );
}
