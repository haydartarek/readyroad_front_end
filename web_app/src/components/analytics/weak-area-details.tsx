'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface WeakArea {
  categoryCode: string;
  categoryName: string;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  averageTime: string;
  commonMistakes: string[];
  recommendedLessons: Array<{
    code: string;
    title: string;
  }>;
}

interface WeakAreaDetailsProps {
  weakAreas: WeakArea[];
}

export function WeakAreaDetails({ weakAreas }: WeakAreaDetailsProps) {
  if (weakAreas.length === 0) {
    return (
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="py-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-green-900">Excellent Performance!</h3>
          <p className="mt-2 text-green-700">
            You don&apos;t have any weak areas. All categories show strong performance!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {weakAreas.map((area, index) => {
        const isVeryWeak = area.accuracy < 50;
        const isWeak = area.accuracy >= 50 && area.accuracy < 70;

        return (
          <Card
            key={area.categoryCode}
            className={cn(
              'border-2 transition-all hover:shadow-lg',
              isVeryWeak && 'border-red-300 bg-red-50',
              isWeak && 'border-orange-300 bg-orange-50'
            )}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-700">
                      {index + 1}
                    </span>
                    <Badge
                      variant="destructive"
                      className={cn(
                        isVeryWeak && 'bg-red-600',
                        isWeak && 'bg-orange-600'
                      )}
                    >
                      {isVeryWeak ? 'Critical' : 'Needs Practice'}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">{area.categoryName}</CardTitle>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      'text-4xl font-bold',
                      isVeryWeak && 'text-red-600',
                      isWeak && 'text-orange-600'
                    )}
                  >
                    {area.accuracy.toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Performance Stats */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-white p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {area.correctCount}
                  </div>
                  <div className="text-xs text-gray-600">Correct</div>
                </div>
                <div className="rounded-lg bg-white p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {area.totalCount - area.correctCount}
                  </div>
                  <div className="text-xs text-gray-600">Wrong</div>
                </div>
                <div className="rounded-lg bg-white p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {area.averageTime}
                  </div>
                  <div className="text-xs text-gray-600">Avg Time</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">Your Progress</span>
                  <span className="text-gray-600">
                    {area.correctCount}/{area.totalCount} questions
                  </span>
                </div>
                <Progress
                  value={area.accuracy}
                  className={cn(
                    'h-3',
                    isVeryWeak && '[&>div]:bg-red-600',
                    isWeak && '[&>div]:bg-orange-600'
                  )}
                />
              </div>

              {/* Common Mistakes */}
              {area.commonMistakes.length > 0 && (
                <div className="rounded-lg bg-white p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                    <span>⚠️</span>
                    Common Mistakes
                  </h4>
                  <ul className="space-y-2">
                    {area.commonMistakes.map((mistake, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Lessons */}
              {area.recommendedLessons.length > 0 && (
                <div className="rounded-lg bg-blue-50 p-4">
                  <h4 className="mb-3 flex items-center gap-2 font-semibold text-blue-900">
                    <span>📚</span>
                    Recommended Study Material
                  </h4>
                  <div className="space-y-2">
                    {area.recommendedLessons.map((lesson) => (
                      <Link
                        key={lesson.code}
                        href={`/lessons/${lesson.code}`}
                        className="block rounded-md bg-white px-3 py-2 text-sm text-blue-800 transition-colors hover:bg-blue-100"
                      >
                        → {lesson.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button asChild className="flex-1">
                  <Link href={`/practice/${area.categoryCode}`}>
                    <span className="mr-2">📝</span>
                    Practice Now
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href={`/lessons?category=${area.categoryCode}`}>
                    <span className="mr-2">📖</span>
                    Study Lessons
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
