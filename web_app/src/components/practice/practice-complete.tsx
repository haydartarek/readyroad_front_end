'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PracticeCompleteProps {
  categoryName?: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  onRestart: () => void;
}

export function PracticeComplete({
  categoryName,
  totalQuestions,
  correctAnswers,
  wrongAnswers,
  accuracy,
  onRestart,
}: PracticeCompleteProps) {
  const isPassing = accuracy >= 85;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="space-y-6">
        {/* Celebration Header */}
        <div className="text-center">
          <div className="text-6xl mb-4">{isPassing ? '🎉' : '💪'}</div>
          <h1 className="text-4xl font-bold">
            {isPassing ? 'Excellent Work!' : 'Practice Complete!'}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {categoryName
              ? `You've completed practice for ${categoryName}`
              : "You've completed this practice session"}
          </p>
        </div>

        {/* Score Card */}
        <Card className={isPassing ? 'border-green-500 bg-green-50/50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Score</span>
              <Badge
                variant={isPassing ? 'default' : 'secondary'}
                className={isPassing ? 'bg-green-600 text-white' : ''}
              >
                {accuracy.toFixed(1)}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div>
              <Progress value={accuracy} className="h-3" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center rounded-lg bg-gray-50 p-4">
                <div className="text-3xl font-bold">{totalQuestions}</div>
                <div className="text-sm text-gray-600 mt-1">Total</div>
              </div>
              <div className="text-center rounded-lg bg-green-50 p-4">
                <div className="text-3xl font-bold text-green-600">
                  {correctAnswers}
                </div>
                <div className="text-sm text-gray-600 mt-1">Correct</div>
              </div>
              <div className="text-center rounded-lg bg-red-50 p-4">
                <div className="text-3xl font-bold text-red-600">
                  {wrongAnswers}
                </div>
                <div className="text-sm text-gray-600 mt-1">Wrong</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Message */}
        <Card>
          <CardContent className="pt-6">
            {accuracy >= 90 ? (
              <div className="text-center">
                <p className="text-lg font-semibold text-green-700">
                  🌟 Outstanding Performance!
                </p>
                <p className="mt-2 text-gray-600">
                  You have excellent mastery of this material. Keep up the great work!
                </p>
              </div>
            ) : accuracy >= 75 ? (
              <div className="text-center">
                <p className="text-lg font-semibold text-blue-700">
                  👍 Good Job!
                </p>
                <p className="mt-2 text-gray-600">
                  You&apos;re doing well! A bit more practice will help you master this topic.
                </p>
              </div>
            ) : accuracy >= 50 ? (
              <div className="text-center">
                <p className="text-lg font-semibold text-orange-700">
                  💡 Keep Practicing!
                </p>
                <p className="mt-2 text-gray-600">
                  You&apos;re making progress! Review the questions you got wrong and try again.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg font-semibold text-red-700">
                  📚 More Study Needed
                </p>
                <p className="mt-2 text-gray-600">
                  This topic needs more attention. Review the related lessons before practicing
                  again.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button size="lg" onClick={onRestart}>
            <span className="mr-2">🔄</span>
            Practice Again
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/practice">
              <span className="mr-2">📝</span>
              Choose Another Category
            </Link>
          </Button>
        </div>

        {/* Additional Options */}
        <Card>
          <CardHeader>
            <CardTitle>What&apos;s Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <Button variant="outline" asChild>
                <Link href="/lessons">
                  <span className="mr-2">📚</span>
                  Study Lessons
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/exam">
                  <span className="mr-2">🎯</span>
                  Take Exam
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/analytics/weak-areas">
                  <span className="mr-2">📊</span>
                  View Analytics
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
