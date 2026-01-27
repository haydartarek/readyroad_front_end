'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReviewQuestion {
  id: number;
  questionText: string;
  imageUrl?: string;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  categoryName: string;
  explanation?: string;
}

interface QuestionReviewProps {
  questions: ReviewQuestion[];
  showOnlyWrong?: boolean;
}

export function QuestionReview({ questions, showOnlyWrong = false }: QuestionReviewProps) {
  
  const displayQuestions = showOnlyWrong
    ? questions.filter(q => !q.isCorrect)
    : questions;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {showOnlyWrong ? 'Wrong Answers' : 'All Questions Review'}
          </CardTitle>
          <span className="text-sm text-gray-600">
            {displayQuestions.length} question{displayQuestions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayQuestions.map((question, index) => (
            <div
              key={question.id}
              className={`rounded-lg border p-4 ${
                question.isCorrect
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-700">
                    {index + 1}
                  </span>
                  <span className="text-xs text-gray-600">{question.categoryName}</span>
                </div>
                <span
                  className={`text-lg ${question.isCorrect ? 'text-green-600' : 'text-red-600'}`}
                >
                  {question.isCorrect ? '✓' : '✗'}
                </span>
              </div>

              <p className="mb-3 text-gray-900">{question.questionText}</p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Your answer:</span>
                  <span
                    className={`font-medium ${
                      question.isCorrect ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    Option {question.selectedOption}
                  </span>
                </div>
                {!question.isCorrect && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">Correct answer:</span>
                    <span className="font-medium text-green-600">
                      Option {question.correctOption}
                    </span>
                  </div>
                )}
              </div>

              {question.explanation && (
                <div className="mt-3 rounded-md bg-white p-3 text-sm text-gray-700">
                  <span className="font-medium">Explanation:</span> {question.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        {displayQuestions.length === 0 && showOnlyWrong && (
          <div className="py-8 text-center text-gray-500">
            <p className="text-lg">🎉 Perfect score! No wrong answers.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
