'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface PracticeQuestionCardProps {
  question: {
    id: string;
    text: string;
    imageUrl?: string;
    options: Array<{
      id: string;
      text: string;
      imageUrl?: string;
    }>;
    correctOptionId: string;
    explanation?: string;
    categoryCode: string;
    categoryName: string;
  };
  onAnswer: (isCorrect: boolean) => void;
}

export function PracticeQuestionCard({ question, onAnswer }: PracticeQuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleOptionClick = (optionId: string) => {
    if (showResult) return; // Don't allow changing after revealing answer
    
    setSelectedOption(optionId);
    setShowResult(true);
    const isCorrect = optionId === question.correctOptionId;
    
    // Notify parent about the answer
    setTimeout(() => onAnswer(isCorrect), 1500);
  };

  const getOptionStyle = (optionId: string) => {
    if (!showResult) {
      return selectedOption === optionId
        ? 'border-primary bg-primary/5'
        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50';
    }

    // After revealing answer
    if (optionId === question.correctOptionId) {
      return 'border-green-500 bg-green-50';
    }
    if (optionId === selectedOption && optionId !== question.correctOptionId) {
      return 'border-red-500 bg-red-50';
    }
    return 'border-gray-200 bg-gray-100';
  };

  const getOptionIcon = (optionId: string) => {
    if (!showResult) return null;

    if (optionId === question.correctOptionId) {
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    }
    if (optionId === selectedOption && optionId !== question.correctOptionId) {
      return <XCircle className="h-6 w-6 text-red-600" />;
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Badge variant="outline" className="mb-2">
              {question.categoryCode} - {question.categoryName}
            </Badge>
            <CardTitle className="text-lg leading-relaxed">{question.text}</CardTitle>
          </div>
          {!showResult && (
            <Badge variant="secondary" className="whitespace-nowrap">
              <AlertCircle className="mr-1 h-3 w-3" />
              Select Answer
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Question Image */}
        {question.imageUrl && (
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={question.imageUrl}
              alt="Question illustration"
              width={800}
              height={400}
              className="w-full h-auto max-h-64 object-contain bg-gray-50"
            />
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              disabled={showResult}
              className={`w-full rounded-lg border-2 p-4 text-left transition-all ${getOptionStyle(
                option.id
              )} ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                {/* Option content */}
                <div className="flex-1">
                  {option.imageUrl ? (
                    <div className="space-y-2">
                      <p className="font-medium">{option.text}</p>
                      <Image
                        src={option.imageUrl}
                        alt={option.text}
                        width={128}
                        height={128}
                        className="w-32 h-32 object-contain bg-white rounded border"
                      />
                    </div>
                  ) : (
                    <p className="font-medium">{option.text}</p>
                  )}
                </div>

                {/* Result icon */}
                {getOptionIcon(option.id)}
              </div>
            </button>
          ))}
        </div>

        {/* Explanation */}
        {showResult && question.explanation && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">💡 Explanation:</p>
            <p className="text-sm text-blue-800">{question.explanation}</p>
          </div>
        )}

        {/* Result Badge */}
        {showResult && (
          <div className="text-center pt-2">
            {selectedOption === question.correctOptionId ? (
              <Badge className="bg-green-600 text-white text-base px-4 py-2">
                <CheckCircle className="mr-2 h-4 w-4" />
                Correct! Great job! 🎉
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-base px-4 py-2">
                <XCircle className="mr-2 h-4 w-4" />
                Not quite right. Keep practicing!
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
