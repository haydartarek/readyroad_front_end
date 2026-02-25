'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { PracticeQuestionCard, AnswerFeedback } from '@/components/practice/practice-question-card';
import { PracticeStats } from '@/components/practice/practice-stats';
import { PracticeComplete } from '@/components/practice/practice-complete';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import apiClient, { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { toast } from 'sonner';

// ── Interfaces matching the secure delivery DTO contract ──────────────
//    NO correctOptionId, NO explanations — those come from submission only

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

// ── Server submission response shape ──────────────────────────────────

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
  }, [categoryCode, t]);

  // ── Language-aware getters ──────────────────────────────────────────

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
      en: resp.explanationEn, ar: resp.explanationAr, nl: resp.explanationNl, fr: resp.explanationFr,
    };
    return (map[language] || resp.explanationEn) ?? undefined;
  };

  const getCategoryName = (): string => {
    if (categoryCode === 'random') return t('practice.random');
    const src = category ?? (questions[0] ? {
      nameEn: questions[0].categoryNameEn,
      nameAr: questions[0].categoryNameAr,
      nameNl: questions[0].categoryNameNl,
      nameFr: questions[0].categoryNameFr,
    } : null);
    if (!src) return categoryCode;
    const map: Record<string, string> = {
      en: src.nameEn, ar: src.nameAr, nl: src.nameNl, fr: src.nameFr,
    };
    return map[language] || src.nameEn;
  };

  const getCategoryCode = (): string => {
    return category?.code ?? questions[0]?.categoryCode ?? categoryCode;
  };

  // ── Server-side answer submission ──────────────────────────────────

  const submitAnswer = useCallback(async (
    questionId: number,
    selectedOptionId: number,
  ): Promise<AnswerFeedback> => {
    const resp = await apiClient.post<SubmitAnswerResponse>(
      `/quiz/questions/${questionId}/answer`,
      { selectedOptionId },
    );
    const data = resp.data;

    // Update counters based on server response
    if (data.isCorrect) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setWrongCount((prev) => prev + 1);
    }

    // Advance to next question after a brief delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsComplete(true);
      }
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

  // ── Render ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-lg text-muted-foreground">{t('practice.loading')}</p>
        </div>
      </div>
    );
  }

  if (serviceUnavailable) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md w-full">
          <ServiceUnavailableBanner
            onRetry={() => {
              setServiceUnavailable(false);
              setError(null);
              fetchData();
            }}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <button
            onClick={fetchData}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            {t('practice.retry') || 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {t('practice.no_questions_title') || 'No Questions Available'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('practice.no_questions_hint') || 'There are no deliverable questions in this category right now. Please try another category or check back later.'}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            {t('practice.go_back') || 'Go Back'}
          </button>
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

  // Options are already sorted by displayOrder from the backend
  const mappedQuestion = {
    id: String(currentQuestion.id),
    text: getQuestionText(currentQuestion),
    imageUrl: currentQuestion.contentImageUrl ?? undefined,
    options: (currentQuestion.options || [])
      .map((opt) => ({
        id: String(opt.id),
        text: getOptionText(opt),
      }))
      .filter((opt) => opt.text.trim() !== ''),
    categoryCode: getCategoryCode(),
    categoryName: getCategoryName(),
  };

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="space-y-6">
          {/* Guest mode banner */}
          {!isAuthenticated && (
            <Alert className="border-amber-300 bg-amber-50">
              <AlertDescription className="text-amber-800">
                {t('practice.guest_banner')}
              </AlertDescription>
            </Alert>
          )}

          <PracticeStats
            totalQuestions={questions.length}
            currentQuestion={currentIndex + 1}
            correctAnswers={correctCount}
            wrongAnswers={wrongCount}
            accuracy={accuracy}
          />

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
