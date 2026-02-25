'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';

export function HeroSection() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <section className="relative overflow-hidden bg-background pt-4 pb-12 lg:pt-6 lg:pb-20">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-card p-8 ring-1 ring-border lg:p-12 xl:p-16">
          {/* Decorative blobs — token-safe opacity */}
          <div className="pointer-events-none absolute end-0 top-0 h-96 w-96 ltr:translate-x-32 rtl:-translate-x-32 -translate-y-32 rounded-full bg-primary/5 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 start-0 h-80 w-80 ltr:-translate-x-20 rtl:translate-x-20 translate-y-20 rounded-full bg-secondary/5 blur-3xl" />

          <div className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left content */}
            <div className="space-y-6 lg:space-y-8">
              {/* Failure stat urgency banner */}
              <div className="inline-flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-3 backdrop-blur-sm">
                <span className="text-3xl font-extrabold text-destructive md:text-4xl">{t('home.hero.failure_stat_pct')}</span>
                <span className="text-sm font-medium leading-snug text-destructive/80">
                  {t('home.hero.failure_stat')}<br />
                  <strong className="text-destructive">{t('home.hero.dont_be_one')}</strong>
                </span>
              </div>

              {/* H1 — the only h1 on the entire page */}
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-secondary md:text-5xl lg:text-6xl xl:text-7xl">
                {t('home.hero.headline')}{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">{t('home.hero.headline_highlight')}</span>
                  <span className="absolute inset-x-0 bottom-2 h-3 bg-primary/20" aria-hidden="true" />
                </span>
              </h1>

              <p className="text-lg leading-relaxed text-muted-foreground lg:text-xl">
                {t('home.hero.subtitle')}
              </p>

              {/* Auth-aware CTAs */}
              <div className="flex flex-wrap gap-3 pt-2">
                {isLoading ? (
                  <>
                    <div className="h-12 w-48 animate-pulse rounded-full bg-muted" />
                    <div className="h-12 w-44 animate-pulse rounded-full bg-muted" />
                  </>
                ) : isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="h-12 rounded-full px-8 text-base font-semibold shadow-md transition-all hover:shadow-lg"
                    >
                      {t('home.hero.cta_auth_primary')}
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/register">
                      <Button
                        size="lg"
                        className="h-14 rounded-full px-10 text-lg font-bold shadow-lg ring-2 ring-primary/30 transition-all hover:shadow-xl active:scale-[0.98]"
                      >
                        {t('home.hero.cta_guest_primary')}
                      </Button>
                    </Link>
                    <Link href="/exam">
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-14 rounded-full border-2 border-border px-10 text-lg font-bold text-secondary transition-all hover:border-secondary hover:bg-muted active:scale-[0.98]"
                      >
                        {t('home.hero.cta_guest_secondary')}
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Trust microcopy */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm text-muted-foreground" aria-label="Trust indicators">
                <span className="inline-flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                  {t('home.hero.trust_secure')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  {t('home.hero.trust_privacy')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" /></svg>
                  {t('home.hero.trust_free')}
                </span>
              </div>
            </div>

            {/* Right visual column */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-md">
                <div className="relative overflow-hidden rounded-3xl bg-card p-8 ring-1 ring-border lg:p-10">
                  <div className="relative z-10 mx-auto aspect-square w-56">
                    <Image
                      src="/images/logo.png"
                      alt="ReadyRoad"
                      fill
                      sizes="(max-width: 768px) 224px, 224px"
                      className="object-contain"
                      priority
                    />
                  </div>

                  <div className="absolute end-0 top-1/2 -translate-y-1/2 ltr:translate-x-6 rtl:-translate-x-6">
                    <div className="relative rotate-12">
                      <svg width="280" height="80" viewBox="0 0 280 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg" aria-hidden="true">
                        <path d="M0 20 Q70 0, 140 10 T280 20 L280 60 Q210 70, 140 60 T0 60 Z" className="fill-secondary" opacity="0.95" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="px-4 text-xs font-medium tracking-wider text-secondary-foreground">{t('home.hero.ribbon')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pointer-events-none absolute -bottom-8 -start-8 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
                  <div className="pointer-events-none absolute -end-8 -top-8 h-32 w-32 rounded-full bg-secondary/10 blur-2xl" />
                </div>

                <div className="mt-6 rounded-2xl border border-border bg-card px-6 py-3 text-center">
                  <p className="text-xl font-bold text-secondary">{t('home.hero.badge_bottom')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
