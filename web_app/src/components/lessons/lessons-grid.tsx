'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lesson } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';

interface LessonsGridProps {
  lessons: Lesson[];
}

export function LessonsGrid({ lessons }: LessonsGridProps) {
  const { language } = useLanguage();

  const getLessonTitle = (lesson: Lesson) => {
    switch (language) {
      case 'ar': return lesson.titleAr;
      case 'nl': return lesson.titleNl;
      case 'fr': return lesson.titleFr;
      default: return lesson.titleEn;
    }
  };

  const getLessonContent = (lesson: Lesson) => {
    switch (language) {
      case 'ar': return lesson.contentAr;
      case 'nl': return lesson.contentNl;
      case 'fr': return lesson.contentFr;
      default: return lesson.contentEn;
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {lessons.map((lesson) => (
        <Card 
          key={lesson.lessonCode} 
          className="group transition-all hover:shadow-lg"
        >
          <CardContent className="p-6">
            {/* Lesson number badge */}
            <div className="mb-4 flex items-center justify-between">
              <Badge variant="secondary" className="text-sm">
                Lesson {lesson.orderIndex}
              </Badge>
              <span className="text-xs text-gray-400">
                {lesson.lessonCode}
              </span>
            </div>

            {/* Lesson title */}
            <h3 className="mb-3 text-lg font-semibold text-gray-900 line-clamp-2">
              {getLessonTitle(lesson)}
            </h3>

            {/* Lesson preview */}
            <p className="mb-4 text-sm text-gray-600 line-clamp-3">
              {getLessonContent(lesson).substring(0, 150)}...
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <Link href={`/lessons/${lesson.lessonCode}`} className="flex-1">
                <Button variant="default" className="w-full">
                  Read Lesson
                </Button>
              </Link>
            </div>

            {/* PDF indicators */}
            <div className="mt-4 flex flex-wrap gap-1 text-xs text-gray-500">
              {lesson.pdfPathEn && <span>📄 EN</span>}
              {lesson.pdfPathAr && <span>📄 AR</span>}
              {lesson.pdfPathNl && <span>📄 NL</span>}
              {lesson.pdfPathFr && <span>📄 FR</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
