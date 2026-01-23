'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { QuestionCard } from '@/components/exam/question-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

interface Question {
  id: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  imageUrl?: string;
  correctOption: 1 | 2 | 3;
  options: Array<{
    number: 1 | 2 | 3;
    textEn: string;
    textAr: string;
    textNl: string;
    textFr: string;
  }>;
}

export default function PracticeQuestionsPage() {
  const params = useParams();
  const categoryCode = params.category as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | undefined>();
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const endpoint =
          categoryCode === 'random'
            ? '/questions/random?count=20'
            : `/questions/category/${categoryCode}`;
        
        const response = await apiClient.get<Question[]>(endpoint);
        setQuestions(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch questions:', err);
        setError('Failed to load questions');
        toast.error('Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [categoryCode]);

  const handleAnswerSelect = useCallback((optionNumber: number) => {
    if (showAnswer) return;
    setSelectedAnswer(optionNumber);
  }, [showAnswer]);

  const handleCheckAnswer = useCallback(() => {
    if (!selectedAnswer) {
      toast.error('Please select an answer');
      return;
    }

    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctOption;

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      toast.success('✅ Correct!');
    } else {
      setWrongCount(prev => prev + 1);
      toast.error('❌ Incorrect');
    }

    setShowAnswer(true);
  }, [selectedAnswer, questions, currentIndex]);

  const handleNextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(undefined);
      setShowAnswer(false);
    }
  }, [currentIndex, questions.length]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setSelectedAnswer(undefined);
      setShowAnswer(false);
    }
  }, [currentIndex]);

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
          <AlertDescription>{error || 'No questions found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalAttempted = correctCount + wrongCount;
  const accuracy = totalAttempted > 0 ? (correctCount / totalAttempted) * 100 : 0;
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="space-y-6">
          {/* Header Stats */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle>Practice Mode</CardTitle>
                  <p className="text-sm text-gray-600">
                    Question {currentIndex + 1} of {questions.length}
                  </p>
                </div>
                <div className="flex gap-4">
                  <Badge variant="default" className="bg-green-500">
                    ✅ {correctCount} Correct
                  </Badge>
                  <Badge variant="destructive">
                    ❌ {wrongCount} Wrong
                  </Badge>
                  <Badge variant="secondary">
                    {accuracy.toFixed(0)}% Accuracy
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={((currentIndex + 1) / questions.length) * 100} />
            </CardContent>
          </Card>

          {/* Question Card */}
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            onAnswerSelect={handleAnswerSelect}
            showCorrectAnswer={showAnswer}
            correctAnswer={currentQuestion.correctOption}
          />

          {/* Navigation */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentIndex === 0}
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Button>

            <div className="flex gap-2">
              {!showAnswer ? (
                <Button onClick={handleCheckAnswer} disabled={!selectedAnswer}>
                  Check Answer
                </Button>
              ) : isLastQuestion ? (
                <Button asChild>
                  <Link href="/practice">Finish Practice</Link>
                </Button>
              ) : (
                <Button onClick={handleNextQuestion}>
                  Next Question
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              )}
            </div>
          </div>

          {/* Summary Card (when finished) */}
          {showAnswer && isLastQuestion && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle>Practice Session Complete! 🎉</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <div className="text-2xl font-bold">{questions.length}</div>
                    <div className="text-sm text-gray-600">Total Questions</div>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                    <div className="text-sm text-gray-600">Correct</div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{wrongCount}</div>
                    <div className="text-sm text-gray-600">Wrong</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/practice">Choose Another Category</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href="/exam">Take an Exam</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
