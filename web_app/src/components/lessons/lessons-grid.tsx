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
    const { language, t } = useLanguage();

    const getLessonTitle = (lesson: Lesson) => {
        switch (language) {
            case 'ar': return lesson.titleAr;
            case 'nl': return lesson.titleNl;
            case 'fr': return lesson.titleFr;
            default: return lesson.titleEn;
        }
    };

    const getLessonDescription = (lesson: Lesson) => {
        switch (language) {
            case 'ar': return lesson.descriptionAr;
            case 'nl': return lesson.descriptionNl;
            case 'fr': return lesson.descriptionFr;
            default: return lesson.descriptionEn;
        }
    };

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lessons.map((lesson) => (
                <Card
                    key={lesson.id}
                    className="group transition-all hover:shadow-lg"
                >
                    <CardContent className="p-6">
                        {/* Lesson number badge + icon */}
                        <div className="mb-4 flex items-center justify-between">
                            <Badge variant="secondary" className="text-sm">
                                {t('lessons.lesson')} {lesson.displayOrder}
                            </Badge>
                            <span className="text-2xl">{lesson.icon}</span>
                        </div>

                        {/* Lesson title */}
                        <h3 className="mb-3 text-lg font-semibold text-foreground line-clamp-2">
                            {getLessonTitle(lesson)}
                        </h3>

                        {/* Lesson preview */}
                        <p className="mb-4 text-sm text-muted-foreground line-clamp-3">
                            {(getLessonDescription(lesson) || '').substring(0, 150)}
                            {(getLessonDescription(lesson) || '').length > 150 ? '...' : ''}
                        </p>

                        {/* Meta info */}
                        <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
                            {lesson.estimatedMinutes > 0 && (
                                <span>~{lesson.estimatedMinutes} min</span>
                            )}
                            {(lesson.totalPages ?? 0) > 0 && (
                                <span>{lesson.totalPages} {t('lessons.pages')}</span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Link href={`/lessons/${lesson.lessonCode}`} className="flex-1">
                                <Button variant="default" className="w-full">
                                    {t('lessons.read_lesson')}
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
