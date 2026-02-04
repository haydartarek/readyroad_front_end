'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { PracticeQuestionCard } from '@/components/practice/practice-question-card';
import { PracticeStats } from '@/components/practice/practice-stats';
import { PracticeComplete } from '@/components/practice/practice-complete';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/language-context';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface QuizQuestion {
  id: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  imagePath?: string; // Legacy field
  contentImageUrl?: string; // Backend field name
  option1En: string;
  option1Ar: string;
  option1Nl: string;
  option1Fr: string;
  option2En: string;
  option2Ar: string;
  option2Nl: string;
  option2Fr: string;
  option3En: string;
  option3Ar: string;
  option3Nl: string;
  option3Fr: string;
  correctAnswer: number;
  categoryCode: string;
}

interface Category {
  code: string;
  nameEn: string;
  nameAr: string;
  nameNl: string;
  nameFr: string;
}

interface AnswerResponse {
  correct: boolean;
  correctAnswer: number;
  explanation?: string;
}

export default function PracticeQuestionsPage() {
  const params = useParams();
  const categoryCode = params.category as string;
  const { language } = useLanguage();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch questions based on category
        const endpoint =
          categoryCode === 'random'
            ? '/quiz/random?count=20'
            : `/quiz/category/${categoryCode}?count=20`;

        const questionsResponse = await apiClient.get<QuizQuestion[]>(endpoint);
        setQuestions(questionsResponse.data);

        // Fetch category info if not random
        if (categoryCode !== 'random') {
          try {
            const categoryResponse = await apiClient.get<Category>(`/categories/${categoryCode}`);
            setCategory(categoryResponse.data);
          } catch {
            // Category not found, use default name
            setCategory({ code: categoryCode, nameEn: categoryCode, nameAr: categoryCode, nameNl: categoryCode, nameFr: categoryCode });
          }
        }

        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load practice session');
        toast.error('Failed to load practice session');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [categoryCode]);

  const getQuestionText = (q: QuizQuestion) => {
    switch (language) {
      case 'ar': return q.questionTextAr || q.questionTextEn;
      case 'nl': return q.questionTextNl || q.questionTextEn;
      case 'fr': return q.questionTextFr || q.questionTextEn;
      default: return q.questionTextEn;
    }
  };

  const getOptionText = (q: QuizQuestion, optionNum: 1 | 2 | 3) => {
    const key = `option${optionNum}${language === 'en' ? 'En' : language === 'ar' ? 'Ar' : language === 'nl' ? 'Nl' : 'Fr'}` as keyof QuizQuestion;
    const fallbackKey = `option${optionNum}En` as keyof QuizQuestion;
    return (q[key] as string) || (q[fallbackKey] as string);
  };

  const getCategoryName = () => {
    if (!category) return categoryCode === 'random' ? 'Random Practice' : categoryCode;
    switch (language) {
      case 'ar': return category.nameAr || category.nameEn;
      case 'nl': return category.nameNl || category.nameEn;
      case 'fr': return category.nameFr || category.nameEn;
      default: return category.nameEn;
    }
  };

  const handleAnswer = useCallback(async (isCorrect: boolean, questionId: number, selectedAnswer: number) => {
    // Submit answer to backend for tracking
    try {
      await apiClient.post<AnswerResponse>(`/quiz/questions/${questionId}/answer`, {
        answer: selectedAnswer,
      });
    } catch (err) {
      console.error('Failed to submit answer:', err);
      // Don't block the flow if answer submission fails
    }

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setWrongCount((prev) => prev + 1);
    }

    // Move to next question after delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsComplete(true);
      }
    }, 2000);
  }, [currentIndex, questions.length]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    setIsComplete(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-lg text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error || 'No questions found for this category'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalAttempted = correctCount + wrongCount;
  const accuracy = totalAttempted > 0 ? (correctCount / totalAttempted) * 100 : 0;

  // Show completion screen
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

  // Map question to component format
  const mappedQuestion = {
    id: String(currentQuestion.id),
    text: getQuestionText(currentQuestion),
    imageUrl: currentQuestion.contentImageUrl || currentQuestion.imagePath,
    options: [
      { id: '1', text: getOptionText(currentQuestion, 1) },
      { id: '2', text: getOptionText(currentQuestion, 2) },
      { id: '3', text: getOptionText(currentQuestion, 3) },
    ],
    correctOptionId: String(currentQuestion.correctAnswer),
    categoryCode: currentQuestion.categoryCode,
    categoryName: getCategoryName(),
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="space-y-6">
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
            question={mappedQuestion}
            onAnswer={(isCorrect) => handleAnswer(isCorrect, currentQuestion.id, parseInt(mappedQuestion.correctOptionId))}
          />
        </div>
      </div>
    </div>
  );
}
