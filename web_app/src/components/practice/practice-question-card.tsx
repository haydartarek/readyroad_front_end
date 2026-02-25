'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { convertToPublicImageUrl } from '@/lib/image-utils';
import { useLanguage } from '@/contexts/language-context';

// ── Answer feedback returned by the server after submission ──
export interface AnswerFeedback {
  isCorrect: boolean;
  correctOptionId: string;
  explanation?: string;
}

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
    categoryCode: string;
    categoryName: string;
  };
  /** Called when the user selects an option. Returns server-side feedback. */
  onSubmitAnswer: (selectedOptionId: string) => Promise<AnswerFeedback>;
}

export function PracticeQuestionCard({ question, onSubmitAnswer }: PracticeQuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(false);
  const { t } = useLanguage();

  const showResult = feedback !== null;

  const handleOptionClick = async (optionId: string) => {
    if (showResult || isSubmitting) return;

    setSelectedOption(optionId);
    setIsSubmitting(true);
    setSubmissionError(false);

    try {
      const result = await onSubmitAnswer(optionId);
      setFeedback(result);
    } catch {
      // Never fabricate correctness on network/server failure.
      // Show an error state and allow retry instead.
      setSubmissionError(true);
      setSelectedOption(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOptionStyle = (optionId: string) => {
    if (!showResult) {
      if (isSubmitting && optionId === selectedOption) {
        return 'border-primary bg-primary/10 animate-pulse';
      }
      return selectedOption === optionId
        ? 'border-primary bg-primary/5'
        : 'border-border hover:border-primary/50 hover:bg-muted';
    }

    if (optionId === feedback!.correctOptionId) {
      return 'border-green-500 bg-green-50';
    }
    if (optionId === selectedOption && optionId !== feedback!.correctOptionId) {
      return 'border-red-500 bg-red-50';
    }
    return 'border-border bg-muted';
  };

  const getOptionIcon = (optionId: string) => {
    if (isSubmitting && optionId === selectedOption) {
      return <Loader2 className="h-6 w-6 text-primary animate-spin" />;
    }
    if (!showResult) return null;

    if (optionId === feedback!.correctOptionId) {
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    }
    if (optionId === selectedOption && optionId !== feedback!.correctOptionId) {
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
          {!showResult && !isSubmitting && (
            <Badge variant="secondary" className="whitespace-nowrap">
              <AlertCircle className="mr-1 h-3 w-3" />
              {t('practice.select_answer')}
            </Badge>
          )}
          {isSubmitting && (
            <Badge variant="secondary" className="whitespace-nowrap">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              {t('practice.submitting')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Question Image */}
        {question.imageUrl && convertToPublicImageUrl(question.imageUrl) && (
          <div className="rounded-lg overflow-hidden border border-border">
            <Image
              src={convertToPublicImageUrl(question.imageUrl)!}
              alt={t('practice.question_image_alt')}
              width={800}
              height={400}
              className="w-full h-auto max-h-64 object-contain bg-muted"
            />
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              disabled={showResult || isSubmitting}
              className={`w-full rounded-lg border-2 p-4 text-left transition-all ${getOptionStyle(
                option.id
              )} ${showResult || isSubmitting ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  {option.imageUrl && convertToPublicImageUrl(option.imageUrl) ? (
                    <div className="space-y-2">
                      <p className="font-medium">{option.text}</p>
                      <Image
                        src={convertToPublicImageUrl(option.imageUrl)!}
                        alt={option.text}
                        width={128}
                        height={128}
                        className="w-32 h-32 object-contain bg-background rounded border"
                      />
                    </div>
                  ) : (
                    <p className="font-medium">{option.text}</p>
                  )}
                </div>
                {getOptionIcon(option.id)}
              </div>
            </button>
          ))}
        </div>

        {/* Submission error — never fabricate correctness */}
        {submissionError && (
          <div className="rounded-lg bg-amber-50 border border-amber-300 p-4 text-center">
            <AlertCircle className="mx-auto mb-2 h-6 w-6 text-amber-600" />
            <p className="text-sm font-semibold text-amber-900 mb-1">
              {t('practice.submission_error') || 'Could not submit your answer'}
            </p>
            <p className="text-xs text-amber-700">
              {t('practice.submission_error_hint') || 'Please try selecting an option again.'}
            </p>
          </div>
        )}

        {/* Explanation (from server response) */}
        {showResult && feedback?.explanation && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">{t('practice.explanation')}</p>
            <p className="text-sm text-blue-800">{feedback.explanation}</p>
          </div>
        )}

        {/* Result Badge */}
        {showResult && (
          <div className="text-center pt-2">
            {feedback!.isCorrect ? (
              <Badge className="bg-green-600 text-white text-base px-4 py-2">
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('practice.answer_correct')}
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-base px-4 py-2">
                <XCircle className="mr-2 h-4 w-4" />
                {t('practice.answer_incorrect')}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
