'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { API_ENDPOINTS, ROUTES } from '@/lib/constants';

interface QuizStats {
  totalQuestions: number;
  totalCategories: number;
}

export function SmartQuizCTA() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<QuizStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<QuizStats>(API_ENDPOINTS.QUIZ.STATS)
      .then((res) => {
        if (!cancelled) setStats(res.data);
      })
      .catch(() => {
        // Silently fail — the section still renders with static CTAs
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="relative overflow-hidden bg-secondary py-16 lg:py-24">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute end-0 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 start-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          {/* Header */}
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-secondary-foreground md:text-4xl lg:text-5xl">
            {t('home.quiz_cta.title')}
          </h2>
          <p className="mb-8 text-lg leading-relaxed text-secondary-foreground/70">
            {t('home.quiz_cta.subtitle')}
          </p>

          {/* Stats badges */}
          {stats && (
            <div className="mb-10 flex flex-wrap justify-center gap-6">
              <div className="rounded-2xl border border-secondary-foreground/10 bg-secondary-foreground/5 px-6 py-4 backdrop-blur-sm">
                <div className="text-3xl font-bold text-primary">{stats.totalQuestions}</div>
                <div className="text-sm text-secondary-foreground/60">{t('home.quiz_cta.total_questions')}</div>
              </div>
              <div className="rounded-2xl border border-secondary-foreground/10 bg-secondary-foreground/5 px-6 py-4 backdrop-blur-sm">
                <div className="text-3xl font-bold text-primary">{stats.totalCategories}</div>
                <div className="text-sm text-secondary-foreground/60">{t('home.quiz_cta.categories_count')}</div>
              </div>
            </div>
          )}

          {/* CTAs — auth-aware */}
          {authLoading ? (
            <div className="flex justify-center gap-4">
              <div className="h-14 w-52 animate-pulse rounded-full bg-secondary-foreground/10" />
              <div className="h-14 w-44 animate-pulse rounded-full bg-secondary-foreground/10" />
            </div>
          ) : isAuthenticated ? (
            <div className="flex flex-wrap justify-center gap-4">
              <Link href={ROUTES.PRACTICE}>
                <Button
                  size="lg"
                  className="h-14 rounded-full px-10 text-lg font-bold shadow-lg ring-2 ring-primary/30 transition-all hover:shadow-xl active:scale-[0.98]"
                >
                  {t('home.quiz_cta.start_quiz')}
                </Button>
              </Link>
              <Link href={ROUTES.EXAM}>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 rounded-full border-2 border-secondary-foreground/30 px-10 text-lg font-bold text-secondary-foreground transition-all hover:border-secondary-foreground hover:bg-secondary-foreground/10 active:scale-[0.98]"
                >
                  {t('home.quiz_cta.take_exam')}
                </Button>
              </Link>
              <Link href={ROUTES.DASHBOARD}>
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-14 rounded-full px-8 text-lg font-semibold text-secondary-foreground/70 transition-all hover:bg-secondary-foreground/10 hover:text-secondary-foreground"
                >
                  {t('home.quiz_cta.view_progress')}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-center gap-4">
                <Link href={ROUTES.PRACTICE}>
                  <Button
                    size="lg"
                    className="h-14 rounded-full px-10 text-lg font-bold shadow-lg ring-2 ring-primary/30 transition-all hover:shadow-xl active:scale-[0.98]"
                  >
                    {t('home.quiz_cta.start_quiz')}
                  </Button>
                </Link>
                <Link href={ROUTES.EXAM}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 rounded-full border-2 border-secondary-foreground/30 px-10 text-lg font-bold text-secondary-foreground transition-all hover:border-secondary-foreground hover:bg-secondary-foreground/10 active:scale-[0.98]"
                  >
                    {t('home.quiz_cta.take_exam')}
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-secondary-foreground/60">
                {t('home.quiz_cta.login_hint')}{' '}
                <Link href={ROUTES.LOGIN} className="font-medium text-primary transition-colors hover:text-primary/80">
                  {t('home.quiz_cta.login_cta')}
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
