'use client';

import Image from 'next/image';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { convertToPublicImageUrl } from '@/lib/image-utils';

// ─── Types ───────────────────────────────────────────────

type Lang = 'en' | 'ar' | 'nl' | 'fr';

interface QuestionOption {
  number: 1 | 2 | 3;
  textEn: string;
  textAr: string;
  textNl: string;
  textFr: string;
}

interface Question {
  id: number;
  questionTextEn: string;
  questionTextAr: string;
  questionTextNl: string;
  questionTextFr: string;
  imageUrl?: string;
  options: QuestionOption[];
}

interface QuestionCardProps {
  question: Question;
  selectedAnswer?: number;
  onAnswerSelect: (optionNumber: number) => void;
  showCorrectAnswer?: boolean;
  correctAnswer?: number;
}

// ─── Helpers ─────────────────────────────────────────────

function getByLang<T extends Record<string, string>>(obj: T, key: string, lang: Lang): string {
  const suffix = lang === 'en' ? 'En' : lang.charAt(0).toUpperCase() + lang.slice(1);
  return (obj as Record<string, string>)[`${key}${suffix}`] ?? obj[`${key}En`] ?? '';
}

// ─── Component ───────────────────────────────────────────

export function QuestionCard({
  question,
  selectedAnswer,
  onAnswerSelect,
  showCorrectAnswer = false,
  correctAnswer,
}: QuestionCardProps) {
  const { language, isRTL } = useLanguage();
  const lang = language as Lang;

  const questionText = getByLang(
    { questionTextEn: question.questionTextEn, questionTextAr: question.questionTextAr,
      questionTextNl: question.questionTextNl, questionTextFr: question.questionTextFr },
    'questionText', lang,
  );

  const imageUrl = question.imageUrl
    ? convertToPublicImageUrl(question.imageUrl) ?? null
    : null;

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardContent className="p-6 md:p-8">
        <div className="space-y-6">

          {/* Image */}
          {imageUrl && (
            <div className="flex justify-center">
              <div className="relative h-64 w-full max-w-md overflow-hidden rounded-2xl bg-muted">
                <Image
                  src={imageUrl}
                  alt="Question illustration"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          )}

          {/* Question text */}
          <h3
            className="text-xl font-black leading-relaxed text-foreground"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {questionText}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map(option => {
              const isSelected = selectedAnswer === option.number;
              const isCorrect  = showCorrectAnswer && correctAnswer === option.number;
              const isWrong    = showCorrectAnswer && isSelected && correctAnswer !== option.number;
              const optionText = getByLang(
                { textEn: option.textEn, textAr: option.textAr, textNl: option.textNl, textFr: option.textFr },
                'text', lang,
              );

              return (
                <button
                  key={`${question.id}-${option.number}`}
                  onClick={() => !showCorrectAnswer && onAnswerSelect(option.number)}
                  disabled={showCorrectAnswer}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className={cn(
                    'w-full rounded-2xl border-2 p-5 text-left transition-all',
                    // default
                    !isSelected && !isCorrect && !isWrong &&
                      'border-border hover:border-primary hover:bg-primary/5',
                    // selected (exam mode)
                    isSelected && !showCorrectAnswer &&
                      'border-primary bg-primary/10',
                    // correct answer
                    isCorrect &&
                      'border-green-500 bg-green-50  dark:bg-green-950/20',
                    // wrong answer
                    isWrong &&
                      'border-red-500   bg-red-50    dark:bg-red-950/20',
                    // disabled cursor
                    showCorrectAnswer && 'cursor-default',
                  )}
                >
                  <div className="flex items-center gap-4">

                    {/* Number badge */}
                    <div className={cn(
                      'flex h-9 w-9 flex-shrink-0 items-center justify-center',
                      'rounded-xl border-2 text-sm font-black transition-colors',
                      isSelected && !showCorrectAnswer && 'border-primary    bg-primary    text-white',
                      isCorrect                         && 'border-green-500  bg-green-500  text-white',
                      isWrong                           && 'border-red-500    bg-red-500    text-white',
                      !isSelected && !isCorrect && !isWrong && 'border-border bg-card text-foreground',
                    )}>
                      {option.number}
                    </div>

                    {/* Text */}
                    <span className="flex-1 text-base font-medium text-foreground text-left">
                      {optionText}
                    </span>

                    {/* Feedback icon */}
                    {showCorrectAnswer && (isCorrect || isWrong) && (
                      <div className="flex-shrink-0">
                        {isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        {isWrong   && <XCircle      className="h-5 w-5 text-red-500"   />}
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
