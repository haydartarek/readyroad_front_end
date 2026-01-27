'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight } from 'lucide-react';

interface Category {
  code: string;
  name: string;
  description: string;
  totalQuestions: number;
  attempted?: number;
  correctAnswers?: number;
  accuracy?: number;
  isWeak?: boolean;
}

interface PracticeCategorySelectorProps {
  categories: Category[];
  title?: string;
  description?: string;
}

export function PracticeCategorySelector({
  categories,
  title = 'Select Practice Category',
  description = 'Choose a category to start practicing',
}: PracticeCategorySelectorProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold">{title}</h1>
        <p className="mt-2 text-lg text-gray-600">{description}</p>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => (
          <Card
            key={category.code}
            className={
              category.isWeak
                ? 'border-2 border-orange-300 bg-orange-50/50'
                : ''
            }
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{category.code}</Badge>
                    {category.isWeak && (
                      <Badge variant="destructive">
                        <span className="mr-1">⚠️</span>
                        Weak Area
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {category.description}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available Questions</span>
                  <span className="font-semibold">
                    {category.totalQuestions}
                  </span>
                </div>

                {category.attempted !== undefined &&
                  category.attempted > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Attempted</span>
                        <span className="font-semibold">
                          {category.attempted}
                        </span>
                      </div>

                      {category.accuracy !== undefined && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Accuracy</span>
                            <span
                              className={`font-semibold ${
                                category.accuracy >= 85
                                  ? 'text-green-600'
                                  : category.accuracy >= 70
                                  ? 'text-orange-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {category.accuracy.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={category.accuracy} />
                        </>
                      )}
                    </>
                  )}
              </div>

              {/* Action Button */}
              <Button asChild className="w-full" size="lg">
                <Link href={`/practice/${category.code}`}>
                  {category.attempted && category.attempted > 0
                    ? 'Continue Practice'
                    : 'Start Practice'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Categories Message */}
      {categories.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold mb-2">No Categories Available</h2>
            <p className="text-gray-600">
              Practice categories will appear here once they are loaded.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
