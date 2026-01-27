'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface TimeAnalysis {
  totalTime: string;
  averagePerQuestion: string;
  fastestQuestion: string;
  slowestQuestion: string;
}

interface ExamStatsProps {
  score: number;
  totalQuestions: number;
  passed: boolean;
  passingScore: number;
  timeAnalysis?: TimeAnalysis;
}

export function ExamStats({ 
  score, 
  totalQuestions, 
  passed, 
  passingScore,
  timeAnalysis 
}: ExamStatsProps) {
  const percentage = ((score / totalQuestions) * 100).toFixed(1);
  const wrongCount = totalQuestions - score;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Main Score Card */}
      <Card className={cn(
        'border-2',
        passed ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
      )}>
        <CardHeader>
          <CardTitle className="text-center text-lg">Your Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="mb-4">
              <span className={cn(
                'text-6xl font-bold',
                passed ? 'text-green-600' : 'text-red-600'
              )}>
                {score}
              </span>
              <span className="text-3xl text-gray-500">/{totalQuestions}</span>
            </div>
            <div className={cn(
              'mb-2 text-2xl font-bold',
              passed ? 'text-green-600' : 'text-red-600'
            )}>
              {percentage}%
            </div>
            <div className="text-sm text-gray-600">
              Required: {passingScore}/{totalQuestions} ({((passingScore / totalQuestions) * 100).toFixed(0)}%)
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-center">
            <div className="rounded-lg bg-white p-3">
              <div className="text-2xl font-bold text-green-600">{score}</div>
              <div className="text-xs text-gray-600">Correct</div>
            </div>
            <div className="rounded-lg bg-white p-3">
              <div className="text-2xl font-bold text-red-600">{wrongCount}</div>
              <div className="text-xs text-gray-600">Wrong</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Analysis Card */}
      {timeAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Time Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm text-gray-600">Total Time</span>
                <span className="font-bold text-gray-900">{timeAnalysis.totalTime}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm text-gray-600">Avg per Question</span>
                <span className="font-bold text-gray-900">{timeAnalysis.averagePerQuestion}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm text-gray-600">Fastest</span>
                <span className="font-bold text-green-600">{timeAnalysis.fastestQuestion}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <span className="text-sm text-gray-600">Slowest</span>
                <span className="font-bold text-orange-600">{timeAnalysis.slowestQuestion}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/exam">
              <Button className="w-full" variant="default">
                🔄 Try Another Exam
              </Button>
            </Link>
            <Link href="/practice">
              <Button className="w-full" variant="outline">
                📝 Practice Mode
              </Button>
            </Link>
            <Link href="/analytics/weak-areas">
              <Button className="w-full" variant="outline">
                📊 View Analytics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
