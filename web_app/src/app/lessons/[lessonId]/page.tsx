'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lesson } from '@/lib/types';
import { apiClient } from '@/lib/api';

export default function LessonDetailPage() {
    const params = useParams();
    const lessonId = params.lessonId as string;
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchLesson() {
            try {
                const response = await apiClient.get<Lesson>(`/lessons/${lessonId}`);
                setLesson(response.data);
            } catch (err) {
                console.error('Error fetching lesson:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        fetchLesson();
    }, [lessonId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg text-gray-600">Loading lesson...</p>
            </div>
        );
    }

    if (error || !lesson) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-lg text-gray-600">Lesson not found</p>
                <Link href="/lessons">
                    <Button variant="outline">← Back to all lessons</Button>
                </Link>
            </div>
        );
    }

    // Get previous and next lessons based on numeric ID
    const currentId = lesson.id;
    const prevLessonId = currentId > 1 ? currentId - 1 : null;
    const nextLessonId = currentId < 31 ? currentId + 1 : null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="container mx-auto px-4 py-12">
                {/* Back button */}
                <Link href="/lessons">
                    <Button variant="ghost" className="mb-6">
                        ← Back to all lessons
                    </Button>
                </Link>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main content */}
                    <div className="lg:col-span-2">
                        {/* Lesson header */}
                        <Card className="mb-8">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <Badge className="mb-3">Lesson {lesson.id} of 31</Badge>
                                        <CardTitle className="text-3xl">{lesson.titleEn}</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Multi-language content */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Lesson Content</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="en" className="w-full">
                                    <TabsList className="grid w-full grid-cols-4">
                                        <TabsTrigger value="en">EN English</TabsTrigger>
                                        <TabsTrigger value="ar">AR العربية</TabsTrigger>
                                        <TabsTrigger value="nl">NL Nederlands</TabsTrigger>
                                        <TabsTrigger value="fr">FR Français</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="en" className="space-y-4">
                                        <div className="prose max-w-none">
                                            <h2>{lesson.titleEn}</h2>
                                            <div className="whitespace-pre-line text-gray-700">
                                                {lesson.contentEn}
                                            </div>
                                        </div>
                                        {lesson.pdfPathEn && (
                                            <Button asChild variant="outline" className="w-full">
                                                <a href={lesson.pdfPathEn} download>
                                                    Download PDF (English)
                                                </a>
                                            </Button>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="ar" className="space-y-4" dir="rtl">
                                        <div className="prose max-w-none">
                                            <h2>{lesson.titleAr}</h2>
                                            <div className="whitespace-pre-line text-gray-700">
                                                {lesson.contentAr}
                                            </div>
                                        </div>
                                        {lesson.pdfPathAr && (
                                            <Button asChild variant="outline" className="w-full">
                                                <a href={lesson.pdfPathAr} download>
                                                    تحميل PDF (عربي)
                                                </a>
                                            </Button>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="nl" className="space-y-4">
                                        <div className="prose max-w-none">
                                            <h2>{lesson.titleNl}</h2>
                                            <div className="whitespace-pre-line text-gray-700">
                                                {lesson.contentNl}
                                            </div>
                                        </div>
                                        {lesson.pdfPathNl && (
                                            <Button asChild variant="outline" className="w-full">
                                                <a href={lesson.pdfPathNl} download>
                                                    Download PDF (Nederlands)
                                                </a>
                                            </Button>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="fr" className="space-y-4">
                                        <div className="prose max-w-none">
                                            <h2>{lesson.titleFr}</h2>
                                            <div className="whitespace-pre-line text-gray-700">
                                                {lesson.contentFr}
                                            </div>
                                        </div>
                                        {lesson.pdfPathFr && (
                                            <Button asChild variant="outline" className="w-full">
                                                <a href={lesson.pdfPathFr} download>
                                                    Télécharger PDF (Français)
                                                </a>
                                            </Button>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>

                        {/* Navigation */}
                        <div className="mt-8 flex justify-between gap-4">
                            {prevLessonId ? (
                                <Link href={`/lessons/${prevLessonId}`} className="flex-1">
                                    <Button variant="outline" className="w-full">
                                        ← Previous Lesson
                                    </Button>
                                </Link>
                            ) : (
                                <div className="flex-1" />
                            )}

                            {nextLessonId ? (
                                <Link href={`/lessons/${nextLessonId}`} className="flex-1">
                                    <Button className="w-full">
                                        Next Lesson →
                                    </Button>
                                </Link>
                            ) : (
                                <div className="flex-1" />
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Progress */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Your Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <div className="mb-2 flex justify-between text-sm">
                                            <span>Lesson Progress</span>
                                            <span className="font-semibold">
                                                {lesson.id} / 31
                                            </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                                            <div
                                                className="h-full bg-primary transition-all"
                                                style={{ width: `${(lesson.id / 31) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {Math.round((lesson.id / 31) * 100)}% Complete
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Study tips */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Study Tips</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <p>Read the lesson carefully</p>
                                <p>Take notes on key points</p>
                                <p>Download PDF for offline study</p>
                                <p>Practice with related questions</p>
                                <p>Review before exam</p>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="space-y-3">
                            <Link href="/practice">
                                <Button className="w-full" variant="default">
                                    Practice Questions
                                </Button>
                            </Link>
                            <Link href="/exam">
                                <Button className="w-full" variant="outline">
                                    Take Full Exam
                                </Button>
                            </Link>
                            <Link href="/traffic-signs">
                                <Button className="w-full" variant="outline">
                                    View Traffic Signs
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
