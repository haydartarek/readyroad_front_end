'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, Shield, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';

const TRUST_ICONS = [
  { key: 'trust_secure', Icon: Lock },
  { key: 'trust_privacy', Icon: Shield },
  { key: 'trust_free', Icon: Gift },
] as const;

function CtaSkeleton() {
  return (
    <>
      <div className="h-12 w-44 animate-pulse rounded-full bg-muted" />
      <div className="h-12 w-40 animate-pulse rounded-full bg-muted" />
    </>
  );
}

function AuthenticatedCta({ label }: { label: string }) {
  return (
    <Button
      size="lg"
      className="h-12 rounded-full px-7 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
      asChild
    >
      <Link href="/dashboard">{label}</Link>
    </Button>
  );
}

function GuestCtas({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <>
      <Button
        size="lg"
        className="h-12 rounded-full px-8 text-sm font-semibold shadow-sm ring-1 ring-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
        asChild
      >
        <Link href="/register">{primary}</Link>
      </Button>

      <Button
        size="lg"
        variant="outline"
        className="h-12 rounded-full border-border px-8 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:bg-muted/60 hover:shadow-sm active:translate-y-0"
        asChild
      >
        <Link href="/exam">{secondary}</Link>
      </Button>
    </>
  );
}

export function HeroSection() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30 pb-12 pt-6 lg:pb-20 lg:pt-10"
      style={{
        '--primary': '219 89% 52%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '215 28% 17%',
        '--secondary-foreground': '0 0% 100%',
        '--ring': '219 89% 52%',
        '--color-primary': 'hsl(219 89% 52%)',
        '--color-primary-foreground': 'hsl(0 0% 100%)',
        '--color-secondary': 'hsl(215 28% 17%)',
        '--color-secondary-foreground': 'hsl(0 0% 100%)',
        '--color-ring': 'hsl(219 89% 52%)',
      } as React.CSSProperties}
    >
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl border bg-card/70 p-7 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 lg:p-12 xl:p-14">
          <div className="pointer-events-none absolute -top-40 end-0 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl ltr:translate-x-24 rtl:-translate-x-24" />
          <div className="pointer-events-none absolute -bottom-40 start-0 h-[26rem] w-[26rem] rounded-full bg-secondary/10 blur-3xl ltr:-translate-x-20 rtl:translate-x-20" />

          <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="space-y-6 lg:space-y-7">
              <div className="inline-flex items-center gap-3 rounded-full border border-destructive/20 bg-destructive/5 px-4 py-2">
                <span className="text-2xl font-extrabold text-destructive md:text-3xl">
                  {t('home.hero.failure_stat_pct')}
                </span>
                <span className="text-sm font-medium leading-snug text-destructive/80">
                  {t('home.hero.failure_stat')}
                  <br />
                  <strong className="font-semibold text-destructive">
                    {t('home.hero.dont_be_one')}
                  </strong>
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-secondary sm:text-5xl lg:text-6xl">
                  {t('home.hero.headline')}{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10">{t('home.hero.headline_highlight')}</span>
                    <span
                      className="absolute inset-x-0 bottom-2 h-3 rounded-full bg-primary/20"
                      aria-hidden
                    />
                  </span>
                </h1>

                <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {t('home.hero.subtitle')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {isLoading ? (
                  <CtaSkeleton />
                ) : isAuthenticated ? (
                  <AuthenticatedCta label={t('home.hero.cta_auth_primary')} />
                ) : (
                  <GuestCtas
                    primary={t('home.hero.cta_guest_primary')}
                    secondary={t('home.hero.cta_guest_secondary')}
                  />
                )}
              </div>

              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm text-muted-foreground"
                aria-label="Trust indicators"
              >
                {TRUST_ICONS.map(({ key, Icon }) => (
                  <span key={key} className="inline-flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full border bg-background/70">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    {t(`home.hero.${key}`)}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-md">
                <div className="relative overflow-hidden rounded-3xl border bg-card p-8 shadow-sm lg:p-10">
                  <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-transparent" />
                  <div className="relative z-10 mx-auto grid aspect-square w-56 place-items-center rounded-3xl border bg-background/70 p-6">
                    <div className="relative aspect-square w-full">
                      <Image
                        src="/images/logo.png"
                        alt="ReadyRoad"
                        fill
                        sizes="(max-width: 768px) 224px, 224px"
                        className="object-contain"
                        priority
                      />
                    </div>
                  </div>

                  <div className="pointer-events-none absolute -bottom-10 -start-10 h-44 w-44 rounded-full bg-primary/10 blur-2xl" />
                  <div className="pointer-events-none absolute -end-10 -top-10 h-36 w-36 rounded-full bg-secondary/10 blur-2xl" />
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-border/60" />
        </div>
      </div>
    </section>
  );
}