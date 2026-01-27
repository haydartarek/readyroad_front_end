import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lesson } from '@/lib/types';
import { API_CONFIG } from '@/lib/constants';

interface Props {
  params: { lessonCode: string };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonCode } = await params;
  const lesson = await getLesson(lessonCode);

  if (!lesson) {
    return {
      title: 'Lesson Not Found | ReadyRoad',
    };
  }

  return {
    title: `${lesson.titleEn} | ReadyRoad`,
    description: lesson.contentEn.substring(0, 160),
    openGraph: {
      title: lesson.titleEn,
      description: lesson.contentEn.substring(0, 160),
    },
  };
}

// Generate static params for all lessons (ISR)
export async function generateStaticParams() {
  try {
    // Fetch lessons from real backend API
    const response = await fetch(`${API_CONFIG.BASE_URL}/lessons`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch lessons for static params:', response.status);
      return [];
    }

    const lessons = await response.json() as Lesson[];
    return lessons.map((lesson) => ({
      lessonCode: lesson.lessonCode,
    }));
  } catch (error) {
    console.error('Error fetching lessons for static params:', error);
    return [];
  }
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600; // 1 hour

async function getLesson(lessonCode: string): Promise<Lesson | null> {
  try {
    // Call real backend API
    const response = await fetch(`${API_CONFIG.BASE_URL}/lessons/${lessonCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error('Failed to fetch lesson:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data as Lesson;
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return null;
  }
}

export default async function LessonDetailPage({ params }: Props) {
  const { lessonCode } = await params;
  const lesson = await getLesson(lessonCode);

  if (!lesson) {
    notFound();
  }

  // Get previous and next lessons
  const prevLessonNumber = lesson.orderIndex - 1;
  const nextLessonNumber = lesson.orderIndex + 1;
  const prevLesson = prevLessonNumber > 0 ? `LESSON_${String(prevLessonNumber).padStart(2, '0')}` : null;
  const nextLesson = nextLessonNumber <= 31 ? `LESSON_${String(nextLessonNumber).padStart(2, '0')}` : null;

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
                    <Badge className="mb-3">Lesson {lesson.orderIndex} of 31</Badge>
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
                    <TabsTrigger value="en">🇬🇧 English</TabsTrigger>
                    <TabsTrigger value="ar">🇸🇦 العربية</TabsTrigger>
                    <TabsTrigger value="nl">🇳🇱 Nederlands</TabsTrigger>
                    <TabsTrigger value="fr">🇫🇷 Français</TabsTrigger>
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
                          📥 Download PDF (English)
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
                          📥 تحميل PDF (عربي)
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
                          📥 Download PDF (Nederlands)
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
                          📥 Télécharger PDF (Français)
                        </a>
                      </Button>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="mt-8 flex justify-between gap-4">
              {prevLesson ? (
                <Link href={`/lessons/${prevLesson}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    ← Previous Lesson
                  </Button>
                </Link>
              ) : (
                <div className="flex-1" />
              )}

              {nextLesson ? (
                <Link href={`/lessons/${nextLesson}`} className="flex-1">
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
                        {lesson.orderIndex} / 31
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(lesson.orderIndex / 31) * 100}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {Math.round((lesson.orderIndex / 31) * 100)}% Complete
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
                <p>✅ Read the lesson carefully</p>
                <p>✅ Take notes on key points</p>
                <p>✅ Download PDF for offline study</p>
                <p>✅ Practice with related questions</p>
                <p>✅ Review before exam</p>
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
