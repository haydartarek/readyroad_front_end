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

const SHARED_PRIMARY_BTN =
  'h-12 rounded-full px-8 text-sm font-semibold shadow-sm ring-1 ring-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0';

const SHARED_OUTLINE_BTN =
  'h-12 rounded-full border border-secondary-foreground/20 bg-transparent px-8 text-sm font-semibold text-secondary-foreground transition-all hover:-translate-y-0.5 hover:border-secondary-foreground/30 hover:bg-secondary-foreground/10 hover:shadow-sm active:translate-y-0';

function CtaSkeleton() {
  return (
    <div className="flex justify-center gap-3">
      <div className="h-12 w-44 animate-pulse rounded-full bg-secondary-foreground/10" />
      <div className="h-12 w-40 animate-pulse rounded-full bg-secondary-foreground/10" />
    </div>
  );
}

function StatBadge({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-secondary-foreground/15 bg-secondary-foreground/5 px-5 py-4 text-center">
      <p className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-medium text-secondary-foreground/65 sm:text-sm">{label}</p>
    </div>
  );
}

function PrimaryBtn({ href, label }: { href: string; label: string }) {
  return (
    <Button size="lg" className={SHARED_PRIMARY_BTN} asChild>
      <Link href={href}>{label}</Link>
    </Button>
  );
}

function OutlineBtn({ href, label }: { href: string; label: string }) {
  return (
    <Button size="lg" variant="outline" className={SHARED_OUTLINE_BTN} asChild>
      <Link href={href}>{label}</Link>
    </Button>
  );
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
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-secondary py-16 lg:py-24">
      <div className="pointer-events-none absolute -top-44 end-0 h-[34rem] w-[34rem] rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-44 start-0 h-[30rem] w-[30rem] rounded-full bg-primary/8 blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-3xl border border-secondary-foreground/10 bg-secondary-foreground/5 p-8 text-center shadow-sm backdrop-blur supports-[backdrop-filter]:bg-secondary-foreground/4 md:p-10">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-secondary-foreground/10 via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-secondary-foreground/10" />

            <div className="relative space-y-6">
              <div className="space-y-3">
                <h2 className="text-balance text-3xl font-extrabold tracking-tight text-secondary-foreground md:text-4xl lg:text-5xl">
                  {t('home.quiz_cta.title')}
                </h2>
                <p className="mx-auto max-w-2xl text-pretty text-base leading-relaxed text-secondary-foreground/70 sm:text-lg">
                  {t('home.quiz_cta.subtitle')}
                </p>
              </div>

              {stats && (
                <div className="flex flex-wrap justify-center gap-4">
                  <StatBadge value={stats.totalQuestions} label={t('home.quiz_cta.total_questions')} />
                  <StatBadge value={stats.totalCategories} label={t('home.quiz_cta.categories_count')} />
                </div>
              )}

              {authLoading ? (
                <CtaSkeleton />
              ) : isAuthenticated ? (
                <div className="flex flex-wrap justify-center gap-3">
                  <PrimaryBtn href={ROUTES.PRACTICE} label={t('home.quiz_cta.start_quiz')} />
                  <OutlineBtn href={ROUTES.EXAM} label={t('home.quiz_cta.take_exam')} />
                  <Button
                    size="lg"
                    variant="ghost"
                    className="h-12 rounded-full px-7 text-sm font-semibold text-secondary-foreground/75 transition-all hover:-translate-y-0.5 hover:bg-secondary-foreground/10 hover:text-secondary-foreground hover:shadow-sm active:translate-y-0"
                    asChild
                  >
                    <Link href={ROUTES.DASHBOARD}>{t('home.quiz_cta.view_progress')}</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap justify-center gap-3">
                    <PrimaryBtn href={ROUTES.PRACTICE} label={t('home.quiz_cta.start_quiz')} />
                    <OutlineBtn href={ROUTES.EXAM} label={t('home.quiz_cta.take_exam')} />
                  </div>
                  <p className="text-sm text-secondary-foreground/60">
                    {t('home.quiz_cta.login_hint')}{' '}
                    <Link
                      href={ROUTES.LOGIN}
                      className="font-semibold text-primary transition-colors hover:text-primary/85"
                    >
                      {t('home.quiz_cta.login_cta')}
                    </Link>
                  </p>
                </div>
              )}
            </div>

            <div className="pointer-events-none absolute -bottom-20 start-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}