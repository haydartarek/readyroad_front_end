'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { convertToPublicImageUrl } from '@/lib/image-utils';
import { useLanguage } from '@/contexts/language-context';

// ─── Types ───────────────────────────────────────────────

export interface AnswerFeedback {
  isCorrect:       boolean;
  correctOptionId: string;
  explanation?:    string;
}

interface QuestionOption {
  id:        string;
  text:      string;
  imageUrl?: string;
}

interface Question {
  id:           string;
  text:         string;
  imageUrl?:    string;
  options:      QuestionOption[];
  categoryCode: string;
  categoryName: string;
}

interface PracticeQuestionCardProps {
  question:       Question;
  onSubmitAnswer: (selectedOptionId: string) => Promise<AnswerFeedback>;
}

// ─── Helpers ─────────────────────────────────────────────

function getOptionStyle(
  optionId:       string,
  selectedOption: string | null,
  feedback:       AnswerFeedback | null,
  isSubmitting:   boolean,
): string {
  if (!feedback) {
    if (isSubmitting && optionId === selectedOption)
      return 'border-primary bg-primary/10 animate-pulse';
    if (selectedOption === optionId)
      return 'border-primary bg-primary/5';
    return 'border-border hover:border-primary/50 hover:bg-muted';
  }
  if (optionId === feedback.correctOptionId)
    return 'border-green-500 bg-green-50';
  if (optionId === selectedOption)
    return 'border-red-500 bg-red-50';
  return 'border-border bg-muted';
}

function getOptionIcon(
  optionId:       string,
  selectedOption: string | null,
  feedback:       AnswerFeedback | null,
  isSubmitting:   boolean,
): React.ReactNode {
  if (isSubmitting && optionId === selectedOption)
    return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
  if (!feedback) return null;
  if (optionId === feedback.correctOptionId)
    return <CheckCircle className="h-6 w-6 text-green-600" />;
  if (optionId === selectedOption)
    return <XCircle className="h-6 w-6 text-red-600" />;
  return null;
}

// ─── Sub-components ──────────────────────────────────────

function StatusBadge({ isSubmitting, showResult }: { isSubmitting: boolean; showResult: boolean }) {
  const { t } = useLanguage();
  if (showResult) return null;
  if (isSubmitting) return (
    <Badge variant="secondary" className="whitespace-nowrap">
      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
      {t('practice.submitting')}
    </Badge>
  );
  return (
    <Badge variant="secondary" className="whitespace-nowrap">
      <AlertCircle className="mr-1 h-3 w-3" />
      {t('practice.select_answer')}
    </Badge>
  );
}

function SubmissionError() {
  const { t } = useLanguage();
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center">
      <AlertCircle className="mx-auto mb-2 h-6 w-6 text-amber-600" />
      <p className="mb-1 text-sm font-black text-amber-900">
        {t('practice.submission_error')}
      </p>
      <p className="text-xs text-amber-700">
        {t('practice.submission_error_hint')}
      </p>
    </div>
  );
}

function ExplanationBox({ explanation }: { explanation: string }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
      <p className="mb-2 text-sm font-black text-blue-900">{t('practice.explanation')}</p>
      <p className="text-sm text-blue-800">{explanation}</p>
    </div>
  );
}

function ResultBadge({ isCorrect }: { isCorrect: boolean }) {
  const { t } = useLanguage();
  return (
    <div className="pt-2 text-center">
      {isCorrect ? (
        <Badge className="bg-green-600 px-4 py-2 text-base text-white">
          <CheckCircle className="mr-2 h-4 w-4" />
          {t('practice.answer_correct')}
        </Badge>
      ) : (
        <Badge variant="destructive" className="px-4 py-2 text-base">
          <XCircle className="mr-2 h-4 w-4" />
          {t('practice.answer_incorrect')}
        </Badge>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export function PracticeQuestionCard({ question, onSubmitAnswer }: PracticeQuestionCardProps) {
  const { t } = useLanguage();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback,       setFeedback]       = useState<AnswerFeedback | null>(null);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [hasError,       setHasError]       = useState(false);

  const showResult = feedback !== null;

  const handleOptionClick = async (optionId: string) => {
    if (showResult || isSubmitting) return;

    setSelectedOption(optionId);
    setIsSubmitting(true);
    setHasError(false);

    try {
      setFeedback(await onSubmitAnswer(optionId));
    } catch {
      // Never fabricate correctness on failure — show error and allow retry
      setHasError(true);
      setSelectedOption(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const questionImageUrl = question.imageUrl
    ? convertToPublicImageUrl(question.imageUrl)
    : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Badge variant="outline" className="mb-2">
              {question.categoryCode} — {question.categoryName}
            </Badge>
            <CardTitle className="text-lg leading-relaxed font-black">
              {question.text}
            </CardTitle>
          </div>
          <StatusBadge isSubmitting={isSubmitting} showResult={showResult} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* Question image */}
        {questionImageUrl && (
          <div className="overflow-hidden rounded-xl border border-border">
            <Image
              src={questionImageUrl}
              alt={t('practice.question_image_alt')}
              width={800}
              height={400}
              className="max-h-64 w-full bg-muted object-contain"
            />
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
          {question.options.map(option => {
            const optionImageUrl = option.imageUrl
              ? convertToPublicImageUrl(option.imageUrl)
              : null;

            return (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                disabled={showResult || isSubmitting}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                  getOptionStyle(option.id, selectedOption, feedback, isSubmitting)
                } ${showResult || isSubmitting ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    {optionImageUrl ? (
                      <div className="space-y-2">
                        <p className="font-semibold">{option.text}</p>
                        <Image
                          src={optionImageUrl}
                          alt={option.text}
                          width={128}
                          height={128}
                          className="h-32 w-32 rounded border bg-background object-contain"
                        />
                      </div>
                    ) : (
                      <p className="font-semibold">{option.text}</p>
                    )}
                  </div>
                  {getOptionIcon(option.id, selectedOption, feedback, isSubmitting)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {hasError && <SubmissionError />}

        {/* Explanation */}
        {showResult && feedback?.explanation && (
          <ExplanationBox explanation={feedback.explanation} />
        )}

        {/* Result */}
        {showResult && <ResultBadge isCorrect={feedback!.isCorrect} />}

      </CardContent>
    </Card>
  );
}
