'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getLessonByCode, getAllLessons } from '@/services/lessonService';
import { isServiceUnavailable, logApiError } from '@/lib/api';
import { ServiceUnavailableBanner } from '@/components/ui/service-unavailable-banner';
import { useLanguage } from '@/contexts/language-context';
import type { Lesson, LessonDetail, LessonPage } from '@/lib/types';

export default function LessonDetailPage() {
    const params = useParams();
    const lessonIdOrCode = params.lessonId as string;
    const { t, language } = useLanguage();

    const [lesson, setLesson] = useState<LessonDetail | null>(null);
    const [allLessons, setAllLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activePage, setActivePage] = useState(0);
    const [serviceUnavailable, setServiceUnavailable] = useState(false);
    const [fetchKey, setFetchKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        Promise.all([getLessonByCode(lessonIdOrCode), getAllLessons()])
            .then(([detail, list]) => {
                if (!cancelled) {
                    setLesson(detail);
                    setAllLessons(list);
                    setActivePage(0);
                }
            })
            .catch((err) => {
                logApiError('Failed to load lesson', err);
                if (!cancelled) {
                    if (isServiceUnavailable(err)) {
                        setServiceUnavailable(true);
                    } else {
                        setError(err?.message ?? 'Failed to load lesson');
                    }
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lessonIdOrCode, fetchKey]);

    // ─── Language helpers ────────────────────────────────

    const getTitle = (l: { titleEn: string; titleAr: string; titleNl: string; titleFr: string }) => {
        switch (language) {
            case 'ar': return l.titleAr;
            case 'nl': return l.titleNl;
            case 'fr': return l.titleFr;
            default: return l.titleEn;
        }
    };

    const getPageTitle = (p: LessonPage) => {
        switch (language) {
            case 'ar': return p.titleAr;
            case 'nl': return p.titleNl;
            case 'fr': return p.titleFr;
            default: return p.titleEn;
        }
    };

    // ─── Loading ─────────────────────────────────────────

    if (serviceUnavailable) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <ServiceUnavailableBanner onRetry={() => { setServiceUnavailable(false); setFetchKey(k => k + 1); }} className="mb-4" />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    // ─── Not found / error ───────────────────────────────

    if (error || !lesson) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-lg text-muted-foreground">{error ?? t('lessons.not_found')}</p>
                <Link href="/lessons">
                    <Button variant="outline">{t('lessons.back_to_all')}</Button>
                </Link>
            </div>
        );
    }

    // ─── Navigation ──────────────────────────────────────

    const total = allLessons.length;
    const currentIdx = allLessons.findIndex(
        (l) => l.lessonCode === lesson.lessonCode,
    );
    const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
    const nextLesson =
        currentIdx >= 0 && currentIdx < allLessons.length - 1
            ? allLessons[currentIdx + 1]
            : null;

    const currentPage = lesson.pages[activePage];

    // ─── Render ──────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gradient-to-b from-muted to-background">
            <div className="container mx-auto px-4 py-12">
                {/* Back button */}
                <Link href="/lessons">
                    <Button variant="ghost" className="mb-6">
                        {t('lessons.back_to_all')}
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
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-2xl">{lesson.icon}</span>
                                            <Badge>{t('lessons.lesson')} {lesson.displayOrder}</Badge>
                                            {lesson.estimatedMinutes > 0 && (
                                                <Badge variant="secondary">~{lesson.estimatedMinutes} min</Badge>
                                            )}
                                            <Badge variant="outline">{lesson.pages.length} {t('lessons.pages')}</Badge>
                                        </div>
                                        <CardTitle className="text-3xl">{getTitle(lesson)}</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Page selector tabs */}
                        {lesson.pages.length > 1 && (
                            <div className="mb-6 flex flex-wrap gap-2">
                                {lesson.pages.map((page, idx) => (
                                    <Button
                                        key={page.pageNumber}
                                        variant={activePage === idx ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setActivePage(idx)}
                                    >
                                        {page.pageNumber}
                                    </Button>
                                ))}
                            </div>
                        )}

                        {/* Page content with language tabs */}
                        {currentPage && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{getPageTitle(currentPage)}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue={language} className="w-full">
                                        <TabsList className="grid w-full grid-cols-4">
                                            <TabsTrigger value="en">EN English</TabsTrigger>
                                            <TabsTrigger value="ar">AR العربية</TabsTrigger>
                                            <TabsTrigger value="nl">NL Nederlands</TabsTrigger>
                                            <TabsTrigger value="fr">FR Français</TabsTrigger>
                                        </TabsList>

                                        {(['en', 'ar', 'nl', 'fr'] as const).map((lang) => {
                                            const title = lang === 'en' ? currentPage.titleEn
                                                : lang === 'ar' ? currentPage.titleAr
                                                    : lang === 'nl' ? currentPage.titleNl
                                                        : currentPage.titleFr;
                                            const content = lang === 'en' ? currentPage.contentEn
                                                : lang === 'ar' ? currentPage.contentAr
                                                    : lang === 'nl' ? currentPage.contentNl
                                                        : currentPage.contentFr;
                                            const bullets = lang === 'en' ? currentPage.bulletPointsEn
                                                : lang === 'ar' ? currentPage.bulletPointsAr
                                                    : lang === 'nl' ? currentPage.bulletPointsNl
                                                        : currentPage.bulletPointsFr;
                                            const dir = lang === 'ar' ? 'rtl' : 'ltr';

                                            return (
                                                <TabsContent key={lang} value={lang} dir={dir} className="space-y-4">
                                                    <div className="prose max-w-none">
                                                        <h2>{title}</h2>
                                                        <div className="whitespace-pre-line text-foreground">
                                                            {content}
                                                        </div>
                                                        {bullets && bullets.length > 0 && (
                                                            <ul className="mt-4 space-y-2">
                                                                {bullets.map((bullet, i) => (
                                                                    <li key={i} className="flex items-start gap-2">
                                                                        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                                                                        <span>{bullet}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                </TabsContent>
                                            );
                                        })}
                                    </Tabs>
                                </CardContent>
                            </Card>
                        )}

                        {/* Page navigation within lesson */}
                        {lesson.pages.length > 1 && (
                            <div className="mt-6 flex justify-between gap-4">
                                {activePage > 0 ? (
                                    <Button variant="outline" onClick={() => setActivePage(activePage - 1)}>
                                        ← {t('lessons.previous_page')}
                                    </Button>
                                ) : (
                                    <div />
                                )}
                                {activePage < lesson.pages.length - 1 ? (
                                    <Button onClick={() => setActivePage(activePage + 1)}>
                                        {t('lessons.next_page')} →
                                    </Button>
                                ) : (
                                    <div />
                                )}
                            </div>
                        )}

                        {/* Lesson navigation */}
                        <div className="mt-8 flex justify-between gap-4">
                            {prevLesson ? (
                                <Link href={`/lessons/${prevLesson.lessonCode}`} className="flex-1">
                                    <Button variant="outline" className="w-full">
                                        {t('lessons.previous')}
                                    </Button>
                                </Link>
                            ) : (
                                <div className="flex-1" />
                            )}

                            {nextLesson ? (
                                <Link href={`/lessons/${nextLesson.lessonCode}`} className="flex-1">
                                    <Button className="w-full">
                                        {t('lessons.next')}
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
                                <CardTitle>{t('lessons.your_progress')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <div className="mb-2 flex justify-between text-sm">
                                            <span>{t('lessons.lesson_progress')}</span>
                                            <span className="font-semibold">
                                                {lesson.displayOrder} / {total}
                                            </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full bg-primary transition-all"
                                                style={{ width: `${total > 0 ? (lesson.displayOrder / total) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {total > 0 ? Math.round((lesson.displayOrder / total) * 100) : 0}% {t('lessons.complete')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Page overview */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('lessons.pages_overview')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {lesson.pages.map((page, idx) => (
                                        <button
                                            key={page.pageNumber}
                                            onClick={() => setActivePage(idx)}
                                            className={`w-full text-left rounded-lg p-2 text-sm transition-colors ${activePage === idx
                                                ? 'bg-primary/10 text-primary font-medium'
                                                : 'hover:bg-muted text-muted-foreground'
                                                }`}
                                        >
                                            <span className="font-mono text-xs mr-2">{page.pageNumber}.</span>
                                            {getPageTitle(page)}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="space-y-3">
                            <Link href="/exam">
                                <Button className="w-full" variant="outline">
                                    {t('lessons.take_exam')}
                                </Button>
                            </Link>
                            <Link href="/traffic-signs">
                                <Button className="w-full" variant="outline">
                                    {t('lessons.view_signs')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
