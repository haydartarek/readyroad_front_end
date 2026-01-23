'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/language-context';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface Category {
  code: string;
  nameEn: string;
  nameAr: string;
  nameNl: string;
  nameFr: string;
  questionCount: number;
}

export default function PracticePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<Category[]>('/categories');
        setCategories(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Failed to load categories');
        toast.error('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const getCategoryName = (category: Category) => {
    switch (language) {
      case 'ar':
        return category.nameAr;
      case 'nl':
        return category.nameNl;
      case 'fr':
        return category.nameFr;
      default:
        return category.nameEn;
    }
  };

  const handleCategorySelect = (categoryCode: string) => {
    router.push(`/practice/${categoryCode}`);
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
            {t('practice.title')}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {t('practice.subtitle')}
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

        {/* Categories Grid */}
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
                    {category.questionCount} Questions
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

        {/* Random Practice Option */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="text-xl">🎲 Random Practice</CardTitle>
            <CardDescription>
              Practice with random questions from all categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push('/practice/random')}>
              Start Random Practice
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
