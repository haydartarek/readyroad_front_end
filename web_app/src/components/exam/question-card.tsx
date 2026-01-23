'use client';

import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

interface Question {
  id: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  imageUrl?: string;
  options: Array<{
    number: 1 | 2 | 3;
    textEn: string;
    textAr: string;
    textNl: string;
    textFr: string;
  }>;
}

interface QuestionCardProps {
  question: Question;
  selectedAnswer?: number;
  onAnswerSelect: (optionNumber: number) => void;
  showCorrectAnswer?: boolean;
  correctAnswer?: number;
}

export function QuestionCard({
  question,
  selectedAnswer,
  onAnswerSelect,
  showCorrectAnswer = false,
  correctAnswer,
}: QuestionCardProps) {
  const { language } = useLanguage();
  
  const getQuestionText = () => {
    switch (language) {
      case 'ar':
        return question.questionTextAr;
      case 'nl':
        return question.questionTextNl;
      case 'fr':
        return question.questionTextFr;
      default:
        return question.questionTextEn;
    }
  };
  
  const getOptionText = (option: Question['options'][0]) => {
    switch (language) {
      case 'ar':
        return option.textAr;
      case 'nl':
        return option.textNl;
      case 'fr':
        return option.textFr;
      default:
        return option.textEn;
    }
  };
  
  return (
    <Card>
      <CardContent className="p-8">
        <div className="space-y-8">
          {/* Question Image */}
          {question.imageUrl && (
            <div className="flex justify-center">
              <div className="relative h-64 w-full max-w-md overflow-hidden rounded-[24px] bg-gray-100">
                <Image
                  src={question.imageUrl}
                  alt="Question illustration"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          )}
          
          {/* Question Text */}
          <div>
            <h3 className="text-xl font-semibold leading-relaxed">
              {getQuestionText()}
            </h3>
          </div>
          
          {/* Options */}
          <div className="space-y-4">
            {question.options.map((option) => {
              const isSelected = selectedAnswer === option.number;
              const isCorrect = showCorrectAnswer && correctAnswer === option.number;
              const isWrong = showCorrectAnswer && isSelected && correctAnswer !== option.number;
              
              return (
                <button
                  key={option.number}
                  onClick={() => !showCorrectAnswer && onAnswerSelect(option.number)}
                  disabled={showCorrectAnswer}
                  className={cn(
                    'w-full rounded-[24px] border-2 p-6 text-left transition-all',
                    'hover:border-primary hover:bg-primary/5',
                    isSelected && !showCorrectAnswer && 'border-primary bg-primary/10',
                    isCorrect && 'border-green-500 bg-green-50',
                    isWrong && 'border-red-500 bg-red-50',
                    showCorrectAnswer && 'cursor-default'
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Option Number */}
                    <div
                      className={cn(
                        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 font-bold',
                        isSelected && !showCorrectAnswer && 'border-primary bg-primary text-white',
                        isCorrect && 'border-green-500 bg-green-500 text-white',
                        isWrong && 'border-red-500 bg-red-500 text-white',
                        !isSelected && !isCorrect && !isWrong && 'border-gray-300 bg-white'
                      )}
                    >
                      {option.number}
                    </div>
                    
                    {/* Option Text */}
                    <div className="flex-1 text-base font-medium">
                      {getOptionText(option)}
                    </div>
                    
                    {/* Feedback Icons (Practice Mode) */}
                    {showCorrectAnswer && (
                      <div className="flex-shrink-0">
                        {isCorrect && (
                          <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {isWrong && (
                          <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
