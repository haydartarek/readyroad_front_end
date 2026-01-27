'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PracticeStatsProps {
  totalQuestions: number;
  currentQuestion: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
}

export function PracticeStats({
  totalQuestions,
  currentQuestion,
  correctAnswers,
  wrongAnswers,
  accuracy,
}: PracticeStatsProps) {
  const progressPercentage = ((currentQuestion - 1) / totalQuestions) * 100;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Progress</span>
              <span className="text-gray-600">
                Question {currentQuestion} of {totalQuestions}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Accuracy */}
            <div className="text-center rounded-lg bg-blue-50 p-3">
              <div className="text-2xl font-bold text-blue-600">
                {accuracy.toFixed(0)}%
              </div>
              <div className="text-xs text-blue-800 mt-1">Accuracy</div>
            </div>

            {/* Correct */}
            <div className="text-center rounded-lg bg-green-50 p-3">
              <div className="text-2xl font-bold text-green-600">
                {correctAnswers}
              </div>
              <div className="text-xs text-green-800 mt-1">Correct</div>
            </div>

            {/* Wrong */}
            <div className="text-center rounded-lg bg-red-50 p-3">
              <div className="text-2xl font-bold text-red-600">
                {wrongAnswers}
              </div>
              <div className="text-xs text-red-800 mt-1">Wrong</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
