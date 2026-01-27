'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface Category {
  code: string;
  nameEn: string;
  nameAr: string;
  nameNl: string;
  nameFr: string;
  description?: string;
}

interface QuizStats {
  totalQuestions: number;
  questionsByCategory: Record<string, number>;
}

export default function PracticePage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch categories and quiz stats in parallel
        const [categoriesResponse, statsResponse] = await Promise.all([
          apiClient.get<Category[]>('/categories'),
          apiClient.get<QuizStats>('/quiz/stats'),
        ]);

        setCategories(categoriesResponse.data);
        setQuizStats(statsResponse.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load categories');
        toast.error('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCategoryName = (category: Category) => {
    switch (language) {
      case 'ar':
        return category.nameAr || category.nameEn;
      case 'nl':
        return category.nameNl || category.nameEn;
      case 'fr':
        return category.nameFr || category.nameEn;
      default:
        return category.nameEn;
    }
  };

  const getQuestionCount = (categoryCode: string) => {
    return quizStats?.questionsByCategory?.[categoryCode] || 0;
  };

  const handleCategorySelect = (categoryCode: string) => {
    router.push(`/practice/${categoryCode}`);
  };

  const handleRandomPractice = () => {
    router.push('/practice/random');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-lg text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            {t('practice.title') || 'Practice Mode'}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {t('practice.subtitle') || 'Choose a category to start practicing'}
          </p>
        </div>

        {/* Info Card */}
        <Alert>
          <AlertDescription>
            <p className="font-semibold">💡 Practice Mode Features:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              <li>Choose a category to focus on specific topics</li>
              <li>Get instant feedback after each answer</li>
              <li>See correct answers and explanations</li>
              <li>No time limit - practice at your own pace</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Random Practice Option */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="text-xl">🎲 Random Practice</CardTitle>
            <CardDescription>
              Practice with random questions from all categories ({quizStats?.totalQuestions || 0} questions available)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handleRandomPractice}>
              Start Random Practice
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </Button>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Practice by Category</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {categories.map((category) => (
              <Card
                key={category.code}
                className="cursor-pointer transition-all hover:shadow-lg"
                onClick={() => handleCategorySelect(category.code)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {getCategoryName(category)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Code: {category.code}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {getQuestionCount(category.code)} Questions
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Practice Now
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
