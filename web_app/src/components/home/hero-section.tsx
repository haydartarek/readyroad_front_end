'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck, Lock, Shield, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import { ROUTES } from '@/lib/constants';

const TRUST_ICONS = [
  {
    key: 'trust_secure',
    Icon: Lock,
    wrapClass: 'border-secondary/20 bg-secondary/10',
    iconClass: 'text-secondary',
  },
  {
    key: 'trust_privacy',
    Icon: Shield,
    wrapClass: 'border-primary/20 bg-primary/10',
    iconClass: 'text-primary',
  },
  {
    key: 'trust_free',
    Icon: Gift,
    wrapClass: 'border-amber-500/20 bg-amber-500/10',
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
] as const;

function CtaSkeleton() {
  return (
    <>
      <div className="h-12 w-44 animate-pulse rounded-full bg-muted" />
      <div className="h-12 w-40 animate-pulse rounded-full bg-muted" />
    </>
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

function MemberCtas({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <>
      <Button
        size="lg"
        className="h-12 rounded-full px-8 text-sm font-semibold shadow-sm ring-1 ring-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
        asChild
      >
        <Link href={ROUTES.LESSONS}>{primary}</Link>
      </Button>

      <Button
        size="lg"
        variant="outline"
        className="h-12 rounded-full border-border px-8 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:bg-muted/60 hover:shadow-sm active:translate-y-0"
        asChild
      >
        <Link href={ROUTES.EXAM}>{secondary}</Link>
      </Button>
    </>
  );
}

export function HeroSection() {
  const { t } = useLanguage();
  const { isLoading, isAuthenticated } = useAuth();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30 pb-12 pt-6 lg:pb-20 lg:pt-10">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl border bg-card/70 p-7 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 lg:p-12 xl:p-14">
          <div className="pointer-events-none absolute -top-40 end-0 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl ltr:translate-x-24 rtl:-translate-x-24" />
          <div className="pointer-events-none absolute -bottom-40 start-0 h-[26rem] w-[26rem] rounded-full bg-secondary/10 blur-3xl ltr:-translate-x-20 rtl:translate-x-20" />

          <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="space-y-6 lg:space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary shadow-sm">
                <BadgeCheck className="h-4 w-4" aria-hidden />
                <span>{t('home.hero.badge')}</span>
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
                  <MemberCtas
                    primary={t('home.hero.cta_primary')}
                    secondary={t('home.hero.cta_secondary')}
                  />
                ) : (
                  <GuestCtas
                    primary={t('home.hero.cta_guest_primary')}
                    secondary={t('home.hero.cta_guest_secondary')}
                  />
                )}
              </div>

              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm text-muted-foreground"
                aria-label={t('home.hero.trust_indicators_label')}
              >
                {TRUST_ICONS.map(({ key, Icon, wrapClass, iconClass }) => (
                  <span key={key} className="inline-flex items-center gap-2">
                    <span
                      className={[
                        'grid h-7 w-7 place-items-center rounded-full border shadow-sm',
                        wrapClass,
                      ].join(' ')}
                    >
                      <Icon className={['h-3.5 w-3.5', iconClass].join(' ')} aria-hidden />
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
